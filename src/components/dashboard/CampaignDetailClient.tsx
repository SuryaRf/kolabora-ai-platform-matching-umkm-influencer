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
import Modal from "@/components/ui/Modal";
import { formatCurrency, formatDate } from "@/lib/utils";
import { colorForName, initialsOf } from "@/lib/avatar";
import { applicationChip, isUndecided } from "@/lib/application";

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
  /** Diisi server bila lamaran ini sudah menjadi kolaborasi. */
  collaborationId?: string | null;
  /** Catatan yang dulu dikirim brand saat menolak. */
  feedback?: string | null;
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


export default function CampaignDetailClient({ id }: { id: string }) {
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  /** Lamaran yang sedang ditolak; catatan opsional dikirim bareng ke kreator. */
  const [rejectFor, setRejectFor] = useState<Application | null>(null);
  const [rejectNote, setRejectNote] = useState("");

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

  const review = async (
    applicationId: string,
    action: "accept" | "reject",
    note?: string,
  ) => {
    setBusyId(applicationId);
    setError("");
    try {
      const res = await fetch("/api/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: applicationId, action, note: note || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal memproses lamaran");
        // Kalau lamaran ternyata sudah diputus (409), muat ulang supaya
        // tombolnya hilang dan tidak bisa diklik dua kali.
        if (res.status === 409) await load();
        return;
      }
      setNotice(
        action === "accept"
          ? "Lamaran diterima. Kolaborasi dibuat dan chat sudah aktif."
          : note
            ? "Lamaran ditolak. Catatan Anda ikut dikirim ke kreator."
            : "Lamaran ditolak.",
      );
      await load();
    } catch {
      setError("Gagal memproses lamaran");
    } finally {
      setBusyId(null);
    }
  };

  const openReject = (app: Application) => {
    setRejectNote("");
    setError("");
    setNotice("");
    setRejectFor(app);
  };

  const confirmReject = async () => {
    if (!rejectFor) return;
    const note = rejectNote.trim();
    setRejectFor(null);
    await review(rejectFor.id, "reject", note);
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
              // Label & warna chip satu sumber dengan halaman lain: penanda
              // dari pelamar terbaca "Ditinjau pelamar" di sisi brand.
              const meta = applicationChip(app.status, "brand");
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
                      {app.status === "REJECTED" && app.feedback && (
                        <p className="text-xs text-zinc-500 mt-2">
                          Catatan yang Anda kirim: “{app.feedback}”
                        </p>
                      )}
                    </div>
                    <div className="flex sm:flex-col gap-2 flex-shrink-0">
                      {isUndecided(app.status) && (
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
                            onClick={() => openReject(app)}
                            disabled={busyId === app.id}
                            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 disabled:opacity-50"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Tolak
                          </button>
                        </>
                      )}
                      {app.status === "ACCEPTED" && (
                        <Link
                          href={
                            app.collaborationId
                              ? `/dashboard/umkm/chat?collaboration=${app.collaborationId}`
                              : "/dashboard/umkm/chat"
                          }
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

      <Modal
        open={!!rejectFor}
        onClose={() => setRejectFor(null)}
        title="Tolak lamaran ini"
        description={rejectFor?.applicant?.name ?? undefined}
      >
        {rejectFor && (
          <div className="space-y-4">
            <p className="text-xs text-zinc-500 leading-relaxed">
              Lamaran untuk{" "}
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                {campaign?.title}
              </span>{" "}
              akan ditandai belum cocok. Kreator tidak bisa melamar campaign yang
              sama dua kali, jadi kalau ada yang sebenarnya masih bisa
              diperbaiki, tulis catatan singkat di bawah — catatan itu yang
              membuat perjalanan dia tidak mentok tanpa arahan.
            </p>

            <div>
              <label className="block text-xs font-medium mb-1.5">
                Catatan untuk kreator (opsional)
              </label>
              <textarea
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value.slice(0, 200))}
                rows={3}
                maxLength={200}
                placeholder="Misalnya: portofolio bagus, tapi tarif di atas budget campaign ini."
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-kolabora/50 resize-none"
              />
              <p className="text-[11px] text-zinc-400 mt-1">
                {rejectNote.length}/200 karakter · tampil di kartu lamaran
                kreator dan di notifikasinya
              </p>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setRejectFor(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200"
              >
                Batal
              </button>
              <button
                onClick={() => void confirmReject()}
                disabled={busyId === rejectFor.id}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
              >
                <XCircle className="w-3.5 h-3.5" /> Tolak Lamaran
              </button>
            </div>
          </div>
        )}
      </Modal>
    </FeaturePage>
  );
}
