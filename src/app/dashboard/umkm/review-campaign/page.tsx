"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Loader2,
  MessageSquare,
  RotateCcw,
  ThumbsUp,
  XCircle,
} from "lucide-react";
import FeaturePage from "@/components/dashboard/FeaturePage";
import Modal from "@/components/ui/Modal";
import { formatDate } from "@/lib/utils";
import { colorForName, initialsOf } from "@/lib/avatar";

interface Review {
  id: string;
  collaborationId: string;
  contentUrl: string;
  caption: string | null;
  notes: string | null;
  status: string;
  reviewNotes: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  collaboration: {
    id: string;
    title: string;
    status: string;
    campaign: { id: string; title: string } | null;
    participants: {
      id: string;
      name: string | null;
      role: string | null;
      image: string | null;
    }[];
  };
}

const STATUS_META: Record<
  string,
  { label: string; className: string; icon: typeof Clock }
> = {
  PENDING: {
    label: "Menunggu Review",
    className:
      "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
    icon: Clock,
  },
  APPROVED: {
    label: "Disetujui",
    className:
      "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
    icon: CheckCircle2,
  },
  REVISION_REQUESTED: {
    label: "Revisi Diminta",
    className: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
    icon: RotateCcw,
  },
};

export default function ReviewCampaignPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"semua" | "pending" | "done">("semua");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [revisionTarget, setRevisionTarget] = useState<Review | null>(null);
  const [revisionNotes, setRevisionNotes] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/reviews", { cache: "no-store" });
      if (res.ok) setReviews(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const pending = reviews.filter((r) => r.status === "PENDING");

  const visible = useMemo(
    () =>
      reviews.filter((r) => {
        if (filter === "pending") return r.status === "PENDING";
        if (filter === "done") return r.status !== "PENDING";
        return true;
      }),
    [reviews, filter],
  );

  const review = async (
    reviewId: string,
    action: "approve" | "revision",
    notes?: string,
  ) => {
    setBusyId(reviewId);
    setError("");
    try {
      const res = await fetch("/api/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId, action, reviewNotes: notes }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal memproses review");
        return;
      }
      setNotice(
        action === "approve"
          ? "Konten disetujui. Dana escrow kini siap dicairkan di Riwayat Kolaborasi."
          : "Permintaan revisi dikirim ke influencer.",
      );
      setRevisionTarget(null);
      setRevisionNotes("");
      await load();
    } catch {
      setError("Gagal memproses review");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <FeaturePage
      title="Review Konten"
      description="Tinjau konten yang dikirim influencer. Setujui untuk melanjutkan pencairan escrow, atau minta revisi dengan catatan yang jelas."
      icon={Eye}
      gradient="bg-umkm"
    >
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: "Menunggu Review", value: pending.length, icon: Clock },
          {
            label: "Disetujui",
            value: reviews.filter((r) => r.status === "APPROVED").length,
            icon: CheckCircle2,
          },
          {
            label: "Perlu Revisi",
            value: reviews.filter((r) => r.status === "REVISION_REQUESTED")
              .length,
            icon: XCircle,
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <s.icon className="w-5 h-5 text-zinc-500" />
            </div>
            <div>
              <p className="text-xl font-bold">{s.value}</p>
              <p className="text-xs text-zinc-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        {[
          { key: "semua" as const, label: "Semua" },
          { key: "pending" as const, label: "Menunggu Review" },
          { key: "done" as const, label: "Sudah Direview" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
              filter === f.key
                ? "bg-umkm text-white"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-sm text-zinc-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Memuat konten...
        </div>
      ) : visible.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-10 text-center">
          <Eye className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <h3 className="font-semibold">Belum ada konten untuk direview</h3>
          <p className="text-sm text-zinc-500 mt-1">
            Konten akan muncul di sini setelah influencer mengirimkannya.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {visible.map((r) => {
            const meta = STATUS_META[r.status] ?? STATUS_META.PENDING;
            const Icon = meta.icon;
            const influencer = r.collaboration.participants.find(
              (p) => p.role === "INFLUENCER",
            );
            const name = influencer?.name ?? "Influencer";
            return (
              <div
                key={r.id}
                className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div
                    className={`w-11 h-11 rounded-full ${colorForName(
                      name,
                    )} flex items-center justify-center text-white text-sm font-bold flex-shrink-0 overflow-hidden`}
                  >
                    {influencer?.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={influencer.image}
                        alt={name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      initialsOf(name)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold">{r.collaboration.title}</p>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${meta.className}`}
                      >
                        <Icon className="w-3 h-3" /> {meta.label}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500">
                      {name} • Dikirim {formatDate(r.submittedAt)}
                    </p>

                    <div className="mt-3 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                        <FileText className="w-3.5 h-3.5" /> Konten
                      </div>
                      <a
                        href={r.contentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-medium text-kolabora hover:underline break-all"
                      >
                        {r.contentUrl}
                      </a>
                      {r.caption && (
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">
                          <span className="font-semibold">Caption:</span>{" "}
                          {r.caption}
                        </p>
                      )}
                      {r.notes && (
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">
                          <span className="font-semibold">Catatan:</span>{" "}
                          {r.notes}
                        </p>
                      )}
                      {r.reviewNotes && (
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">
                          <span className="font-semibold">Catatan review:</span>{" "}
                          {r.reviewNotes}
                        </p>
                      )}
                    </div>
                  </div>

                  {r.status === "PENDING" && (
                    <div className="flex sm:flex-col gap-2 flex-shrink-0">
                      <button
                        onClick={() => void review(r.id, "approve")}
                        disabled={busyId === r.id}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {busyId === r.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <ThumbsUp className="w-3.5 h-3.5" />
                        )}
                        Setujui
                      </button>
                      <button
                        onClick={() => {
                          setRevisionTarget(r);
                          setRevisionNotes("");
                        }}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Minta Revisi
                      </button>
                      <Link
                        href="/dashboard/umkm/chat"
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-kolabora bg-kolabora/10 hover:bg-kolabora/20"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> Diskusi
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={!!revisionTarget}
        onClose={() => setRevisionTarget(null)}
        title="Minta Revisi Konten"
        description={revisionTarget?.collaboration.title}
      >
        <div className="space-y-4">
          <p className="text-xs text-zinc-500">
            Jelaskan bagian yang perlu diperbaiki agar influencer dapat segera
            melakukan revisi.
          </p>
          <textarea
            rows={5}
            value={revisionNotes}
            onChange={(e) => setRevisionNotes(e.target.value)}
            placeholder="Contoh: Perbaiki pencahayaan pada 5 detik pertama dan tambahkan hashtag #ad."
            className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-umkm/50"
          />
          <button
            onClick={() =>
              revisionTarget &&
              void review(revisionTarget.id, "revision", revisionNotes)
            }
            disabled={
              !revisionNotes.trim() ||
              (revisionTarget ? busyId === revisionTarget.id : false)
            }
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white bg-umkm hover:bg-umkm-dark disabled:opacity-50"
          >
            {busyId === revisionTarget?.id ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RotateCcw className="w-4 h-4" />
            )}
            Kirim Permintaan Revisi
          </button>
        </div>
      </Modal>
    </FeaturePage>
  );
}
