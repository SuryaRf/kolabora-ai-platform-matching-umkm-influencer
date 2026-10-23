import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock,
  Heart,
  History,
  LayoutDashboard,
  MessageSquare,
  PieChart,
  Search,
  Send,
  Sparkles,
  TrendingUp,
  UserCog,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { colorForName, initialsOf } from "@/lib/avatar";
import { getStatusMeta, statusToStep } from "@/lib/collab";

export default async function InfluencerOverview() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const [profile, applications, collaborations] = await Promise.all([
    prisma.influencerProfile.findUnique({ where: { userId } }),
    prisma.application.findMany({
      where: { applicantId: userId },
      include: {
        campaign: {
          select: {
            id: true,
            title: true,
            category: true,
            budgetMin: true,
            budgetMax: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 4,
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
            umkmProfile: { select: { businessName: true, category: true } },
            influencerProfile: { select: { displayName: true } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const steps = collaborations.map((c) => statusToStep(c.status));
  const activeCollabs = steps.filter((s) => s >= 3 && s <= 5).length;
  const pendingApplications = applications.filter(
    (a) => a.status === "PENDING",
  ).length;
  const earnings = collaborations
    .filter((c) => c.status === "COMPLETED")
    .reduce((acc, c) => acc + (c.escrowAmount ?? c.budget), 0);

  const stats = [
    {
      icon: Users,
      label: "Total Followers",
      value: profile
        ? profile.followers >= 1000
          ? `${(profile.followers / 1000).toFixed(1)}K`
          : String(profile.followers)
        : "—",
      hint: profile ? `${profile.engagement}% engagement` : "Lengkapi profil",
      color: "bg-influencer",
    },
    {
      icon: Send,
      label: "Lamaran Menunggu",
      value: String(pendingApplications),
      hint: `${applications.length} lamaran terkirim`,
      color: "bg-amber-500",
    },
    {
      icon: LayoutDashboard,
      label: "Kolaborasi Aktif",
      value: String(activeCollabs),
      hint: `${steps.filter((s) => s === 6).length} selesai`,
      color: "bg-emerald-500",
    },
    {
      icon: Wallet,
      label: "Total Pendapatan",
      value: formatCurrency(earnings),
      hint: "dari escrow yang dicairkan",
      color: "bg-kolabora",
    },
  ];

  const quickActions = [
    {
      icon: Search,
      label: "Cari Campaign",
      href: "/dashboard/influencer/discover",
      color: "bg-influencer",
    },
    {
      icon: Zap,
      label: "Smart Matching",
      href: "/dashboard/influencer/smart-matching",
      color: "bg-kolabora",
    },
    {
      icon: History,
      label: "Riwayat",
      href: "/dashboard/influencer/history",
      color: "bg-cyan-500",
    },
    {
      icon: MessageSquare,
      label: "Chat",
      href: "/dashboard/influencer/chat",
      color: "bg-emerald-500",
    },
    {
      icon: PieChart,
      label: "Portfolio",
      href: "/dashboard/influencer/portfolio",
      color: "bg-purple-500",
    },
    {
      icon: BarChart3,
      label: "Analytics",
      href: "/dashboard/influencer/analytics",
      color: "bg-rose-500",
    },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Influencer</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Pantau performa, kelola campaign, dan temukan peluang kolaborasi
            baru.
          </p>
        </div>
        <Link
          href="/dashboard/influencer/discover"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-influencer hover:bg-influencer-dark"
        >
          <Search className="w-4 h-4" /> Cari Campaign
        </Link>
      </div>

      {!profile && (
        <Link
          href="/dashboard/influencer/profile"
          className="flex items-center gap-3 p-4 rounded-2xl bg-influencer/10 border border-influencer/30 hover:bg-influencer/15 transition-colors"
        >
          <div className="w-9 h-9 rounded-xl bg-influencer flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-influencer">
              Lengkapi profil influencer Anda
            </p>
            <p className="text-xs text-zinc-500">
              Isi niche, lokasi, followers, engagement, dan tarif agar AI Smart
              Matching bekerja optimal.
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-influencer flex-shrink-0" />
        </Link>
      )}

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
              href="/dashboard/influencer/history"
              className="text-xs text-kolabora hover:underline flex items-center gap-1"
            >
              Lihat Semua <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {collaborations.length === 0 ? (
            <p className="text-sm text-zinc-500 py-6 text-center">
              Belum ada kolaborasi. Mulai dari Cari Campaign.
            </p>
          ) : (
            <div className="space-y-3">
              {collaborations.slice(0, 4).map((c) => {
                const brand = c.participants.find((p) => p.role === "UMKM");
                const name =
                  brand?.umkmProfile?.businessName || brand?.name || c.title;
                const meta = getStatusMeta(c.status, "INFLUENCER");
                const step = statusToStep(c.status);
                return (
                  <Link
                    key={c.id}
                    href="/dashboard/influencer/history"
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
          <h3 className="font-semibold text-sm">Lamaran Terbaru</h3>
          <Link
            href="/dashboard/influencer/campaigns"
            className="text-xs text-kolabora hover:underline flex items-center gap-1"
          >
            Campaign Saya <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {applications.length === 0 ? (
          <p className="text-sm text-zinc-500 py-6 text-center">
            Belum ada lamaran. Temukan campaign yang cocok di Cari Campaign.
          </p>
        ) : (
          <div className="space-y-3">
            {applications.map((a) => (
              <Link
                key={a.id}
                href="/dashboard/influencer/campaigns"
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                  <Send className="w-4 h-4 text-zinc-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {a.campaign.title}
                  </p>
                  <p className="text-xs text-zinc-500 truncate">
                    {a.campaign.category} •{" "}
                    {formatCurrency(a.campaign.budgetMin)} -{" "}
                    {formatCurrency(a.campaign.budgetMax)} •{" "}
                    {formatDate(a.createdAt)}
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

      {profile && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Users, label: "Followers", value: profile.followers.toLocaleString("id-ID") },
            { icon: Heart, label: "Engagement", value: `${profile.engagement}%` },
            { icon: Sparkles, label: "Niche", value: profile.category },
            { icon: UserCog, label: "Tarif Mulai", value: profile.rateMin ? formatCurrency(profile.rateMin) : "Nego" },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4"
            >
              <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-1">
                <s.icon className="w-3.5 h-3.5" /> {s.label}
              </div>
              <p className="text-sm font-bold truncate">{s.value}</p>
            </div>
          ))}
        </div>
      )}

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
