import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { scoreCampaign } from "@/lib/matching";

/**
 * Pencocokan berbasis aturan murni (tanpa AI).
 * Dipakai sebagai halaman "Smart Matching" dan sebagai kandidat awal /api/ai/match.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.influencerProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Lengkapi profil influencer terlebih dahulu" },
        { status: 400 },
      );
    }

    const campaigns = await prisma.campaign.findMany({
      where: { status: "ACTIVE" },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            image: true,
            umkmProfile: {
              select: { businessName: true, category: true, location: true },
            },
          },
        },
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const matches = campaigns
      .map((campaign) => {
        const { score, reasons } = scoreCampaign(
          {
            category: profile.category,
            niches: profile.niches,
            location: profile.location,
            rateMin: profile.rateMin,
          },
          {
            category: campaign.category,
            location: campaign.location,
            budgetMax: campaign.budgetMax,
            applicants: campaign._count.applications,
            createdAt: campaign.createdAt,
          },
        );

        return {
          campaignId: campaign.id,
          title: campaign.title,
          description: campaign.description,
          category: campaign.category,
          location: campaign.location,
          budgetMin: campaign.budgetMin,
          budgetMax: campaign.budgetMax,
          businessName:
            campaign.owner.umkmProfile?.businessName ?? campaign.owner.name ?? "Brand",
          image: campaign.owner.image,
          applicants: campaign._count.applications,
          score,
          reasons,
        };
      })
      .sort((a, b) => b.score - a.score);

    return NextResponse.json(matches);
  } catch (error) {
    console.error("Match campaigns error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
  }
}
