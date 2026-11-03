"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Medal,
  Loader2,
  AlertTriangle,
  TrendingUp,
  Users,
  CheckCircle,
  ArrowRight,
  Target,
  Wand2,
} from "lucide-react";
import FeaturePage from "@/components/dashboard/FeaturePage";
import { formatCurrency } from "@/lib/utils";

interface Insight {
  profile: {
    displayName: string;
    category: string;
    location: string | null;
    followers: number;
    engagement: number;
    rateMin: number | null;
    rateMax: number | null;
    portfolioCount: number;
  };
  score: number;
  subScores: { key: string; label: string; score: number; weight: number; detail: string }[];
  missing: string[];
  visibility: { score: number; rank: number; competitors: number; activeCampaigns: number };
  funnel: { total: number; pending: number; reviewed: number; accepted: number; rejected: number };
  collaborations: { total: number; completed: number; active: number; totalEarned: number; paidCampaigns: number };
  approvedContents: number;
  conversionRate: number | null;
}

const LABEL_FIELD: Record<string, string> = {
  bio: "bio",
  lokasi: "lokasi",
  niche: "niche",
  "platform sosial": "platform sosial",
  "rentang tarif": "rentang tarif",
  portofolio: "portofolio",
  "jumlah follower": "jumlah follower",
  "engagement rate": "engagement rate",
};

