import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";
import { formatCurrency } from "@/lib/utils";
import { z } from "zod";
import type { CollaborationStatus, UserRole } from "@prisma/client";

type Transition = {
  from: CollaborationStatus[];
  to: CollaborationStatus;
  role: UserRole | "ANY";
  label: (title: string) => string;
  notifyTitle: string;
};

const TRANSITIONS: Record<string, Transition> = {
  accept: {
    from: ["PROPOSED"],
    to: "NEGOTIATION",
    role: "INFLUENCER",
    label: (title) => `Tawaran kolaborasi "${title}" diterima.`,
    notifyTitle: "Tawaran diterima",
  },
  // NEGOTIATION -> AGREED sengaja TIDAK ada di tabel ini.
  // Deal membutuhkan konfirmasi KEDUA belah pihak, jadi satu klik tidak boleh
  // memutasikan status. Penanganannya ada di confirmDeal() di bawah.
  hold_escrow: {
    from: ["AGREED"],
    to: "ESCROW_HELD",
    role: "UMKM",
    label: (title) => `Pembayaran escrow untuk "${title}" berhasil dikunci.`,
    notifyTitle: "Dana escrow aman",
  },
  start_production: {
    from: ["ESCROW_HELD"],
    to: "IN_PRODUCTION",
    role: "INFLUENCER",
    label: (title) => `Produksi konten untuk "${title}" dimulai.`,
    notifyTitle: "Produksi dimulai",
  },
  complete: {
    from: ["APPROVED"],
    to: "COMPLETED",
    role: "UMKM",
    label: (title) => `Kolaborasi "${title}" selesai dan dana telah dicairkan.`,
    notifyTitle: "Pembayaran dicairkan",
  },
  cancel: {
    from: ["PROPOSED", "NEGOTIATION", "AGREED"],
    to: "CANCELLED",
    role: "UMKM",
    label: (title) => `Kolaborasi "${title}" dibatalkan.`,
    notifyTitle: "Kolaborasi dibatalkan",
  },
};

const actionSchema = z.object({
  action: z.enum([
    "accept",
    "confirm_deal",
    "hold_escrow",
    "start_production",
    "complete",
    "cancel",
  ]),
  /** Tarif final hasil negosiasi. Beda dari budget saat ini = penawaran ulang. */
  budget: z.coerce.number().int().min(1).max(2_000_000_000).optional(),
  /** Catatan singkat kesepakatan (deliverables/tenggat), maks 500 karakter. */
  note: z.string().trim().max(500).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id || !session.user.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = actionSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Aksi tidak dikenal" },
        { status: 400 },
      );
    }
    const transition = TRANSITIONS[parsed.data.action];

    if (parsed.data.action === "confirm_deal") {
      return confirmDeal(id, session.user.id, session.user.role, {
        budget: parsed.data.budget,
        note: parsed.data.note,
      });
    }

    const collaboration = await prisma.collaboration.findFirst({
      where: { id, participants: { some: { id: session.user.id } } },
      include: { participants: { select: { id: true } } },
    });

    if (!collaboration) {
      return NextResponse.json(
        { error: "Kolaborasi tidak ditemukan" },
        { status: 404 },
      );
    }

    if (!transition.from.includes(collaboration.status)) {
      return NextResponse.json(
        { error: "Aksi tidak tersedia pada tahap ini" },
        { status: 400 },
      );
    }

    if (transition.role !== "ANY" && transition.role !== session.user.role) {
      return NextResponse.json(
        { error: "Anda tidak berhak melakukan aksi ini" },
        { status: 403 },
      );
    }

    const now = new Date();
    const data: Record<string, unknown> = { status: transition.to };

    if (transition.to === "AGREED") data.agreedAt = now;
    if (transition.to === "ESCROW_HELD") {
      data.escrowAmount = collaboration.budget;
      data.escrowStatus = "HELD";
      data.escrowHeldAt = now;
    }
    if (transition.to === "IN_PRODUCTION") data.startedAt = now;
    if (transition.to === "COMPLETED") {
      data.escrowStatus = "RELEASED";
      data.escrowReleasedAt = now;
      data.completedAt = now;
    }

    // Guard status membuat transisi atomik: dua klik beruntun tidak bisa
    // menaikkan tahap dua kali / mengirim notifikasi ganda.
    const result = await prisma.collaboration.updateMany({
      where: { id, status: collaboration.status },
      data,
    });
    if (result.count === 0) {
      return NextResponse.json(
        { error: "Status kolaborasi sudah berubah. Muat ulang halaman." },
        { status: 409 },
      );
    }

    const updated = await prisma.collaboration.findUnique({ where: { id } });

    const others = collaboration.participants.filter(
      (p) => p.id !== session.user.id,
    );
    await Promise.all(
      others.map((p) =>
        notify(
          p.id,
          transition.to === "COMPLETED" ? "PAYMENT" : "COLLABORATION",
          transition.notifyTitle,
          transition.label(collaboration.title),
          session.user.role === "UMKM"
            ? "/dashboard/influencer/history"
            : "/dashboard/umkm/history",
        ),
      ),
    );

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Collaboration action error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
  }
}

