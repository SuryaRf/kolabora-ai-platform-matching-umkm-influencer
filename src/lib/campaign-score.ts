/**
 * Penilai brief campaign berbasis aturan — memakai field yang benar-benar ada
 * pada model Campaign di Prisma (title, description, category, budgetMin/Max,
 * location, requirements, deliverables, startDate, endDate).
 *
 * Berjalan tanpa AI, sehingga dipakai sebagai:
 *  1) pemeriksaan cepat langsung di form (tanpa biaya), dan
 *  2) nilai cadangan bila panggilan model gagal.
 */

export interface CampaignDraft {
  title: string;
  description: string;
  category: string;
  budgetMin: number;
  budgetMax: number;
  location?: string | null;
  /** Teks bebas: target audiens, kewajiban, larangan, dsb. */
  requirements?: string | null;
  /** Teks bebas per baris/koma: daftar hasil kerja yang diharapkan. */
  deliverables?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

export interface RuleIssue {
  field: string;
  problem: string;
  severity: "high" | "medium" | "low";
}

export interface RuleSuggestion {
  field: string;
  action: string;
  example: string;
}

export interface BudgetAssessment {
  verdict: "too_low" | "reasonable" | "too_high";
  recommendedMin: number;
  recommendedMax: number;
  reason: string;
}

export interface RuleScoreResult {
  score: number;
  summary: string;
  issues: RuleIssue[];
  suggestions: RuleSuggestion[];
  budgetAssessment: BudgetAssessment;
  checklist: { label: string; done: boolean }[];
  /** Perkiraan target follower yang terbaca dari teks requirements */
  followerTarget: number | null;
  deliverableCount: number;
  durationDays: number;
}

/** Perkiraan harga pasar: Rp per follower per deliverable utama. */
export const RATE_PER_FOLLOWER_PER_DELIVERABLE = 45;

const rupiah = (value: number) => `Rp ${Math.round(value).toLocaleString("id-ID")}`;

function roundTo(value: number, step: number) {
  return Math.max(step, Math.round(value / step) * step);
}

/** "1 video reels, 3 story" -> ["1 video reels", "3 story"] */
export function splitDeliverables(raw?: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(/[\n;•·]+|(?:,)(?![^()]*\))/)
    .map((item) => item.replace(/^[-*\d.\s]+/, "").trim())
    .filter((item) => item.length > 2);
}

/** Ambil angka follower terbesar dari teks bebas ("minimal 25.000 followers"). */
export function extractFollowerTarget(raw?: string | null): number | null {
  if (!raw) return null;
  const text = raw.toLowerCase();
  const matches = [...text.matchAll(/(\d+(?:[.,]\d+)*)\s*(?:rb|ratus ribu|ribu|k\b|juta(?:n)?|m\b|follower|reach)/g)];
  const numbers: number[] = [];
  for (const match of matches) {
    const base = Number(match[1].replace(/\./g, "").replace(",", "."));
    if (!Number.isFinite(base) || base <= 0) continue;
    const unit = match[2] ?? "";
    let value = base;
    if (/rb|ratus ribu|ribu|^k$/.test(unit)) value = base * (unit === "ratus ribu" ? 100_000 : 1_000);
    else if (/jutan|^m$/.test(unit)) value = base * 1_000_000;
    else if (base >= 100) value = base;
    numbers.push(Math.round(value));
  }
  // Pola "10k-50k followers"
  const range = text.match(/(\d+)\s*(k|rb|ribu)?\s*[-–]\s*(\d+)\s*(k|rb|ribu)?\s*follower/);
  if (range) {
    const mul = (u?: string) => (u === "k" || u === "rb" || u === "ribu" ? 1_000 : 1);
    numbers.push(Number(range[3]) * mul(range[4]));
  }
  if (!numbers.length) return null;
  const top = Math.max(...numbers);
  return top > 200_000_000 ? null : top;
}

