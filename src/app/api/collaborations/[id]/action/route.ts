import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";
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
  agree: {
    from: ["NEGOTIATION"],
    to: "AGREED",
    role: "ANY",
    label: (title) => `Deal kolaborasi "${title}" disepakati.`,
    notifyTitle: "Deal disepakati",
  },
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

    const { action } = (await req.json()) as { action?: string };
    const transition = action ? TRANSITIONS[action] : undefined;
    if (!transition) {
      return NextResponse.json({ error: "Aksi tidak dikenal" }, { status: 400 });
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

    const updated = await prisma.collaboration.update({
      where: { id },
      data,
    });

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
