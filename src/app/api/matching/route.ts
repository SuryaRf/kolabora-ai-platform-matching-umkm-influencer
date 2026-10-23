import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Simple rule-based matching
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { campaignId } = await req.json();

    // Get campaign details
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { owner: true },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    // Get all influencers
    const influencers = await prisma.user.findMany({
      where: { role: "INFLUENCER" },
      include: {
        influencerProfile: true,
      },
    });

    // Rule-based scoring
    const matches = influencers
      .filter((inf) => inf.influencerProfile)
      .map((inf) => {
        const profile = inf.influencerProfile!;
        let score = 0;
        const reasons = [];

        // Category match (40%)
        if (profile.category.toLowerCase() === campaign.category.toLowerCase()) {
          score += 40;
          reasons.push({ label: "Kategori sesuai", pct: 100 });
        } else {
          score += 20;
          reasons.push({ label: "Kategori terkait", pct: 50 });
        }

        // Followers (20%)
        if (profile.followers >= 10000) {
          score += 20;
          reasons.push({ label: "Follower cukup besar", pct: 100 });
        } else if (profile.followers >= 5000) {
          score += 15;
          reasons.push({ label: "Follower menengah", pct: 75 });
        } else {
          score += 10;
          reasons.push({ label: "Follower berkembang", pct: 50 });
        }

        // Engagement (20%)
        if (profile.engagement >= 5) {
          score += 20;
          reasons.push({ label: "Engagement rate tinggi", pct: 100 });
        } else if (profile.engagement >= 3) {
          score += 15;
          reasons.push({ label: "Engagement rate baik", pct: 75 });
        } else {
          score += 10;
          reasons.push({ label: "Engagement rate cukup", pct: 50 });
        }

        // Location match (20%)
        if (campaign.location && profile.location === campaign.location) {
          score += 20;
          reasons.push({ label: "Lokasi sesuai", pct: 100 });
        } else {
          score += 10;
          reasons.push({ label: "Lokasi berbeda", pct: 50 });
        }

        return {
          id: inf.id,
          name: profile.displayName,
          category: profile.category,
          location: profile.location,
          followers: profile.followers,
          engagement: profile.engagement,
          score: Math.min(100, score),
          reasons,
        };
      })
      .sort((a, b) => b.score - a.score);

    return NextResponse.json(matches);
  } catch (error) {
    console.error("Matching error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
  }
}
