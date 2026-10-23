import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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
        const reasons: { label: string; pct: number }[] = [];
        let score = 0;

        const category = campaign.category.toLowerCase();
        const sameCategory = profile.category
          .toLowerCase()
          .includes(category);
        const related = profile.niches.some((n) =>
          n.toLowerCase().includes(category),
        );

        if (sameCategory) {
          score += 40;
          reasons.push({ label: "Kategori sesuai niche Anda", pct: 100 });
        } else if (related) {
          score += 30;
          reasons.push({ label: "Niche terkait campaign", pct: 75 });
        } else {
          score += 12;
          reasons.push({ label: "Kategori di luar niche utama", pct: 35 });
        }

        if (
          campaign.location &&
          profile.location &&
          campaign.location.toLowerCase() === profile.location.toLowerCase()
        ) {
          score += 20;
          reasons.push({ label: "Lokasi campaign sesuai", pct: 100 });
        } else {
          score += 9;
          reasons.push({ label: "Lokasi campaign berbeda", pct: 45 });
        }

        const rateMin = profile.rateMin ?? 0;
        if (rateMin > 0 && campaign.budgetMax >= rateMin) {
          score += 20;
          reasons.push({ label: "Budget sesuai tarif Anda", pct: 100 });
        } else if (rateMin > 0) {
          score += 6;
          reasons.push({ label: "Budget di bawah tarif Anda", pct: 30 });
        } else {
          score += 10;
          reasons.push({ label: "Tarif belum diatur", pct: 50 });
        }

        if (campaign._count.applications <= 2) {
          score += 10;
          reasons.push({ label: "Kompetisi pelamar masih rendah", pct: 100 });
        } else {
          score += 4;
          reasons.push({ label: "Sudah banyak pelamar", pct: 40 });
        }

        const ageDays = Math.floor(
          (Date.now() - campaign.createdAt.getTime()) / 86400000,
        );
        if (ageDays <= 7) {
          score += 10;
          reasons.push({ label: "Campaign baru dipublikasikan", pct: 100 });
        } else {
          score += 5;
          reasons.push({ label: "Campaign sudah berjalan", pct: 50 });
        }

        return {
          campaignId: campaign.id,
          title: campaign.title,
          description: campaign.description,
          category: campaign.category,
          location: campaign.location,
          budgetMin: campaign.budgetMin,
          budgetMax: campaign.budgetMax,
          businessName:
            campaign.owner.umkmProfile?.businessName ??
            campaign.owner.name ??
            "Brand",
          image: campaign.owner.image,
          applicants: campaign._count.applications,
          score: Math.min(100, score),
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
