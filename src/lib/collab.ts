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
  /** id peserta yang sudah menekan "Konfirmasi Deal" pada tahap NEGOTIATION. */
  dealConfirmedBy: string[];
  /** Tarif final yang terkunci saat deal jadi (AGREED). */
  dealAmount: number | null;
  /** Catatan singkat kesepakatan (deliverables, tenggat, dsb). */
  agreedNote: string | null;
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

/**
 * SATU SUMBER KEBENARAN untuk 7 tahap alur kolaborasi.
 * `CollaborationFlow.tsx` (stepper/progress/timeline) dan kartu riwayat sama-sama
 * membaca daftar ini, jadi jumlah tahap di teks "Tahap x dari 7" tidak bisa lagi
 * berbeda dari kotak yang ditampilkan. Ikon tetap milik komponen.
 *
 * PENTING: indeks array ini == angka `statusToStep()` (0-based). Mengubah urutan
 * di sini berarti menggeser mesin status, jadi jangan menambah/memindah tahap
 * tanpa menyesuaikan STEP_BY_STATUS, isActiveStep, dan filter "selesai".
 */
export interface CollabStage {
  key: string;
  label: Record<Role, string>;
  description: Record<Role, string>;
  /** Kalimat pemicu: aksi apa yang membuat kolaborasi keluar dari tahap ini. */
  trigger: Record<Role, string>;
}

export const COLLAB_STAGES: CollabStage[] = [
  {
    key: "matching",
    label: { UMKM: "AI Smart Matching", INFLUENCER: "AI Smart Matching" },
    description: {
      UMKM: "AI merekomendasikan influencer paling cocok berdasarkan profil, niche, lokasi, audiens, dan performa.",
      INFLUENCER:
        "AI merekomendasikan campaign paling cocok dengan profil, niche, tarif, dan jangkauan Anda.",
    },
    trigger: {
      UMKM: "Pemicu lanjut: temukan kandidat di AI Smart Matching, lalu kirim proposal.",
      INFLUENCER:
        "Pemicu lanjut: temukan campaign di Discover/smart matching, lalu kirim lamaran.",
    },
  },
  {
    key: "proposal",
    label: { UMKM: "Ajukan Kolaborasi", INFLUENCER: "Lamar / Terima Tawaran" },
    description: {
      UMKM: "Proposal kolaborasi dikirim ke influencer lengkap dengan detail brief dan penawaran.",
      INFLUENCER:
        "Anda melamar campaign yang terbuka, atau menerima tawaran langsung dari brand.",
    },
    trigger: {
      UMKM: "Pemicu lanjut: influencer menerima lamaran/undangan Anda.",
      INFLUENCER:
        "Pemicu lanjut: brand menyetujui lamaran Anda, atau Anda menekan Terima Tawaran.",
    },
  },
  {
    key: "negotiation",
    label: { UMKM: "Diskusi & Negosiasi", INFLUENCER: "Diskusi & Negosiasi" },
    description: {
      UMKM: "Kedua pihak berdiskusi via Chat soal brief, tarif, dan konsep konten.",
      INFLUENCER:
        "Anda dan brand berdiskusi via Chat soal brief, tarif, dan konsep konten.",
    },
    trigger: {
      UMKM: "Pemicu lanjut: DEAL dikonfirmasi kedua pihak dengan tarif final yang sama.",
      INFLUENCER:
        "Pemicu lanjut: DEAL dikonfirmasi Anda dan brand dengan tarif final yang sama.",
    },
  },
  {
    key: "agreement",
    label: { UMKM: "Konfirmasi & Escrow", INFLUENCER: "Konfirmasi & Escrow" },
    description: {
      UMKM: "Deal terkunci setelah brand dan kreator sama-sama mengonfirmasi; brand lalu mengamankannya di sistem escrow.",
      INFLUENCER:
        "Deal terkunci setelah Anda dan brand sama-sama mengonfirmasi; brand mengamankan dana di sistem escrow.",
    },
    trigger: {
      UMKM: "Pemicu lanjut: Anda menekan Bayar & Kunci Escrow, lalu kreator menekan Mulai Produksi.",
      INFLUENCER:
        "Pemicu lanjut: brand mengunci escrow, kemudian Anda menekan Mulai Produksi.",
    },
  },
  {
    key: "production",
    label: { UMKM: "Produksi Konten", INFLUENCER: "Produksi Konten" },
    description: {
      UMKM: "Influencer memproduksi konten sesuai brief dan kesepakatan tarif.",
      INFLUENCER:
        "Anda memproduksi konten sesuai brief dan kesepakatan tarif dengan brand.",
    },
    trigger: {
      UMKM: "Pemicu lanjut: influencer mengirim konten untuk direview.",
      INFLUENCER: "Pemicu lanjut: Anda menekan Kirim Konten (URL atau file).",
    },
  },
  {
    key: "review",
    label: { UMKM: "Review & Persetujuan", INFLUENCER: "Persetujuan Brand" },
    description: {
      UMKM: "Brand meninjau konten di Review Campaign — setujui atau minta revisi.",
      INFLUENCER: "Brand meninjau konten Anda — disetujui atau diminta revisi.",
    },
    trigger: {
      UMKM: "Pemicu lanjut: Anda menekan Setujui. Minta Revisi mengembalikan kreator ke tahap produksi.",
      INFLUENCER:
        "Pemicu lanjut: brand menekan Setujui. Minta Revisi mengembalikan Anda ke tahap produksi.",
    },
  },
  {
    key: "completion",
    label: {
      UMKM: "Publikasi & Pembayaran",
      INFLUENCER: "Publikasi & Pembayaran",
    },
    description: {
      UMKM: "Konten tayang, dana escrow dicairkan ke influencer, dan performa dianalisis di Analytics.",
      INFLUENCER:
        "Konten tayang, dana escrow dicairkan ke Anda, dan performa dianalisis di Analytics.",
    },
    trigger: {
      UMKM: "Pemicu selesai: Anda menekan Cairkan Dana setelah konten disetujui.",
      INFLUENCER:
        "Pemicu selesai: brand mencairkan escrow — dana menjadi hak Anda.",
    },
  },
];

