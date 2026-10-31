/**
 * Penilai profil kreator & penghitung tarif (murni aturan, tanpa AI).
 *
 * Semua angka berasal dari data yang benar-benar ada di database:
 * kelengkapan profil, bio, follower, engagement, portofolio, dan riwayat
 * lamaran/kolaborasi. Halaman AI Profile Optimizer dan AI Rate Recommendation
 * memakai modul ini sebagai dasar, lalu AI hanya menambah/merapikan.
 */

import { RATE_PER_FOLLOWER_PER_DELIVERABLE } from "@/lib/campaign-score";

export interface ProfileFacts {
  displayName: string;
  category: string;
  bio?: string | null;
  location?: string | null;
  followers: number;
  engagement: number;
  niches: string[];
  hasPlatforms: boolean;
  rateMin?: number | null;
  rateMax?: number | null;
  portfolioCount: number;
  applicationsTotal: number;
  applicationsAccepted: number;
  collaborationsCompleted: number;
  collaborationsActive: number;
}

export interface SubScore {
  key: string;
  label: string;
  score: number;
  weight: number;
  detail: string;
}

export interface ProfileRecommendation {
  type: string;
  priority: "Tinggi" | "Sedang" | "Rendah";
  suggestion: string;
}

export interface ProfileScoreResult {
  overall: number;
  subScores: SubScore[];
  missing: string[];
  recommendations: ProfileRecommendation[];
}

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));
const roundTo = (value: number, step: number) => Math.max(step, Math.round(value / step) * step);
const rupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(
    Math.round(value),
  );

/** Field yang belum diisi dan paling berpengaruh pada pencocokan. */
export function missingFields(p: ProfileFacts): string[] {
  const out: string[] = [];
  if (!p.bio || p.bio.trim().length < 40) out.push("bio");
  if (!p.location) out.push("lokasi");
  if (p.niches.length < 2) out.push("niche");
  if (!p.hasPlatforms) out.push("platform sosial");
  if (!p.rateMin || !p.rateMax) out.push("rentang tarif");
  if (p.portfolioCount === 0) out.push("portofolio");
  if (!p.followers) out.push("jumlah follower");
  if (!p.engagement) out.push("engagement rate");
  return out;
}

function completenessScore(p: ProfileFacts): number {
  const checks: boolean[] = [
    Boolean(p.displayName),
    Boolean(p.category),
    Boolean(p.bio && p.bio.trim().length >= 40),
    Boolean(p.location),
    p.niches.length >= 2,
    p.hasPlatforms,
    Boolean(p.rateMin && p.rateMax),
    p.followers > 0,
    p.engagement > 0,
    p.portfolioCount > 0,
  ];
  const filled = checks.filter(Boolean).length;
  return Math.round((filled / checks.length) * 100);
}

function bioScore(p: ProfileFacts): number {
  const bio = (p.bio ?? "").trim();
  if (!bio) return 0;
  let score = 0;
  if (bio.length >= 40) score += 35;
  else score += Math.round((bio.length / 40) * 35);
  if (bio.length >= 90 && bio.length <= 400) score += 20;

  const words = [p.category, ...p.niches]
    .map((w) => w.toLowerCase().trim())
    .filter((w) => w.length > 2);
  const lower = bio.toLowerCase();
  const hits = words.filter((w) => lower.includes(w)).length;
  score += clamp(Math.round((hits / Math.max(1, Math.min(3, words.length))) * 25), 0, 25);

  if (/(@|https?:\/\/|wa\.me|instagram\.com|tiktok\.com|youtube\.com)/i.test(bio)) score += 10;
  if (/[0-9]/.test(bio)) score += 5;
  if (/\b(halo|dm|email|kontak|kolaborasi|collab)\b/i.test(bio)) score += 10;
  return clamp(score);
}

function reachScore(p: ProfileFacts): number {
  const f = p.followers;
  if (f <= 0) return 0;
  if (f >= 100_000) return 92;
  if (f >= 50_000) return 84;
  if (f >= 25_000) return 75;
  if (f >= 10_000) return 65;
  if (f >= 5_000) return 54;
  if (f >= 1_000) return 40;
  return 25;
}

function engagementScore(p: ProfileFacts): number {
  const e = p.engagement;
  if (e <= 0) return 0;
  if (e >= 8) return 95;
  if (e >= 6) return 88;
  if (e >= 4) return 76;
  if (e >= 2) return 60;
  if (e >= 1) return 45;
  return 25;
}

function visualScore(p: ProfileFacts): number {
  const withUrl = p.portfolioCount;
  let score = clamp(withUrl * 20, 0, 60);
  if (withUrl >= 3) score += 20;
  if (p.hasPlatforms) score += 20;
  return clamp(score);
}

function trackRecordScore(p: ProfileFacts): number {
  let score = 0;
  if (p.collaborationsCompleted > 0) score += clamp(p.collaborationsCompleted * 20, 0, 60);
  if (p.applicationsTotal > 0) {
    const ratio = p.applicationsAccepted / p.applicationsTotal;
    score += clamp(Math.round(ratio * 40), 0, 40);
  } else {
    score += 10; // akun baru belum punya sinyal, jangan dihukum penuh
  }
  return clamp(score);
}

