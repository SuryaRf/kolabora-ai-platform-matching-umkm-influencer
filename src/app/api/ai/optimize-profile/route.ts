import { NextResponse } from "next/server";
import { aiInfo, aiJson, clampText } from "@/lib/ai";
import { guardAiQuota } from "@/lib/rate-limit";
import { SYSTEM_PROFILE } from "@/lib/prompts";
import { aiErrorResponse, requireSession } from "@/lib/ai-route";
import { loadInfluencerFacts } from "@/lib/facts";
import { draftBio, missingFields, scoreProfile, type ProfileRecommendation } from "@/lib/profile-score";

export const runtime = "nodejs";
export const maxDuration = 90;

interface AiProfilePayload {
  bio?: string;
  reason?: string;
  recommendations?: { type?: string; priority?: string; suggestion?: string }[];
}

const PRIORITAS = new Set(["Tinggi", "Sedang", "Rendah"]);
const TIPE = new Set(["Bio", "Niche", "Tarif", "Portofolio", "Platform", "Lokasi", "Lamaran"]);

/**
 * POST /api/ai/optimize-profile
 * AI Profile Optimizer: skor dihitung dari data profil yang sebenarnya
 * (src/lib/profile-score.ts), AI menambah draf bio dan perbaikan konkret.
 * Bila kunci AI tidak ada/gagal, draf bio disusun dari data yang sama.
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

  const rule = scoreProfile(facts);
  const missing = missingFields(facts);

  let ai: AiProfilePayload | null = null;
  let aiError: string | null = null;
  try {
    ai = await aiJson<AiProfilePayload>({
      messages: [
        { role: "system", content: SYSTEM_PROFILE },
        {
          role: "user",
          content: `DATA PROFIL (asli dari database)
Nama tampil: ${facts.displayName}
Kategori: ${facts.category}
Niche: ${facts.niches.join(", ") || "(belum diisi)"}
Lokasi: ${facts.location ?? "(belum diisi)"}
Follower: ${facts.followers.toLocaleString("id-ID")}
Engagement: ${facts.engagement}%
Tarif: ${facts.rateMin ?? "-"} - ${facts.rateMax ?? "-"}
Jumlah karya di portofolio: ${facts.portfolioCount}
Kolaborasi selesai: ${facts.collaborationsCompleted}
Lamaran dikirim: ${facts.applicationsTotal}, diterima: ${facts.applicationsAccepted}
Bio sekarang: ${clampText(facts.bio ?? "", 300) || "(kosong)"}

SKOR ATURAN
${rule.subScores.map((s) => `- ${s.label}: ${s.score}/100 (bobot ${s.weight}%, ${s.detail})`).join("\n")}

Field yang belum diisi: ${missing.join(", ") || "(tidak ada)"}
Susun draf bio maksimal 220 karakter dan 3-5 perbaikan.`,
        },
      ],
      temperature: 0.5,
      maxTokens: 900,
    });
  } catch (err) {
    aiError = err instanceof Error ? err.message : "AI tidak dapat dihubungi.";
    console.warn("[ai/optimize-profile] memakai hasil aturan:", aiError);
  }

  const aiBio = clampText(ai?.bio, 260);
  const bio = aiBio.length >= 40 ? aiBio : draftBio(facts);

  const aiRecs: ProfileRecommendation[] = (ai?.recommendations ?? [])
    .map((r) => {
      const type = TIPE.has(String(r.type)) ? String(r.type) : "Bio";
      const rawPriority = String(r.priority ?? "");
      const priority = PRIORITAS.has(rawPriority)
        ? (rawPriority as ProfileRecommendation["priority"])
        : "Sedang";
      return { type, priority, suggestion: clampText(r.suggestion, 220) };
    })
    .filter((r) => r.suggestion.length >= 15)
    .slice(0, 5);

  // Hasil aturan tetap dipakai untuk field yang belum disentuh AI.
  const covered = new Set(aiRecs.map((r) => r.type));
  const merged = [...aiRecs, ...rule.recommendations.filter((r) => !covered.has(r.type))].slice(0, 6);

  return NextResponse.json({
    overall: rule.overall,
    subScores: rule.subScores,
    missing,
    currentBio: facts.bio ?? "",
    bio,
    bioSource: aiBio.length >= 40 ? "ai" : "aturan",
    reason: clampText(ai?.reason, 200) || "Draf disusun dari data yang ada; lengkapi field yang masih kosong agar lebih kuat.",
    recommendations: merged.length ? merged : rule.recommendations,
    aiUsed: Boolean(ai),
    aiError,
    model: ai ? aiInfo().model : null,
  });
}
