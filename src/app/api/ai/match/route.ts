import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { aiInfo, aiJson, clampText } from "@/lib/ai";
import { guardAiQuota } from "@/lib/rate-limit";
import { SYSTEM_MATCH } from "@/lib/prompts";
import { blendScores, scoreCampaign, type ScoringCampaign } from "@/lib/matching";
import { aiErrorResponse, requireAiSession } from "@/lib/ai-route";

export const runtime = "nodejs";
export const maxDuration = 90;

interface AiMatchItem {
  id?: string;
  aiScore?: number;
  reason?: string;
  pitch?: string;
  risk?: string;
}

interface AiMatchPayload {
  matches?: AiMatchItem[];
  overallAdvice?: string;
  missingFields?: string[];
}

/**
 * POST /api/ai/match
 * Smart matching hibrida: kandidat dihitung dengan aturan (niche, lokasi,
 * budget, persaingan, umur campaign), lalu AI memberi alasan, skor kualitatif,
 * dan usulan kalimat lamaran. Bila AI gagal, hasil aturan tetap dikembalikan.
 */
export async function POST(req: Request) {
  const guard = await requireAiSession(["INFLUENCER"]);
  if (!guard.ok) return guard.res;

  const quota = guardAiQuota(guard.userId);
  if (quota) return quota;

  try {
    const body = await req.json().catch(() => ({}));
    const requestedLimit = Math.min(15, Math.max(3, Number(body.limit) || 8));

    const profile = await prisma.influencerProfile.findUnique({ where: { userId: guard.userId } });
    if (!profile) {
      return NextResponse.json(
        { error: "Lengkapi profil influencer terlebih dahulu (kategori, niche, lokasi, dan tarif).", code: "PROFILE_MISSING" },
        { status: 400 },
      );
    }

    const campaigns = await prisma.campaign.findMany({
      where: { status: "ACTIVE" },
      include: {
        owner: { select: { name: true, image: true, umkmProfile: { select: { businessName: true, category: true, location: true } } } },
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 60,
    });

    // Sudah pernah melamar disingkirkan agar rekomendasi selalu relevan
    const applied = await prisma.application.findMany({
      where: { applicantId: profile.userId },
      select: { campaignId: true },
    });
    const appliedIds = new Set(applied.map((a) => a.campaignId));

    const scored = campaigns
      .filter((c) => !appliedIds.has(c.id))
      .map((campaign) => {
        const scorable: ScoringCampaign = {
          category: campaign.category,
          location: campaign.location,
          budgetMax: campaign.budgetMax,
          applicants: campaign._count.applications,
          createdAt: campaign.createdAt,
        };
        const { score, reasons } = scoreCampaign(
          { category: profile.category, niches: profile.niches, location: profile.location, rateMin: profile.rateMin },
          scorable,
        );
        return {
          campaignId: campaign.id,
          title: campaign.title,
          description: campaign.description,
          category: campaign.category,
          location: campaign.location,
          budgetMin: campaign.budgetMin,
          budgetMax: campaign.budgetMax,
          deliverables: campaign.deliverables,
          businessName: campaign.owner.umkmProfile?.businessName ?? campaign.owner.name ?? "Brand",
          image: campaign.owner.image,
          applicants: campaign._count.applications,
          createdAt: campaign.createdAt.toISOString(),
          ruleScore: score,
          reasons,
        };
      })
      .sort((a, b) => b.ruleScore - a.ruleScore);

    const candidates = scored.slice(0, requestedLimit);

    if (!candidates.length) {
      return NextResponse.json({
        matches: [],
        aiUsed: false,
        overallAdvice: appliedIds.size > 0 ? "Anda sudah melamar semua campaign yang sedang aktif." : "Belum ada campaign aktif saat ini.",
        ruleCandidates: scored.length,
      });
    }

    let ai: AiMatchPayload | null = null;
    let aiError: string | null = null;
    try {
      ai = await aiJson<AiMatchPayload>({
        messages: [
          { role: "system", content: SYSTEM_MATCH },
          {
            role: "user",
            content: `PROFIL KREATOR
- Nama tampil: ${profile.displayName}
- Kategori: ${profile.category}
- Niche: ${profile.niches.join(", ") || profile.category}
- Follower: ${profile.followers.toLocaleString("id-ID")}
- Engagement rate: ${profile.engagement}%
- Lokasi: ${profile.location ?? "belum diisi"}
- Tarif: Rp ${(profile.rateMin ?? 0).toLocaleString("id-ID")} - Rp ${(profile.rateMax ?? 0).toLocaleString("id-ID")}
- Bio: ${clampText(profile.bio ?? "", 300) || "-"}

KANDIDAT CAMPAIGN (sudah dinilai sistem aturan; urutkan ulang bila ada alasan kualitatif)
${JSON.stringify(
  candidates.map((c) => ({
    id: c.campaignId,
    judul: c.title,
    kategori: c.category,
    lokasi: c.location,
    budget_rupiah: [c.budgetMin, c.budgetMax],
    pelamar: c.applicants,
    skor_aturan: c.ruleScore,
    deliverables: clampText(c.deliverables ?? "", 160),
    ringkasan: clampText(c.description, 220),
  })),
  null,
  2,
)}

Batas: maksimal ${requestedLimit} item, sertakan seluruh kandidat di atas.`,
          },
        ],
        temperature: 0.35,
        maxTokens: 1500,
      });
    } catch (err) {
      aiError = err instanceof Error ? err.message : "AI tidak dapat dihubungi.";
      console.warn("[ai/match] memakai pencocokan aturan:", aiError);
    }

    const byId = new Map((ai?.matches ?? []).map((m) => [String(m.id ?? ""), m]));

    const matches = candidates
      .map((c) => {
        const item = byId.get(c.campaignId);
        const aiRaw = typeof item?.aiScore === "number" && Number.isFinite(item.aiScore) ? item.aiScore : null;
        const score = aiRaw === null ? c.ruleScore : blendScores(c.ruleScore, Math.max(0, Math.min(100, aiRaw)));
        return {
          ...c,
          score,
          aiScore: aiRaw,
          reason: clampText(item?.reason, 220) || c.reasons[0]?.label || "Kecocokan dihitung dari niche, lokasi, budget, dan persaingan.",
          pitch: clampText(item?.pitch, 320) || null,
          risk: clampText(item?.risk, 200) || null,
        };
      })
      .sort((a, b) => b.score - a.score);

    return NextResponse.json({
      matches,
      aiUsed: Boolean(ai),
      aiError,
      model: ai ? aiInfo().model : null,
      overallAdvice: clampText(ai?.overallAdvice, 400) || null,
      missingFields: (ai?.missingFields ?? []).filter((f) => typeof f === "string").slice(0, 5),
      ruleCandidates: scored.length,
    });
  } catch (err) {
    return aiErrorResponse(err);
  }
}
