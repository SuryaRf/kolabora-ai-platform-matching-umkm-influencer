import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock,
  Heart,
  Send,
  Sparkles,
  Target,
  Users,
  Wallet,
} from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getStatusMeta, statusToStep } from "@/lib/collab";

export default async function InfluencerAnalyticsPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const [profile, applications, collaborations] = await Promise.all([
    prisma.influencerProfile.findUnique({ where: { userId } }),
    prisma.application.findMany({
      where: { applicantId: userId },
      include: {
        campaign: { select: { id: true, title: true, category: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.collaboration.findMany({
      where: { participants: { some: { id: userId } } },
      include: {
        participants: {
          select: {
            id: true,
            role: true,
            name: true,
            umkmProfile: { select: { businessName: true } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const accepted = applications.filter((a) => a.status === "ACCEPTED").length;
  const conversion =
    applications.length > 0
      ? Math.round((accepted / applications.length) * 100)
      : 0;
  const earnings = collaborations
    .filter((c) => c.status === "COMPLETED")
    .reduce((acc, c) => acc + (c.escrowAmount ?? c.budget), 0);
  const pendingEscrow = collaborations
    .filter((c) => c.status === "APPROVED" || c.status === "ESCROW_HELD")
    .reduce((acc, c) => acc + (c.escrowAmount ?? c.budget), 0);
  const completedCount = collaborations.filter(
    (c) => c.status === "COMPLETED",
  ).length;
  const avgValue =
    completedCount > 0 ? Math.round(earnings / completedCount) : 0;

  const statusBuckets = [
    { label: "Lamaran Terkirim", count: applications.length },
    { label: "Lamaran Diterima", count: accepted },
    {
      label: "Sedang Berjalan",
      count: collaborations.filter((c) => {
        const step = statusToStep(c.status);
        return step >= 3 && step <= 5;
      }).length,
    },
    { label: "Selesai", count: completedCount },
  ];
  const maxBucket = Math.max(1, ...statusBuckets.map((b) => b.count));

  const stats = [
    {
      icon: Users,
      label: "Followers",
      value: profile ? profile.followers.toLocaleString("id-ID") : "—",
      hint: profile ? `${profile.engagement}% engagement` : "Lengkapi profil",
    },
    {
      icon: Send,
      label: "Lamaran Terkirim",
      value: String(applications.length),
      hint: `${conversion}% diterima`,
    },
    {
      icon: Wallet,
      label: "Total Pendapatan",
      value: formatCurrency(earnings),
      hint: `${formatCurrency(pendingEscrow)} menunggu cair`,
    },
    {
      icon: Target,
      label: "Rata-rata Nilai",
      value: avgValue ? formatCurrency(avgValue) : "—",
      hint: "per kolaborasi selesai",
    },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-influencer flex items-center justify-center shadow-lg flex-shrink-0">
          <BarChart3 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Campaign Analytics</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Pantau performa lamaran, kolaborasi, dan pendapatan Anda.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <s.icon className="w-4 h-4 text-zinc-400" />
              <span className="text-xs text-zinc-500">{s.label}</span>
            </div>
            <p className="text-xl font-bold truncate">{s.value}</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">{s.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
          <h3 className="font-semibold text-sm mb-4">Funnel Lamaran</h3>
          <div className="space-y-4">
            {statusBuckets.map((b) => (
              <div key={b.label}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-zinc-600 dark:text-zinc-400">
                    {b.label}
                  </span>
                  <span className="font-semibold">{b.count}</span>
                </div>
                <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-influencer"
                    style={{ width: `${(b.count / maxBucket) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          {applications.length === 0 && (
            <Link
              href="/dashboard/influencer/discover"
              className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-influencer"
            >
              Mulai cari campaign <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
          <h3 className="font-semibold text-sm mb-4">Profil & Jangkauan</h3>
          {profile ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-influencer/10 text-influencer flex items-center justify-center font-bold">
                  {profile.displayName.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold">{profile.displayName}</p>
                  <p className="text-xs text-zinc-500">
                    {profile.category}
                    {profile.location ? ` • ${profile.location}` : ""}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60">
                  <p className="text-xs text-zinc-500 flex items-center gap-1">
                    <Users className="w-3 h-3" /> Followers
                  </p>
                  <p className="font-bold">
                    {profile.followers.toLocaleString("id-ID")}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60">
                  <p className="text-xs text-zinc-500 flex items-center gap-1">
                    <Heart className="w-3 h-3" /> Engagement
                  </p>
                  <p className="font-bold">{profile.engagement}%</p>
                </div>
                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60">
                  <p className="text-xs text-zinc-500 flex items-center gap-1">
                    <Wallet className="w-3 h-3" /> Tarif Min
                  </p>
                  <p className="font-bold">
                    {profile.rateMin ? formatCurrency(profile.rateMin) : "Nego"}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60">
                  <p className="text-xs text-zinc-500 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Tarif Maks
                  </p>
                  <p className="font-bold">
                    {profile.rateMax ? formatCurrency(profile.rateMax) : "Nego"}
                  </p>
                </div>
              </div>
              <Link
                href="/dashboard/influencer/profile"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-influencer"
              >
                Perbarui profil <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-zinc-500 mb-4">
                Profil influencer belum lengkap.
              </p>
              <Link
                href="/dashboard/influencer/profile"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-influencer"
              >
                Lengkapi Profil
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800">
          <h3 className="font-semibold text-sm">Riwayat Lamaran</h3>
          <Link
            href="/dashboard/influencer/campaigns"
            className="text-xs text-kolabora hover:underline flex items-center gap-1"
          >
            Lihat Semua <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {applications.length === 0 ? (
          <p className="text-sm text-zinc-500 p-8 text-center">
            Belum ada lamaran.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-zinc-500 border-b border-zinc-100 dark:border-zinc-800">
                  <th className="px-5 py-3 font-medium">Campaign</th>
                  <th className="px-5 py-3 font-medium">Kategori</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((a) => (
                  <tr
                    key={a.id}
                    className="border-b border-zinc-50 dark:border-zinc-800/60 last:border-0"
                  >
                    <td className="px-5 py-3 font-medium">
                      {a.campaign.title}
                    </td>
                    <td className="px-5 py-3 text-zinc-500">
                      {a.campaign.category}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          a.status === "PENDING"
                            ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                            : a.status === "ACCEPTED"
                              ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                              : a.status === "REJECTED"
                                ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
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
                    </td>
                    <td className="px-5 py-3 text-zinc-500">
                      {formatDate(a.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
        <h3 className="font-semibold text-sm mb-4">Kolaborasi Terbaru</h3>
        {collaborations.length === 0 ? (
          <p className="text-sm text-zinc-500 py-6 text-center">
            Belum ada kolaborasi.
          </p>
        ) : (
          <div className="space-y-3">
            {collaborations.slice(0, 6).map((c) => {
              const brand = c.participants.find((p) => p.role === "UMKM");
              const name = brand?.umkmProfile?.businessName || brand?.name || c.title;
              const meta = getStatusMeta(c.status, "INFLUENCER");
              return (
                <Link
                  key={c.id}
                  href="/dashboard/influencer/history"
                  className="flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{c.title}</p>
                    <p className="text-xs text-zinc-500 truncate">
                      {name} • Tahap {statusToStep(c.status)}/6
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

      <div className="flex items-center gap-4 text-xs text-zinc-400 px-1">
        <span className="flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Data dari
          database
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" /> Real-time saat halaman dimuat
        </span>
      </div>
    </div>
  );
}
