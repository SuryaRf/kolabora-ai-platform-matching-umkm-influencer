/**
 * Bahasa satu sumber untuk kartu lamaran di sisi kreator.
 *
 * Alasannya: sebelumnya lamaran yang ditolak hanya mendapat chip merah "Ditolak"
 * tanpa baris penjelas dan tanpa tombol apa pun, jadi perjalanannya terasa berhenti
 * total (padahal brand sudah memutuskan dan langkah berikutnya jelas). File ini
 * menghitung "apa artinya status ini, giliran siapa, dan apa yang bisa diklik
 * selanjutnya" — murni tampilan, tidak mengubah satu pun aturan transisi.
 *
 * Sengaja tanpa import (sama seperti collab.ts) supaya bisa diuji langsung dari
 * naskah simulasi, tanpa perlu alias "@/..." atau React.
 */

/** Format uang rupiah — identik dengan formatCurrency di lib/utils. */
function idr(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export type ApplicationState =
  | "PENDING"
  | "REVIEWED"
  | "ACCEPTED"
  | "REJECTED"
  | "WITHDRAWN";

/**
 * Status yang masih menunggu keputusan brand. `REVIEWED` diisi oleh PELAMAR
 * (tombol "Tandai sudah ditinjau" di kartunya), jadi bukan keputusan: ia tetap
 * dihitung sebagai "menunggu" di semua angka dan tetap bisa diterima/ditolak.
 * Tanpa daftar ini, menandai lamaran justru membuat brand kehilangan tombolnya.
 */
export const UNDECIDED: readonly ApplicationState[] = ["PENDING", "REVIEWED"];

export function isUndecided(status: string): boolean {
  return (UNDECIDED as readonly string[]).includes(status);
}

type Tone = "waiting" | "seen" | "success" | "danger" | "muted";

const TONE_CLASS: Record<Tone, string> = {
  waiting: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
  seen: "bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400",
  success:
    "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
  danger: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
  muted: "bg-zinc-100 dark:bg-zinc-800 text-zinc-500",
};

const TONE: Record<ApplicationState, Tone> = {
  PENDING: "waiting",
  REVIEWED: "seen",
  ACCEPTED: "success",
  REJECTED: "danger",
  WITHDRAWN: "muted",
};

/**
 * Label chip per status, dibedakan menurut sisi yang melihat: "Ditinjau pelamar"
 * (brand) dan "Sudah ditandai" (kreator) adalah peristiwa yang sama, tapi
 * subjeknya berbeda — dan itu justru inti dari penanda ini.
 */
const LABEL: Record<ApplicationState, { brand: string; kreator: string }> = {
  PENDING: { brand: "Menunggu", kreator: "Menunggu Review" },
  REVIEWED: { brand: "Ditinjau pelamar", kreator: "Sudah ditandai" },
  ACCEPTED: { brand: "Diterima", kreator: "Diterima" },
  REJECTED: { brand: "Ditolak", kreator: "Ditolak" },
  WITHDRAWN: { brand: "Ditarik", kreator: "Ditarik" },
};

/**
 * Satu sumber untuk chip status lamaran. Sebelum ini, label "Ditinjau" muncul
 * lewat cabang fallback di empat halaman — sehingga `WITHDRAWN` ikut terbaca
 * "Ditinjau" dan `REVIEWED` bisa berarti dua hal tergantung halaman.
 */
export function applicationChip(
  status: string,
  side: "brand" | "kreator" = "brand",
): { label: string; className: string } {
  const key = (Object.keys(LABEL) as ApplicationState[]).includes(
    status as ApplicationState,
  )
    ? (status as ApplicationState)
    : "PENDING";
  return { label: LABEL[key][side], className: TONE_CLASS[TONE[key]] };
}

export interface ApplicationLike {
  status: ApplicationState;
  proposedRate: number | null;
  /** Catatan singkat brand saat menolak; boleh kosong. */
  feedback?: string | null;
  campaign: {
    title: string;
    category: string;
    budgetMin: number;
    budgetMax: number;
    status?: string;
  };
  /** Kategori yang tertera di profil kreator, untuk pencocokan kasar. */
  applicantCategory?: string | null;
}

export interface ApplicationAction {
  label: string;
  to: string;
  why: string;
}

export interface ApplicationGuidance {
  /** Apa arti status ini bagi kreator. */
  headline: string;
  /** Siapa yang pegang kendali, memakai bahasa yang sama dengan kartu kolaborasi. */
  turn: string;
  /** Nada warna: menunggu / masih terbuka / sudah selesai. */
  tone: "waiting" | "open" | "closed";
  /** Penyebab yang bisa dibaca dari data lamaran itu sendiri. */
  hints: string[];
  /** Langkah berikutnya yang benar-benar bisa diklik. */
  actions: ApplicationAction[];
}

const DISCOVER: ApplicationAction = {
  label: "Cari Campaign Lain",
  to: "/dashboard/influencer/discover",
  why: "Perluas peluang sambil menunggu keputusan brand.",
};

const SMART_MATCH: ApplicationAction = {
  label: "Campaign Cocok Untuk Anda",
  to: "/dashboard/influencer/smart-matching",
  why: "AI memilihkan campaign yang paling pas dengan kategori dan tarif Anda.",
};

const PROFILE: ApplicationAction = {
  label: "Perbaiki Profil",
  to: "/dashboard/influencer/profile",
  why: "Brand membaca kategori, tarif, dan portofolio sebelum memutuskan.",
};

const RATE_ADVICE: ApplicationAction = {
  label: "Cek Rekomendasi Tarif",
  to: "/dashboard/influencer/rate-recommendation",
  why: "Ketahui angka yang wajar untuk kategori dan jumlah follower Anda.",
};

/** Saran yang diturunkan dari angka lamaran, bukan dari tebakan. */
function rateHints(app: ApplicationLike): string[] {
  const { proposedRate, campaign } = app;
  const range = `${idr(campaign.budgetMin)}–${idr(campaign.budgetMax)}`;
  const out: string[] = [];

  if (proposedRate == null) {
    out.push(
      "Anda tidak mencantumkan tarif. Brand umumnya lebih cepat memilih pelamar " +
        "yang angkanya jelas, jadi tulis tarif di lamaran berikutnya.",
    );
  } else if (proposedRate > campaign.budgetMax) {
    out.push(
      `Tarif yang Anda ajukan (${idr(proposedRate)}) di atas budget campaign ini ` +
        `(${range}). Kalau masih mau kejar brand yang sama, tawarkan angka di dalam rentang itu.`,
    );
  } else if (proposedRate < campaign.budgetMin) {
    out.push(
      `Tarif Anda (${idr(proposedRate)}) justru di bawah rentang budget (${range}). ` +
        "Brand kadang membaca angka terlalu rendah sebagai sinyal kualitas; naikkan di lamaran berikutnya.",
    );
  }

  // Kategori profil dan tarif adalah dua sinyal berbeda: yang satu tidak
  // meniadakan yang lain, jadi keduanya boleh muncul bareng.
  if (app.applicantCategory) {
    const a = app.applicantCategory.trim().toLowerCase();
    const c = campaign.category.trim().toLowerCase();
    if (a && c && a !== c) {
      out.push(
        `Kategori profil Anda "${app.applicantCategory}", campaign ini mencari "${campaign.category}". ` +
          "Prioritaskan campaign yang se-kategori agar lamaran lebih mudah lolos.",
      );
    }
  }

  // Dibatasi tiga baris: kartu harus tetap bisa dibaca sekilas.
  return out.slice(0, 3);
}

export function getApplicationGuidance(
  app: ApplicationLike,
): ApplicationGuidance | null {
  switch (app.status) {
    case "PENDING":
    case "REVIEWED":
      return {
        headline:
          app.status === "PENDING"
            ? "Lamaran terkirim, menunggu keputusan brand"
            : "Sudah Anda tandai sebagai ditinjau — keputusan tetap di brand",
        turn: "Giliran brand: meninjau dan memutuskan",
        tone: "waiting",
        hints: rateHints(app),
        actions: [DISCOVER],
      };
    case "REJECTED": {
      const note = app.feedback?.trim();
      return {
        headline:
          "Lamaran ini belum diterima — bukan penilaian terakhir atas konten Anda",
        turn: "Lamaran ditutup, tidak ada aksi tersisa di sini",
        tone: "closed",
        hints: [
          ...(note ? [`Catatan brand: “${note}”`] : []),
          ...rateHints(app),
        ].slice(0, 3),
        actions: [SMART_MATCH, DISCOVER, PROFILE, RATE_ADVICE],
      };
    }
    case "WITHDRAWN":
      return {
        headline: "Lamaran ditarik",
        turn: "Lamaran ditutup, tidak ada aksi tersisa di sini",
        tone: "closed",
        hints: [],
        actions: [SMART_MATCH, DISCOVER],
      };
    case "ACCEPTED":
      // Kartu sudah punya pintasan "Buka Kolaborasi" dan tahapannya hidup
      // di Riwayat Kolaborasi, jadi tidak perlu dobel bicara.
      return null;
    default:
      return null;
  }
}
