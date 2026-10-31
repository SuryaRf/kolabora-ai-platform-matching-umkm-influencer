import { NextResponse } from "next/server";
import { aiInfo, aiJson, clampText } from "@/lib/ai";
import { guardAiQuota } from "@/lib/rate-limit";
import { SYSTEM_RATE } from "@/lib/prompts";
import { aiErrorResponse, requireSession } from "@/lib/ai-route";
import { loadInfluencerFacts, loadMarketSample } from "@/lib/facts";
import { PLATFORM_MULTIPLIER, rateCard, type RateRow } from "@/lib/profile-score";

export const runtime = "nodejs";
export const maxDuration = 90;

interface AiRatePayload {
  platforms?: { platform?: string; min?: number; max?: number; reason?: string }[];
  advice?: string;
  negotiationLine?: string;
}

const roundTo = (value: number, step = 50_000) => Math.max(step, Math.round(value / step) * step);

/** AI hanya boleh bergeser maksimal 25% dari angka aturan. */
function clampAdjust(value: number, reference: number) {
  const low = reference * 0.75;
  const high = reference * 1.25;
  return roundTo(Math.max(low, Math.min(high, value)));
}

/**
 * POST /api/ai/rate-card
 * AI Rate Recommendation: tarif dasar dihitung dari follower, engagement,
 * rekam jejak, dan budget campaign nyata satu kategori; AI hanya menyesuaikan
 * maksimal 25% untuk alasan produksi yang konkret. Tanpa AI, angka aturan dipakai apa adanya.
 */
export async function POST() {
  try {
    return await handle();
  } catch (err) {
    return aiErrorResponse(err);
  }
}

async function handle() {
  const guard = await requireSession(["INFLUENCER"]);
  if (!guard.ok) return guard.res;

  const quota = guardAiQuota(guard.userId);
  if (quota) return quota;

  const facts = await loadInfluencerFacts(guard.userId);
  if (!facts) {
    return NextResponse.json(
      { error: "Lengkapi profil influencer terlebih dahulu.", code: "PROFILE_MISSING" },
      { status: 400 },
    );
  }

  const market = await loadMarketSample(facts.category);
  const rule = rateCard(facts, market);

  let ai: AiRatePayload | null = null;
  let aiError: string | null = null;
  try {
    ai = await aiJson<AiRatePayload>({
      messages: [
        { role: "system", content: SYSTEM_RATE },
        {
          role: "user",
          content: `KREATOR
Nama: ${facts.displayName}
Kategori: ${facts.category}
Niche: ${facts.niches.join(", ") || facts.category}
Follower: ${facts.followers.toLocaleString("id-ID")}
Engagement: ${facts.engagement}%
Kolaborasi selesai: ${facts.collaborationsCompleted}
Tarif yang sekarang terpasang di profil: ${facts.rateMin ?? "-"} - ${facts.rateMax ?? "-"}

DATA PASAR NYATA (campaign aktif sekategori di Kolabora)
Jumlah sampel: ${market.sampleSize}
Median budget: ${market.medianBudget.toLocaleString("id-ID")} rupiah

ANGKA ATURAN (rupiah per konten, kecuali bundle per campaign)
${rule.platforms.map((p) => `- ${p.platform}: ${p.min.toLocaleString("id-ID")} - ${p.max.toLocaleString("id-ID")}`).join("\n")}

Kembalikan penyesuaian untuk kelima platform di atas.`,
        },
      ],
      temperature: 0.3,
      maxTokens: 700,
    });
  } catch (err) {
    aiError = err instanceof Error ? err.message : "AI tidak dapat dihubungi.";
    console.warn("[ai/rate-card] memakai tarif aturan:", aiError);
  }

  const reasonByPlatform = new Map<string, string>();
  const platforms: RateRow[] = rule.platforms.map((row) => {
    const item = ai?.platforms?.find((p) => String(p.platform) === row.platform);
    const aiMin = typeof item?.min === "number" && Number.isFinite(item.min) ? item.min : null;
    const aiMax = typeof item?.max === "number" && Number.isFinite(item.max) ? item.max : null;
    if (!aiMin || !aiMax) return { ...row, reason: null };
    const min = clampAdjust(aiMin, row.min);
    const max = Math.max(clampAdjust(aiMax, row.max), min);
    reasonByPlatform.set(row.platform, clampText(item?.reason, 120));
    return { ...row, min, max, reason: reasonByPlatform.get(row.platform) || null };
  });

  const primary = platforms.find((p) => p.platform === "instagram-reels") ?? platforms[0];

  return NextResponse.json({
    factors: rule.factors,
    base: rule.base,
    platforms,
    suggestedMin: primary.min,
    suggestedMax: primary.max,
    market: rule.market,
    explanation: rule.explanation,
    advice:
      clampText(ai?.advice, 400) ||
      `Mulai dari ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(primary.min)} untuk konten tunggal. Naikkan mendekati ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(primary.max)} bila UMKM meminta hak pakai iklan atau revisi lebih dari dua kali.`,
    negotiationLine:
      clampText(ai?.negotiationLine, 300) ||
      "Tarif saya untuk deliverable ini di rentang tersebut karena sudah mencakup produksi, satu putaran revisi, dan hak pakai organik selama 3 bulan. Bila menambah hak pakai iklan atau revisi, biayanya saya hitung terpisah.",
    current: { rateMin: facts.rateMin, rateMax: facts.rateMax },
    multipliers: PLATFORM_MULTIPLIER.map((m) => ({ platform: m.platform, multiplier: m.multiplier, note: m.note })),
    aiUsed: Boolean(ai),
    aiError,
    model: ai ? aiInfo().model : null,
  });
}
