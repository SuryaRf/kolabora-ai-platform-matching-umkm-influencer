import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getCollaborationsForUser } from "@/lib/collab-server";
import { notify } from "@/lib/notify";
import { z } from "zod";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const collaborations = await getCollaborationsForUser(session.user.id);
    return NextResponse.json(collaborations);
  } catch (error) {
    console.error("Get collaborations error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
  }
}

const createSchema = z.object({
  participantId: z.string().min(1),
  title: z.string().min(2),
  brief: z.string().min(10),
  budget: z.coerce.number().int().positive(),
  campaignId: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "UMKM") {
      return NextResponse.json(
        { error: "Hanya UMKM yang bisa mengajukan kolaborasi" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Data kolaborasi tidak valid", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { participantId, title, brief, budget, campaignId } = parsed.data;

    const influencer = await prisma.user.findUnique({
      where: { id: participantId },
      select: { id: true, role: true, name: true },
    });

    if (!influencer || influencer.role !== "INFLUENCER") {
      return NextResponse.json(
        { error: "Influencer tidak ditemukan" },
        { status: 404 },
      );
    }

    if (campaignId) {
      const campaign = await prisma.campaign.findFirst({
        where: { id: campaignId, ownerId: session.user.id },
        select: { id: true },
      });
      if (!campaign) {
        return NextResponse.json(
          { error: "Campaign tidak ditemukan" },
          { status: 404 },
        );
      }
    }

    const collaboration = await prisma.collaboration.create({
      data: {
        campaignId: campaignId ?? undefined,
        title,
        brief,
        budget,
        status: "PROPOSED",
        participants: {
          connect: [{ id: session.user.id }, { id: participantId }],
        },
      },
    });

    await notify(
      participantId,
      "COLLABORATION",
      "Tawaran kolaborasi baru",
      `Anda menerima tawaran kolaborasi "${title}".`,
      "/dashboard/influencer/history",
    );

    await prisma.message.create({
      data: {
        collaborationId: collaboration.id,
        senderId: session.user.id,
        content: `Halo! Saya ingin mengajak kolaborasi untuk "${title}".\n\nBrief:\n${brief}\n\nBudget: Rp ${budget.toLocaleString("id-ID")}`,
        type: "BRIEF",
      },
    });

    return NextResponse.json(collaboration, { status: 201 });
  } catch (error) {
    console.error("Create collaboration error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
  }
}