export function durationDays(draft: CampaignDraft): number {
  const start = draft.startDate ? new Date(draft.startDate).getTime() : NaN;
  const end = draft.endDate ? new Date(draft.endDate).getTime() : NaN;
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return 0;
  return Math.max(1, Math.round((end - start) / 86_400_000));
}

export function expectedBudget(draft: CampaignDraft): { min: number; max: number } {
  const followers = extractFollowerTarget(`${draft.requirements ?? ""} ${draft.description ?? ""}`) ?? 15_000;
  const deliverableCount = Math.max(1, splitDeliverables(draft.deliverables).length);
  const base = followers * RATE_PER_FOLLOWER_PER_DELIVERABLE * deliverableCount;
  // Deliverable ke-3 dan seterusnya biasanya dikerjakan berpasangan
  const adjusted = deliverableCount > 2 ? base * 0.75 : base;
  return { min: roundTo(adjusted * 0.7, 100_000), max: roundTo(adjusted * 1.6, 100_000) };
}

export function scoreCampaignDraft(draft: CampaignDraft): RuleScoreResult {
  const issues: RuleIssue[] = [];
  const suggestions: RuleSuggestion[] = [];
  const checklist: { label: string; done: boolean }[] = [];
  let score = 0;

  const title = (draft.title ?? "").trim();
  if (title.length >= 8) score += 12;
  else
    issues.push({ field: "title", problem: "Judul terlalu pendek untuk menarik perhatian influencer.", severity: "medium" });
  if (title.length < 8)
    suggestions.push({
      field: "title",
      action: "Sebutkan produk dan bentuk kerja samanya di judul.",
      example: "Endorse Kopi Susu Gula Aren untuk Pekerja Muda di Jakarta",
    });
  checklist.push({ label: "Judul jelas (minimal 8 karakter)", done: title.length >= 8 });

  const description = (draft.description ?? "").trim();
  if (description.length >= 250) score += 26;
  else if (description.length >= 120) score += 18;
  else if (description.length >= 40) {
    score += 8;
    issues.push({
      field: "description",
      problem: "Deskripsi terlalu singkat; influencer tidak punya cukup informasi untuk membuat konten.",
      severity: "high",
    });
  } else {
    issues.push({ field: "description", problem: "Deskripsi hampir kosong.", severity: "high" });
  }
  if (description.length < 250)
    suggestions.push({
      field: "description",
      action: "Ceritakan produk, keunggulan, promo, dan hal yang wajib/haram disebut di konten.",
      example:
        "Kopi susu gula aren kemasan 250 ml tanpa pemanis buatan. Target: pekerja muda 22-30 tahun di Jakarta. Wajib menyebut promo beli 2 gratis 1 dan menautkan link order di bio. Dilarang mengklaim bisa menurunkan berat badan.",
    });
  checklist.push({ label: "Deskripsi minimal 250 karakter", done: description.length >= 250 });

  if ((draft.category ?? "").trim()) score += 8;
  else issues.push({ field: "category", problem: "Kategori belum dipilih sehingga pencocokan niche tidak berjalan.", severity: "medium" });
  checklist.push({ label: "Kategori dipilih", done: Boolean((draft.category ?? "").trim()) });

  if ((draft.location ?? "").trim()) score += 6;
  else
    suggestions.push({
      field: "location",
      action: "Isi lokasi bila kerja sama membutuhkan kreator yang bisa datang atau memahami area tertentu.",
      example: "Bandung (konten direkam di kedai)",
    });
  checklist.push({ label: "Lokasi campaign diisi", done: Boolean((draft.location ?? "").trim()) });

  const deliverables = splitDeliverables(draft.deliverables);
  if (deliverables.length >= 2) score += 12;
  else if (deliverables.length === 1) score += 8;
  else
    issues.push({ field: "deliverables", problem: "Belum ada deliverables, hasil kerja tidak terukur.", severity: "high" });
  if (deliverables.length === 0)
    suggestions.push({
      field: "deliverables",
      action: "Tulis jumlah dan format konten, satu butir per baris.",
      example: "1 video Reels 30 detik\n3 Instagram Story\n1 video TikTok",
    });
  checklist.push({ label: "Deliverables terperinci", done: deliverables.length >= 2 });

  const requirements = (draft.requirements ?? "").trim();
  const followerTarget = extractFollowerTarget(requirements) ?? extractFollowerTarget(description);
  if (requirements.length >= 40) score += 8;
  else if (requirements.length >= 10) score += 4;
  else
    issues.push({ field: "requirements", problem: "Requirement/ketentuan masih kosong atau terlalu umum.", severity: "medium" });
  if (followerTarget) score += 6;
  else
    suggestions.push({
      field: "requirements",
      action: "Sebutkan target follower minimal dan segmen audiens yang diharapkan.",
      example: "Influencer mikro 10.000-50.000 followers, audiens utama perempuan 18-30 tahun di Jabodetabek.",
    });
  checklist.push({ label: "Target follower/audiens disebut", done: Boolean(followerTarget) });

  const days = durationDays(draft);
  if (days >= 7) score += 8;
  else if (days >= 3) score += 5;
  else
    issues.push({
      field: "endDate",
      problem: days === 0 ? "Rentang tanggal belum diisi atau tanggal akhir sebelum tanggal mulai." : "Durasi terlalu pendek untuk produksi dan review konten.",
      severity: days === 0 ? "medium" : "low",
    });
  checklist.push({ label: "Durasi minimal 3 hari", done: days >= 3 });

  const expected = expectedBudget(draft);
  const budgetMax = Number(draft.budgetMax ?? 0);
  const budgetMin = Number(draft.budgetMin ?? 0);
  let budgetAssessment: BudgetAssessment;

  if (budgetMax <= 0 || budgetMin <= 0) {
    budgetAssessment = {
      verdict: "too_low",
      recommendedMin: expected.min,
      recommendedMax: expected.max,
      reason: "Budget belum diisi dengan benar, peluang dilamar influencer berkualitas sangat kecil.",
    };
    issues.push({ field: "budgetMax", problem: "Budget minimum/maksimum belum valid.", severity: "high" });
  } else if (budgetMin > budgetMax) {
    budgetAssessment = {
      verdict: "too_low",
      recommendedMin: expected.min,
      recommendedMax: expected.max,
      reason: "Budget minimum lebih besar daripada maksimum.",
    };
    issues.push({ field: "budgetMax", problem: "Budget minimum melebihi maksimum.", severity: "high" });
  } else if (budgetMax < expected.min * 0.55) {
    budgetAssessment = {
      verdict: "too_low",
      recommendedMin: expected.min,
      recommendedMax: expected.max,
      reason: `Untuk ${deliverables.length || 1} deliverables${followerTarget ? ` dengan target ${followerTarget.toLocaleString("id-ID")} followers` : ""}, harga pasar umumnya ${rupiah(expected.min)} - ${rupiah(expected.max)}.`,
    };
    issues.push({ field: "budgetMax", problem: "Budget jauh di bawah perkiraan harga pasar.", severity: "high" });
    suggestions.push({
      field: "budgetMax",
      action: "Naikkan budget ke rentang pasar, atau kurangi target follower/jumlah deliverables.",
      example: `Rentang wajar: ${rupiah(expected.min)} - ${rupiah(expected.max)}`,
    });
  } else if (budgetMax > expected.max * 2.5) {
    budgetAssessment = {
      verdict: "too_high",
      recommendedMin: expected.min,
      recommendedMax: expected.max,
      reason: "Budget jauh di atas harga pasar untuk permintaan saat ini.",
    };
    issues.push({ field: "budgetMax", problem: "Budget jauh di atas harga pasar; bisa dipecah ke beberapa kreator mikro.", severity: "low" });
    suggestions.push({
      field: "budgetMax",
      action: "Pecah budget ke beberapa influencer mikro atau tambah deliverables.",
      example: `Realistis memakai 2-4 influencer mikro (${rupiah(expected.min)} - ${rupiah(expected.max)} per kreator)`,
    });
  } else {
    budgetAssessment = {
      verdict: "reasonable",
      recommendedMin: expected.min,
      recommendedMax: expected.max,
      reason: "Budget berada pada rentang yang wajar untuk target yang ditetapkan.",
    };
    score += 6;
  }
  checklist.push({ label: "Budget masuk rentang pasar", done: budgetAssessment.verdict === "reasonable" });

  const capped = Math.max(0, Math.min(100, Math.round(score)));
  const highCount = issues.filter((i) => i.severity === "high").length;
  const summary =
    highCount > 0
      ? `Brief dinilai ${capped}/100. Ada ${highCount} bagian penting yang perlu diperbaiki sebelum dipublikasikan.`
      : capped >= 80
        ? "Brief sudah lengkap, jelas, dan siap dipublikasikan."
        : `Brief cukup baik (${capped}/100). Masih ada bagian yang bisa dipertajam agar lebih menarik bagi influencer.`;

  return {
    score: capped,
    summary,
    issues,
    suggestions,
    budgetAssessment,
    checklist,
    followerTarget,
    deliverableCount: deliverables.length,
    durationDays: days,
  };
}

