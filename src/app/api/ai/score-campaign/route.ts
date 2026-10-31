import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { aiJson, aiInfo, clampText } from "@/lib/ai";
import { guardAiQuota } from "@/lib/rate-limit";
import { SYSTEM_SCORE } from "@/lib/prompts";
import { aiErrorResponse, requireAiSession } from "@/lib/ai-route";
import { mergeRuleAndAi, scoreCampaignDraft, type AiScoreResult, type CampaignDraft } from "@/lib/campaign-score";

export const runtime = "nodejs";
export const maxDuration = 90;

function num(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * POST /api/ai/score-campaign
 * Menilai kelayakan brief campaign sebelum dipublikasikan.
 * Selalu mengembalikan skor aturan; skor AI ditambahkan bila tersedia.
 */
export async function POST(req: Request) {
  const guard = await requireAiSession(["UMKM"]);
  if (!guard.ok) return guard.res;

  const quota = guardAiQuota(guard.userId);
  if (quota) return quota;

  try {
    const body = await req.json().catch(() => ({}));

    const draft: CampaignDraft = {
      title: clampText(body.title, 160),
      description: clampText(body.description, 6000),
      category: clampText(body.category, 80),
      budgetMin: num(body.budgetMin),
      budgetMax: num(body.budgetMax),
      location: clampText(body.location, 120) || null,
      requirements: clampText(body.requirements, 3000) || null,
      deliverables: clampText(body.deliverables, 1500) || null,
      startDate: clampText(body.startDate, 40) || null,
      endDate: clampText(body.endDate, 40) || null,
    };

    if (!draft.title && !draft.description) {
      return NextResponse.json(
        { error: "Isi judul atau deskripsi campaign terlebih dahulu agar bisa dinilai.", code: "VALIDATION" },
        { status: 400 },
      );
    }

    const rule = scoreCampaignDraft(draft);

    // Penilaian cepat di dalam form: gunakan aturan saja, hemat token & instan
    if (body.ruleOnly === true) {
      return NextResponse.json({ ...rule, aiUsed: false, targetAudience: [], suggestedNiches: [], model: null });
    }

    const profile = await prismaProfile(guard.userId);

    let ai: AiScoreResult | null = null;
    let aiError: string | null = null;
    try {
      ai = await aiJson<AiScoreResult>({
        messages: [
          { role: "system", content: SYSTEM_SCORE },
          {
            role: "user",
            content: `${profile}

RANCANGAN CAMPAIGN
${JSON.stringify(draft, null, 2)}

Perkirakan juga rentang budget pasar (recommendedMin/recommendedMax dalam Rupiah, pembulatannya kelipatan 100.000).`,
          },
        ],
        temperature: 0.3,
        maxTokens: 1300,
      });
    } catch (err) {
      aiError = err instanceof Error ? err.message : "AI tidak dapat dihubungi.";
      console.warn("[ai/score] memakai skor aturan:", aiError);
    }

    const merged = mergeRuleAndAi(rule, ai);
    return NextResponse.json({ ...merged, model: ai ? aiInfo().model : null, aiError });
  } catch (err) {
    return aiErrorResponse(err);
  }
}

/** Ringkasan profil UMKM sebagai konteks (aman bila profil belum ada). */
async function prismaProfile(userId: string): Promise<string> {
  try {
    const profile = await prisma.uMKMProfile.findUnique({ where: { userId } });
    if (!profile) return "KONTEKS USAHA: profil UMKM belum dilengkapi.";
    return `KONTEKS USAHA
- Nama usaha: ${profile.businessName}
- Kategori: ${profile.category}
- Lokasi: ${profile.location ?? "-"}`;
  } catch {
    return "KONTEKS USAHA: profil tidak dapat dimuat.";
  }
}
