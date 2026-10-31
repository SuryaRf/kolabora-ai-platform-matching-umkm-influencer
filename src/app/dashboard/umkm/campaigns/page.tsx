"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Megaphone,
  Plus,
  Loader2,
  Users,
  Wallet,
  MapPin,
  ArrowRight,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import FeaturePage from "@/components/dashboard/FeaturePage";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Campaign {
  id: string;
  title: string;
  description: string;
  category: string;
  budgetMin: number;
  budgetMax: number;
  location: string | null;
  status: string;
  createdAt: string;
  _count: { applications: number };
}

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
  DRAFT: "bg-zinc-100 dark:bg-zinc-800 text-zinc-500",
  CLOSED: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
  COMPLETED: "bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400",
};

export default function UMKMCampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/campaigns?mine=1", { cache: "no-store" });
      if (res.ok) setCampaigns(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const totalApplicants = campaigns.reduce(
    (acc, c) => acc + c._count.applications,
    0,
  );
  const active = campaigns.filter((c) => c.status === "ACTIVE").length;
  const closed = campaigns.filter((c) => c.status === "CLOSED").length;

  return (
    <FeaturePage
      title="Campaign Saya"
      description="Buat campaign baru, pantau pelamar, dan kelola campaign yang sedang berjalan."
      icon={Megaphone}
      gradient="bg-umkm"
    >
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
          {[
            { label: "Total Campaign", value: campaigns.length, icon: Megaphone },
            { label: "Aktif", value: active, icon: CheckCircle2 },
            { label: "Ditutup", value: closed, icon: XCircle },
            { label: "Total Pelamar", value: totalApplicants, icon: Users },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4"
            >
              <div className="flex items-center gap-2 mb-1">
                <s.icon className="w-4 h-4 text-zinc-400" />
                <span className="text-xs text-zinc-500">{s.label}</span>
              </div>
              <p className="text-xl font-bold">{s.value}</p>
            </div>
          ))}
        </div>
        <button
          onClick={() => router.push("/dashboard/umkm/campaigns/new")}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-umkm hover:bg-umkm-dark transition-all"
        >
          <Plus className="w-4 h-4" /> Buat Campaign
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-sm text-zinc-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Memuat campaign...
        </div>
      ) : campaigns.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-10 text-center">
          <Megaphone className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <h3 className="font-semibold">Belum ada campaign</h3>
          <p className="text-sm text-zinc-500 mt-1 mb-5">
            Buat campaign pertama Anda agar influencer dapat mulai melamar.
          </p>
          <button
            onClick={() => router.push("/dashboard/umkm/campaigns/new")}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-umkm hover:bg-umkm-dark"
          >
            <Plus className="w-4 h-4" /> Buat Campaign
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {campaigns.map((c) => (
            <Link
              key={c.id}
              href={`/dashboard/umkm/campaigns/${c.id}`}
              className="group bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 hover:shadow-lg hover:border-umkm/40 transition-all"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p className="font-semibold group-hover:text-umkm transition-colors">
                    {c.title}
                  </p>
                  <p className="text-xs text-zinc-500">{c.category}</p>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                    STATUS_STYLE[c.status] ?? STATUS_STYLE.DRAFT
                  }`}
                >
                  {c.status === "ACTIVE"
                    ? "Aktif"
                    : c.status === "CLOSED"
                      ? "Ditutup"
                      : c.status}
                </span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 mb-3">
                {c.description}
              </p>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 text-zinc-500">
                  <Wallet className="w-3.5 h-3.5" />{" "}
                  {formatCurrency(c.budgetMin)} - {formatCurrency(c.budgetMax)}
                </span>
                <span className="flex items-center gap-1 text-zinc-500">
                  <Users className="w-3.5 h-3.5" /> {c._count.applications} pelamar
                </span>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-400">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {c.location ?? "Remote"}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {formatDate(c.createdAt)}
                </span>
                <span className="flex items-center gap-1 text-umkm font-semibold">
                  Kelola <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

    </FeaturePage>
  );
}
