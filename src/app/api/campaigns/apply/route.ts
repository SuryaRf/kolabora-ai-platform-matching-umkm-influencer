import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";
import { z } from "zod";

const applySchema = z.object({
  campaignId: z.string().min(1),
  proposal: z.string().min(20),
  proposedRate: z.coerce.number().int().positive().optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "INFLUENCER") {
      return NextResponse.json(
        { error: "Hanya Influencer yang bisa melamar campaign" },
        { status: 403 },
      );
    }

    const parsed = applySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Lamaran tidak valid", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { campaignId, proposal, proposedRate } = parsed.data;

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true, title: true, ownerId: true, status: true },
    });

    if (!campaign || campaign.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Campaign tidak tersedia" },
        { status: 404 },
      );
    }

    const existing = await prisma.application.findUnique({
      where: {
        campaignId_applicantId: {
          campaignId,
          applicantId: session.user.id,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Anda sudah melamar campaign ini" },
        { status: 400 },
      );
    }

    const application = await prisma.application.create({
      data: {
        campaignId,
        applicantId: session.user.id,
        proposal,
        proposedRate: proposedRate ?? undefined,
        status: "PENDING",
      },
    });

    await notify(
      campaign.ownerId,
      "APPLICATION",
      "Lamaran baru masuk",
      `${session.user.name ?? "Influencer"} melamar campaign "${campaign.title}".`,
      `/dashboard/umkm/campaigns/${campaign.id}`,
    );

    return NextResponse.json(application, { status: 201 });
  } catch (error) {
    console.error("Apply campaign error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
  }
}
