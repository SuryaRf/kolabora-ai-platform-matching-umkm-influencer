import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";
import { z } from "zod";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reviews = await prisma.contentReview.findMany({
      where: {
        collaboration: {
          participants: { some: { id: session.user.id } },
        },
      },
      include: {
        collaboration: {
          select: {
            id: true,
            title: true,
            status: true,
            participants: {
              select: { id: true, name: true, role: true, image: true },
            },
            campaign: { select: { id: true, title: true } },
          },
        },
      },
      orderBy: { submittedAt: "desc" },
    });

    return NextResponse.json(reviews);
  } catch (error) {
    console.error("Get reviews error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
  }
}

// contentUrl harus https:// sungguhan: nilainya dirender sebagai <a href> di
// dashboard UMKM, jadi javascript:/data:/file: dan tautan phishing harus
// ditolak di gerbang.
const httpsUrl = z
  .string()
  .max(500)
  .refine((v) => {
    try {
      return new URL(v).protocol === "https:";
    } catch {
      return false;
    }
  }, "URL harus dimulai dengan https://");

const submitSchema = z.object({
  collaborationId: z.string().min(1),
  contentUrl: httpsUrl,
  caption: z.string().max(2000).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

const patchSchema = z.object({
  reviewId: z.string().min(1),
  action: z.enum(["approve", "revision"]),
  reviewNotes: z.string().max(2000).optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "INFLUENCER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const parsed = submitSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
    }

    const { collaborationId, contentUrl, caption, notes } = parsed.data;

    const collab = await prisma.collaboration.findFirst({
      where: {
        id: collaborationId,
        participants: { some: { id: session.user.id } },
      },
      include: { participants: { select: { id: true } } },
    });

    if (!collab) {
      return NextResponse.json(
        { error: "Kolaborasi tidak ditemukan" },
        { status: 404 },
      );
    }

    if (
      collab.status !== "IN_PRODUCTION" &&
      collab.status !== "REVISION_REQUESTED"
    ) {
      return NextResponse.json(
        { error: "Konten tidak dapat dikirim pada tahap ini" },
        { status: 400 },
      );
    }

    const review = await prisma.contentReview.create({
      data: { collaborationId, contentUrl, caption, notes },
    });

    await prisma.collaboration.update({
      where: { id: collaborationId },
      data: { status: "CONTENT_SUBMITTED", submittedAt: new Date() },
    });

    const owner = collab.participants.find((p) => p.id !== session.user.id);
    if (owner) {
      await notify(
        owner.id,
        "REVIEW",
        "Konten menunggu review",
        `Konten untuk "${collab.title}" sudah dikirim dan menunggu persetujuan Anda.`,
        "/dashboard/umkm/review-campaign",
      );
    }

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error("Submit review error:", error);
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

    const bodyParsed = patchSchema.safeParse(await req.json().catch(() => null));
    if (!bodyParsed.success) {
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
    }
    const { reviewId, action, reviewNotes } = bodyParsed.data;

    const review = await prisma.contentReview.findUnique({
      where: { id: reviewId },
      include: {
        collaboration: {
          include: { participants: { select: { id: true } } },
        },
      },
    });

    if (
      !review ||
      !review.collaboration.participants.some((p) => p.id === session.user.id)
    ) {
      return NextResponse.json({ error: "Review tidak ditemukan" }, {
        status: 404,
      });
    }

    // Prasyarat: review hanya bisa diputuskan saat konten baru dikirim /
    // sedang direview — cegah approve/revision diulang untuk mencetak riwayat
    // fiktif (temuan audit #1).
    const allowedCollabStatuses = ["CONTENT_SUBMITTED", "UNDER_REVIEW"];
    if (!allowedCollabStatuses.includes(review.collaboration.status)) {
      return NextResponse.json(
        { error: "Review sudah diputuskan pada tahap ini" },
        { status: 400 },
      );
    }

    const now = new Date();
    const isApprove = action === "approve";

    // Guard atomik: hanya review yang masih PENDING yang boleh berubah.
    // updateMany + count mencegah balapan dua klik / dua tab.
    const [updatedReview] = await prisma.$transaction([
      prisma.contentReview.updateMany({
        where: { id: review.id, status: "PENDING" },
        data: {
          status: isApprove ? "APPROVED" : "REVISION_REQUESTED",
          reviewNotes: reviewNotes ?? null,
          reviewedAt: now,
        },
      }),
      prisma.collaboration.update({
        where: { id: review.collaborationId },
        data: {
          status: isApprove ? "APPROVED" : "REVISION_REQUESTED",
          approvedAt: isApprove ? now : null,
        },
      }),
    ]);

    if (updatedReview.count !== 1) {
      return NextResponse.json(
        { error: "Review sudah diputuskan sebelumnya" },
        { status: 409 },
      );
    }

    const finalReview = await prisma.contentReview.findUnique({
      where: { id: review.id },
    });

    const influencer = review.collaboration.participants.find(
      (p) => p.id !== session.user.id,
    );
    if (influencer) {
      await notify(
        influencer.id,
        "REVIEW",
        isApprove ? "Konten disetujui" : "Revisi diminta",
        isApprove
          ? `Konten untuk "${review.collaboration.title}" disetujui. Pembayaran akan segera dicairkan.`
          : `Brand meminta revisi untuk "${review.collaboration.title}". ${reviewNotes ?? ""}`,
        "/dashboard/influencer/history",
      );
    }

    return NextResponse.json(finalReview);
  } catch (error) {
    console.error("Update review error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
  }
}
