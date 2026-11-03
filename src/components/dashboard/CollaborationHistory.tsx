"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  ArrowRight,
  Banknote,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Handshake,
  History,
  Loader2,
  Lock,
  RotateCcw,
  Send,
  Sparkles,
  Upload,
  Wallet,
} from "lucide-react";
import { useRouter } from "next/navigation";
import FeaturePage from "@/components/dashboard/FeaturePage";
import {
  CollaborationProgress,
  CollaborationStepper,
  CollaborationTimeline,
} from "@/components/dashboard/CollaborationFlow";
import PaymentModal, {
  type PaymentMode,
} from "@/components/dashboard/PaymentModal";
import Modal from "@/components/ui/Modal";
import { formatCurrency, formatDate } from "@/lib/utils";
import { colorForName, initialsOf, participantLabel } from "@/lib/avatar";
import {
  actionClassName,
  getCollabActions,
  getDealState,
  getStatusMeta,
  getTurnInfo,
  isActiveStep,
  isWaitingStep,
  stageHint,
  stageIndexFor,
  statusToStep,
  type CollabAction,
  type CollabDTO,
  type Role,
} from "@/lib/collab";

type FilterKey = "semua" | "berjalan" | "menunggu" | "selesai";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "semua", label: "Semua" },
  { key: "berjalan", label: "Sedang Berjalan" },
  { key: "menunggu", label: "Menunggu Respons" },
  { key: "selesai", label: "Selesai" },
];

