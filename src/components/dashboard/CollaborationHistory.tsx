"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  CheckCircle2,
  ChevronDown,
  Clock,
  Handshake,
  History,
  LayoutDashboard,
  Lock,
  PenTool,
  RotateCcw,
  Send,
  Sparkles,
  Wallet,
} from "lucide-react";
import FeaturePage from "@/components/dashboard/FeaturePage";
import {
  CollaborationProgress,
  CollaborationStepper,
  CollaborationTimeline,
  getStageStatusInfo,
} from "@/components/dashboard/CollaborationFlow";
import { type CollaborationRole, useCollaborations } from "@/lib/collaborations";

type FilterKey = "semua" | "berjalan" | "menunggu" | "selesai";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "semua", label: "Semua" },
  { key: "berjalan", label: "Sedang Berjalan" },
  { key: "menunggu", label: "Menunggu Respons" },
  { key: "selesai", label: "Selesai" },
];

const ROLE_LINKS: Record<CollaborationRole, { chat: string; review: string }> = {
  umkm: { chat: "/dashboard/umkm/chat", review: "/dashboard/umkm/review-campaign" },
  influencer: { chat: "/dashboard/influencer/chat", review: "/dashboard/influencer/campaigns" },
};

const STAGE_ACTIONS: Record<
  CollaborationRole,
  Partial<
    Record<
      number,
      {
        label: string;
        hint: string;
        icon: typeof Handshake;
        btn: string;
        secondary?: { label: string; hrefKey: "chat" | "review" };
      }
    >
  >
> = {
  umkm: {
    2: {
      label: "Konfirmasi Kesepakatan",
      hint: "Tarif, brief, dan konsep konten sudah disepakati.",
      icon: Handshake,
      btn: "bg-kolabora hover:bg-kolabora-dark",
      secondary: { label: "Buka Chat", hrefKey: "chat" },
    },
    3: {
      label: "Konfirmasi & Kunci Escrow",
      hint: "Dana ditahan otomatis di sistem escrow sampai konten disetujui.",
      icon: Lock,
      btn: "bg-purple-600 hover:bg-purple-700",
    },
    4: {
      label: "Tandai Konten Selesai",
      hint: "Konten influencer selesai diproduksi dan siap direview.",
      icon: PenTool,
      btn: "bg-blue-600 hover:bg-blue-700",
    },
    5: {
      label: "Setujui & Selesaikan",
      hint: "Setelah disetujui, dana escrow otomatis dicairkan ke influencer.",
      icon: CheckCircle2,
      btn: "bg-emerald-600 hover:bg-emerald-700",
      secondary: { label: "Buka Review", hrefKey: "review" },
    },
  },
  influencer: {
    2: {
      label: "Setujui Kesepakatan",
      hint: "Setujui penawaran brand untuk melanjutkan ke tahap berikutnya.",
      icon: Handshake,
      btn: "bg-kolabora hover:bg-kolabora-dark",
      secondary: { label: "Buka Chat", hrefKey: "chat" },
    },
    3: {
      label: "Setujui & Kunci Escrow",
      hint: "Anda menyetujui kesepakatan — dana brand dikunci di escrow.",
      icon: Lock,
      btn: "bg-purple-600 hover:bg-purple-700",
    },
    4: {
      label: "Tandai Konten Siap",
      hint: "Konten Anda selesai diproduksi dan siap direview brand.",
      icon: PenTool,
      btn: "bg-blue-600 hover:bg-blue-700",
    },
    5: {
      label: "Konfirmasi Konten Tayang",
      hint: "Setelah disetujui brand, tandai konten sudah tayang untuk memicu pembayaran.",
      icon: CheckCircle2,
      btn: "bg-emerald-600 hover:bg-emerald-700",
      secondary: { label: "Lihat Status", hrefKey: "review" },
    },
  },
};

function inStageRange(stageIndex: number, filter: FilterKey) {
  switch (filter) {
    case "berjalan":
      return stageIndex >= 3 && stageIndex <= 5;
    case "menunggu":
      return stageIndex <= 2;
    case "selesai":
      return stageIndex === 6;
    default:
      return true;
  }
}

