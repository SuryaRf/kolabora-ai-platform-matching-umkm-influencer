import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { aiChat, aiInfo, clampText } from "@/lib/ai";
import { guardAiQuota } from "@/lib/rate-limit";
import { SYSTEM_CONTENT } from "@/lib/prompts";
import { aiErrorResponse, requireAiSession, readString, isResponse } from "@/lib/ai-route";

export const runtime = "nodejs";
export const maxDuration = 90;

const FORMATS: Record<string, string> = {
  caption: "caption Instagram/TikTok siap tempel",
  hook: "hook pembuka video 3-5 detik",
  skrip: "skrip video utuh dengan penanda detik",
  ide: "ide dan konsep konten",
  carousel: "outline carousel swipe-able",
  stories: "rangkaian Instagram Story",
};

const PLATFORMS = ["TikTok", "Instagram Reels", "Instagram Feed", "Instagram Story", "YouTube Shorts", "X/Twitter"];

function platformHint(raw: string): string {
  const known = PLATFORMS.find((p) => p.toLowerCase() === raw.toLowerCase());
  if (known) return known;
  return raw.toLowerCase().includes("tiktok")
    ? "TikTok"
    : raw.toLowerCase().includes("reels")
      ? "Instagram Reels"
      : raw.toLowerCase().includes("youtube")
        ? "YouTube Shorts"
        : raw;
}

/**
 * POST /api/ai/content
 * Generator konten asli (DeepSeek) untuk influencer.
 * Body: { prompt, format?, platform?, tone?, campaignId?, previous?, feedback? }
 */
export async function POST(req: Request) {
  const guard = await requireAiSession();
  if (!guard.ok) return guard.res;

  const quota = guardAiQuota(guard.userId);
  if (quota) return quota;

  try {
    const body = await req.json().catch(() => ({}));

    const prompt = readString(body.prompt, "Instruksi konten", 10, 2000);
    if (isResponse(prompt)) return prompt;

    const formatKey = clampText(body.format, 24).toLowerCase();
    const formatLabel = FORMATS[formatKey] ?? FORMATS.caption;
    const platform = platformHint(clampText(body.platform, 40) || "TikTok");
    const tone = clampText(body.tone, 60);
    const previous = clampText(body.previous, 2500);
    const feedback = clampText(body.feedback, 600);
    const campaignId = clampText(body.campaignId, 40);

    // Konteks brief (bila dipakai) + profil kreator, semuanya dari database
    const [profile, campaign] = await Promise.all([
      prisma.influencerProfile.findUnique({ where: { userId: guard.userId } }),
      campaignId
        ? prisma.campaign.findUnique({
            where: { id: campaignId },
            include: { owner: { select: { name: true, umkmProfile: { select: { businessName: true, category: true, location: true } } } } },
          })
        : Promise.resolve(null),
    ]);

    const brand = campaign
      ? campaign.owner.umkmProfile?.businessName ?? campaign.owner.name ?? "brand"
      : null;

    const briefBlock = campaign
      ? `BRIEF KAMPANYE
- Judul: ${campaign.title}
- Brand: ${brand} (${campaign.owner.umkmProfile?.category ?? campaign.category})${campaign.owner.umkmProfile?.location ? ` - ${campaign.owner.umkmProfile.location}` : ""}
- Kategori campaign: ${campaign.category}
- Lokasi campaign: ${campaign.location ?? "tidak disebutkan"}
- Deskripsi: ${clampText(campaign.description, 1200)}
- Deliverables: ${clampText(campaign.deliverables ?? "", 400) || "belum dirinci"}
- Ketentuan: ${clampText(campaign.requirements ?? "", 600) || "tidak ada"}
- Rentang budget: Rp ${campaign.budgetMin.toLocaleString("id-ID")} - Rp ${campaign.budgetMax.toLocaleString("id-ID")}`
      : "BRIEF KAMPANYE\nTidak dilampirkan. Gunakan deskripsi yang ditulis pengguna; jangan mengarang detail produk.";

    const creatorBlock = profile
      ? `PROFIL KREATOR
- Nama tampil: ${profile.displayName}
- Kategori: ${profile.category}
- Niche: ${profile.niches.join(", ") || profile.category}
- Jumlah follower: ${profile.followers.toLocaleString("id-ID")}
- Engagement rate: ${profile.engagement}%
- Lokasi: ${profile.location ?? "tidak disebutkan"}
- Bio: ${clampText(profile.bio ?? "", 300) || "-"}`
      : "PROFIL KREATOR\nBelum dilengkapi.";

    const messages = [
      { role: "system" as const, content: SYSTEM_CONTENT },
      {
        role: "user" as const,
        content: [
          creatorBlock,
          briefBlock,
          `PERMINTAAN
- Jenis keluaran: ${formatLabel}
- Platform utama: ${platform}
- Tone: ${tone || "sesuai karakter akun di atas"}
- Permintaan pengguna: ${prompt}`,
          previous
            ? `DRAF SEBELUMNYA (perbaiki, jangan diulang persis):\n${previous}`
            : "",
          feedback ? `CATATAN REVISI: ${feedback}` : "",
          "",
          "Tuliskan hasil mengikuti struktur bagian pada instruksi sistem.",
        ]
          .filter(Boolean)
          .join("\n\n"),
      },
    ];

    const content = await aiChat({ messages, temperature: 0.85, maxTokens: 1600 });
    const info = aiInfo();

    return NextResponse.json({
      content: content.trim(),
      model: info.model,
      campaignId: campaign?.id ?? null,
      charCount: content.trim().length,
    });
  } catch (err) {
    return aiErrorResponse(err);
  }
}
