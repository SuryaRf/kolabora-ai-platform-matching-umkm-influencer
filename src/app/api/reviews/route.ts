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

const submitSchema = z.object({
  collaborationId: z.string().min(1),
  contentUrl: z.string().min(1),
  caption: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
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

    const body = (await req.json()) as {
      reviewId?: string;
      action?: "approve" | "revision";
      reviewNotes?: string;
    };

    if (
      !body.reviewId ||
      (body.action !== "approve" && body.action !== "revision")
    ) {
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
    }

    const review = await prisma.contentReview.findUnique({
      where: { id: body.reviewId },
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

    const now = new Date();
    const isApprove = body.action === "approve";

    const [updatedReview] = await prisma.$transaction([
      prisma.contentReview.update({
        where: { id: review.id },
        data: {
          status: isApprove ? "APPROVED" : "REVISION_REQUESTED",
          reviewNotes: body.reviewNotes,
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
          : `Brand meminta revisi untuk "${review.collaboration.title}". ${body.reviewNotes ?? ""}`,
        "/dashboard/influencer/history",
      );
    }

    return NextResponse.json(updatedReview);
  } catch (error) {
    console.error("Update review error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
  }
}
