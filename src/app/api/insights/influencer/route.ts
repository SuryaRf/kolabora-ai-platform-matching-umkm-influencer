import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/ai-route";
import { scoreCampaign, type ScoringCampaign, type ScoringProfile } from "@/lib/matching";
import { loadInfluencerFacts, loadInfluencerStats } from "@/lib/facts";
import { missingFields, scoreProfile } from "@/lib/profile-score";

export const runtime = "nodejs";

/**
 * GET /api/insights/influencer
 * Angka nyata untuk halaman Priority Matching & ringkasan profil:
 * funnel lamaran, kolaborasi, pemasukan escrow yang cair, skor profil,
 * dan peringkat visibilitas terhadap kreator lain pada campaign aktif.
 */
export async function GET() {
  try {
    return await handle();
  } catch (error) {
    console.error("Insights influencer error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan. Silakan coba lagi." }, { status: 500 });
  }
}

async function handle() {
  const guard = await requireSession(["INFLUENCER"]);
  if (!guard.ok) return guard.res;
  const userId = guard.userId;

  const facts = await loadInfluencerFacts(userId);
  if (!facts) {
    return NextResponse.json(
      { error: "Lengkapi profil influencer terlebih dahulu.", code: "PROFILE_MISSING" },
      { status: 400 },
    );
  }

  const [stats, campaigns, peers] = await Promise.all([
    loadInfluencerStats(userId),
    prisma.campaign.findMany({
      where: { status: "ACTIVE" },
      select: {
        category: true,
        location: true,
        budgetMax: true,
        createdAt: true,
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 60,
    }),
    prisma.influencerProfile.findMany({
      select: {
        userId: true,
        category: true,
        niches: true,
        location: true,
        rateMin: true,
        followers: true,
        engagement: true,
        bio: true,
      },
      take: 500,
    }),
  ]);

  const scorable: ScoringCampaign[] = campaigns.map((c) => ({
    category: c.category,
    location: c.location,
    budgetMax: c.budgetMax,
    applicants: c._count.applications,
    createdAt: c.createdAt,
  }));

  const avgMatch = (profile: {
    category: string;
    niches: string[];
    location?: string | null;
    rateMin?: number | null;
  }) => {
    if (!scorable.length) return 0;
    const scoring: ScoringProfile = {
      category: profile.category,
      niches: profile.niches,
      location: profile.location ?? null,
      rateMin: profile.rateMin ?? null,
    };
    const total = scorable.reduce(
      (sum, c) => sum + scoreCampaign(scoring, c).score,
      0,
    );
    return Math.round(total / scorable.length);
  };

  const myVisibility = avgMatch({
    category: facts.category,
    niches: facts.niches,
    location: facts.location,
    rateMin: facts.rateMin,
  });

  const peerVisibility = peers
    .filter((p) => p.userId !== userId)
    .map((p) => avgMatch({ category: p.category, niches: p.niches, location: p.location, rateMin: p.rateMin }))
    .sort((a, b) => b - a);

  const rank = peerVisibility.filter((v) => v > myVisibility).length + 1;
  const profileScore = scoreProfile(facts);

  return NextResponse.json({
    profile: {
      displayName: facts.displayName,
      category: facts.category,
      location: facts.location ?? null,
      followers: facts.followers,
      engagement: facts.engagement,
      niches: facts.niches,
      rateMin: facts.rateMin ?? null,
      rateMax: facts.rateMax ?? null,
      portfolioCount: facts.portfolioCount,
    },
    score: profileScore.overall,
    subScores: profileScore.subScores,
    missing: missingFields(facts),
    visibility: {
      score: myVisibility,
      rank,
      competitors: peerVisibility.length + 1,
      activeCampaigns: scorable.length,
    },
    funnel: stats.applications,
    collaborations: stats.collaborations,
    approvedContents: stats.approvedContents,
    conversionRate:
      stats.applications.total > 0
        ? Math.round((stats.applications.accepted / stats.applications.total) * 100)
        : null,
  });
}