/**
 * NEGOTIATION -> AGREED dengan konfirmasi DUA BELAH PIHAK.
 *
 * - Klik pertama hanya mencatat konfirmasi; status tetap NEGOTIATION.
 * - Tarif yang dikirim berbeda dari budget saat ini => penawaran ulang: budget
 *   diganti dan SEMUA konfirmasi direset, jadi kedua pihak harus klik lagi.
 * - Status baru menjadi AGREED setelah semua peserta mengonfirmasi tarif yang
 *   sama. Angka tarif ditulis ke `budget` (+ snapshot `dealAmount`), sehingga
 *   escrow berikutnya mengunci hasil negosiasi, bukan angka awal lamaran.
 * - Update dijaga `status = 'NEGOTIATION'` di dalam updateMany: dua klik
 *   bersamaan tidak bisa menutup deal dua kali / bangunkan escrow ganda.
 * - Setiap kejadian dicatat sebagai pesan SYSTEM di chat kolaborasi, supaya
 *   riwayat deal terlihat di sisi kedua pihak.
 */
async function confirmDeal(
  id: string,
  meId: string,
  myRole: UserRole,
  input: { budget?: number; note?: string },
) {
  const collab = await prisma.collaboration.findFirst({
    where: { id, participants: { some: { id: meId } } },
    include: {
      participants: { select: { id: true, name: true, email: true } },
    },
  });

  if (!collab) {
    return NextResponse.json(
      { error: "Kolaborasi tidak ditemukan" },
      { status: 404 },
    );
  }
  if (collab.status !== "NEGOTIATION") {
    return NextResponse.json(
      { error: "Deal hanya bisa dikonfirmasi pada tahap negosiasi" },
      { status: 400 },
    );
  }

  const nextBudget = input.budget ?? collab.budget;
  const now = new Date();

  const outcome = await prisma.$transaction(async (tx) => {
    const fresh = await tx.collaboration.findUnique({
      where: { id },
      include: { participants: { select: { id: true } } },
    });
    if (!fresh || fresh.status !== "NEGOTIATION") return null;

    const counterOffer = nextBudget !== fresh.budget;
    const carried = counterOffer ? [] : (fresh.dealConfirmedBy ?? []);
    const confirmedBy = Array.from(new Set([...carried, meId]));
    const closed =
      fresh.participants.length > 0 &&
      fresh.participants.every((p) => confirmedBy.includes(p.id));

    const guard = await tx.collaboration.updateMany({
      where: { id, status: "NEGOTIATION" },
      data: {
        budget: nextBudget,
        dealConfirmedBy: confirmedBy,
        ...(input.note !== undefined ? { agreedNote: input.note } : {}),
        ...(closed
          ? {
              status: "AGREED" as const,
              agreedAt: now,
              dealAmount: nextBudget,
            }
          : {}),
      },
    });
    if (guard.count === 0) return null;

    return { closed, counterOffer, confirmedBy };
  });

  if (!outcome) {
    return NextResponse.json(
      { error: "Status kolaborasi sudah berubah. Muat ulang halaman." },
      { status: 409 },
    );
  }

  const me = collab.participants.find((p) => p.id === meId);
  const myName = me?.name || me?.email || "Salah satu pihak";
  const peers = collab.participants.filter((p) => p.id !== meId);
  const peerNames =
    peers
      .map((p) => p.name || p.email)
      .filter(Boolean)
      .join(" & ") || "pihak lain";
  const rate = formatCurrency(nextBudget);

  const dealMessage = outcome.closed
    ? `Deal final ${rate}${input.note ? ` — ${input.note}` : ""} dikonfirmasi kedua belah pihak. Berikutnya: brand mengunci dana escrow, lalu kreator memulai produksi.`
    : outcome.counterOffer
      ? `${myName} menawarkan tarif ${rate}. Konfirmasi deal direset — Anda dan ${peerNames} perlu menekan "Konfirmasi Deal" lagi pada tarif yang sama.`
      : `${myName} sudah mengonfirmasi deal ${rate}. Deal terkunci setelah ${peerNames} ikut mengonfirmasi.`;

  await prisma.message.create({
    data: {
      collaborationId: id,
      senderId: meId,
      content: dealMessage,
      type: "SYSTEM",
    },
  });

  const historyTarget =
    myRole === "UMKM"
      ? "/dashboard/influencer/history"
      : "/dashboard/umkm/history";
  const notifyTitle = outcome.closed
    ? "Deal disepakati"
    : outcome.counterOffer
      ? "Penawaran tarif baru"
      : "Menunggu konfirmasi Anda";
  const notifyBody = outcome.closed
    ? `Deal "${collab.title}" final di ${rate}. Brand bisa mengunci escrow.`
    : outcome.counterOffer
      ? `${myName} menawarkan tarif ${rate} untuk "${collab.title}".`
      : `${myName} mengonfirmasi deal ${rate} untuk "${collab.title}". Klik Konfirmasi Deal untuk mengunci.`;

  await Promise.all(
    peers.map((p) =>
      notify(p.id, "COLLABORATION", notifyTitle, notifyBody, historyTarget),
    ),
  );

  const updated = await prisma.collaboration.findUnique({ where: { id } });
  return NextResponse.json({ ...(updated ?? {}), dealMessage });
}