export function scoreProfile(p: ProfileFacts): ProfileScoreResult {
  const subScores: SubScore[] = [
    {
      key: "completeness",
      label: "Kelengkapan profil",
      score: completenessScore(p),
      weight: 25,
      detail: `${10 - missingFields(p).length}/10 kolom terisi`,
    },
    {
      key: "bio",
      label: "Kualitas bio",
      score: bioScore(p),
      weight: 20,
      detail: p.bio ? `${p.bio.trim().length} karakter` : "belum diisi",
    },
    {
      key: "reach",
      label: "Jangkauan audiens",
      score: reachScore(p),
      weight: 20,
      detail: p.followers > 0 ? `${p.followers.toLocaleString("id-ID")} follower` : "follower belum diisi",
    },
    {
      key: "engagement",
      label: "Engagement",
      score: engagementScore(p),
      weight: 20,
      detail: p.engagement > 0 ? `${p.engagement}%` : "belum diisi",
    },
    {
      key: "visual",
      label: "Portofolio & bukti karya",
      score: visualScore(p),
      weight: 10,
      detail: `${p.portfolioCount} karya terdaftar`,
    },
    {
      key: "track",
      label: "Rekam jejak",
      score: trackRecordScore(p),
      weight: 5,
      detail:
        p.collaborationsCompleted > 0
          ? `${p.collaborationsCompleted} kolaborasi selesai`
          : "belum ada yang selesai",
    },
  ];

  const totalWeight = subScores.reduce((sum, s) => sum + s.weight, 0);
  const overall = Math.round(
    subScores.reduce((sum, s) => sum + s.score * s.weight, 0) / totalWeight,
  );

  const recommendations: ProfileRecommendation[] = [];
  if (!p.bio || p.bio.trim().length < 40) {
    recommendations.push({
      type: "Bio",
      priority: "Tinggi",
      suggestion:
        "Tulis bio minimal 40 karakter: sebutkan niche, satu bukti hasil (angka follower/kolaborasi), dan cara menghubungi kamu.",
    });
  } else if (p.bio.trim().length < 90) {
    recommendations.push({
      type: "Bio",
      priority: "Sedang",
      suggestion: "Bio sudah ada tapi masih pendek. Tambahkan 1-2 kalimat tentang gaya konten dan kota domisili.",
    });
  }
  if (!p.location) {
    recommendations.push({
      type: "Lokasi",
      priority: "Tinggi",
      suggestion: "Isi kota domisili. Pencocokan memberi nilai lebih pada kreator yang satu kota dengan UMKM.",
    });
  }
  if (p.niches.length < 2) {
    recommendations.push({
      type: "Niche",
      priority: "Sedang",
      suggestion: "Tambahkan minimal dua niche agar muncul pada lebih banyak pencarian UMKM.",
    });
  }
  if (!p.rateMin || !p.rateMax) {
    recommendations.push({
      type: "Tarif",
      priority: "Tinggi",
      suggestion: "Isi rentang tarif. UMKM dapat menyaring berdasarkan budget, jadi profil tanpa tarif sering terlewat.",
    });
  }
  if (p.portfolioCount === 0) {
    recommendations.push({
      type: "Portofolio",
      priority: "Sedang",
      suggestion: "Unggah minimal tiga karya terpilih supaya UMKM bisa menilai kualitas konten kamu.",
    });
  }
  if (!p.hasPlatforms) {
    recommendations.push({
      type: "Platform",
      priority: "Sedang",
      suggestion: "Daftarkan akun Instagram/TikTok/YouTube kamu di profil agar kecocokan platform bisa dihitung.",
    });
  }
  if (p.applicationsTotal >= 5 && p.applicationsAccepted === 0) {
    recommendations.push({
      type: "Lamaran",
      priority: "Tinggi",
      suggestion:
        "Sudah mengirim banyak lamaran tetapi belum ada yang diterima. Sesuaikan tarif dengan budget campaign dan sebutkan hasil konkret di proposal.",
    });
  }

  const order = { Tinggi: 0, Sedang: 1, Rendah: 2 } as const;
  recommendations.sort((a, b) => order[a.priority] - order[b.priority]);

  return { overall, subScores, missing: missingFields(p), recommendations };
}

/** Draf bio darurat bila AI tidak tersedia — hanya memakai data asli pengguna. */
export function draftBio(p: ProfileFacts): string {
  const niches = p.niches.length ? p.niches.slice(0, 3).join(" | ") : p.category;
  const reach = p.followers > 0 ? `${(p.followers / 1000).toFixed(1).replace(".0", "")}K+ audiens` : "audiens yang terus tumbuh";
  const proof =
    p.collaborationsCompleted > 0 ? `${p.collaborationsCompleted} campaign selesai` : "terbuka untuk campaign perdana";
  const location = p.location ? ` • ${p.location}` : "";
  const rate =
    p.rateMin && p.rateMax
      ? ` • tarif mulai Rp ${(p.rateMin / 1000).toFixed(0)}rb`
      : "";
  return `${p.displayName} — ${niches}${location}. ${reach}, ${proof}${rate}. Kolaborasi? DM atau email ke ${"[alamat email kamu]"}.`;
}

