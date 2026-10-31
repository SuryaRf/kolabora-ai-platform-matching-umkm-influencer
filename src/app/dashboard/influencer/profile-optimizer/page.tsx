"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Wand2,
  Sparkles,
  Loader2,
  AlertTriangle,
  Check,
  Copy,
  Save,
  RefreshCw,
  Zap,
  ListChecks,
} from "lucide-react";
import FeaturePage from "@/components/dashboard/FeaturePage";

interface SubScore {
  key: string;
  label: string;
  score: number;
  weight: number;
  detail: string;
}

interface Recommendation {
  type: string;
  priority: "Tinggi" | "Sedang" | "Rendah";
  suggestion: string;
}

interface OptimizerResult {
  overall: number;
  subScores: SubScore[];
  missing: string[];
  currentBio: string;
  bio: string;
  bioSource: "ai" | "aturan";
  reason: string;
  recommendations: Recommendation[];
  aiUsed: boolean;
  aiError?: string | null;
  model?: string | null;
}

const barColor = (score: number) =>
  score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-amber-500" : "bg-red-500";

const priorityStyle = (p: Recommendation["priority"]) =>
  p === "Tinggi"
    ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
    : p === "Sedang"
      ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
      : "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400";

export default function ProfileOptimizer() {
  const [data, setData] = useState<OptimizerResult | null>(null);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [profileMissing, setProfileMissing] = useState(false);
  const [copied, setCopied] = useState(false);

  const analyze = useCallback(async (silent = false) => {
    if (!silent) setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/ai/optimize-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      const json = await res.json().catch(() => ({}));
      if (res.status === 400 && json.code === "PROFILE_MISSING") {
        setProfileMissing(true);
        return;
      }
      if (res.status === 429) {
        setError(json.error ?? "Terlalu sering dicoba. Tunggu sebentar lalu ulangi.");
        return;
      }
      if (!res.ok) {
        setError(json.error ?? "Analisis gagal dijalankan.");
        return;
      }
      setData(json as OptimizerResult);
      setDraft(String(json.bio ?? ""));
      setProfileMissing(false);
    } catch {
      setError("Koneksi terputus saat menghubungi server. Coba lagi.");
    } finally {
      setBusy(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await analyze();
    })();
  }, [analyze]);

  const applyBio = async () => {
    const bio = draft.trim();
    if (bio.length < 20) {
      setError("Bio terlalu pendek (minimal 20 karakter).");
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "Gagal menyimpan bio ke profil.");
        return;
      }
      setData((prev) => (prev ? { ...prev, currentBio: bio } : prev));
      setNotice("Bio tersimpan. UMKM yang mencocokkan profil kini memakai teks baru.");
    } catch {
      setError("Tidak dapat menyimpan bio. Periksa koneksi lalu ulangi.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <FeaturePage
        title="AI Profile Optimizer"
        description="Analisis profil dan saran perbaikan berbasis data profil kamu sendiri."
        icon={Wand2}
        gradient="bg-kolabora"
      >
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Loader2 className="w-4 h-4 animate-spin" /> Menganalisis profil...
        </div>
      </FeaturePage>
    );
  }

  if (profileMissing) {
    return (
      <FeaturePage
        title="AI Profile Optimizer"
        description="Analisis profil dan saran perbaikan berbasis data profil kamu sendiri."
        icon={Wand2}
        gradient="bg-kolabora"
      >
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 text-center">
          <p className="font-semibold">Profil influencer belum dibuat</p>
          <p className="text-sm text-zinc-500 mt-1">
            Analisis memakai data profil nyata (kategori, niche, tarif, portofolio), jadi isi profil
            terlebih dahulu.
          </p>
          <Link
            href="/dashboard/influencer/profile"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-influencer hover:bg-influencer-dark transition-colors"
          >
            Lengkapi profil
          </Link>
        </div>
      </FeaturePage>
    );
  }

  return (
    <FeaturePage
      title="AI Profile Optimizer"
      description="Skor dihitung dari data profil yang sebenarnya (kelengkapan, bio, jangkauan, engagement, portofolio, rekam jejak), lalu disusun saran perbaikan konkret."
      icon={Wand2}
      gradient="bg-kolabora"
    >
      {error && (
        <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {notice && (
        <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-sm text-emerald-700 dark:text-emerald-400">
          <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h3 className="font-semibold text-sm">Skor Optimasi Profil</h3>
              <span
                className={`text-[11px] px-2.5 py-1 rounded-full font-medium inline-flex items-center gap-1 ${
                  data?.aiUsed
                    ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
                    : "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                }`}
              >
                <Zap className="w-3 h-3" />
                {data?.aiUsed ? data.model : "AI tidak terpakai"}
              </span>
            </div>

            <div className="space-y-3">
              {(data?.subScores ?? []).map((s) => (
                <div key={s.key}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-zinc-600 dark:text-zinc-400">
                      {s.label}
                      <span className="text-zinc-400 ml-1">· bobot {s.weight}%</span>
                    </span>
                    <span className="font-semibold">
                      {s.score}/100
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${barColor(s.score)} transition-all duration-500`}
                      style={{ width: `${s.score}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1">{s.detail}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-center">
              <p className="text-lg font-bold text-kolabora">{data?.overall ?? 0}/100</p>
              <p className="text-xs text-zinc-500">Skor keseluruhan (tertimbang)</p>
            </div>

            {data && data.missing.length > 0 && (
              <p className="text-xs text-zinc-500 mt-3">
                Field yang masih kosong: {data.missing.join(", ")}
              </p>
            )}
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-umkm" />
              <h3 className="font-semibold text-sm">
                Draf bio {data?.bioSource === "ai" ? "dari AI" : "dari data profil"}
              </h3>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard?.writeText(draft);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="ml-auto inline-flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? "Tersalin" : "Salin"}
              </button>
            </div>

            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={4}
              maxLength={300}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-kolabora/40 resize-none"
              placeholder="Tulis bio kamu di sini, atau pakai draf di atas"
            />
            <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-1">
              <span>{draft.trim().length}/300 karakter</span>
              {data?.reason && <span className="truncate max-w-[60%] text-right">{data.reason}</span>}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 mt-3">
              <button
                type="button"
                onClick={applyBio}
                disabled={saving || !draft.trim()}
                className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold text-white bg-influencer hover:bg-influencer-dark transition-all disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Terapkan ke profil
              </button>
              <Link
                href="/dashboard/influencer/portfolio"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
              >
                Kelola portofolio
              </Link>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
            <div className="flex items-center gap-2 mb-4">
              <ListChecks className="w-4 h-4 text-kolabora" />
              <h3 className="font-semibold text-sm">Perbaikan yang disarankan</h3>
            </div>
            {(data?.recommendations ?? []).length === 0 ? (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-sm text-emerald-700 dark:text-emerald-400">
                Tidak ada perbaikan mendesak. Profil kamu sudah lengkap dan punya rekam jejak —
                tinggal jaga konsistensi konten.
              </div>
            ) : (
              <div className="space-y-3">
                {(data?.recommendations ?? []).map((r, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold">{r.type}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${priorityStyle(r.priority)}`}>
                        {r.priority}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">{r.suggestion}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
            <h3 className="font-semibold text-sm mb-2">Bio yang sekarang tersimpan</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 italic">
              {data?.currentBio ? data.currentBio : "(belum ada bio)"}
            </p>
            <button
              type="button"
              onClick={() => void analyze()}
              disabled={busy}
              className="w-full mt-4 inline-flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white bg-kolabora hover:bg-kolabora-dark transition-all disabled:opacity-60"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Analisis ulang profil
            </button>
            {data && !data.aiUsed && data.aiError && (
              <p className="text-[11px] text-zinc-400 mt-2">AI: {data.aiError}</p>
            )}
          </div>
        </div>
      </div>
    </FeaturePage>
  );
}
