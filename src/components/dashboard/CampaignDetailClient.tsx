"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  MessageSquare,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import FeaturePage from "@/components/dashboard/FeaturePage";
import { formatCurrency, formatDate } from "@/lib/utils";
import { colorForName, initialsOf } from "@/lib/avatar";

interface Applicant {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  influencerProfile: {
    displayName: string;
    category: string;
    location: string | null;
    followers: number;
    engagement: number;
    bio: string | null;
  } | null;
}

interface Application {
  id: string;
  proposal: string;
  proposedRate: number | null;
  status: "PENDING" | "REVIEWED" | "ACCEPTED" | "REJECTED" | "WITHDRAWN";
  createdAt: string;
  applicant: Applicant;
}

interface CampaignDetail {
  id: string;
  title: string;
  description: string;
  category: string;
  budgetMin: number;
  budgetMax: number;
  location: string | null;
  requirements: string | null;
  deliverables: string | null;
  status: string;
  createdAt: string;
  canManage: boolean;
  applications: Application[];
}

const APP_STATUS: Record<string, { label: string; className: string }> = {
  PENDING: {
    label: "Menunggu",
    className:
      "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
  },
  ACCEPTED: {
    label: "Diterima",
    className:
      "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
  },
  REJECTED: {
    label: "Ditolak",
    className: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
  },
  REVIEWED: {
    label: "Ditinjau",
    className: "bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400",
  },
  WITHDRAWN: {
    label: "Ditarik",
    className: "bg-zinc-100 dark:bg-zinc-800 text-zinc-500",
  },
};

export default function CampaignDetailClient({ id }: { id: string }) {
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/campaigns/${id}`, { cache: "no-store" });
      if (res.ok) setCampaign(await res.json());
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const review = async (applicationId: string, action: "accept" | "reject") => {
    setBusyId(applicationId);
    setError("");
    try {
      const res = await fetch("/api/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: applicationId, action }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal memproses lamaran");
        return;
      }
      setNotice(
        action === "accept"
          ? "Lamaran diterima. Kolaborasi dibuat dan chat sudah aktif."
          : "Lamaran ditolak.",
      );
      await load();
    } catch {
      setError("Gagal memproses lamaran");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-sm text-zinc-500">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Memuat campaign...
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="p-6">
        <p className="text-sm text-zinc-500">Campaign tidak ditemukan.</p>
        <Link
          href="/dashboard/umkm/campaigns"
          className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-kolabora"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali
        </Link>
      </div>
    );
  }

  return (
    <FeaturePage
      title={campaign.title}
      description={`${campaign.category} • Dibuat ${formatDate(campaign.createdAt)}`}
      icon={Users}
      gradient="bg-umkm"
    >
      <Link
        href="/dashboard/umkm/campaigns"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-umkm"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Campaign Saya
      </Link>

      {notice && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 text-sm text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="w-4 h-4" /> {notice}
        </div>
      )}
      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Wallet, label: "Budget", value: `${formatCurrency(campaign.budgetMin)} - ${formatCurrency(campaign.budgetMax)}` },
          { icon: MapPin, label: "Lokasi", value: campaign.location ?? "Remote" },
          { icon: Users, label: "Pelamar", value: String(campaign.applications.length) },
          { icon: Clock, label: "Status", value: campaign.status === "ACTIVE" ? "Aktif" : "Ditutup" },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4"
          >
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-1">
              <s.icon className="w-3.5 h-3.5" /> {s.label}
            </div>
            <p className="text-sm font-bold leading-tight break-words">
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-4">
        <div>
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1">
            Brief Campaign
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap">
            {campaign.description}
          </p>
        </div>
        {campaign.requirements && (
          <div>
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1">
              Persyaratan
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap">
              {campaign.requirements}
            </p>
          </div>
        )}
        {campaign.deliverables && (
          <div>
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1">
              Deliverables
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap">
              {campaign.deliverables}
            </p>
          </div>
        )}
      </div>

      <div>
        <h3 className="font-semibold text-sm mb-3">
          Pelamar ({campaign.applications.length})
        </h3>
        {campaign.applications.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 text-center text-sm text-zinc-500">
            Belum ada influencer yang melamar campaign ini.
          </div>
        ) : (
          <div className="space-y-3">
            {campaign.applications.map((app) => {
              const profile = app.applicant.influencerProfile;
              const name =
                profile?.displayName ||
                app.applicant.name ||
                app.applicant.email;
              const meta = APP_STATUS[app.status] ?? APP_STATUS.PENDING;
              return (
                <div
                  key={app.id}
                  className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div
                      className={`w-11 h-11 rounded-full ${colorForName(
                        name,
                      )} flex items-center justify-center text-white text-sm font-bold flex-shrink-0 overflow-hidden`}
                    >
                      {app.applicant.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={app.applicant.image}
                          alt={name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        initialsOf(name)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold">{name}</p>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${meta.className}`}
                        >
                          {meta.label}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500">
                        {profile?.category ?? "Umum"}
                        {profile?.location ? ` • ${profile.location}` : ""}
                        {profile ? ` • ${profile.followers.toLocaleString("id-ID")} followers` : ""}
                        {profile ? ` • ${profile.engagement}% engagement` : ""}
                      </p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-2 whitespace-pre-wrap">
                        {app.proposal}
                      </p>
                      {app.proposedRate && (
                        <p className="text-xs font-semibold text-kolabora mt-2">
                          Penawaran tarif: {formatCurrency(app.proposedRate)}
                        </p>
                      )}
                    </div>
                    <div className="flex sm:flex-col gap-2 flex-shrink-0">
                      {app.status === "PENDING" && (
                        <>
                          <button
                            onClick={() => void review(app.id, "accept")}
                            disabled={busyId === app.id}
                            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                          >
                            {busyId === app.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                            Terima
                          </button>
                          <button
                            onClick={() => void review(app.id, "reject")}
                            disabled={busyId === app.id}
                            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 disabled:opacity-50"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Tolak
                          </button>
                        </>
                      )}
                      {app.status === "ACCEPTED" && (
                        <Link
                          href="/dashboard/umkm/chat"
                          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-kolabora bg-kolabora/10 hover:bg-kolabora/20"
                        >
                          <MessageSquare className="w-3.5 h-3.5" /> Chat
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </FeaturePage>
  );
}
