import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/ai-route";

export const runtime = "nodejs";

export type CalendarEventType =
  | "briefing"
  | "production"
  | "review"
  | "publish"
  | "payment"
  | "evaluation";

export interface CalendarEvent {
  id: string;
  date: string; // ISO
  title: string;
  type: CalendarEventType;
  collaborationId?: string;
  campaignId?: string;
  done: boolean;
}

const currency = (value: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);

/**
 * GET /api/insights/umkm
 * Statistik asli milik satu UMKM: campaign, pelamar, kolaborasi, uang escrow,
 * plus agenda (kalender) yang diturunkan dari tanggal sungguhan di database —
 * bukan contoh acak.
 */
export async function GET() {
  try {
    return await handle();
  } catch (error) {
    console.error("Insights UMKM error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan. Silakan coba lagi." }, { status: 500 });
  }
}

async function handle() {
  const guard = await requireSession(["UMKM"]);
  if (!guard.ok) return guard.res;
  const userId = guard.userId;

  const [profile, campaigns, collaborations] = await Promise.all([
    prisma.uMKMProfile.findUnique({ where: { userId } }),
    prisma.campaign.findMany({
      where: { ownerId: userId },
      select: {
        id: true,
        title: true,
        category: true,
        status: true,
        budgetMin: true,
        budgetMax: true,
        startDate: true,
        endDate: true,
        createdAt: true,
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 60,
    }),
    prisma.collaboration.findMany({
      where: { participants: { some: { id: userId } } },
      select: {
        id: true,
        title: true,
        status: true,
        budget: true,
        escrowAmount: true,
        escrowStatus: true,
        campaignId: true,
        createdAt: true,
        agreedAt: true,
        startedAt: true,
        submittedAt: true,
        approvedAt: true,
        completedAt: true,
        escrowHeldAt: true,
        escrowReleasedAt: true,
        campaign: { select: { id: true, title: true, endDate: true } },
      },
      take: 60,
    }),
  ]);

  if (!profile) {
    return NextResponse.json(
      { error: "Lengkapi profil UMKM terlebih dahulu.", code: "PROFILE_MISSING" },
      { status: 400 },
    );
  }

  /* ------------------------------------------------------------ kalender */
  const events: CalendarEvent[] = [];
  const push = (
    id: string,
    date: Date | null | undefined,
    title: string,
    type: CalendarEventType,
    done: boolean,
    extra: { collaborationId?: string; campaignId?: string } = {},
  ) => {
    if (!date) return;
    events.push({ id: `${id}-${type}-${events.length}`, date: date.toISOString(), title, type, done, ...extra });
  };

  for (const c of campaigns) {
    push(c.id, c.createdAt, `Campaign dibuat — ${c.title}`, "briefing", true, { campaignId: c.id });
    push(c.id, c.startDate, `Mulai campaign — ${c.title}`, "evaluation", Boolean(c.startDate && c.startDate.getTime() < Date.now()), {
      campaignId: c.id,
    });
    push(c.id, c.endDate, `Batas akhir — ${c.title}`, "review", Boolean(c.endDate && c.endDate.getTime() < Date.now()), {
      campaignId: c.id,
    });
  }

  for (const k of collaborations) {
    const base = { collaborationId: k.id, campaignId: k.campaignId ?? undefined };
    push(k.id, k.createdAt, `Kolaborasi dibuka — ${k.title}`, "briefing", true, base);
    push(k.id, k.agreedAt, `Kesepakatan tercapai — ${k.title}`, "evaluation", true, base);
    push(k.id, k.escrowHeldAt, `Dana ditahan escrow (${currency(k.escrowAmount ?? k.budget)})`, "payment", true, base);
    push(k.id, k.startedAt, `Produksi dimulai — ${k.title}`, "production", true, base);
    push(k.id, k.submittedAt, `Konten dikirim — ${k.title}`, "review", true, base);
    push(k.id, k.approvedAt, `Konten disetujui — ${k.title}`, "publish", true, base);
    push(k.id, k.completedAt ?? k.escrowReleasedAt, `Pembayaran dicairkan — ${k.title}`, "payment", true, base);
    if (k.campaign?.endDate) {
      const upcoming = k.campaign.endDate.getTime() > Date.now();
      push(k.id, k.campaign.endDate, `Deadline konten — ${k.title}`, "review", !upcoming, base);
    }
  }

  events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  /* -------------------------------------------------------- tindakan berikut */
  const actions: { title: string; reason: string; href: string; urgent: boolean }[] = [];
  const now = Date.now();

  for (const k of collaborations) {
    if (k.status === "ESCROW_HELD" && !k.startedAt) {
      actions.push({
        title: `Ingatkan kreator memulai produksi — ${k.title}`,
        reason: "Dana escrow sudah ditahan tetapi belum ada penanda produksi dimulai.",
        href: `/dashboard/umkm/chat?collaboration=${k.id}`,
        urgent: true,
      });
    }
    if (k.status === "CONTENT_SUBMITTED" || k.status === "UNDER_REVIEW") {
      actions.push({
        title: `Tinjau konten — ${k.title}`,
        reason: "Konten sudah dikirim dan menunggu keputusan kamu.",
        href: "/dashboard/umkm/review-campaign",
        urgent: true,
      });
    }
    if (k.status === "APPROVED" && k.escrowStatus === "HELD") {
      actions.push({
        title: `Cairkan pembayaran — ${k.title}`,
        reason: "Konten sudah disetujui; dana masih tertahan di escrow.",
        href: `/dashboard/umkm/history?collaboration=${k.id}`,
        urgent: false,
      });
    }
    if (k.status === "PROPOSED" || k.status === "NEGOTIATION") {
      actions.push({
        title: `Tanggapi penawaran — ${k.title}`,
        reason: "Kesepakatan belum disepakati berdua, sehingga jadwal belum bisa disusun.",
        href: `/dashboard/umkm/chat?collaboration=${k.id}`,
        urgent: false,
      });
    }
  }

  const noApplicants = campaigns.filter((c) => c.status === "ACTIVE" && c._count.applications === 0);
  if (noApplicants.length > 0) {
    actions.push({
      title: `Perbaiki brief ${noApplicants.length} campaign tanpa pelamar`,
      reason: "Campaign aktif tetapi belum ada yang melamar — biasanya budget di bawah tarif pasar atau deliverables belum jelas.",
      href: `/dashboard/umkm/campaigns/${noApplicants[0].id}`,
      urgent: false,
    });
  }

  /* ------------------------------------------------------------- agregat */
  const totalApplications = campaigns.reduce((sum, c) => sum + c._count.applications, 0);
  const pendingApplications = await prisma.application.count({
    where: { campaign: { ownerId: userId }, status: "PENDING" },
  });
  const held = collaborations.filter((k) => k.escrowStatus === "HELD");
  const released = collaborations.filter((k) => k.escrowStatus === "RELEASED");

  const upcoming = events.filter((e) => new Date(e.date).getTime() >= now && !e.done);
  const monthsShown = new Set(upcoming.map((e) => e.date.slice(0, 7)));

  return NextResponse.json({
    business: {
      name: profile.businessName,
      category: profile.category,
      location: profile.location,
    },
    campaigns: {
      total: campaigns.length,
      active: campaigns.filter((c) => c.status === "ACTIVE").length,
      closed: campaigns.filter((c) => c.status === "CLOSED").length,
      completed: campaigns.filter((c) => c.status === "COMPLETED").length,
      draft: campaigns.filter((c) => c.status === "DRAFT").length,
      budgetCommitted: campaigns
        .filter((c) => c.status === "ACTIVE")
        .reduce((sum, c) => sum + c.budgetMax, 0),
    },
    applications: { total: totalApplications, pending: pendingApplications },
    collaborations: {
      total: collaborations.length,
      active: collaborations.filter(
        (k) => !["COMPLETED", "CANCELLED", "DISPUTED"].includes(k.status),
      ).length,
      completed: collaborations.filter((k) => k.status === "COMPLETED").length,
      escrowHeld: held.reduce((sum, k) => sum + (k.escrowAmount ?? k.budget), 0),
      escrowReleased: released.reduce((sum, k) => sum + (k.escrowAmount ?? k.budget), 0),
      heldCount: held.length,
    },
    events,
    upcomingCount: upcoming.length,
    upcomingMonths: [...monthsShown],
    actions: actions.slice(0, 6),
  });
}
