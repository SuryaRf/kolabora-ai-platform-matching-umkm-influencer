"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  Loader2,
  CheckCircle2,
  Clock,
  Lightbulb,
  XCircle,
  ArrowRight,
  Sparkles,
  Wallet,
  Search,
} from "lucide-react";
import FeaturePage from "@/components/dashboard/FeaturePage";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getStatusMeta, isActiveStep, stageHint, statusToStep, type CollabDTO } from "@/lib/collab";
import { getApplicationGuidance } from "@/lib/application";

interface Application {
  id: string;
  proposal: string;
  proposedRate: number | null;
  status: "PENDING" | "REVIEWED" | "ACCEPTED" | "REJECTED" | "WITHDRAWN";
  /** Catatan brand saat menolak — alasan yang bisa dipakai kreator bergerak. */
  feedback: string | null;
  createdAt: string;
  applicant?: { influencerProfile?: { category: string | null } | null } | null;
  campaign: {
    id: string;
    title: string;
    category: string;
    budgetMin: number;
    budgetMax: number;
    status: string;
  };
}

const APP_META: Record<string, { label: string; className: string; icon: typeof Clock }> = {
  PENDING: {
    label: "Menunggu Review",
    className:
      "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
    icon: Clock,
  },
  ACCEPTED: {
    label: "Diterima",
    className:
      "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
    icon: CheckCircle2,
  },
  REJECTED: {
    label: "Ditolak",
    className: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
    icon: XCircle,
  },
  REVIEWED: {
    label: "Ditinjau",
    className: "bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400",
    icon: Sparkles,
  },
  WITHDRAWN: {
    label: "Ditarik",
    className: "bg-zinc-100 dark:bg-zinc-800 text-zinc-500",
    icon: XCircle,
  },
};