export default function CollaborationHistory({ role }: { role: CollaborationRole }) {
  const { items, advanceStage, resetAll } = useCollaborations(role);
  const [filter, setFilter] = useState<FilterKey>("semua");
  const [expanded, setExpanded] = useState<string | null>(items[0]?.id ?? null);

  const visible = items.filter((item) => inStageRange(item.stageIndex, filter));

  const stats = [
    { icon: LayoutDashboard, label: "Total Kolaborasi", value: items.length, color: "bg-kolabora" },
    { icon: Clock, label: "Sedang Berjalan", value: items.filter((i) => i.stageIndex >= 3 && i.stageIndex <= 5).length, color: "bg-amber-500" },
    { icon: Send, label: "Menunggu Respons", value: items.filter((i) => i.stageIndex <= 2).length, color: "bg-blue-500" },
    { icon: CheckCircle2, label: "Selesai", value: items.filter((i) => i.stageIndex === 6).length, color: "bg-emerald-500" },
  ];

  return (
    <FeaturePage
      title="Riwayat Kolaborasi"
      description={
        role === "umkm"
          ? "Linimasa lengkap setiap kolaborasi — mulai dari rekomendasi AI Smart Matching, pengajuan, negosiasi, hingga publikasi dan pembayaran."
          : "Linimasa lengkap setiap kolaborasi Anda — mulai dari tawaran diterima di AI Smart Matching, negosiasi, hingga publikasi dan pembayaran."
      }
      icon={History}
      gradient="bg-kolabora"
    >
      <CollaborationStepper role={role} />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-xs text-zinc-500">
          Data tersimpan sementara di perangkat Anda — klik aksi di tiap kolaborasi
          untuk melanjutkan ke tahap berikutnya.
        </p>
        <button
          onClick={resetAll}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-300 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset Demo
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-lg ${s.color} flex items-center justify-center`}>
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

      {visible.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-10 text-center text-sm text-zinc-500">
          Belum ada kolaborasi pada kategori ini.
        </div>
      ) : (
        <div className="space-y-4">
          {visible.map((item) => {
            const status = getStageStatusInfo(role, item.stageIndex);
            const open = expanded === item.id;
            const action = STAGE_ACTIONS[role][item.stageIndex];
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
                    <div
                      className={`w-12 h-12 rounded-full ${item.color} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}
                    >
                      {item.avatar}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold truncate flex items-center gap-2">
                        {item.name}
                        {item.source === "user" && (
                          <span className="text-[10px] font-bold uppercase tracking-wide bg-kolabora/10 text-kolabora px-2 py-0.5 rounded-full">
                            Baru
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-zinc-500 truncate">{item.subtitle}</p>
                      <p className="text-[11px] text-zinc-400 mt-0.5">Diajukan {item.submittedAt}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-kolabora/10 text-kolabora">
                      <Sparkles className="w-3 h-3" /> {item.matchScore}% cocok
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${status.className}`}>
                      {status.label}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-zinc-500 font-medium">
                      <Wallet className="w-3 h-3" /> {item.budget}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`} />
                  </div>
                </button>

                <div className="px-5 pb-4">
                  <CollaborationProgress role={role} currentIndex={item.stageIndex} />
                </div>

                {action && (
                  <div className="border-t border-zinc-100 dark:border-zinc-800 px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 text-xs text-zinc-500 flex items-center gap-2">
                      <action.icon className="w-4 h-4 text-purple-500 flex-shrink-0" />
                      <span>{action.hint}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {action.secondary && (
                        <Link
                          href={ROLE_LINKS[role][action.secondary.hrefKey]}
                          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
                        >
                          {action.secondary.label} <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      )}
                      <button
                        onClick={() => advanceStage(item.id)}
                        className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-white transition-all ${action.btn}`}
                      >
                        <action.icon className="w-3.5 h-3.5" /> {action.label}
                      </button>
                    </div>
                  </div>
                )}

                {item.stageIndex === 6 && (
                  <div className="border-t border-zinc-100 dark:border-zinc-800 px-5 py-4">
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-sm">
                      <Banknote className="w-5 h-5 flex-shrink-0" />
                      <span>
                        Kolaborasi dengan <strong>{item.name}</strong> selesai — dana escrow{" "}
                        <strong>{item.budget}</strong>{" "}
                        {role === "umkm"
                          ? "telah dicairkan ke influencer."
                          : "telah dicairkan ke Anda."}
                      </span>
                    </div>
                  </div>
                )}

                {open && (
                  <div className="border-t border-zinc-100 dark:border-zinc-800 px-5 py-5">
                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-4">
                      Perjalanan kolaborasi dengan {item.name}
                    </p>
                    <CollaborationTimeline role={role} currentIndex={item.stageIndex} />
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
              Saat kesepakatan dikonfirmasi, dana campaign dikunci otomatis di sistem escrow.
              Dana hanya dicairkan ke influencer setelah konten disetujui kedua belah pihak —
              pembayaran aman, transparan, dan mengurangi risiko wanprestasi.
            </p>
          </div>
        </div>
      </div>
    </FeaturePage>
  );
}