/** Bentuk respons AI agar seragam dengan hasil aturan. */
export interface AiScoreResult {
  score?: number;
  summary?: string;
  issues?: RuleIssue[];
  suggestions?: RuleSuggestion[];
  budgetAssessment?: BudgetAssessment;
  targetAudience?: string[];
  suggestedNiches?: string[];
}

/**
 * Gabungkan hasil aturan dan AI. Temuan aturan tidak pernah hilang,
 * dan skor akhir tetap memberi bobot pada pemeriksaan deterministik.
 */
export function mergeRuleAndAi(rule: RuleScoreResult, ai: AiScoreResult | null): RuleScoreResult & { aiUsed: boolean; targetAudience: string[]; suggestedNiches: string[] } {
  if (!ai) return { ...rule, aiUsed: false, targetAudience: [], suggestedNiches: [] };

  const aiScore = typeof ai.score === "number" && Number.isFinite(ai.score) ? Math.max(0, Math.min(100, Math.round(ai.score))) : rule.score;
  const aiIssues = (ai.issues ?? []).filter(
    (i) => i && typeof i.problem === "string" && !rule.issues.some((r) => r.field === i.field && r.problem === i.problem),
  );
  const aiSuggestions = (ai.suggestions ?? []).filter((s) => s && typeof s.action === "string");
  const budget =
    ai.budgetAssessment && Number.isFinite(Number(ai.budgetAssessment.recommendedMax)) && Number.isFinite(Number(ai.budgetAssessment.recommendedMin))
      ? {
          verdict: (["too_low", "reasonable", "too_high"] as const).includes(ai.budgetAssessment.verdict) ? ai.budgetAssessment.verdict : rule.budgetAssessment.verdict,
          recommendedMin: Number(ai.budgetAssessment.recommendedMin),
          recommendedMax: Number(ai.budgetAssessment.recommendedMax),
          reason: ai.budgetAssessment.reason?.trim() || rule.budgetAssessment.reason,
        }
      : rule.budgetAssessment;

  return {
    score: Math.round(rule.score * 0.4 + aiScore * 0.6),
    summary: ai.summary?.trim() || rule.summary,
    issues: [...rule.issues, ...aiIssues].slice(0, 12),
    suggestions: [...aiSuggestions, ...rule.suggestions].slice(0, 8),
    budgetAssessment: budget,
    checklist: rule.checklist,
    followerTarget: rule.followerTarget,
    deliverableCount: rule.deliverableCount,
    durationDays: rule.durationDays,
    aiUsed: true,
    targetAudience: (ai.targetAudience ?? []).filter((t) => typeof t === "string").slice(0, 5),
    suggestedNiches: (ai.suggestedNiches ?? []).filter((t) => typeof t === "string").slice(0, 6),
  };
}