/* ------------------------------------------------------------------ tarif */

export const PLATFORM_MULTIPLIER: { platform: string; label: string; multiplier: number; note: string }[] = [
  { platform: "instagram-feed", label: "Instagram Feed (foto/carousel)", multiplier: 1, note: "deliverable standar" },
  { platform: "instagram-reels", label: "Instagram Reels", multiplier: 1.25, note: "produksi video pendek" },
  { platform: "tiktok-video", label: "TikTok Video", multiplier: 1.35, note: "kejar volume penonton" },
  { platform: "youtube-video", label: "YouTube (dedicated/integrated)", multiplier: 1.7, note: "durasi panjang, umur konten awet" },
  { platform: "bundle", label: "Bundle (3 konten + story)", multiplier: 2.4, note: "harga paket, lebih murah per konten" },
];

export interface MarketSample {
  sampleSize: number;
  medianBudget: number;
  category: string;
}

export interface RateFactor {
  label: string;
  value: string;
  effect: number; // pengali yang diterapkan
  weight: number; // porsi pengaruh, untuk ditampilkan
}

export interface RateRow {
  platform: string;
  label: string;
  note: string;
  min: number;
  max: number;
  per: string;
  /** Alasan kualitatif dari AI (bila dipakai), maksimal 120 karakter. */
  reason?: string | null;
}

export interface RateResult {
  factors: RateFactor[];
  base: number;
  platforms: RateRow[];
  suggestedMin: number;
  suggestedMax: number;
  market: MarketSample;
  explanation: string;
}

/**
 * Tarif inti = Rp per follower per deliverable (konstanta yang sama dengan
 * penilai brief UMKM, supaya kedua sisi pasar memakai satu acuan),
 * dikalikan faktor engagement dan disesuaikan dengan budget campaign nyata
 * pada kategori yang sama.
 */
export function rateCard(p: ProfileFacts, market: MarketSample): RateResult {
  const engagementEffect = clamp(p.engagement / 5, 0.7, 1.4) || 0.85;
  const trackEffect = p.collaborationsCompleted >= 3 ? 1.1 : p.collaborationsCompleted >= 1 ? 1.05 : 0.95;
  const followers = Math.max(1000, p.followers || 1000);

  // Acuan yang sama dengan perkiraan budget di sisi UMKM (campaign-score.ts),
  // supaya angka kedua pihak tidak saling menjauh.
  const raw = followers * RATE_PER_FOLLOWER_PER_DELIVERABLE * engagementEffect * trackEffect;

  // Batasi dengan budget campaign nyata pada kategori yang sama.
  const cap = market.sampleSize >= 3 ? Math.max(market.medianBudget * 1.8, followers * 20) : raw;
  const capped = Math.min(raw, cap);
  const marketEffect = raw > 0 ? Number((capped / raw).toFixed(2)) : 1;

  const factors: RateFactor[] = [
    {
      label: "Jumlah follower",
      value: p.followers > 0 ? `${p.followers.toLocaleString("id-ID")} follower` : `belum diisi (dipakai ${followers.toLocaleString("id-ID")})`,
      effect: 1,
      weight: 45,
    },
    {
      label: "Engagement rate",
      value: p.engagement > 0 ? `${p.engagement}%` : "belum diisi (dipakai 0,85x)",
      effect: Number(engagementEffect.toFixed(2)),
      weight: 25,
    },
    {
      label: "Rekam jejak",
      value: `${p.collaborationsCompleted} kolaborasi selesai`,
      effect: Number(trackEffect.toFixed(2)),
      weight: 15,
    },
    {
      label: "Budget UMKM sekategori",
      value:
        market.sampleSize > 0
          ? `median ${rupiah(market.medianBudget)} dari ${market.sampleSize} campaign`
          : "belum ada data campaign sekategori",
      effect: marketEffect,
      weight: 15,
    },
  ];

  const platforms: RateRow[] = PLATFORM_MULTIPLIER.map((row) => ({
    platform: row.platform,
    label: row.label,
    note: row.note,
    min: roundTo(capped * row.multiplier * 0.75, 50_000),
    max: roundTo(capped * row.multiplier * 1.35, 50_000),
    per: row.platform === "bundle" ? "campaign" : "konten",
  }));

  const single = platforms.find((x) => x.platform === "instagram-reels") ?? platforms[0];

  return {
    factors,
    base: roundTo(capped, 25_000),
    platforms,
    suggestedMin: single.min,
    suggestedMax: single.max,
    market,
    explanation:
      market.sampleSize >= 3
        ? `Rentang ini diturunkan dari tarif dasar kamu (follower × engagement × rekam jejak) dan dibatasi budget campaign nyata di kategori ${market.category}: median ${rupiah(market.medianBudget)} dari ${market.sampleSize} campaign.`
        : `Rentang ini dihitung dari tarif dasar kamu. Belum ada cukup campaign di kategori ${market.category} untuk mengikat angkanya ke data pasar.`,
  };
}
