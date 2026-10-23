export type Role = "UMKM" | "INFLUENCER";

export type CollabStatus =
  | "PROPOSED"
  | "NEGOTIATION"
  | "AGREED"
  | "ESCROW_HELD"
  | "IN_PRODUCTION"
  | "CONTENT_SUBMITTED"
  | "UNDER_REVIEW"
  | "REVISION_REQUESTED"
  | "APPROVED"
  | "COMPLETED"
  | "CANCELLED"
  | "DISPUTED";

export interface CollabParticipant {
  id: string;
  name: string | null;
  email: string;
  role: Role | null;
  image: string | null;
  businessName?: string | null;
  displayName?: string | null;
  category?: string | null;
  location?: string | null;
}

export interface LastMessage {
  content: string;
  createdAt: string;
  senderId: string;
}

export interface CollabDTO {
  id: string;
  title: string;
  brief: string;
  budget: number;
  status: CollabStatus;
  escrowStatus: string | null;
  escrowAmount: number | null;
  campaign: { id: string; title: string } | null;
  participants: CollabParticipant[];
  unreadCount: number;
  lastMessage: LastMessage | null;
  createdAt: string;
  updatedAt: string;
  agreedAt: string | null;
  startedAt: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
  completedAt: string | null;
}

const STEP_BY_STATUS: Record<CollabStatus, number> = {
  PROPOSED: 1,
  NEGOTIATION: 2,
  AGREED: 3,
  ESCROW_HELD: 3,
  IN_PRODUCTION: 4,
  CONTENT_SUBMITTED: 5,
  UNDER_REVIEW: 5,
  REVISION_REQUESTED: 5,
  APPROVED: 5,
  COMPLETED: 6,
  CANCELLED: 0,
  DISPUTED: 5,
};

export function statusToStep(status: CollabStatus): number {
  return STEP_BY_STATUS[status] ?? 0;
}

const STATUS_META: Record<
  CollabStatus,
  { label: Record<Role, string>; className: string }
> = {
  PROPOSED: {
    label: { UMKM: "Menunggu Respons", INFLUENCER: "Tawaran Baru" },
    className:
      "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
  },
  NEGOTIATION: {
    label: { UMKM: "Negosiasi", INFLUENCER: "Negosiasi" },
    className:
      "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
  },
  AGREED: {
    label: { UMKM: "Deal Disetujui", INFLUENCER: "Deal Disetujui" },
    className: "bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400",
  },
  ESCROW_HELD: {
    label: { UMKM: "Dana di Escrow", INFLUENCER: "Dana di Escrow" },
    className:
      "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
  },
  IN_PRODUCTION: {
    label: { UMKM: "Produksi Konten", INFLUENCER: "Produksi Konten" },
    className:
      "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400",
  },
  CONTENT_SUBMITTED: {
    label: { UMKM: "Perlu Review", INFLUENCER: "Menunggu Review" },
    className:
      "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
  },
  UNDER_REVIEW: {
    label: { UMKM: "Sedang Direview", INFLUENCER: "Sedang Direview" },
    className:
      "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
  },
  REVISION_REQUESTED: {
    label: { UMKM: "Revisi Diminta", INFLUENCER: "Perlu Revisi" },
    className: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
  },
  APPROVED: {
    label: { UMKM: "Disetujui", INFLUENCER: "Disetujui" },
    className:
      "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
  },
  COMPLETED: {
    label: { UMKM: "Selesai", INFLUENCER: "Selesai" },
    className: "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400",
  },
  CANCELLED: {
    label: { UMKM: "Dibatalkan", INFLUENCER: "Dibatalkan" },
    className: "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400",
  },
  DISPUTED: {
    label: { UMKM: "Sengketa", INFLUENCER: "Sengketa" },
    className: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
  },
};

export function getStatusMeta(status: CollabStatus, role: Role) {
  const meta = STATUS_META[status] ?? STATUS_META.PROPOSED;
  return { label: meta.label[role], className: meta.className };
}

export type ActionTone = "primary" | "success" | "warning" | "danger" | "escrow";

export interface CollabAction {
  key: string;
  label: string;
  hint: string;
  tone: ActionTone;
  /** Payment simulation to run before confirming the action. */
  payment?: "hold" | "release";
  /** Ask the influencer to attach content when running this action. */
  requiresContent?: boolean;
  /** Secondary deep link. */
  href?: { label: string; to: "chat" | "review" };
}

const TONES: Record<ActionTone, string> = {
  primary: "bg-kolabora hover:bg-kolabora-dark",
  success: "bg-emerald-600 hover:bg-emerald-700",
  warning: "bg-amber-600 hover:bg-amber-700",
  danger: "bg-red-600 hover:bg-red-700",
  escrow: "bg-purple-600 hover:bg-purple-700",
};

export function actionClassName(tone: ActionTone) {
  return TONES[tone];
}

export function getCollabActions(
  status: CollabStatus,
  role: Role,
): CollabAction[] {
  if (role === "UMKM") {
    switch (status) {
      case "NEGOTIATION":
        return [
          {
            key: "agree",
            label: "Sepakati Deal",
            hint: "Brief, tarif, dan konsep konten sudah disepakati.",
            tone: "primary",
            href: { label: "Buka Chat", to: "chat" },
          },
        ];
      case "AGREED":
        return [
          {
            key: "hold_escrow",
            label: "Bayar & Kunci Escrow",
            hint: "Dana campaign ditahan di escrow sampai konten disetujui.",
            tone: "escrow",
            payment: "hold",
          },
        ];
      case "CONTENT_SUBMITTED":
        return [
          {
            key: "open_review",
            label: "Review Konten",
            hint: "Konten sudah dikirim influencer dan siap ditinjau.",
            tone: "primary",
            href: { label: "Buka Review", to: "review" },
          },
        ];
      case "APPROVED":
        return [
          {
            key: "release_escrow",
            label: "Cairkan Dana",
            hint: "Konten disetujui — cairkan dana escrow ke influencer.",
            tone: "success",
            payment: "release",
          },
        ];
      case "PROPOSED":
        return [
          {
            key: "cancel",
            label: "Batalkan",
            hint: "Tawaran belum direspons influencer.",
            tone: "danger",
          },
        ];
      default:
        return [];
    }
  }

  switch (status) {
    case "PROPOSED":
      return [
        {
          key: "accept",
          label: "Terima Tawaran",
          hint: "Terima tawaran brand untuk mulai berdiskusi.",
          tone: "primary",
          href: { label: "Buka Chat", to: "chat" },
        },
      ];
    case "NEGOTIATION":
      return [
        {
          key: "agree",
          label: "Setujui Deal",
          hint: "Setujui brief dan tarif yang disepakati.",
          tone: "primary",
          href: { label: "Buka Chat", to: "chat" },
        },
      ];
    case "ESCROW_HELD":
      return [
        {
          key: "start_production",
          label: "Mulai Produksi",
          hint: "Dana sudah aman di escrow. Mulai produksi konten.",
          tone: "primary",
        },
      ];
    case "IN_PRODUCTION":
    case "REVISION_REQUESTED":
      return [
        {
          key: "submit_content",
          label: "Kirim Konten",
          hint: "Unggah konten final atau tautan konten untuk direview brand.",
          tone: "primary",
          requiresContent: true,
        },
      ];
    default:
      return [];
  }
}
