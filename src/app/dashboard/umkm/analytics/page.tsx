import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock,
  Eye,
  Send,
  Target,
  Wallet,
} from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getStatusMeta, statusToStep } from "@/lib/collab";

export default async function UMKMAnalyticsPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const [campaigns, applications, collaborations] = await Promise.all([
    prisma.campaign.findMany({
      where: { ownerId: userId },
      include: { _count: { select: { applications: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.application.findMany({
      where: { campaign: { ownerId: userId } },
      include: {
        campaign: { select: { id: true, title: true, category: true } },
        applicant: {
          select: {
            id: true,
            name: true,
            influencerProfile: {
              select: { displayName: true, followers: true, category: true },
            },
          },
        },
      },
    }),
    prisma.collaboration.findMany({
      where: { participants: { some: { id: userId } } },
      include: {
        participants: {
          select: {
            id: true,
            role: true,
            umkmProfile: { select: { businessName: true } },
            influencerProfile: { select: { displayName: true } },
            name: true,
          },
        },
      },
    }),
  ]);

  const accepted = applications.filter((a) => a.status === "ACCEPTED").length;
  const conversion =
    applications.length > 0
      ? Math.round((accepted / applications.length) * 100)
      : 0;
  const spend = collaborations
    .filter((c) => c.status === "COMPLETED")
    .reduce((acc, c) => acc + (c.escrowAmount ?? c.budget), 0);
  const activeSpend = collaborations
    .filter((c) => c.status === "ESCROW_HELD" || c.status === "IN_PRODUCTION")
    .reduce((acc, c) => acc + (c.escrowAmount ?? c.budget), 0);

  const statusBuckets = [
    { label: "Menunggu Respons", keys: ["PROPOSED", "NEGOTIATION"] },
    { label: "Escrow & Produksi", keys: ["AGREED", "ESCROW_HELD", "IN_PRODUCTION"] },
    {
      label: "Review Konten",
      keys: ["CONTENT_SUBMITTED", "UNDER_REVIEW", "REVISION_REQUESTED"],
    },
    { label: "Disetujui & Selesai", keys: ["APPROVED", "COMPLETED"] },
  ].map((bucket) => ({
    ...bucket,
    count: collaborations.filter((c) => bucket.keys.includes(c.status)).length,
  }));
  const maxBucket = Math.max(1, ...statusBuckets.map((b) => b.count));

  const influencerStats = new Map<
    string,
    { name: string; applications: number; completed: number; followers: number }
  >();
  for (const app of applications) {
    const id = app.applicant.id;
    const current = influencerStats.get(id) ?? {
      name:
        app.applicant.influencerProfile?.displayName ||
        app.applicant.name ||
        "Influencer",
      applications: 0,
      completed: 0,
      followers: app.applicant.influencerProfile?.followers ?? 0,
    };
    current.applications += 1;
    influencerStats.set(id, current);
  }
  for (const collab of collaborations) {
    if (collab.status !== "COMPLETED") continue;
    const peer = collab.participants.find((p) => p.role === "INFLUENCER");
    if (!peer) continue;
    const current = influencerStats.get(peer.id);
    if (current) current.completed += 1;
  }

  const stats = [
    {
      icon: BarChart3,
      label: "Total Campaign",
      value: String(campaigns.length),
      hint: `${campaigns.filter((c) => c.status === "ACTIVE").length} aktif`,
    },
    {
      icon: Send,
      label: "Total Lamaran",
      value: String(applications.length),
      hint: `${accepted} diterima`,
    },
    {
      icon: Target,
      label: "Conversion Rate",
      value: `${conversion}%`,
      hint: "lamaran menjadi kolaborasi",
    },
    {
      icon: Wallet,
      label: "Pembayaran Selesai",
      value: formatCurrency(spend),
      hint: `${formatCurrency(activeSpend)} di escrow`,
    },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-umkm flex items-center justify-center shadow-lg flex-shrink-0">
          <BarChart3 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Campaign Analytics</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Ringkasan performa campaign, lamaran, dan pembayaran escrow Anda.
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
          <h3 className="font-semibold text-sm mb-4">Status Kolaborasi</h3>
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
                    className="h-full rounded-full bg-umkm"
                    style={{ width: `${(b.count / maxBucket) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
          <h3 className="font-semibold text-sm mb-4">
            Influencer Paling Aktif
          </h3>
          {influencerStats.size === 0 ? (
            <p className="text-sm text-zinc-500 py-8 text-center">
              Belum ada data lamaran.
            </p>
          ) : (
            <div className="space-y-3">
              {Array.from(influencerStats.entries())
                .sort((a, b) => b[1].applications - a[1].applications)
                .slice(0, 5)
                .map(([id, info]) => (
                  <div key={id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-kolabora/10 text-kolabora flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {info.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {info.name}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {info.applications} lamaran • {info.completed} selesai
                        {info.followers
                          ? ` • ${info.followers.toLocaleString("id-ID")} followers`
                          : ""}
                      </p>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800">
          <h3 className="font-semibold text-sm">Performa per Campaign</h3>
          <Link
            href="/dashboard/umkm/campaigns"
            className="text-xs text-kolabora hover:underline flex items-center gap-1"
          >
            Kelola <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {campaigns.length === 0 ? (
          <p className="text-sm text-zinc-500 p-8 text-center">
            Belum ada campaign.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-zinc-500 border-b border-zinc-100 dark:border-zinc-800">
                  <th className="px-5 py-3 font-medium">Campaign</th>
                  <th className="px-5 py-3 font-medium">Kategori</th>
                  <th className="px-5 py-3 font-medium">Pelamar</th>
                  <th className="px-5 py-3 font-medium">Budget</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Dibuat</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-zinc-50 dark:border-zinc-800/60 last:border-0"
                  >
                    <td className="px-5 py-3">
                      <Link
                        href={`/dashboard/umkm/campaigns/${c.id}`}
                        className="font-medium hover:text-umkm"
                      >
                        {c.title}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-zinc-500">{c.category}</td>
                    <td className="px-5 py-3">{c._count.applications}</td>
                    <td className="px-5 py-3 text-zinc-500">
                      {formatCurrency(c.budgetMin)} -{" "}
                      {formatCurrency(c.budgetMax)}
                    </td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                        {c.status === "ACTIVE" ? "Aktif" : c.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-zinc-500">
                      {formatDate(c.createdAt)}
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
              const peer = c.participants.find((p) => p.role === "INFLUENCER");
              const name =
                peer?.influencerProfile?.displayName ||
                peer?.name ||
                c.title;
              const meta = getStatusMeta(c.status, "UMKM");
              return (
                <Link
                  key={c.id}
                  href="/dashboard/umkm/history"
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
          <Eye className="w-3.5 h-3.5" /> Data dari database
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" /> Real-time saat halaman dimuat
        </span>
      </div>
    </div>
  );
}
