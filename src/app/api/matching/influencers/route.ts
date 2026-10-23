import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category")?.toLowerCase() ?? "";
    const location = searchParams.get("location")?.toLowerCase() ?? "";
    const budget = Number(searchParams.get("budget") ?? 0);

    const users = await prisma.user.findMany({
      where: { role: "INFLUENCER", id: { not: session.user.id } },
      include: { influencerProfile: true },
    });

    const matches = users
      .filter((u) => u.influencerProfile)
      .map((u) => {
        const profile = u.influencerProfile!;
        const reasons: { label: string; pct: number }[] = [];
        let score = 0;

        const sameCategory =
          category.length > 0 &&
          profile.category.toLowerCase().includes(category);
        const relatedCategory =
          category.length > 0 &&
          profile.niches.some((n) => n.toLowerCase().includes(category));

        if (sameCategory) {
          score += 40;
          reasons.push({ label: "Kategori persis dengan campaign", pct: 100 });
        } else if (relatedCategory) {
          score += 30;
          reasons.push({ label: "Niche terkait dengan campaign", pct: 75 });
        } else {
          score += 12;
          reasons.push({ label: "Kategori di luar niche utama", pct: 35 });
        }

        const sameLocation =
          location.length > 0 &&
          (profile.location ?? "").toLowerCase().includes(location);
        if (sameLocation) {
          score += 15;
          reasons.push({ label: "Lokasi sesuai target", pct: 100 });
        } else {
          score += 7;
          reasons.push({ label: "Lokasi berbeda (tetap terjangkau)", pct: 50 });
        }

        if (profile.followers >= 10000) {
          score += 15;
          reasons.push({ label: "Jangkauan audiens besar", pct: 100 });
        } else if (profile.followers >= 5000) {
          score += 11;
          reasons.push({ label: "Jangkauan audiens menengah", pct: 75 });
        } else {
          score += 7;
          reasons.push({ label: "Audiens masih berkembang", pct: 50 });
        }

        if (profile.engagement >= 5) {
          score += 15;
          reasons.push({ label: "Engagement rate sangat baik", pct: 100 });
        } else if (profile.engagement >= 3) {
          score += 11;
          reasons.push({ label: "Engagement rate baik", pct: 75 });
        } else {
          score += 7;
          reasons.push({ label: "Engagement rate cukup", pct: 50 });
        }

        const rateMin = profile.rateMin ?? 0;
        if (budget > 0 && rateMin > 0 && rateMin <= budget) {
          score += 15;
          reasons.push({ label: "Tarif masih dalam budget", pct: 100 });
        } else if (budget > 0 && rateMin > 0) {
          score += 5;
          reasons.push({ label: "Tarif di atas budget", pct: 30 });
        } else {
          score += 8;
          reasons.push({ label: "Tarif belum diatur", pct: 55 });
        }

        return {
          userId: u.id,
          name: profile.displayName || u.name || "Influencer",
          image: u.image,
          category: profile.category,
          bio: profile.bio,
          location: profile.location,
          followers: profile.followers,
          engagement: profile.engagement,
          rateMin: profile.rateMin,
          rateMax: profile.rateMax,
          niches: profile.niches,
          score: Math.min(100, score),
          reasons,
        };
      })
      .sort((a, b) => b.score - a.score);

    return NextResponse.json(matches);
  } catch (error) {
    console.error("Match influencers error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
  }
}
