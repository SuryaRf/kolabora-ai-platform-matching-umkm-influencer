import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await auth();

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            image: true,
            umkmProfile: true,
          },
        },
        applications: {
          include: {
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
        },
        collaborations: {
          select: { id: true, status: true },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign tidak ditemukan" },
        { status: 404 },
      );
    }

    const isOwner = session?.user?.id === campaign.ownerId;
    return NextResponse.json({
      ...campaign,
      applications: isOwner ? campaign.applications : [],
      canManage: isOwner,
    });
  } catch (error) {
    console.error("Get campaign error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const campaign = await prisma.campaign.findUnique({ where: { id } });
    if (!campaign || campaign.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "Campaign tidak ditemukan" },
        { status: 404 },
      );
    }

    const { status } = (await req.json()) as { status?: string };
    if (status !== "CLOSED" && status !== "ACTIVE") {
      return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
    }

    const updated = await prisma.campaign.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update campaign error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
  }
}