export default function CollaborationHistory({ role }: { role: Role }) {
  const { data: session } = useSession();
  const router = useRouter();
  const meId = session?.user?.id ?? "";

  const [items, setItems] = useState<CollabDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>("semua");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [payment, setPayment] = useState<{
    collab: CollabDTO;
    mode: PaymentMode;
    action: string;
  } | null>(null);

  const [contentFor, setContentFor] = useState<CollabDTO | null>(null);
  const [contentUrl, setContentUrl] = useState("");
  const [contentCaption, setContentCaption] = useState("");
  const [contentNotes, setContentNotes] = useState("");
  const [contentFile, setContentFile] = useState<File | null>(null);
  const [submittingContent, setSubmittingContent] = useState(false);

  // Deal final: tarif + catatan, dikonfirmasi dua pihak.
  const [dealFor, setDealFor] = useState<CollabDTO | null>(null);
  const [dealBudget, setDealBudget] = useState("");
  const [dealNote, setDealNote] = useState("");
  const [submittingDeal, setSubmittingDeal] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/collaborations", { cache: "no-store" });
      if (!res.ok) return;
      const data: CollabDTO[] = await res.json();
      setItems(data);
      // Tautan dalam /dashboard/{role}/history?collaboration=<id> langsung membuka item itu.
      const focus =
        typeof window === "undefined"
          ? null
          : new URLSearchParams(window.location.search).get("collaboration");
      const target = focus ? data.find((c) => c.id === focus) : null;
      setExpanded((prev) => prev ?? target?.id ?? data[0]?.id ?? null);
    } catch {
      setError("Gagal memuat data kolaborasi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fungsi async lokal: setState tidak terjadi sinkron di dalam effect.
    const muat = async () => {
      await load();
    };
    void muat();
  }, [load]);

  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(id);
  }, [notice]);

  const visible = useMemo(
    () =>
      items.filter((item) => {
        const step = statusToStep(item.status);
        switch (filter) {
          case "berjalan":
            return isActiveStep(step);
          case "menunggu":
            return isWaitingStep(step);
          case "selesai":
            return step === 6;
          default:
            return true;
        }
      }),
    [items, filter],
  );

  const stats = useMemo(() => {
    const steps = items.map((i) => statusToStep(i.status));
    return [
      {
        icon: History,
        label: "Total Kolaborasi",
        value: items.length,
        color: "bg-kolabora",
      },
      {
        icon: Clock,
        label: "Sedang Berjalan",
        value: steps.filter(isActiveStep).length,
        color: "bg-amber-500",
      },
      {
        icon: Send,
        label: "Menunggu Respons",
        value: steps.filter(isWaitingStep).length,
        color: "bg-blue-500",
      },
      {
        icon: CheckCircle2,
        label: "Selesai",
        value: steps.filter((s) => s === 6).length,
        color: "bg-emerald-500",
      },
    ];
  }, [items]);

  const runAction = async (
    collab: CollabDTO,
    action: string,
    extra?: Record<string, unknown>,
  ) => {
    // UI uses `release_escrow` to trigger the payment modal; the API state
    // machine names that transition `complete`.
    const apiAction = action === "release_escrow" ? "complete" : action;
    setBusyId(collab.id);
    setError(null);
    try {
      const res = await fetch(`/api/collaborations/${collab.id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: apiAction, ...(extra ?? {}) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Aksi gagal dijalankan");
        return false;
      }
      // Aksi deal mengembalikan kalimat status (sudah 1 pihak / deal terkunci).
      setNotice(
        typeof data.dealMessage === "string"
          ? data.dealMessage
          : "Tahap kolaborasi berhasil diperbarui.",
      );
      await load();
      router.refresh();
      return true;
    } catch {
      setError("Aksi gagal dijalankan");
      return false;
    } finally {
      setBusyId(null);
    }
  };

  const openDeal = (collab: CollabDTO) => {
    setDealFor(collab);
    setDealBudget(String(collab.dealAmount ?? collab.budget));
    setDealNote(collab.agreedNote ?? "");
  };

  // tarif yang diketik != tarif sekarang  =>  penawaran ulang
  const typedRate = Number(dealBudget);
  const rateChanged =
    !!dealFor &&
    Number.isFinite(typedRate) &&
    typedRate > 0 &&
    typedRate !== dealFor.budget;
  const peerAlreadyConfirmed =
    !!dealFor && getDealState(dealFor, meId).peerConfirmed;

  const submitDeal = async () => {
    if (!dealFor) return;
    const amount = Number(dealBudget);
    if (!Number.isFinite(amount) || amount < 1) {
      setError("Isi tarif final dengan angka yang benar");
      return;
    }
    setSubmittingDeal(true);
    const ok = await runAction(dealFor, "confirm_deal", {
      budget: Math.round(amount),
      note: dealNote.trim(),
    });
    setSubmittingDeal(false);
    if (ok) setDealFor(null);
  };

  const handleAction = (collab: CollabDTO, action: CollabAction) => {
    if (action.payment) {
      setPayment({ collab, mode: action.payment, action: action.key });
      return;
    }
    if (action.requiresDeal) {
      openDeal(collab);
      return;
    }
    if (action.requiresContent) {
      setContentFor(collab);
      setContentUrl("");
      setContentCaption("");
      setContentNotes("");
      setContentFile(null);
      return;
    }
    if (action.key === "cancel") {
      if (!window.confirm("Batalkan kolaborasi ini?")) return;
    }
    void runAction(collab, action.key);
  };

  const submitContent = async () => {
    if (!contentFor) return;
    if (!contentUrl && !contentFile) {
      setError("Lampirkan file atau isi tautan konten");
      return;
    }
    setSubmittingContent(true);
    setError(null);
    try {
      let url = contentUrl.trim();
      if (contentFile) {
        const form = new FormData();
        form.append("file", contentFile);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: form,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          setError(uploadData.error ?? "Upload file gagal");
          return;
        }
        url = uploadData.url;
      }

      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collaborationId: contentFor.id,
          contentUrl: url,
          caption: contentCaption || null,
          notes: contentNotes || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Gagal mengirim konten");
        return;
      }
      setNotice("Konten berhasil dikirim dan menunggu review brand.");
      setContentFor(null);
      await load();
      router.refresh();
    } catch {
      setError("Gagal mengirim konten");
    } finally {
      setSubmittingContent(false);
    }
  };

  return (
    <FeaturePage
      title="Riwayat Kolaborasi"
      description={
        role === "UMKM"
          ? "Linimasa lengkap setiap kolaborasi — dari rekomendasi AI Smart Matching, pengajuan, negosiasi, escrow, hingga publikasi dan pembayaran."
          : "Linimasa lengkap setiap kolaborasi Anda — dari tawaran brand, negosiasi, escrow, produksi konten, hingga pembayaran."
      }
      icon={History}
      gradient="bg-kolabora"
    >
      <CollaborationStepper role={role} />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-xs text-zinc-500">
          Data kolaborasi tersimpan di database dan tersinkron untuk kedua belah
          pihak secara real-time.
        </p>
        <button
          onClick={() => void load()}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-300 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Muat Ulang
        </button>
      </div>

      {notice && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-sm text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> {notice}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className={`w-8 h-8 rounded-lg ${s.color} flex items-center justify-center`}
              >
                <s.icon className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs text-zinc-500">{s.label}</span>
            </div>
            <p className="text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
              filter === f.key
                ? "bg-kolabora text-white"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-sm text-zinc-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Memuat kolaborasi...
        </div>
      ) : visible.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-10 text-center">
          <p className="text-sm text-zinc-500">
            Belum ada kolaborasi pada kategori ini.
          </p>
          <Link
            href={
              role === "UMKM"
                ? "/dashboard/umkm/smart-matching"
                : "/dashboard/influencer/discover"
            }
            className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-kolabora hover:underline"
          >
            Mulai cari kolaborasi <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {visible.map((item) => {
            const status = getStatusMeta(item.status, role);
            const open = expanded === item.id;
            const actions = getCollabActions(item.status, role);
            const peer = item.participants.find((p) => p.id !== meId);
            const peerName = participantLabel(
              peer ?? { name: item.title, email: "" },
            );
            const busy = busyId === item.id;
            // -1 untuk CANCELLED: seluruh kotak tahap jadi abu, bukan justru
            // menandai "matching" sebagai tahap yang sedang berjalan.
            const progressIndex = stageIndexFor(item.status);
            const deal = getDealState(item, meId);
            const turn = getTurnInfo(item.status, role, actions);
            const isDealStep = actions[0]?.requiresDeal === true;
            const waitingPeer = isDealStep && deal.iConfirmed;
            const agreedRate = item.dealAmount ?? item.budget;
            const chatHref = `${
              role === "UMKM"
                ? "/dashboard/umkm/chat"
                : "/dashboard/influencer/chat"
            }?collaboration=${item.id}`;
            // Baris penjelasan: hint pemicu kalau saya punya tombol, kalau tidak
            // tetap tulis "giliran siapa" supaya sisi yang menunggu tidak diam.
            const hintText = isDealStep
              ? waitingPeer
                ? `Anda sudah mengonfirmasi ${formatCurrency(
                    item.budget,
                  )}. Deal terkunci setelah ${peerName} ikut mengonfirmasi.`
                : deal.peerConfirmed
                  ? `${peerName} sudah mengonfirmasi ${formatCurrency(
                      item.budget,
                    )}. Klik Konfirmasi Deal untuk mengunci tarif ini.`
                  : actions[0].hint
              : (actions[0]?.hint ?? turn?.text ?? "");
            const HintIcon =
              item.status === "COMPLETED"
                ? CheckCircle2
                : actions.length === 0 || waitingPeer
                  ? Clock
                  : Handshake;
            // Escrow relevan di semua tahap setelah dana dikunci, bukan hanya
            // ESCROW_HELD — sebelumnya banner hilang saat produksi berjalan.
            const escrowHeld = [
              "ESCROW_HELD",
              "IN_PRODUCTION",
              "CONTENT_SUBMITTED",
              "UNDER_REVIEW",
              "REVISION_REQUESTED",
              "APPROVED",
            ].includes(item.status);
            const escrowReleased = item.status === "COMPLETED";

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
              >
                <button
                  onClick={() => setExpanded(open ? null : item.id)}
                  className="w-full text-left p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="relative flex-shrink-0">
                      <div
                        className={`w-12 h-12 rounded-full ${colorForName(
                          peerName,
                        )} flex items-center justify-center text-white text-sm font-bold overflow-hidden`}
                      >
                        {peer?.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={peer.image}
                            alt={peerName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          initialsOf(peerName)
                        )}
                      </div>
                      {item.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                          {item.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{item.title}</p>
                      <p className="text-xs text-zinc-500 truncate">
                        {peerName}
                        {peer?.category ? ` • ${peer.category}` : ""}
                      </p>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        Mulai {formatDate(item.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${status.className}`}
                    >
                      {status.label}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-zinc-500 font-medium">
                      <Wallet className="w-3 h-3" />{" "}
                      {formatCurrency(item.budget)}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-zinc-400 transition-transform ${
                        open ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </button>

                <div className="px-5 pb-4 flex items-center gap-3">
                  <CollaborationProgress
                    role={role}
                    currentIndex={progressIndex}
                  />
                  {stageHint(item.status) && (
                    <span className="text-[11px] font-medium text-zinc-400 whitespace-nowrap">
                      {stageHint(item.status)}
                    </span>
                  )}
                </div>

                {(escrowHeld || escrowReleased) && (
                  <div className="px-5 pb-4">
                    <div
                      className={`flex items-center gap-2 p-3 rounded-xl text-xs ${
                        escrowReleased
                          ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                          : "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400"
                      }`}
                    >
                      {escrowReleased ? (
                        <Banknote className="w-4 h-4 flex-shrink-0" />
                      ) : (
                        <Lock className="w-4 h-4 flex-shrink-0" />
                      )}
                      <span>
                        {escrowReleased
                          ? `Dana escrow ${formatCurrency(
                              item.escrowAmount ?? item.budget,
                            )} telah dicairkan ke influencer.`
                          : item.status === "APPROVED"
                            ? `Dana ${formatCurrency(
                                item.escrowAmount ?? item.budget,
                              )} siap dicairkan ke influencer.`
                            : `Dana ${formatCurrency(
                                item.escrowAmount ?? item.budget,
                              )} terkunci di escrow sampai konten disetujui.`}
                      </span>
                      <span className="ml-auto flex-shrink-0 px-1.5 py-0.5 rounded bg-white/60 dark:bg-black/20 text-[10px] font-semibold uppercase tracking-wide">
                        Simulasi
                      </span>
                    </div>
                  </div>
                )}

                {/*
                 * Baris aksi. Dulu tombol disembunyikan bila aksi punya `href`
                 * (`action.href ? null : <button>`), sehingga di tahap NEGOTIATION
                 * kedua sisi cuma melihat "Buka Chat" tanpa tombol deal sama
                 * sekali. Sekarang `href` kembali menjadi pintasan sekunder:
                 * tombol aksi selalu tampil, "Buka Chat" selalu tersedia.
                 */}
                <div className="border-t border-zinc-100 dark:border-zinc-800 px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 text-xs text-zinc-500 flex items-start gap-2">
                    <HintIcon
                      className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                        item.status === "COMPLETED"
                          ? "text-emerald-500"
                          : actions.length === 0 || waitingPeer
                            ? "text-amber-500"
                            : "text-purple-500"
                      }`}
                    />
                    <span>{hintText}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={chatHref}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
                    >
                      Buka Chat
                      {item.unreadCount > 0 && (
                        <span className="min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                          {item.unreadCount}
                        </span>
                      )}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                    {actions.map((action) =>
                      action.href?.to === "review" ? (
                        <Link
                          key={`${action.key}-link`}
                          href={
                            role === "UMKM"
                              ? `/dashboard/umkm/review-campaign?collaboration=${item.id}`
                              : "/dashboard/influencer/campaigns"
                          }
                          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
                        >
                          {action.href.label}{" "}
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      ) : null,
                    )}
                    {actions.map((action) => {
                      const waiting = action.requiresDeal && waitingPeer;
                      if (waiting) {
                        return (
                          <span
                            key={action.key}
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
                          >
                            <Clock className="w-3.5 h-3.5" /> Menunggu{" "}
                            {peerName}
                          </span>
                        );
                      }
                      return (
                        <button
                          key={action.key}
                          onClick={() => handleAction(item, action)}
                          disabled={busy}
                          className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-white transition-all disabled:opacity-50 ${actionClassName(
                            action.tone,
                          )}`}
                        >
                          {busy ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : action.key === "hold_escrow" ||
                            action.key === "release_escrow" ? (
                            <Lock className="w-3.5 h-3.5" />
                          ) : action.requiresContent ? (
                            <Upload className="w-3.5 h-3.5" />
                          ) : action.requiresDeal ? (
                            <Handshake className="w-3.5 h-3.5" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5" />
                          )}
                          {action.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {open && (
                  <div className="border-t border-zinc-100 dark:border-zinc-800 px-5 py-5">
                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-4">
                      Perjalanan kolaborasi dengan {peerName}
                    </p>
                    <CollaborationTimeline
                      role={role}
                      currentIndex={progressIndex}
                    />

                    {/* Hasil negosiasi: tarif final + catatan + siapa yang sudah
                        mengonfirmasi. Diblok "Bayar & Kunci Escrow" memakai angka
                        ini, jadi deal di chat dan angka escrow tidak bisa beda. */}
                    {item.status !== "PROPOSED" &&
                      item.status !== "CANCELLED" && (
                        <div className="mt-4 p-4 rounded-xl border border-purple-200 dark:border-purple-900/50 bg-purple-50/70 dark:bg-purple-900/10">
                          <div className="flex items-center justify-between gap-3 flex-wrap">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-purple-700 dark:text-purple-300">
                              Kesepakatan
                            </p>
                            <span className="text-sm font-bold text-purple-800 dark:text-purple-200">
                              {formatCurrency(agreedRate)}
                            </span>
                          </div>
                          {item.agreedNote ? (
                            <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-2 whitespace-pre-wrap">
                              {item.agreedNote}
                            </p>
                          ) : (
                            <p className="text-xs text-zinc-500 mt-2">
                              Belum ada catatan kesepakatan. Tulis deliverables
                              (jumlah konten, platform, tenggat) saat
                              mengonfirmasi deal.
                            </p>
                          )}
                          {isDealStep ? (
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              {item.participants.map((p) => {
                                const ok = item.dealConfirmedBy.includes(p.id);
                                return (
                                  <span
                                    key={p.id}
                                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium ${
                                      ok
                                        ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                                    }`}
                                  >
                                    {ok ? (
                                      <Check className="w-3 h-3" />
                                    ) : (
                                      <Clock className="w-3 h-3" />
                                    )}
                                    {participantLabel(p)}
                                    {p.id === meId ? " (Anda)" : ""}
                                  </span>
                                );
                              })}
                              <p className="basis-full text-[11px] text-purple-700/80 dark:text-purple-300/80">
                                Deal terkunci setelah kedua pihak mengonfirmasi
                                tarif yang sama. Mengubah tarif berarti
                                penawaran ulang — konfirmasi kedua pihak
                                direset.
                              </p>
                            </div>
                          ) : item.dealAmount ||
                            item.dealConfirmedBy.length > 1 ? (
                            <p className="text-[11px] text-zinc-500 mt-2">
                              Dikonfirmasi kedua pihak ·{" "}
                              {item.agreedAt ? formatDate(item.agreedAt) : "-"}
                            </p>
                          ) : item.agreedAt ? (
                            // Baris lama sebelum deal butuh dua konfirmasi:
                            // jangan mengklaim keduanya klik kalau datanya tidak ada.
                            <p className="text-[11px] text-zinc-500 mt-2">
                              Deal tercatat {formatDate(item.agreedAt)} ·{" "}
                              {formatCurrency(agreedRate)}
                            </p>
                          ) : null}
                        </div>
                      )}
                    <div className="mt-5 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/60">
                      <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide mb-1">
                        Brief
                      </p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap">
                        {item.brief}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-zinc-800 dark:to-zinc-800 rounded-2xl border border-purple-200 dark:border-zinc-700 p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center flex-shrink-0">
            <Lock className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Bagaimana Escrow Bekerja?</h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mt-1">
              Saat kesepakatan dikonfirmasi, dana campaign dikunci di sistem
              escrow. Dana hanya dicairkan ke influencer setelah konten
              disetujui brand. Untuk versi demo ini, pembayaran disimulasikan
              dengan animasi status berhasil/gagal tanpa gateway pembayaran
              sungguhan.
            </p>
          </div>
        </div>
      </div>

      {payment && (
        <PaymentModal
          open={!!payment}
          mode={payment.mode}
          amount={payment.collab.escrowAmount ?? payment.collab.budget}
          title={payment.collab.title}
          onClose={() => setPayment(null)}
          onSuccess={() => {
            void runAction(payment.collab, payment.action);
          }}
        />
      )}

      <Modal
        open={!!contentFor}
        onClose={() => setContentFor(null)}
        title="Kirim Konten untuk Review"
        description={contentFor?.title}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5">
              Unggah File Konten
            </label>
            <input
              type="file"
              onChange={(e) => setContentFile(e.target.files?.[0] ?? null)}
              className="w-full text-xs file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-kolabora/10 file:text-kolabora"
            />
            <p className="text-[10px] text-zinc-400 mt-1">
              Opsional. Jika unggah file gagal, gunakan tautan konten di bawah.
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5">
              Tautan Konten
            </label>
            <input
              value={contentUrl}
              onChange={(e) => setContentUrl(e.target.value)}
              placeholder="https://drive.google.com/... atau https://instagram.com/p/..."
              className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-kolabora/50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5">Caption</label>
            <textarea
              value={contentCaption}
              onChange={(e) => setContentCaption(e.target.value)}
              rows={2}
              className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-kolabora/50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5">
              Catatan untuk Brand
            </label>
            <textarea
              value={contentNotes}
              onChange={(e) => setContentNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-kolabora/50"
            />
          </div>
          <button
            onClick={() => void submitContent()}
            disabled={submittingContent}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white bg-kolabora hover:bg-kolabora-dark disabled:opacity-50"
          >
            {submittingContent ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            Kirim Konten
          </button>
        </div>
      </Modal>
      <Modal
        open={!!dealFor}
        onClose={() => setDealFor(null)}
        title="Konfirmasi Deal Final"
        description={dealFor?.title}
      >
        {dealFor && (
          <div className="space-y-4">
            <p className="text-xs text-zinc-500 leading-relaxed">
              Deal baru terkunci setelah Anda dan{" "}
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                {participantLabel(
                  dealFor.participants.find((p) => p.id !== meId) ?? {
                    name: dealFor.title,
                    email: "",
                  },
                )}
              </span>{" "}
              mengonfirmasi tarif yang sama. Setelah itu brand mengunci escrow
              sebesar tarif ini.
            </p>

            <div>
              <label className="block text-xs font-medium mb-1.5">
                Tarif Final (Rp)
              </label>
              <input
                type="number"
                min={1000}
                step={1000}
                value={dealBudget}
                onChange={(e) => setDealBudget(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-kolabora/50"
              />
              {rateChanged && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1.5 flex items-start gap-1.5">
                  <Clock className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  Beda dari penawaran sekarang ({formatCurrency(dealFor.budget)}
                  ). Mengirim tarif baru = penawaran ulang: konfirmasi yang
                  sudah ada direset dan kedua pihak harus klik lagi.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5">
                Catatan Kesepakatan
              </label>
              <textarea
                value={dealNote}
                onChange={(e) => setDealNote(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Contoh: 2 reels Instagram + 3 story, tayang minggu ke-2 November, sertakan kode promo."
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-kolabora/50"
              />
              <p className="text-[10px] text-zinc-400 mt-1">
                Tersimpan sebagai isi deal dan ikut tercatat di chat kolaborasi.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {dealFor.participants.map((p) => {
                const ok = dealFor.dealConfirmedBy.includes(p.id);
                return (
                  <span
                    key={p.id}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium ${
                      ok
                        ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                    }`}
                  >
                    {ok ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <Clock className="w-3 h-3" />
                    )}
                    {participantLabel(p)}
                    {p.id === meId ? " (Anda)" : ""}
                  </span>
                );
              })}
            </div>

            <button
              onClick={() => void submitDeal()}
              disabled={submittingDeal || busyId === dealFor.id}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white bg-kolabora hover:bg-kolabora-dark disabled:opacity-50"
            >
              {submittingDeal || busyId === dealFor.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Handshake className="w-4 h-4" />
              )}
              {rateChanged
                ? "Kirim Penawaran Baru"
                : peerAlreadyConfirmed
                  ? "Konfirmasi & Kunci Deal"
                  : "Konfirmasi Deal"}
            </button>
          </div>
        )}
      </Modal>
    </FeaturePage>
  );
}