export const STAGE_COUNT = COLLAB_STAGES.length;

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

/**
 * Tahap yang dihitung "sedang berjalan".
 *
 * Begitu kolaborasi masuk tahap diskusi (NEGOTIATION) kedua pihak sudah sama
 * sama bergerak, jadi tidak boleh lagi dihitung sebagai "menunggu respons".
 * DEFINISI INI DIPAKAI SEMUA HALAMAN (dashboard influencer, dashboard UMKM,
 * riwayat, analytics, Campaign Saya) supaya angka di kartu yang sama tidak
 * beda-beda. COMPLETED (6) dan CANCELLED (0) sengaja tidak ikut.
 */
export function isActiveStep(step: number): boolean {
  return step >= 2 && step <= 5;
}

/** "Menunggu respons" = baru diajukan/diundang, belum ada diskusi. */
export function isWaitingStep(step: number): boolean {
  return step === 1;
}

/**
 * Teks posisi tahap untuk kartu & daftar.
 * `statusToStep()` mengembalikan INDEKS tahap (0-based) dari COLLAB_STAGES, jadi
 * angka yang dibaca manusia adalah indeks+1 dan totalnya STAGE_COUNT (7), bukan
 * angka lama yang hardcoded "/6".
 * CANCELLED dipetakan ke tahap 0, tapi statusnya sudah ditampilkan oleh badge
 * "Dibatalkan", jadi tidak perlu baris tahap.
 */
export function stageHint(
  status: CollabStatus,
  compact = false,
): string | null {
  const step = statusToStep(status);
  if (step === 0) return null;
  const shown = step + 1;
  return compact
    ? `Tahap ${shown}/${STAGE_COUNT}`
    : `Tahap ${shown} dari ${STAGE_COUNT}`;
}

/**
 * Posisi timeline untuk kartu. CANCELLED memakai -1 supaya seluruh kotak abu
 * (bukan justru menandai tahap pertama sebagai "sedang berjalan").
 */
export function stageIndexFor(status: CollabStatus): number {
  return status === "CANCELLED" ? -1 : statusToStep(status);
}

