"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Bot,
  CheckCircle2,
  ClipboardCopy,
  Loader2,
  Megaphone,
  Sparkles,
  Wand2,
  XCircle,
} from "lucide-react";
import FeaturePage from "@/components/dashboard/FeaturePage";
import { formatCurrency } from "@/lib/utils";
import { scoreCampaignDraft, type CampaignDraft } from "@/lib/campaign-score";

const CATEGORIES = [
  "Kuliner",
  "Fashion",
  "Kecantikan & Skincare",
  "Makanan & Minuman",
  "Teknologi & Gadget",
  "Travel",
  "Kesehatan",
  "Rumah Tangga",
  "Pendidikan",
  "Olahraga",
  "Retail & Marketplace",
  "Jasa Profesional",
  "Otomotif",
  "Hiburan & Kreativitas",
  "Lainnya",
];

type FormState = {
  title: string;
  description: string;
  category: string;
  location: string;
  budgetMin: string;
  budgetMax: string;
  deliverables: string;
  requirements: string;
  startDate: string;
  endDate: string;
};

const EMPTY: FormState = {
  title: "",
  description: "",
  category: "",
  location: "",
  budgetMin: "",
  budgetMax: "",
  deliverables: "",
  requirements: "",
  startDate: "",
  endDate: "",
};

interface AiScore {
  score: number;
  summary: string;
  issues: { field: string; problem: string; severity: string }[];
  suggestions: { field: string; action: string; example: string }[];
  budgetAssessment: { verdict: string; recommendedMin: number; recommendedMax: number; reason: string };
  checklist: { label: string; done: boolean }[];
  targetAudience?: string[];
  suggestedNiches?: string[];
  aiUsed: boolean;
  aiError?: string | null;
  model?: string | null;
}

const FIELD_LABELS: Record<string, string> = {
  title: "Judul",
  description: "Deskripsi",
  category: "Kategori",
  location: "Lokasi",
  budgetMin: "Budget minimum",
  budgetMax: "Budget maksimum",
  deliverables: "Deliverables",
  requirements: "Ketentuan",
  startDate: "Tanggal mulai",
  endDate: "Tanggal akhir",
};

const inputClass =
  "w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-umkm/50";

function toDraft(form: FormState): CampaignDraft {
  return {
    title: form.title,
    description: form.description,
    category: form.category,
    location: form.location || null,
    budgetMin: Number(form.budgetMin.replace(/[^\d]/g, "")) || 0,
    budgetMax: Number(form.budgetMax.replace(/[^\d]/g, "")) || 0,
    deliverables: form.deliverables || null,
    requirements: form.requirements || null,
    startDate: form.startDate || null,
    endDate: form.endDate || null,
  };
}

/** Ambil isi bagian "Deskripsi: ..." dari teks AI yang berstruktur label */
function extractSection(text: string, labels: string[]): string | null {
  for (const label of labels) {
    const re = new RegExp(`${label}\\s*[:\\-–]\\s*([\\s\\S]*?)(?=\\n\\s*(?:Judul|Deskripsi|Deliverables|Ketentuan|Budget|Target|Platform|Timeline|Key Message|Kriteria)\\s*[:\\-–]|$)`, "i");
    const m = text.match(re);
    if (m?.[1]) return m[1].replace(/^[-•*\s]+/, "").trim();
  }
  return null;
}