function ApplicationBoard({ initialTab }: { initialTab: string | null }) {
  const [tab, setTab] = useState<"lamaran" | "kolaborasi">(
    // Notifikasi penolakan menunjuk ke ?tab=lamaran. Tanpa ini, kreator yang
    // mengkliknya mendarat di tab Kolaborasi — daftar yang justru tidak memuat
    // lamarannya, jadi kesannya sistem diam.
    initialTab === "lamaran" ? "lamaran" : "kolaborasi",
  );
  const [applications, setApplications] = useState<Application[]>([]);
  const [collaborations, setCollaborations] = useState<CollabDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [appRes, colRes] = await Promise.all([
        fetch("/api/applications", { cache: "no-store" }),
        fetch("/api/collaborations", { cache: "no-store" }),
      ]);
      if (appRes.ok) setApplications(await appRes.json());
      if (colRes.ok) setCollaborations(await colRes.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /**
   * Kartu ringkasan ikut dimuat ulang saat user kembali ke tab ini. Tanpa ini
   * angkanya masih memakai data saat halaman pertama dibuka, misalnya setelah
   * UMKM menerima lamaran di tab lain.
   */
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") void load();
    };
    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  const stats = useMemo(() => {
    // Satu campaign bisa muncul dua kali untuk influencer yang sama (lamaran +
    // kolaborasi yang lahir saat lamaran itu diterima). Jadi "Total Campaign"
    // dihitung dari ID campaign unik, bukan penjumlahan jumlah baris.
    const campaignKeys = new Set<string>();
    for (const c of collaborations) campaignKeys.add(c.campaign?.id ?? c.id);
    for (const a of applications) campaignKeys.add(a.campaign.id);

    const steps = collaborations.map((c) => statusToStep(c.status));
    const earnings = collaborations
      .filter((c) => c.status === "COMPLETED")
      .reduce((acc, c) => acc + (c.escrowAmount ?? c.budget), 0);
    return {
      total: campaignKeys.size,
      berjalan: steps.filter(isActiveStep).length,
      menunggu: applications.filter((a) => a.status === "PENDING").length,
      selesai: steps.filter((s) => s === 6).length,
      earnings,
    };
  }, [collaborations, applications]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-sm text-zinc-500">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Memuat campaign...
      </div>
    );
  }

  return (
    <FeaturePage
      title="Campaign Saya"
      description="Pantau lamaran yang Anda kirim dan semua kolaborasi yang sedang berjalan."
      icon={LayoutDashboard}
      gradient="bg-influencer"
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Campaign", value: stats.total },
          { label: "Lamaran Menunggu", value: stats.menunggu },
          { label: "Sedang Berjalan", value: stats.berjalan },
          {
            label: "Total Pendapatan",
            value: formatCurrency(stats.earnings),
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4"
          >
            <p className="text-xs text-zinc-500 mb-1">{s.label}</p>
            <p className="text-lg font-bold truncate">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setTab("kolaborasi")}
          className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
            tab === "kolaborasi"
              ? "bg-influencer text-white"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
          }`}
        >
          Kolaborasi ({collaborations.length})
        </button>
        <button
          onClick={() => setTab("lamaran")}
          className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
            tab === "lamaran"
              ? "bg-influencer text-white"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
          }`}
        >
          Lamaran ({applications.length})
        </button>
      </div>

      {tab === "kolaborasi" ? (
        collaborations.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-10 text-center">
            <LayoutDashboard className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
            <h3 className="font-semibold">Belum ada kolaborasi</h3>
            <p className="text-sm text-zinc-500 mt-1 mb-5">
              Lamar campaign atau terima tawaran brand untuk memulai.
            </p>
            <Link
              href="/dashboard/influencer/discover"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-influencer hover:bg-influencer-dark"
            >
              <Search className="w-4 h-4" /> Cari Campaign
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {collaborations.map((c) => {
              const status = getStatusMeta(c.status, "INFLUENCER");
              const step = statusToStep(c.status);
              const brand = c.participants.find(
                (p) => p.role === "UMKM",
              );
              const brandName =
                brand?.businessName || brand?.name || "Brand";
              return (
                <Link
                  key={c.id}
                  href="/dashboard/influencer/history"
                  className="group bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 hover:shadow-lg hover:border-influencer/40 transition-all"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <p className="font-semibold truncate group-hover:text-influencer transition-colors">
                        {c.title}
                      </p>
                      <p className="text-xs text-zinc-500">{brandName}</p>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium flex-shrink-0 ${status.className}`}
                    >
                      {status.label}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 line-clamp-2 mb-3">
                    {c.brief}
                  </p>
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Wallet className="w-3.5 h-3.5" />{" "}
                      {formatCurrency(c.budget)}
                    </span>
                    <span>{stageHint(c.status)}</span>
                  </div>
                  <div className="mt-3 h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        step === 0 ? "bg-zinc-300" : "bg-influencer"
                      }`}
                      style={{ width: `${(step / 6) * 100}%` }}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        )
      ) : applications.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-10 text-center">
          <Search className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <h3 className="font-semibold">Belum ada lamaran</h3>
          <p className="text-sm text-zinc-500 mt-1 mb-5">
            Temukan campaign yang cocok dan kirim lamaran pertama Anda.
          </p>
          <Link
            href="/dashboard/influencer/discover"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-influencer hover:bg-influencer-dark"
          >
            <Search className="w-4 h-4" /> Cari Campaign
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => {
            const meta = APP_META[app.status] ?? APP_META.PENDING;
            const Icon = meta.icon;
            const guidance = getApplicationGuidance({
              status: app.status,
              proposedRate: app.proposedRate,
              feedback: app.feedback,
              campaign: app.campaign,
              applicantCategory:
                app.applicant?.influencerProfile?.category ?? null,
            });
            return (
              <div
                key={app.id}
                className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold">{app.campaign.title}</p>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${meta.className}`}
                      >
                        <Icon className="w-3 h-3" /> {meta.label}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500">
                      {app.campaign.category} •{" "}
                      {formatCurrency(app.campaign.budgetMin)} -{" "}
                      {formatCurrency(app.campaign.budgetMax)} •{" "}
                      {formatDate(app.createdAt)}
                    </p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-2 line-clamp-2">
                      {app.proposal}
                    </p>
                    {app.proposedRate && (
                      <p className="text-xs font-semibold text-influencer mt-1.5">
                        Tarif diajukan: {formatCurrency(app.proposedRate)}
                      </p>
                    )}
                  </div>
                  {app.status === "ACCEPTED" && (
                    <Link
                      href="/dashboard/influencer/history"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-influencer bg-influencer/10 hover:bg-influencer/20 flex-shrink-0"
                    >
                      Buka Kolaborasi <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>

                {guidance && (
                  <div className="mt-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 p-3.5">
                    <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                      {guidance.headline}
                    </p>
                    <p className="text-[11px] text-zinc-500 mt-1 flex items-start gap-1.5">
                      {guidance.tone === "waiting" ? (
                        <Clock className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      )}
                      {guidance.turn}
                    </p>
                    {guidance.hints.map((hint) => (
                      <p
                        key={hint}
                        className="text-[11px] text-zinc-600 dark:text-zinc-300 mt-2 flex items-start gap-1.5 leading-relaxed"
                      >
                        <Lightbulb className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-500" />
                        {hint}
                      </p>
                    ))}
                    {guidance.actions.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {guidance.actions.map((a) => (
                          <Link
                            key={a.to}
                            href={a.to}
                            title={a.why}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-influencer bg-influencer/10 hover:bg-influencer/20"
                          >
                            {a.label} <ArrowRight className="w-3 h-3" />
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </FeaturePage>
  );
}

export default function InfluencerCampaignsPage() {
  // App Router meminta boundary Suspense untuk komponen yang memakai
  // useSearchParams. `key` membuat papan lamaran dimuat ulang saat parameter
  // tab berubah (misalnya saat user mengklik notifikasi penolakan), jadi tab
  // mengikuti URL tanpa perlu effect setState.
  const params = useSearchParams();
  const initialTab = params.get("tab");
  return (
    <Suspense
      fallback={
        <div className="py-16 flex items-center justify-center gap-2 text-sm text-zinc-400">
          <Loader2 className="w-4 h-4 animate-spin" /> Memuat lamaran…
        </div>
      }
    >
      <ApplicationBoard key={initialTab ?? "default"} initialTab={initialTab} />
    </Suspense>
  );
}
