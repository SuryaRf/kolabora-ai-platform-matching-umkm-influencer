"use client";

import { Medal, Star, Zap, TrendingUp, Sparkles, CheckCircle, ArrowRight } from "lucide-react";
import FeaturePage from "@/components/dashboard/FeaturePage";
import Link from "next/link";

export default function PriorityMatching() {
  return (
    <FeaturePage
      title="Priority Matching / Featured Creator"
      description="Prioritas rekomendasi profil kreator pada sistem pencarian UMKM (boost visibilitas)."
      icon={Medal}
      gradient="bg-gradient-to-br from-amber-500 to-yellow-600"
    >
      <div className="flex items-center gap-3 mb-6 p-5 rounded-2xl bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-zinc-800 dark:to-zinc-800 border border-amber-200 dark:border-zinc-700">
        <Medal className="w-10 h-10 text-amber-500 flex-shrink-0" />
        <div>
          <p className="font-semibold">Featured Creator — Aktif</p>
          <p className="text-sm text-zinc-500">Profil kamu mendapat prioritas di hasil pencarian UMKM</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          { icon: TrendingUp, label: "Visibilitas Meningkat", value: "3.5x", color: "text-emerald-500" },
          { icon: Star, label: "Match Score Bonus", value: "+15%", color: "text-amber-500" },
          { icon: Zap, label: "Response Priority", value: "Prioritas", color: "text-kolabora" },
        ].map((s, i) => (
          <div key={i} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 text-center">
            <s.icon className={`w-8 h-8 ${s.color} mx-auto mb-2`} />
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-zinc-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
          <h3 className="font-semibold text-sm mb-4">Keuntungan Featured Creator</h3>
          <div className="space-y-3">
            {[
              "Muncul di urutan teratas hasil pencarian UMKM",
              "Badge Featured Creator eksklusif di profil",
              "Prioritas dalam rekomendasi AI Smart Matching",
              "Notifikasi campaign baru lebih awal",
              "Akses ke campaign eksklusif UMKM premium",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span className="text-sm text-zinc-600 dark:text-zinc-400">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
          <h3 className="font-semibold text-sm mb-4">Stats Visibilitas</h3>
          <div className="space-y-4">
            {[
              { label: "Profile Views (30d)", value: "2.450", change: "+45%" },
              { label: "UMKM Inquiries", value: "28", change: "+60%" },
              { label: "Kolaborasi Aktif", value: "4", change: "+33%" },
            ].map((stat, i) => (
              <div key={i} className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-zinc-500">{stat.label}</span>
                  <span className="text-xs font-semibold text-emerald-500">{stat.change}</span>
                </div>
                <p className="text-xl font-bold">{stat.value}</p>
              </div>
            ))}
          </div>
          <Link
            href="/dashboard/influencer/portfolio"
            className="flex items-center justify-center gap-1.5 mt-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 transition-all"
          >
            Lihat Portfolio Saya <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </FeaturePage>
  );
}