/** Nama sisi yang tampil di UI, netran terhadap peran. */
export function sideName(role: Role): string {
  return role === "UMKM" ? "brand" : "kreator";
}

export interface DealState {
  /** Jumlah peserta yang sudah menekan "Konfirmasi Deal". */
  confirmedCount: number;
  totalParticipants: number;
  iConfirmed: boolean;
  peerConfirmed: boolean;
  /** Pihak lain belum ikut mengonfirmasi. */
  waitingForPeer: boolean;
  /** Semua sudah konfirmasi — deal akan/berstatus AGREED. */
  readyToClose: boolean;
}

/**
 * Status konfirmasi dua sisi dari data kolaborasi. Dipakai untuk mengganti label
 * tombol dan menulis baris "Giliran: …" supaya user tidak mengira kliknya
 * langsung menyelesaikan deal.
 */
export function getDealState(
  item: Pick<CollabDTO, "status" | "dealConfirmedBy" | "participants">,
  meId: string,
): DealState {
  const confirmed = item.dealConfirmedBy ?? [];
  const total = item.participants.length || 2;
  const confirmedCount = item.participants.filter((p) =>
    confirmed.includes(p.id),
  ).length;
  const iConfirmed = confirmed.includes(meId);
  return {
    confirmedCount,
    totalParticipants: total,
    iConfirmed,
    peerConfirmed: confirmedCount > (iConfirmed ? 1 : 0),
    waitingForPeer: item.status === "NEGOTIATION" && iConfirmed,
    readyToClose: item.status === "NEGOTIATION" && confirmedCount >= total,
  };
}

export interface TurnInfo {
  /** Pihak yang memegang kendali pada tahap ini. */
  owner: Role | "SELESAI" | "BOTH";
  itIsMyTurn: boolean;
  /** Baris pendek: "Giliran brand: bayar & kunci escrow". */
  text: string;
}

const TURN: Record<
  CollabStatus,
  { owner: Role | "SELESAI" | "BOTH"; what: string }
> = {
  PROPOSED: { owner: "INFLUENCER", what: "menanggapi tawaran brand" },
  // Kedua pihak punya tombol "Konfirmasi Deal" di tahap ini.
  NEGOTIATION: { owner: "BOTH", what: "menyepakati tarif final" },
  AGREED: { owner: "UMKM", what: "bayar & kunci escrow" },
  ESCROW_HELD: { owner: "INFLUENCER", what: "klik Mulai Produksi" },
  IN_PRODUCTION: { owner: "INFLUENCER", what: "kirim konten untuk direview" },
  CONTENT_SUBMITTED: {
    owner: "UMKM",
    what: "review konten di Review Campaign",
  },
  UNDER_REVIEW: { owner: "UMKM", what: "menyelesaikan review konten" },
  REVISION_REQUESTED: {
    owner: "INFLUENCER",
    what: "perbaiki lalu kirim ulang konten",
  },
  APPROVED: { owner: "UMKM", what: "cairkan dana escrow" },
  COMPLETED: {
    owner: "SELESAI",
    what: "Kolaborasi selesai — escrow sudah dicairkan",
  },
  CANCELLED: { owner: "SELESAI", what: "Kolaborasi dibatalkan" },
  DISPUTED: { owner: "SELESAI", what: "Menunggu penanganan admin" },
};

/**
 * "Giliran siapa + ngapain" — dipakai saat kartu tidak punya tombol aksi, supaya
 * sisi yang sedang menunggu tetap tahu pemicu berikutnya (bukan hanya diam).
 * Mengembalikan null bila tahap ini sudah memberi saya tombol, atau bila kedua
 * pihak memang sama-sama menunggu (deal dua konfirmasi).
 */