export default function CreateCampaignPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [aiBusy, setAiBusy] = useState<"" | "draft" | "review">("");
  const [aiNote, setAiNote] = useState("");
  const [aiResult, setAiResult] = useState<AiScore | null>(null);
  const [draftText, setDraftText] = useState("");

  const rule = useMemo(() => scoreCampaignDraft(toDraft(form)), [form]);
  const canSubmit = form.title.trim().length >= 3 && form.description.trim().length >= 20 && form.category.trim().length >= 2;

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const money = (key: "budgetMin" | "budgetMax") => (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/[^\d]/g, "");
    setForm((f) => ({ ...f, [key]: digits }));
  };

  const businessContext =
    session?.user?.role === "UMKM"
      ? "Buat brief untuk usaha saya sesuai profil usaha saya di Kolabora."
      : "Buat brief kampanye yang umum dipakai UMKM Indonesia.";

  const generateDraft = async () => {
    setAiBusy("draft");
    setAiNote("");
    setError("");
    try {
      const res = await fetch("/api/ai/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "brief",
          prompt: `${businessContext} Tolong susun brief campaign lengkap. Product/ide yang saya punya: ${
            form.title || form.description || "(pengguna belum menulis apa pun — minta detail produk lebih dulu)"
          }. Balasan wajib memakai label bagian persis seperti ini:
Judul: ...
Deskripsi: ...
Deliverables: (daftar, satu butir per baris)
Ketentuan: ...
Budget: ...`,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAiNote(data.error ?? "Draft gagal dibuat.");
        return;
      }
      const text = String(data.content ?? "");
      setDraftText(text);

      const title = extractSection(text, ["Judul"]);
      const description = extractSection(text, ["Deskripsi"]);
      const deliverables = extractSection(text, ["Deliverables", "Hasil yang diharapkan"]);
      const requirements = extractSection(text, ["Ketentuan", "Target Audiens", "Kriteria Influencer"]);
      const budgetLine = extractSection(text, ["Budget"]);
      const budgetNumbers = budgetLine?.match(/(\d{2,})/g)?.map((n) => Number(n.replace(/[^\d]/g, ""))).filter((n) => n > 100000);

      setForm((f) => ({
        ...f,
        title: f.title || (title ? title.slice(0, 120) : ""),
        description: description ? (f.description ? `${f.description}\n\n${description}` : description) : f.description,
        deliverables: deliverables || f.deliverables,
        requirements: requirements ? (f.requirements ? `${f.requirements}\n\n${requirements}` : requirements) : f.requirements,
        budgetMin: f.budgetMin || (budgetNumbers?.[0] ? String(budgetNumbers[0]) : ""),
        budgetMax: f.budgetMax || (budgetNumbers?.[1] ? String(budgetNumbers[1] ?? budgetNumbers[0]) : ""),
      }));
      setAiNote("Draft AI sudah dimasukkan ke form. Periksa dan sunting sebelum dipublikasikan.");
    } catch {
      setAiNote("Tidak dapat menghubungi asisten AI.");
    } finally {
      setAiBusy("");
    }
  };

  const reviewBrief = async () => {
    setAiBusy("review");
    setAiNote("");
    setError("");
    try {
      const res = await fetch("/api/ai/score-campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toDraft(form)),
      });
      const data: AiScore & { error?: string } = await res.json();
      if (!res.ok) {
        setAiNote(data.error ?? "Penilaian AI gagal dijalankan.");
        return;
      }
      setAiResult(data);
      if (!data.aiUsed) setAiNote(data.aiError ?? "AI belum aktif — hasil di bawah berasal dari perhitungan aturan.");
    } catch {
      setAiNote("Tidak dapat menghubungi asisten AI.");
    } finally {
      setAiBusy("");
    }
  };

  const applySuggestion = (s: { field: string; example: string }) => {
    const key = (s.field in form ? s.field : null) as keyof FormState | null;
    if (!key) return;
    setForm((f) => ({ ...f, [key]: s.example }));
    setAiNote(`Isian "${FIELD_LABELS[key] ?? key}" diganti dengan saran AI.`);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...toDraft(form),
          budgetMin: toDraft(form).budgetMin,
          budgetMax: toDraft(form).budgetMax,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal membuat campaign.");
        setSaving(false);
        return;
      }
      router.push(`/dashboard/umkm/campaigns/${data.id}`);
    } catch {
      setError("Gagal membuat campaign.");
    } finally {
      setSaving(false);
    }
  };

  const shown = aiResult ?? ({ ...rule, aiUsed: false } as unknown as AiScore);
  const scoreValue = aiResult ? aiResult.score : rule.score;
  const scoreTone = scoreValue >= 80 ? "text-emerald-600" : scoreValue >= 60 ? "text-amber-600" : "text-red-600";

  return (
    <FeaturePage
      title="Buat Campaign Baru"
      description="Isi brief selengkap mungkin. Semakin jelas target dan hasil yang diharapkan, semakin cepat influencer berkualitas melamar."
      icon={Megaphone}
      gradient="bg-umkm"
    >
      <Link
        href="/dashboard/umkm/campaigns"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        <ArrowLeft className="w-4 h-4" /> Kembali ke Campaign Saya
      </Link>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form onSubmit={submit} className="lg:col-span-2 space-y-5">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-4">
            <h3 className="font-semibold text-sm">Informasi utama</h3>

            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5" htmlFor="title">
                Judul campaign *
              </label>
              <input id="title" value={form.title} onChange={set("title")} placeholder="Endorse Kopi Susu untuk Anak Kantor" className={inputClass} maxLength={120} />
              <p className="text-[11px] text-zinc-400 mt-1">{form.title.length}/120 karakter</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5" htmlFor="description">
                Deskripsi & cerita produk *
              </label>
              <textarea
                id="description"
                value={form.description}
                onChange={set("description")}
                rows={7}
                placeholder="Ceritakan produk, keunggulan, promo, target audiens, dan hal yang wajib/haram disebut di konten."
                className={`${inputClass} resize-y`}
              />
              <p className="text-[11px] text-zinc-400 mt-1">
                {form.description.length} karakter — minimal 250 agar pelamar paham ekspektasi.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5" htmlFor="category">
                  Kategori *
                </label>
                <select id="category" value={form.category} onChange={set("category")} className={inputClass}>
                  <option value="">Pilih kategori</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5" htmlFor="location">
                  Lokasi
                </label>
                <input id="location" value={form.location} onChange={set("location")} placeholder="Jakarta / Seluruh Indonesia" className={inputClass} />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-4">
            <h3 className="font-semibold text-sm">Hasil kerja, ketentuan, dan waktu</h3>

            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5" htmlFor="deliverables">
                Deliverables (satu butir per baris)
              </label>
              <textarea
                id="deliverables"
                value={form.deliverables}
                onChange={set("deliverables")}
                rows={4}
                placeholder={"1 video Reels 30 detik\n3 Instagram Story\n1 video TikTok"}
                className={`${inputClass} resize-y`}
              />
              <p className="text-[11px] text-zinc-400 mt-1">
                {rule.deliverableCount} butir terbaca. Jumlah ini dipakai menaksir budget yang wajar.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5" htmlFor="requirements">
                Ketentuan & target audiens
              </label>
              <textarea
                id="requirements"
                value={form.requirements}
                onChange={set("requirements")}
                rows={4}
                placeholder="Influencer mikro 10.000-50.000 followers, audiens perempuan 18-30 tahun di Jabodetabek, gaya konten storytelling."
                className={`${inputClass} resize-y`}
              />
              <p className="text-[11px] text-zinc-400 mt-1">
                {rule.followerTarget ? `Target follower terbaca: ${rule.followerTarget.toLocaleString("id-ID")}` : "Sebutkan target follower agar pencocokan niche lebih akurat."}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5" htmlFor="startDate">
                  Tanggal mulai
                </label>
                <input id="startDate" type="date" value={form.startDate} onChange={set("startDate")} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5" htmlFor="endDate">
                  Tanggal akhir
                </label>
                <input id="endDate" type="date" value={form.endDate} onChange={set("endDate")} className={inputClass} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5" htmlFor="budgetMin">
                  Budget minimum (Rp)
                </label>
                <input id="budgetMin" inputMode="numeric" value={form.budgetMin} onChange={money("budgetMin")} placeholder="800000" className={inputClass} />
                {form.budgetMin && <p className="text-[11px] text-zinc-400 mt-1">{formatCurrency(Number(form.budgetMin))}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5" htmlFor="budgetMax">
                  Budget maksimum (Rp)
                </label>
                <input id="budgetMax" inputMode="numeric" value={form.budgetMax} onChange={money("budgetMax")} placeholder="1600000" className={inputClass} />
                {form.budgetMax && <p className="text-[11px] text-zinc-400 mt-1">{formatCurrency(Number(form.budgetMax))}</p>}
              </div>
            </div>
            <p className="text-[11px] text-zinc-400">
              Perkiraan harga pasar untuk permintaan ini: {formatCurrency(rule.budgetAssessment.recommendedMin)} - {formatCurrency(rule.budgetAssessment.recommendedMax)} per kreator.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={saving || !canSubmit}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-umkm hover:bg-umkm-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <BadgeCheck className="w-4 h-4" />}
              Publikasikan Campaign
            </button>
            <button
              type="button"
              onClick={() => setForm(EMPTY)}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            >
              Kosongkan
            </button>
            {!canSubmit && <span className="text-xs text-zinc-500">Lengkapi judul, deskripsi (min. 20 karakter), dan kategori.</span>}
          </div>
        </form>

        <div className="space-y-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 sticky top-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">Kesiapan Brief</h3>
              <span className={`text-2xl font-bold ${scoreTone}`}>{scoreValue}</span>
            </div>
            <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden mb-3">
              <div
                className={`h-full rounded-full transition-all ${scoreValue >= 80 ? "bg-emerald-500" : scoreValue >= 60 ? "bg-amber-500" : "bg-red-500"}`}
                style={{ width: `${Math.min(100, Math.max(4, scoreValue))}%` }}
              />
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed mb-4">{shown.summary}</p>

            <div className="space-y-2 mb-4">
              {shown.checklist?.slice(0, 8).map((item) => (
                <div key={item.label} className="flex items-start gap-2">
                  {item.done ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-zinc-300 dark:text-zinc-600 mt-0.5 flex-shrink-0" />
                  )}
                  <span className={`text-xs ${item.done ? "text-zinc-500 line-through" : "text-zinc-700 dark:text-zinc-300"}`}>{item.label}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={reviewBrief}
                disabled={aiBusy !== "" || !canSubmit}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 disabled:opacity-50 transition-all"
              >
                {aiBusy === "review" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Periksa dengan AI
              </button>
              <button
                type="button"
                onClick={generateDraft}
                disabled={aiBusy !== ""}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/20 disabled:opacity-50 transition-all"
              >
                {aiBusy === "draft" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                Susun draft brief dengan AI
              </button>
            </div>

            {aiNote && (
              <p className="mt-3 text-xs text-zinc-500 bg-zinc-50 dark:bg-zinc-800 rounded-xl px-3 py-2 leading-relaxed">{aiNote}</p>
            )}
            {aiResult?.aiError && (
              <p className="mt-2 text-xs text-amber-600 flex items-start gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                AI tidak terpakai: {aiResult.aiError}
              </p>
            )}
            {aiResult && (
              <p className="mt-2 text-[11px] text-zinc-400">
                {aiResult.aiUsed ? `Dinilai oleh ${aiResult.model ?? "AI"} + aturan Kolabora.` : "Dinilai dengan aturan Kolabora (AI tidak aktif)."}
              </p>
            )}
          </div>

          {(shown.issues?.length ?? 0) > 0 && (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
              <h3 className="font-semibold text-sm mb-3">Perlu diperbaiki</h3>
              <div className="space-y-2">
                {shown.issues.slice(0, 6).map((issue, i) => (
                  <div key={`${issue.field}-${i}`} className="flex items-start gap-2">
                    <span
                      className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                        issue.severity === "high" ? "bg-red-500" : issue.severity === "medium" ? "bg-amber-500" : "bg-zinc-400"
                      }`}
                    />
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">{FIELD_LABELS[issue.field] ?? issue.field}:</span> {issue.problem}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(shown.suggestions?.length ?? 0) > 0 && (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
              <h3 className="font-semibold text-sm mb-3">Saran perbaikan</h3>
              <div className="space-y-3">
                {shown.suggestions.slice(0, 4).map((s, i) => (
                  <div key={`${s.field}-${i}`} className="rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-3">
                    <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">{FIELD_LABELS[s.field] ?? s.field}</p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-2 leading-relaxed">{s.action}</p>
                    {s.example && (
                      <>
                        <p className="text-[11px] text-zinc-500 bg-white dark:bg-zinc-900 rounded-lg px-2.5 py-2 mb-2 whitespace-pre-wrap border border-zinc-100 dark:border-zinc-700">
                          {s.example}
                        </p>
                        <div className="flex gap-2">
                          {s.field in form && (
                            <button
                              type="button"
                              onClick={() => applySuggestion(s)}
                              className="text-[11px] font-semibold text-umkm hover:underline"
                            >
                              Terapkan
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => void navigator.clipboard.writeText(s.example)}
                            className="text-[11px] text-zinc-500 hover:text-zinc-800 inline-flex items-center gap-1"
                          >
                            <ClipboardCopy className="w-3 h-3" /> Salin
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {aiResult?.targetAudience && aiResult.targetAudience.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
              <h3 className="font-semibold text-sm mb-2">Segmen audiens usulan</h3>
              <div className="flex flex-wrap gap-1.5">
                {aiResult.targetAudience.map((t) => (
                  <span key={t} className="text-[11px] px-2.5 py-1 rounded-full bg-umkm/10 text-umkm font-medium">
                    {t}
                  </span>
                ))}
              </div>
              {aiResult.suggestedNiches?.length ? (
                <>
                  <h4 className="font-semibold text-xs mt-4 mb-2 text-zinc-500">Niche influencer yang cocok</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {aiResult.suggestedNiches.map((t) => (
                      <span key={t} className="text-[11px] px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                        {t}
                      </span>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          )}

          {draftText && (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
              <div className="flex items-center gap-2 mb-2">
                <Bot className="w-4 h-4 text-violet-500" />
                <h3 className="font-semibold text-sm">Draft AI lengkap</h3>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">{draftText}</p>
              <button
                type="button"
                onClick={() => void navigator.clipboard.writeText(draftText)}
                className="mt-3 text-[11px] text-zinc-500 hover:text-zinc-800 inline-flex items-center gap-1"
              >
                <ClipboardCopy className="w-3 h-3" /> Salin semuanya
              </button>
            </div>
          )}
        </div>
      </div>
    </FeaturePage>
  );
}
