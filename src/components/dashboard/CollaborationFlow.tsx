"use client";

import { Fragment } from "react";
import {
  ArrowRight,
  Banknote,
  Check,
  Eye,
  Handshake,
  MessageSquare,
  PenTool,
  Send,
  Sparkles,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { CollaborationRole } from "@/lib/collaborations";

export interface FlowStage {
  key: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

interface StageDefinition {
  key: string;
  icon: LucideIcon;
  label: Record<CollaborationRole, string>;
  description: Record<CollaborationRole, string>;
}

const STAGE_DEFINITIONS: StageDefinition[] = [
  {
    key: "matching",
    icon: Zap,
    label: { umkm: "AI Smart Matching", influencer: "AI Smart Matching" },
    description: {
      umkm: "AI merekomendasikan influencer paling cocok berdasarkan profil, niche, lokasi, audiens, dan performa.",
      influencer: "AI merekomendasikan campaign paling cocok dengan profil, niche, tarif, dan jangkauan Anda.",
    },
  },
  {
    key: "proposal",
    icon: Send,
    label: { umkm: "Ajukan Kolaborasi", influencer: "Terima Tawaran" },
    description: {
      umkm: "Proposal kolaborasi dikirim ke influencer lengkap dengan detail brief dan penawaran.",
      influencer: "Anda mengajukan diri ke campaign atau menerima tawaran kolaborasi dari brand.",
    },
  },
  {
    key: "negotiation",
    icon: MessageSquare,
    label: { umkm: "Diskusi & Negosiasi", influencer: "Diskusi & Negosiasi" },
    description: {
      umkm: "Kedua pihak berdiskusi via Chat untuk menyepakati brief, tarif, dan konsep konten.",
      influencer: "Anda berdiskusi dengan brand via Chat untuk menyepakati brief, tarif, dan konsep konten.",
    },
  },
  {
    key: "agreement",
    icon: Handshake,
    label: { umkm: "Konfirmasi & Escrow", influencer: "Setujui & Escrow" },
    description: {
      umkm: "Deal dikonfirmasi dan dana campaign diamankan di sistem escrow sebagai jaminan.",
      influencer: "Anda menyetujui kesepakatan brand; dana campaign dikunci di sistem escrow.",
    },
  },
  {
    key: "production",
    icon: PenTool,
    label: { umkm: "Produksi Konten", influencer: "Produksi Konten" },
    description: {
      umkm: "Influencer memproduksi konten sesuai brief yang telah disepakati.",
      influencer: "Anda memproduksi konten sesuai brief yang telah disepakati dengan brand.",
    },
  },
  {
    key: "review",
    icon: Eye,
    label: { umkm: "Review & Persetujuan", influencer: "Persetujuan Brand" },
    description: {
      umkm: "Brand meninjau konten di Review Campaign — setujui atau minta revisi.",
      influencer: "Brand meninjau konten Anda di Review Campaign — disetujui atau minta revisi.",
    },
  },
  {
    key: "completion",
    icon: Banknote,
    label: { umkm: "Publikasi & Pembayaran", influencer: "Publikasi & Pembayaran" },
    description: {
      umkm: "Konten tayang, dana escrow dicairkan otomatis, dan performa dianalisis di Analytics.",
      influencer: "Konten tayang, dana escrow dicairkan ke Anda, dan performa dianalisis di Analytics.",
    },
  },
];

export function getCollaborationStages(role: CollaborationRole): FlowStage[] {
  return STAGE_DEFINITIONS.map((s) => ({
    key: s.key,
    icon: s.icon,
    label: s.label[role],
    description: s.description[role],
  }));
}

const STAGE_STATUS: Record<
  CollaborationRole,
  Record<string, { label: string; className: string }>
> = {
  umkm: {
    matching: {
      label: "Menunggu Ajuan",
      className:
        "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
    },
    proposal: {
      label: "Pengajuan Terkirim",
      className:
        "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    },
    negotiation: {
      label: "Negosiasi",
      className:
        "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
    },
    agreement: {
      label: "Dikonfirmasi",
      className:
        "bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400",
    },
    production: {
      label: "Produksi Konten",
      className:
        "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400",
    },
    review: {
      label: "Review Konten",
      className:
        "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
    },
    completion: {
      label: "Selesai",
      className:
        "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
    },
  },
  influencer: {
    matching: {
      label: "Menunggu Tawaran",
      className:
        "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
    },
    proposal: {
      label: "Tawaran Diterima",
      className:
        "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    },
    negotiation: {
      label: "Negosiasi",
      className:
        "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
    },
    agreement: {
      label: "Deal Disetujui",
      className:
        "bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400",
    },
    production: {
      label: "Produksi Konten",
      className:
        "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400",
    },
    review: {
      label: "Persetujuan Brand",
      className:
        "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
    },
    completion: {
      label: "Selesai",
      className:
        "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
    },
  },
};

export function getStageStatus(
  stageIndex: number,
  currentIndex: number,
): "done" | "current" | "pending" {
  if (stageIndex < currentIndex) return "done";
  if (stageIndex === currentIndex) return "current";
  return "pending";
}

export function getStageStatusInfo(
  role: CollaborationRole,
  currentIndex: number,
): { label: string; className: string } {
  const stages = getCollaborationStages(role);
  const key = stages[currentIndex]?.key ?? "completion";
  return STAGE_STATUS[role][key];
}

export function CollaborationStepper({
  role,
  currentIndex,
}: {
  role: CollaborationRole;
  currentIndex?: number;
}) {
  const stages = getCollaborationStages(role);
  const current = currentIndex ?? -1;
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm">Alur Kolaborasi End-to-End</h3>
        <span className="text-xs text-zinc-500 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-kolabora" />
          Satu alur untuk semua kolaborasi
        </span>
      </div>
      <div className="flex items-stretch gap-1.5 overflow-x-auto pb-2">
        {stages.map((s, i) => {
          const active = current === -1 || i <= current;
          return (
            <Fragment key={s.key}>
              <div className="flex flex-col items-center text-center min-w-[104px] px-1">
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                    active
                      ? "bg-gradient-to-br from-kolabora to-influencer text-white shadow-md"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
                  }`}
                >
                  <s.icon className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-medium mt-2 leading-tight text-zinc-700 dark:text-zinc-300">
                  {s.label}
                </span>
                <span className="text-[10px] text-zinc-400 mt-0.5">
                  Step {i + 1}
                </span>
              </div>
              {i < stages.length - 1 && (
                <div className="flex items-center flex-shrink-0">
                  <ArrowRight className="w-4 h-4 text-zinc-300 dark:text-zinc-600" />
                </div>
              )}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}

export function CollaborationProgress({
  role,
  currentIndex,
}: {
  role: CollaborationRole;
  currentIndex: number;
}) {
  const stages = getCollaborationStages(role);
  return (
    <div className="flex items-center">
      {stages.map((s, i) => (
        <div key={s.key} className="flex items-center" title={s.label}>
          <span
            className={`h-2 rounded-full transition-all ${
              i <= currentIndex ? "w-5 bg-kolabora" : "w-2 bg-zinc-200 dark:bg-zinc-700"
            }`}
          />
          {i < stages.length - 1 && (
            <span
              className={`w-1.5 h-0.5 rounded-full ${
                i < currentIndex ? "bg-kolabora" : "bg-zinc-200 dark:bg-zinc-700"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export function CollaborationTimeline({
  role,
  currentIndex,
}: {
  role: CollaborationRole;
  currentIndex: number;
}) {
  const stages = getCollaborationStages(role);
  return (
    <ol className="space-y-4">
      {stages.map((s, i) => {
        const status = getStageStatus(i, currentIndex);
        const isLast = i === stages.length - 1;
        return (
          <li key={s.key} className="relative flex gap-3.5">
            {!isLast && (
              <span
                className={`absolute left-[17px] top-10 bottom-[-16px] w-0.5 rounded-full ${
                  i < currentIndex ? "bg-kolabora" : "bg-zinc-200 dark:bg-zinc-700"
                }`}
              />
            )}
            <div
              className={`relative w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                status === "done"
                  ? "bg-kolabora text-white"
                  : status === "current"
                    ? "bg-kolabora/10 text-kolabora ring-2 ring-kolabora"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
              }`}
            >
              {status === "done" ? (
                <Check className="w-4 h-4" />
              ) : (
                <s.icon className="w-4 h-4" />
              )}
            </div>
            <div className="flex-1 min-w-0 pt-0.5 pb-1">
              <p
                className={`text-sm font-medium flex items-center flex-wrap gap-x-2 gap-y-1 ${
                  status === "current"
                    ? "text-kolabora"
                    : status === "pending"
                      ? "text-zinc-400"
                      : "text-zinc-700 dark:text-zinc-300"
                }`}
              >
                {s.label}
                {status === "current" && (
                  <span className="text-[10px] font-semibold uppercase tracking-wide bg-kolabora/10 text-kolabora px-2 py-0.5 rounded-full">
                    Sedang di tahap ini
                  </span>
                )}
              </p>
              <p
                className={`text-xs mt-0.5 ${
                  status === "pending"
                    ? "text-zinc-300 dark:text-zinc-600"
                    : "text-zinc-500"
                }`}
              >
                {s.description}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