/** Sabang prioritas visibilitas, dipakai bersama dengan mesin pencocok aturan. */
function tier(score: number) {
  if (score >= 80) return { label: "Prioritas teratas", tone: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800" };
  if (score >= 65) return { label: "Naik ke urutan tengah", tone: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800" };
  return { label: "Masih di bawah", tone: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800" };
}

export default function PriorityMatching() {
  const [data, setData] = useState<Insight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profilKosong, setProfilKosong] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const res = await fetch("/api/insights/influencer", { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 400 && json.code === "PROFILE_MISSING") setProfilKosong(true);
        else setError(json.error ?? "Gagal memuat data visibilitas.");
        return;
      }
      setData(json as Insight);
      setProfilKosong(false);
    } catch {
      setError("Koneksi terputus saat memuat data visibilitas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  const shell = (children: React.ReactNode) => (
    <FeaturePage
      title="Priority Matching / Visibilitas Profil"
      description="Seberapa tinggi profil kamu muncul pada hasil pencocokan UMKM — dihitung dari data asli, bukan angka perkiraan."
      icon={Medal}
      gradient="bg-gradient-to-br from-amber-500 to-yellow-600"
    >
      {children}
    </FeaturePage>
  );

  if (loading) {
    return shell(
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <Loader2 className="w-4 h-4 animate-spin" /> Memuat data visibilitas...
      </div>,
    );
  }

  if (profilKosong || !data) {
    return shell(
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 text-center">
        <p className="font-semibold">Profil influencer belum lengkap</p>
        <p className="text-sm text-zinc-500 mt-1">
          {error || "Peringkat visibilitas dihitung dari profil, lamaran, dan kolaborasi kamu di database."}
        </p>
        <Link
          href="/dashboard/influencer/profile"
          className="inline-flex items-center gap-2 mt-4 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-influencer hover:bg-influencer-dark transition-colors"
        >
          Lengkapi profil <ArrowRight className="w-4 h-4" />
        </Link>
      </div>,
    );
  }

  const t = tier(data.visibility.score);
  const weakSubs = data.subScores.filter((s) => s.score < 75);

  return shell(
    <>
      {error && (
        <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className={`flex items-center gap-4 p-5 rounded-2xl border ${t.tone}`}>
        <Medal className="w-10 h-10 flex-shrink-0" />
        <div className="min-w-0">
          <p className="font-semibold">{t.label}</p>
          <p className="text-sm opacity-80">
            Skor kecocokan rata-rata {data.visibility.score}/100 pada {data.visibility.activeCampaigns} campaign aktif —
            peringkat {data.visibility.rank} dari {data.visibility.competitors} kreator di Kolabora.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="ml-auto text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/70 dark:bg-zinc-900/60 hover:bg-white dark:hover:bg-zinc-900 transition-colors"
        >
          Segarkan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: Target, label: "Skor profil", value: `${data.score}/100`, color: "text-emerald-500" },
          { icon: Users, label: "Kreator dibandingkan", value: `${data.visibility.competitors}`, color: "text-amber-500" },
          { icon: TrendingUp, label: "Lamaran diterima", value: data.conversionRate === null ? "belum ada" : `${data.conversionRate}%`, color: "text-kolabora" },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 text-center">
            <s.icon className={`w-8 h-8 ${s.color} mx-auto mb-2`} />
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-zinc-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
          <h3 className="font-semibold text-sm mb-4">Data kamu saat ini</h3>
          <div className="space-y-3">
            {[
              // REVIEWED tetap "menunggu" di sisi kreator: penandanya dari dia
              // sendiri, keputusannya masih di brand.
              { label: "Lamaran dikirim", value: `${data.funnel.total}`, hint: `${data.funnel.pending + data.funnel.reviewed} menunggu${data.funnel.reviewed ? ` (${data.funnel.reviewed} ditandai ditinjau)` : ""}, ${data.funnel.rejected} ditolak` },
              { label: "Lamaran diterima", value: `${data.funnel.accepted}`, hint: `${data.collaborations.total} kolaborasi tercipta` },
              { label: "Kolaborasi berjalan", value: `${data.collaborations.active}`, hint: `${data.collaborations.completed} sudah selesai` },
              { label: "Konten disetujui", value: `${data.approvedContents}`, hint: "review yang berstatus APPROVED" },
              {
                label: "Total diterima (escrow cair)",
                value: formatCurrency(data.collaborations.totalEarned),
                hint: `dari ${data.collaborations.paidCampaigns} campaign`,
              },
              { label: "Portofolio", value: `${data.profile.portfolioCount} karya`, hint: data.profile.portfolioCount < 3 ? "UMKM biasanya cek 3 karya teratas" : "cukup untuk dinilai" },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800">
                <div className="min-w-0">
                  <p className="text-xs text-zinc-500">{row.label}</p>
                  <p className="text-[11px] text-zinc-400 truncate">{row.hint}</p>
                </div>
                <p className="text-sm font-bold flex-shrink-0">{row.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
          <h3 className="font-semibold text-sm mb-4">Yang menaikkan urutan kamu</h3>
          <div className="space-y-3">
            {data.missing.map((field) => (
              <div key={field} className="flex items-start gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Isi {(LABEL_FIELD[field] ?? field)}</p>
                  <p className="text-xs text-zinc-500">
                    Kolom ini ikut dihitung mesin pencocok, jadi profil yang kosong kalah urutan.
                  </p>
                </div>
              </div>
            ))}
            {weakSubs.map((s) => (
              <div key={s.key} className="flex items-start gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800">
                <CheckCircle className="w-4 h-4 text-kolabora mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">
                    Perbaiki {s.label.toLowerCase()} ({s.score}/100)
                  </p>
                  <p className="text-xs text-zinc-500">{s.detail} · bobot {s.weight}% pada skor profil</p>
                </div>
              </div>
            ))}
            {data.missing.length === 0 && weakSubs.length === 0 && (
              <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Tidak ada PR hari ini</p>
                  <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80">
                    Semua kolom terisi dan tiap komponen skor di atas 75. Pertahankan konsistensi unggahan.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <Link
              href="/dashboard/influencer/profile-optimizer"
              className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 transition-all"
            >
              <Wand2 className="w-4 h-4" /> Optimalkan profil
            </Link>
            <Link
              href="/dashboard/influencer/smart-matching"
              className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
            >
              Campaign yang cocok <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
        <h3 className="font-semibold text-sm mb-3">Komponen skor visibilitas</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.subScores.map((s) => (
            <div key={s.key} className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-zinc-500">{s.label}</span>
                <span className="text-xs font-semibold">{s.score}/100</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                <div
                  className={`h-full rounded-full ${s.score >= 80 ? "bg-emerald-500" : s.score >= 60 ? "bg-amber-500" : "bg-red-500"}`}
                  style={{ width: `${s.score}%` }}
                />
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">{s.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </>,
  );
}
