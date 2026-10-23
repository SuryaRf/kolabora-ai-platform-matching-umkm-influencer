import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock,
  Eye,
  History,
  Megaphone,
  MessageSquare,
  Plus,
  Target,
  TrendingUp,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { colorForName, initialsOf } from "@/lib/avatar";
import { getStatusMeta, statusToStep } from "@/lib/collab";

export default async function UMKMOverview() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const [campaigns, collaborations, applications, pendingReviews] =
    await Promise.all([
      prisma.campaign.findMany({
        where: { ownerId: userId },
        include: { _count: { select: { applications: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.collaboration.findMany({
        where: { participants: { some: { id: userId } } },
        include: {
          participants: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              image: true,
              influencerProfile: { select: { displayName: true, category: true } },
              umkmProfile: { select: { businessName: true, category: true } },
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.application.findMany({
        where: { campaign: { ownerId: userId } },
        include: {
          campaign: { select: { id: true, title: true } },
          applicant: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 4,
      }),
      prisma.contentReview.count({
        where: {
          status: "PENDING",
          collaboration: { participants: { some: { id: userId } } },
        },
      }),
    ]);

  const steps = collaborations.map((c) => statusToStep(c.status));
  const activeCollabs = steps.filter((s) => s >= 3 && s <= 5).length;
  const waiting = steps.filter((s) => s >= 1 && s <= 2).length;
  const completed = steps.filter((s) => s === 6).length;
  const spend = collaborations
    .filter((c) => c.status === "COMPLETED")
    .reduce((acc, c) => acc + (c.escrowAmount ?? c.budget), 0);
  const totalApplicants = campaigns.reduce(
    (acc, c) => acc + c._count.applications,
    0,
  );

  const stats = [
    {
      icon: Megaphone,
      label: "Total Campaign",
      value: String(campaigns.length),
      hint: `${campaigns.filter((c) => c.status === "ACTIVE").length} aktif`,
      color: "bg-kolabora",
    },
    {
      icon: Users,
      label: "Total Pelamar",
      value: String(totalApplicants),
      hint: "dari semua campaign",
      color: "bg-emerald-500",
    },
    {
      icon: Target,
      label: "Kolaborasi Aktif",
      value: String(activeCollabs),
      hint: `${waiting} menunggu respons`,
      color: "bg-amber-500",
    },
    {
      icon: Wallet,
      label: "Total Pembayaran",
      value: formatCurrency(spend),
      hint: `${completed} kolaborasi selesai`,
      color: "bg-purple-500",
    },
  ];

  const quickActions = [
    {
      icon: Plus,
      label: "Buat Campaign",
      href: "/dashboard/umkm/campaigns",
      color: "bg-umkm",
    },
    {
      icon: Zap,
      label: "Smart Matching",
      href: "/dashboard/umkm/smart-matching",
      color: "bg-kolabora",
    },
    {
      icon: Eye,
      label: "Review Konten",
      href: "/dashboard/umkm/review-campaign",
      color: "bg-purple-500",
    },
    {
      icon: MessageSquare,
      label: "Chat",
      href: "/dashboard/umkm/chat",
      color: "bg-emerald-500",
    },
    {
      icon: History,
      label: "Riwayat",
      href: "/dashboard/umkm/history",
      color: "bg-cyan-500",
    },
    {
      icon: BarChart3,
      label: "Analytics",
      href: "/dashboard/umkm/analytics",
      color: "bg-rose-500",
    },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">
            Dashboard UMKM
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Selamat datang, {session.user.name ?? "Pemilik Usaha"}! Kelola
            campaign dan temukan influencer terbaik.
          </p>
        </div>
        <Link
          href="/dashboard/umkm/campaigns"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-umkm hover:bg-umkm-dark"
        >
          <Plus className="w-4 h-4" /> Buat Campaign
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center`}
              >
                <s.icon className="w-5 h-5 text-white" />
              </div>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-xl font-bold truncate">{s.value}</p>
            <p className="text-xs text-zinc-500">{s.label}</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">{s.hint}</p>
          </div>
        ))}
      </div>

      {pendingReviews > 0 && (
        <Link
          href="/dashboard/umkm/review-campaign"
          className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center flex-shrink-0">
            <Eye className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              {pendingReviews} konten menunggu review
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Setujui konten untuk melanjutkan pencairan escrow.
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-amber-600 flex-shrink-0" />
        </Link>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
          <h3 className="font-semibold text-sm mb-4">Akses Cepat</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {quickActions.map((qa) => (
              <Link
                key={qa.href}
                href={qa.href}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all text-center"
              >
                <div
                  className={`w-10 h-10 rounded-xl ${qa.color} flex items-center justify-center`}
                >
                  <qa.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  {qa.label}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm">Kolaborasi Terbaru</h3>
            <Link
              href="/dashboard/umkm/history"
              className="text-xs text-kolabora hover:underline flex items-center gap-1"
            >
              Lihat Semua <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {collaborations.length === 0 ? (
            <p className="text-sm text-zinc-500 py-6 text-center">
              Belum ada kolaborasi. Mulai dari Smart Matching.
            </p>
          ) : (
            <div className="space-y-3">
              {collaborations.slice(0, 4).map((c) => {
                const peer = c.participants.find((p) => p.id !== userId);
                const name =
                  peer?.influencerProfile?.displayName ||
                  peer?.umkmProfile?.businessName ||
                  peer?.name ||
                  c.title;
                const meta = getStatusMeta(c.status, "UMKM");
                const step = statusToStep(c.status);
                return (
                  <Link
                    key={c.id}
                    href="/dashboard/umkm/history"
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <div
                      className={`w-10 h-10 rounded-full ${colorForName(
                        name,
                      )} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}
                    >
                      {initialsOf(name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{c.title}</p>
                      <p className="text-xs text-zinc-500 truncate">
                        {name} • Tahap {step}/6
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0 ${meta.className}`}
                    >
                      {meta.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm">Pelamar Terbaru</h3>
          <Link
            href="/dashboard/umkm/campaigns"
            className="text-xs text-kolabora hover:underline flex items-center gap-1"
          >
            Kelola Campaign <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {applications.length === 0 ? (
          <p className="text-sm text-zinc-500 py-6 text-center">
            Belum ada pelamar. Publikasikan campaign agar influencer bisa
            melamar.
          </p>
        ) : (
          <div className="space-y-3">
            {applications.map((a) => (
              <Link
                key={a.id}
                href={`/dashboard/umkm/campaigns/${a.campaign.id}`}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <div
                  className={`w-9 h-9 rounded-full ${colorForName(
                    a.applicant.name,
                  )} flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0`}
                >
                  {initialsOf(a.applicant.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {a.applicant.name ?? "Influencer"}
                  </p>
                  <p className="text-xs text-zinc-500 truncate">
                    Melamar {a.campaign.title} • {formatDate(a.createdAt)}
                  </p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0 ${
                    a.status === "PENDING"
                      ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                      : a.status === "ACCEPTED"
                        ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                  }`}
                >
                  {a.status === "PENDING"
                    ? "Menunggu"
                    : a.status === "ACCEPTED"
                      ? "Diterima"
                      : a.status === "REJECTED"
                        ? "Ditolak"
                        : "Ditinjau"}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
        <span className="flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Data
          tersinkron dengan database
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" /> Diperbarui otomatis setiap dimuat
        </span>
      </div>
    </div>
  );
}
