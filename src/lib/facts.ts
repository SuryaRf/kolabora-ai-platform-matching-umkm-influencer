/**
 * Pengambil data profil nyata (server only) untuk halaman AI Profile Optimizer,
 * AI Rate Recommendation, dan Priority Matching. Satu sumber queries supaya
 * angka di ketiga halaman itu selalu sama.
 */

import { prisma } from "@/lib/prisma";
import type { MarketSample, ProfileFacts } from "@/lib/profile-score";

/** Ringkasan profil + riwayat sungguhan milik satu akun influencer. */
export async function loadInfluencerFacts(userId: string): Promise<ProfileFacts | null> {
  const profile = await prisma.influencerProfile.findUnique({
    where: { userId },
    include: { _count: { select: { portfolio: true } } },
  });
  if (!profile) return null;

  const [appTotal, appAccepted, collabs] = await Promise.all([
    prisma.application.count({ where: { applicantId: userId } }),
    prisma.application.count({ where: { applicantId: userId, status: "ACCEPTED" } }),
    prisma.collaboration.findMany({
      where: { participants: { some: { id: userId } } },
      select: { status: true },
    }),
  ]);

  const statuses = collabs.map((c) => c.status);

  let platforms: unknown = profile.platforms;
  if (typeof platforms === "string") {
    try {
      platforms = JSON.parse(platforms);
    } catch {
      platforms = null;
    }
  }
  const hasPlatforms =
    (Array.isArray(platforms) && platforms.length > 0) ||
    (Boolean(platforms) && typeof platforms === "object" && Object.keys(platforms as object).length > 0);

  return {
    displayName: profile.displayName,
    category: profile.category,
    bio: profile.bio,
    location: profile.location,
    followers: profile.followers,
    engagement: profile.engagement,
    niches: profile.niches,
    hasPlatforms,
    rateMin: profile.rateMin,
    rateMax: profile.rateMax,
    portfolioCount: profile._count.portfolio,
    applicationsTotal: appTotal,
    applicationsAccepted: appAccepted,
    collaborationsCompleted: statuses.filter((s) => s === "COMPLETED").length,
    collaborationsActive: statuses.filter(
      (s) => s !== "COMPLETED" && s !== "CANCELLED" && s !== "DISPUTED",
    ).length,
  };
}

/** Statistik budget campaign aktif pada kategori yang sama (data pasar nyata). */
export async function loadMarketSample(category: string): Promise<MarketSample> {
  const sameCategory = await prisma.campaign.findMany({
    where: { status: "ACTIVE", category: { contains: category } },
    select: { budgetMin: true, budgetMax: true },
    take: 200,
  });

  if (sameCategory.length === 0) {
    return { sampleSize: 0, medianBudget: 0, category };
  }

  const midpoints = sameCategory
    .map((c) => Math.round((c.budgetMin + c.budgetMax) / 2))
    .sort((a, b) => a - b);
  const middle = Math.floor(midpoints.length / 2);
  const median =
    midpoints.length % 2 === 0
      ? Math.round((midpoints[middle - 1] + midpoints[middle]) / 2)
      : midpoints[middle];

  return { sampleSize: sameCategory.length, medianBudget: median, category };
}

/** Funnel & ringkasan angka untuk halaman Priority Matching. */
export async function loadInfluencerStats(userId: string) {
  const [applications, collaborations, portfolio, reviews] = await Promise.all([
    prisma.application.groupBy({
      by: ["status"],
      where: { applicantId: userId },
      _count: { _all: true },
    }),
    prisma.collaboration.findMany({
      where: { participants: { some: { id: userId } } },
      select: { status: true, escrowAmount: true, escrowStatus: true, budget: true },
    }),
    prisma.portfolioItem.count({ where: { profile: { userId } } }),
    prisma.contentReview.count({
      where: { status: "APPROVED", collaboration: { participants: { some: { id: userId } } } },
    }),
  ]);

  const byStatus: Record<string, number> = {};
  for (const row of applications) byStatus[row.status] = row._count._all;
  const totalApplied = applications.reduce((sum, row) => sum + row._count._all, 0);

  const released = collaborations.filter((c) => c.escrowStatus === "RELEASED");
  const totalEarned = released.reduce((sum, c) => sum + (c.escrowAmount ?? c.budget ?? 0), 0);

  return {
    applications: {
      total: totalApplied,
      pending: byStatus.PENDING ?? 0,
      reviewed: byStatus.REVIEWED ?? 0,
      accepted: byStatus.ACCEPTED ?? 0,
      rejected: byStatus.REJECTED ?? 0,
    },
    collaborations: {
      total: collaborations.length,
      completed: collaborations.filter((c) => c.status === "COMPLETED").length,
      active: collaborations.filter(
        (c) => !["COMPLETED", "CANCELLED", "DISPUTED"].includes(c.status),
      ).length,
      totalEarned,
      paidCampaigns: released.length,
    },
    portfolioCount: portfolio,
    approvedContents: reviews,
  };
}
