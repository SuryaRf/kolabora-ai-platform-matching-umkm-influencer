import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";
import { z } from "zod";
import type { Application, Collaboration } from "@prisma/client";

/** Penanda internal bahwa lamaran sudah diputus — bukan error sistem. */
class AlreadyDecided extends Error {
  constructor() {
    super("already-decided");
  }
}

/**
 * Status yang masih boleh diputus brand. Setelah ACCEPTED/REJECTED, lamaran
 * itu selesai — dulu tidak ada penjaga ini, jadi satu klik "Tolak" setelah
 * lamaran diterima bisa membalik statusnya sementara kolaborasinya tetap
 * hidup (kolaborasi yatim tanpa lamaran aktif).
 */
const DECIDABLE = ["PENDING", "REVIEWED"] as const;

const decideSchema = z.object({
  id: z.string().min(1),
  action: z.enum(["accept", "reject"]),
  // Catatan opsional saat menolak, supaya kreator tahu apa yang bisa diperbaiki.
  // Dibatasi pendek: ini arahan, bukan ruang curhat.
  note: z
    .string()
    .trim()
    .max(200, "Catatan maksimal 200 karakter")
    .optional()
    .nullable(),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const applications = await prisma.application.findMany({
      where:
        session.user.role === "UMKM"
          ? { campaign: { ownerId: session.user.id } }
          : { applicantId: session.user.id },
      include: {
        campaign: {
          select: {
            id: true,
            title: true,
            category: true,
            budgetMin: true,
            budgetMax: true,
            status: true,
            ownerId: true,
          },
        },
        applicant: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            influencerProfile: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(applications);
  } catch (error) {
    console.error("Get applications error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "UMKM") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = decideSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Data tidak valid" },
        { status: 400 },
      );
    }
    const { id, action, note } = parsed.data;

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        campaign: true,
        applicant: { select: { id: true, name: true } },
      },
    });

    if (!application || application.campaign.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "Lamaran tidak ditemukan" },
        { status: 404 },
      );
    }

    if (!(DECIDABLE as readonly string[]).includes(application.status)) {
      return NextResponse.json(
        { error: "Lamaran ini sudah diputus sebelumnya" },
        { status: 409 },
      );
    }

    if (action === "reject") {
      // updateMany + filter status: dua brand yang menolak bersamaan tidak
      // saling menimpa, dan catatan pertama yang menang.
      const decided = await prisma.application.updateMany({
        where: { id, status: { in: [...DECIDABLE] } },
        data: { status: "REJECTED", feedback: note ?? null },
      });
      if (decided.count === 0) {
        return NextResponse.json(
          { error: "Lamaran sudah diputus, muat ulang halaman" },
          { status: 409 },
        );
      }
      const updated = await prisma.application.findUniqueOrThrow({
        where: { id },
      });
      await notify(
        application.applicantId,
        "APPLICATION",
        "Lamaran belum cocok",
        `Lamaran Anda untuk "${application.campaign.title}" belum dapat diterima kali ini.` +
          (note ? ` Catatan dari brand: “${note}”.` : ""),
        // Tujuannya tab Lamaran, bukan halaman yang membuka tab Kolaborasi —
        // dulu kreator mendarat di daftar yang justru tidak memuat lamarannya.
        "/dashboard/influencer/campaigns?tab=lamaran",
      );
      return NextResponse.json(updated);
    }

    const existing = await prisma.collaboration.findFirst({
      where: {
        campaignId: application.campaignId,
        // Hanya kolaborasi yang masih terbuka yang menghalangi: yang sudah
        // selesai/batal adalah sejarah, bukan pekerjaan berjalan.
        status: { notIn: ["COMPLETED", "CANCELLED"] },
        AND: [
          { participants: { some: { id: session.user.id } } },
          { participants: { some: { id: application.applicantId } } },
        ],
      },
      select: { id: true, title: true, status: true },
    });

    if (existing) {
      return NextResponse.json(
        {
          error: `Kolaborasi untuk pelamar ini sudah berjalan (“${existing.title}”). Selesaikan atau batalkan dulu.`,
          existingId: existing.id,
        },
        { status: 409 },
      );
    }

    let decidedApplication: Application | null = null;
    let collaboration: Collaboration | null = null;
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Penjaga balapan: kalau lamaran ini sudah diputus di tab lain,
        // jangan sampai kolaborasi kedua dibuat untuk pelamar yang sama.
        const decided = await tx.application.updateMany({
          where: { id, status: { in: [...DECIDABLE] } },
          data: { status: "ACCEPTED" },
        });
        if (decided.count === 0) throw new AlreadyDecided();
        const collab = await tx.collaboration.create({
          data: {
            campaignId: application.campaignId,
            title: application.campaign.title,
            brief: application.campaign.description,
            budget:
              application.proposedRate ?? application.campaign.budgetMin,
            // Jalur ini bukan tawaran yang harus direspons influencer: dia yang
            // melamar dan UMKM sudah menyetujui. Maka kolaborasi lahir langsung
            // di tahap diskusi (NEGOTIATION), bukan PROPOSED yang berarti
            // "menunggu respons" — kalau tidak, dashboard sisi influencer masih
            // menampilkan "Terima Tawaran" dan sisi UMKM "Ajukan Kolaborasi"
            // padahal lamarannya sudah diterima.
            // Jalur undangan langsung (POST /api/collaborations) tetap PROPOSED.
            status: "NEGOTIATION",
            participants: {
              connect: [
                { id: session.user.id },
                { id: application.applicantId },
              ],
            },
          },
        });
        const fresh = await tx.application.findUniqueOrThrow({ where: { id } });
        return { fresh, collab };
      });
      decidedApplication = result.fresh;
      collaboration = result.collab;
    } catch (error) {
      if (error instanceof AlreadyDecided) {
        return NextResponse.json(
          { error: "Lamaran sudah diputus, muat ulang halaman" },
          { status: 409 },
        );
      }
      throw error;
    }

    const updated = decidedApplication;

    await prisma.message.create({
      data: {
        collaborationId: collaboration.id,
        senderId: session.user.id,
        content: `Selamat! Lamaran Anda untuk "${application.campaign.title}" diterima. Mari diskusikan detail kolaborasi di sini.`,
        type: "SYSTEM",
      },
    });

    await notify(
      application.applicantId,
      "APPLICATION",
      "Lamaran diterima",
      `Selamat! Lamaran Anda untuk "${application.campaign.title}" diterima.`,
      "/dashboard/influencer/history",
    );

    return NextResponse.json({ application: updated, collaboration });
  } catch (error) {
    console.error("Update application error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
  }
}
