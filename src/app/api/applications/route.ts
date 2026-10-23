import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";

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

    const { id, action } = (await req.json()) as {
      id?: string;
      action?: "accept" | "reject";
    };

    if (!id || (action !== "accept" && action !== "reject")) {
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
    }

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

    if (action === "reject") {
      const updated = await prisma.application.update({
        where: { id },
        data: { status: "REJECTED" },
      });
      await notify(
        application.applicantId,
        "APPLICATION",
        "Lamaran belum cocok",
        `Lamaran Anda untuk "${application.campaign.title}" belum dapat diterima kali ini.`,
        "/dashboard/influencer/campaigns",
      );
      return NextResponse.json(updated);
    }

    const existing = await prisma.collaboration.findFirst({
      where: {
        campaignId: application.campaignId,
        AND: [
          { participants: { some: { id: session.user.id } } },
          { participants: { some: { id: application.applicantId } } },
        ],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Kolaborasi untuk pelamar ini sudah dibuat" },
        { status: 400 },
      );
    }

    const [updated, collaboration] = await prisma.$transaction([
      prisma.application.update({
        where: { id },
        data: { status: "ACCEPTED" },
      }),
      prisma.collaboration.create({
        data: {
          campaignId: application.campaignId,
          title: application.campaign.title,
          brief: application.campaign.description,
          budget:
            application.proposedRate ?? application.campaign.budgetMin,
          status: "PROPOSED",
          participants: {
            connect: [
              { id: session.user.id },
              { id: application.applicantId },
            ],
          },
        },
      }),
    ]);

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
