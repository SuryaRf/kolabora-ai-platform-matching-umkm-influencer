/**
 * Pencocokan berbasis aturan (niche, lokasi, budget, persaingan, umur campaign).
 * Dipakai oleh /api/matching/campaigns dan /api/ai/match supaya keduanya
 * menghitung skor dengan cara yang sama.
 */

export interface ScoringProfile {
  /** Kategori utama influencer, contoh: "Kuliner" */
  category: string;
  /** Niche tambahan dari profil */
  niches: string[];
  /** Lokasi domisili, mis. "Jakarta" */
  location: string | null;
  /** Tarif minimum per kampanye (Rp) */
  rateMin: number | null;
}

export interface ScoringCampaign {
  category: string;
  location: string | null;
  budgetMax: number;
  /** Jumlah pelamar saat ini */
  applicants: number;
  createdAt: Date;
}

export interface MatchReason {
  label: string;
  /** Kepentingan alasan ini untuk UI bar, 0-100 */
  pct: number;
  /** Kategori alasan, dipakai untuk mencari tahu kenapa skor tinggi/rendah */
  kind: "niche" | "location" | "budget" | "competition" | "freshness";
}

export interface ScoreResult {
  score: number;
  reasons: MatchReason[];
}

/** Bobot maksimum tiap faktor; total mentah = 100 */
export const MATCH_WEIGHTS = {
  niche: 40,
  location: 20,
  budget: 20,
  competition: 10,
  freshness: 10,
} as const;

export function scoreCampaign(profile: ScoringProfile, campaign: ScoringCampaign): ScoreResult {
  const reasons: MatchReason[] = [];
  let score = 0;

  const category = (campaign.category ?? "").toLowerCase().trim();
  const profileCategory = (profile.category ?? "").toLowerCase().trim();
  const sameCategory = profileCategory.length > 0 && category.length > 0 && profileCategory.includes(category);
  const related = (profile.niches ?? []).some((n) => {
    const niche = (n ?? "").toLowerCase().trim();
    return niche.length > 0 && category.length > 0 && niche.includes(category);
  });

  if (sameCategory) {
    score += 40;
    reasons.push({ label: "Kategori sesuai niche Anda", pct: 100, kind: "niche" });
  } else if (related) {
    score += 30;
    reasons.push({ label: "Niche terkait campaign", pct: 75, kind: "niche" });
  } else {
    score += 12;
    reasons.push({ label: "Kategori di luar niche utama", pct: 35, kind: "niche" });
  }

  if (
    campaign.location &&
    profile.location &&
    campaign.location.toLowerCase().trim() === profile.location.toLowerCase().trim()
  ) {
    score += 20;
    reasons.push({ label: "Lokasi campaign sesuai", pct: 100, kind: "location" });
  } else {
    score += 9;
    reasons.push({ label: "Lokasi campaign berbeda", pct: 45, kind: "location" });
  }

  const rateMin = profile.rateMin ?? 0;
  if (rateMin > 0 && campaign.budgetMax >= rateMin) {
    score += 20;
    reasons.push({ label: "Budget sesuai tarif Anda", pct: 100, kind: "budget" });
  } else if (rateMin > 0) {
    score += 6;
    reasons.push({ label: "Budget di bawah tarif Anda", pct: 30, kind: "budget" });
  } else {
    score += 10;
    reasons.push({ label: "Tarif belum diatur", pct: 50, kind: "budget" });
  }

  if (campaign.applicants <= 2) {
    score += 10;
    reasons.push({ label: "Kompetisi pelamar masih rendah", pct: 100, kind: "competition" });
  } else {
    score += 4;
    reasons.push({ label: "Sudah banyak pelamar", pct: 40, kind: "competition" });
  }

  const ageDays = Math.floor((Date.now() - campaign.createdAt.getTime()) / 86_400_000);
  if (ageDays <= 7) {
    score += 10;
    reasons.push({ label: "Campaign baru dipublikasikan", pct: 100, kind: "freshness" });
  } else {
    score += 5;
    reasons.push({ label: "Campaign sudah berjalan", pct: 50, kind: "freshness" });
  }

  return { score: Math.min(100, score), reasons };
}

/** Gabungkan skor aturan dengan skor AI. AI tidak pernah menyingkirkan hasil aturan sepenuhnya. */
export function blendScores(ruleScore: number, aiScore: number, aiWeight = 0.45): number {
  const w = Math.min(1, Math.max(0, aiWeight));
  return Math.round(Math.min(100, Math.max(0, ruleScore * (1 - w) + aiScore * w)));
}