export function getTurnInfo(
  status: CollabStatus,
  role: Role,
  actions: CollabAction[],
): TurnInfo | null {
  const turn = TURN[status];
  if (!turn || turn.owner === "BOTH") return null;
  if (turn.owner === role && actions.length > 0) return null;
  if (turn.owner === "SELESAI") {
    return { owner: turn.owner, itIsMyTurn: false, text: turn.what };
  }
  return {
    owner: turn.owner,
    itIsMyTurn: turn.owner === role,
    text:
      turn.owner === role
        ? `Giliran Anda: ${turn.what}`
        : `Giliran ${sideName(turn.owner)}: ${turn.what}`,
  };
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

export type ActionTone =
  "primary" | "success" | "warning" | "danger" | "escrow";

export interface CollabAction {
  key: string;
  label: string;
  hint: string;
  tone: ActionTone;
  /** Payment simulation to run before confirming the action. */
  payment?: "hold" | "release";
  /** Ask the influencer to attach content when running this action. */
  requiresContent?: boolean;
  /** Ask for final rate + note (deal dua konfirmasi) before running. */
  requiresDeal?: boolean;
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

/**
 * Tombol yang bisa ditekan pihak ini pada tahap ini.
 * `hint` ditulis sebagai PEMICU (aksi apa yang menggerakkan tahap) + apa
 * berikutnya — bukan kalimat yang membaca seolah sesuatu sudah selesai.
 * Daftar lengkap status -> giliran ada di TURN/getTurnInfo.
 */
export function getCollabActions(
  status: CollabStatus,
  role: Role,
): CollabAction[] {
  if (role === "UMKM") {
    switch (status) {
      case "NEGOTIATION":
        return [
          {
            key: "confirm_deal",
            label: "Konfirmasi Deal",
            hint: "Kalau brief dan tarif di chat sudah cocok, klik untuk mengonfirmasi deal dengan tarif final. Deal terkunci setelah kreator ikut konfirmasi.",
            tone: "primary",
            requiresDeal: true,
            href: { label: "Buka Chat", to: "chat" },
          },
        ];
      case "AGREED":
        return [
          {
            key: "hold_escrow",
            label: "Bayar & Kunci Escrow",
            hint: "Deal sudah final. Kunci dana escrow sesuai tarif kesepakatan — setelah ini kreator bisa mulai produksi.",
            tone: "escrow",
            payment: "hold",
          },
        ];
      // UNDER_REVIEW = brand sedang menimbang; tanpa kasus ini tahap itu jadi
      // jalan buntu (tidak ada tombol di sisi mana pun).
      case "CONTENT_SUBMITTED":
      case "UNDER_REVIEW":
        return [
          {
            key: "open_review",
            label: "Review Konten",
            hint: "Konten sudah dikirim. Buka Review Campaign lalu tekan Setujui (lanjut ke pencairan) atau Minta Revisi.",
            tone: "primary",
            href: { label: "Buka Review", to: "review" },
          },
        ];
      case "APPROVED":
        return [
          {
            key: "release_escrow",
            label: "Cairkan Dana",
            hint: "Konten disetujui. Cairkan escrow untuk menutup kolaborasi.",
            tone: "success",
            payment: "release",
          },
        ];
      case "PROPOSED":
        return [
          {
            key: "cancel",
            label: "Batalkan",
            hint: "Kreator belum menanggapi. Tekan Batalkan untuk menarik tawaran ini.",
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
          hint: "Klik Terima Tawaran untuk masuk ke diskusi via Chat dengan brand.",
          tone: "primary",
          href: { label: "Buka Chat", to: "chat" },
        },
      ];
    case "NEGOTIATION":
      return [
        {
          key: "confirm_deal",
          label: "Konfirmasi Deal",
          hint: "Kalau brief dan tarif di chat sudah cocok, klik untuk mengonfirmasi deal dengan tarif final. Deal terkunci setelah brand ikut konfirmasi.",
          tone: "primary",
          requiresDeal: true,
          href: { label: "Buka Chat", to: "chat" },
        },
      ];
    case "ESCROW_HELD":
      return [
        {
          key: "start_production",
          label: "Mulai Produksi",
          hint: "Dana escrow sudah terkunci. Klik Mulai Produksi, lalu kirim kontennya untuk direview.",
          tone: "primary",
        },
      ];
    case "IN_PRODUCTION":
    case "REVISION_REQUESTED":
      return [
        {
          key: "submit_content",
          label: "Kirim Konten",
          hint: "Unggah atau tautkan konten final agar brand bisa menyetujui dan mencairkan dana.",
          tone: "primary",
          requiresContent: true,
        },
      ];
    default:
      return [];
  }
}
