"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  DollarSign,
  Loader2,
  AlertTriangle,
  Info,
  RefreshCw,
  Save,
  Check,
  Copy,
  Zap,
} from "lucide-react";
import FeaturePage from "@/components/dashboard/FeaturePage";
import { formatCurrency } from "@/lib/utils";

interface RateFactor {
  label: string;
  value: string;
  effect: number;
  weight: number;
}

interface RateRow {
  platform: string;
  label: string;
  note: string;
  min: number;
  max: number;
  per: string;
  reason?: string | null;
}

interface RateResult {
  factors: RateFactor[];
  base: number;
  platforms: RateRow[];
  suggestedMin: number;
  suggestedMax: number;
  market: { sampleSize: number; medianBudget: number; category: string };
  explanation: string;
  advice: string;
  negotiationLine: string;
  current: { rateMin: number | null; rateMax: number | null };
  aiUsed: boolean;
  aiError?: string | null;
  model?: string | null;
}

export default function RateRecommendation() {
  const [data, setData] = useState<RateResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<string>("instagram-reels");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [profileMissing, setProfileMissing] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/ai/rate-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      const json = await res.json().catch(() => ({}));
      if (res.status === 400 && json.code === "PROFILE_MISSING") {
        setProfileMissing(true);
        return;
      }
      if (!res.ok) {
        setError(json.error ?? "Perhitungan tarif gagal dijalankan.");
        return;
      }
      setData(json as RateResult);
      setProfileMissing(false);
    } catch {
      setError("Koneksi terputus. Coba hitung ulang.");
    } finally {
      setBusy(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  const row = data?.platforms.find((p) => p.platform === selected) ?? data?.platforms[0];

  const saveToProfile = async () => {
    if (!row) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rateMin: row.min, rateMax: row.max }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "Gagal menyimpan tarif ke profil.");
        return;
      }
      setData((prev) => (prev ? { ...prev, current: { rateMin: row.min, rateMax: row.max } } : prev));
      setNotice(`Tarif ${row.label} (${formatCurrency(row.min)} - ${formatCurrency(row.max)}) dipasang di profil.`);
    } catch {
      setError("Tidak dapat menyimpan tarif. Periksa koneksi lalu ulangi.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <FeaturePage
        title="AI Rate Recommendation"
        description="Kalkulator tarif berbasis data profil dan budget campaign nyata di kategori kamu."
        icon={DollarSign}
        gradient="bg-kolabora"
      >
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Loader2 className="w-4 h-4 animate-spin" /> Menghitung tarif...
        </div>
      </FeaturePage>
    );
  }

  if (profileMissing) {
    return (
      <FeaturePage
        title="AI Rate Recommendation"
        description="Kalkulator tarif berbasis data profil dan budget campaign nyata di kategori kamu."
        icon={DollarSign}
        gradient="bg-kolabora"
      >
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 text-center">
          <p className="font-semibold">Profil influencer belum dibuat</p>
          <p className="text-sm text-zinc-500 mt-1">
            Tarif dihitung dari follower, engagement, dan rekam jejak di profil kamu.
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
      title="AI Rate Recommendation"
      description="Tarif dasar dihitung dari follower × engagement × rekam jejak, lalu dibatasi budget campaign nyata pada kategori kamu. AI hanya menyesuaikan maksimal 25% untuk alasan produksi."
      icon={DollarSign}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
            <div className="flex items-center justify-between gap-3 mb-6">
              <h3 className="font-semibold">Faktor perhitungan</h3>
              <div className="flex items-center gap-1 text-xs text-zinc-500">
                <Info className="w-3 h-3" /> dari data kamu & campaign aktif
              </div>
            </div>
            <div className="space-y-4">
              {(data?.factors ?? []).map((f) => (
                <div key={f.label}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{f.label}</span>
                      <span className="text-xs text-zinc-400">(bobot {f.weight}%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500">{f.value}</span>
                      <span className="w-12 text-right text-xs font-bold text-kolabora">
                        {f.effect === 1 ? "1x" : `${f.effect}x`}
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-kolabora transition-all duration-500"
                      style={{ width: `${Math.min(100, f.effect * 70)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-zinc-500 mt-4">{data?.explanation}</p>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3">
              <h3 className="font-semibold text-sm">Rentang tarif per jenis konten</h3>
              <span
                className={`text-[11px] px-2.5 py-1 rounded-full font-medium inline-flex items-center gap-1 ${
                  data?.aiUsed
                    ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
                    : "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                }`}
              >
                <Zap className="w-3 h-3" />
                {data?.aiUsed ? data.model : "tarif aturan"}
              </span>
            </div>
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {(data?.platforms ?? []).map((p) => {
                const active = p.platform === row?.platform;
                return (
                  <button
                    key={p.platform}
                    type="button"
                    onClick={() => setSelected(p.platform)}
                    className={`w-full text-left px-6 py-4 transition-colors ${
                      active ? "bg-kolabora/5" : "hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-medium text-sm flex items-center gap-2">
                          {p.label}
                          {active && <Check className="w-4 h-4 text-kolabora" />}
                        </p>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {p.note}
                          {p.reason ? ` · AI: ${p.reason}` : ""}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-semibold text-sm">
                          {formatCurrency(p.min)} - {formatCurrency(p.max)}
                        </p>
                        <p className="text-[11px] text-zinc-500">per {p.per}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
            <h3 className="font-semibold text-sm mb-3">Rekomendasi utama</h3>
            <p className="text-2xl font-bold text-kolabora">
              {row ? formatCurrency(row.min) : "-"}
            </p>
            <p className="text-xs text-zinc-500">
              sampai {row ? formatCurrency(row.max) : "-"} untuk {row?.label.toLowerCase() ?? "konten"}
            </p>

            <div className="mt-4 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
              <p>
                Tarif di profil sekarang:{" "}
                {data?.current.rateMin && data?.current.rateMax
                  ? `${formatCurrency(data.current.rateMin)} - ${formatCurrency(data.current.rateMax)}`
                  : "belum diisi"}
              </p>
              <p>
                Data pasar: {data?.market.sampleSize ?? 0} campaign aktif sekategori{" "}
                {data?.market.category}
                {data && data.market.sampleSize > 0
                  ? `, median ${formatCurrency(data.market.medianBudget)}`
                  : ""}
              </p>
            </div>

            <button
              type="button"
              onClick={saveToProfile}
              disabled={saving || !row}
              className="w-full mt-4 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold text-white bg-influencer hover:bg-influencer-dark transition-all disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Pasang tarif ini di profil
            </button>
            <Link
              href="/dashboard/influencer/smart-matching"
              className="w-full mt-2 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
            >
              Cari campaign sesuai tarif ini
            </Link>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
            <h3 className="font-semibold text-sm mb-2">Strategi harga</h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">{data?.advice}</p>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm">Kalimat negosiasi</h3>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard?.writeText(data?.negotiationLine ?? "");
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="inline-flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? "Tersalin" : "Salin"}
              </button>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 italic">
              &ldquo;{data?.negotiationLine}&rdquo;
            </p>
          </div>

          <button
            type="button"
            onClick={() => void load()}
            disabled={busy}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-kolabora hover:bg-kolabora-dark transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Hitung ulang tarif
          </button>
          {data && !data.aiUsed && data.aiError && (
            <p className="text-[11px] text-zinc-400 -mt-2">AI: {data.aiError}</p>
          )}
        </div>
      </div>
    </FeaturePage>
  );
}
