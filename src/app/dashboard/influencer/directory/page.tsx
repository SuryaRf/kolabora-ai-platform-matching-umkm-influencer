"use client";

import { Users, Search, MapPin, Star, TrendingUp, Globe, Share2, ExternalLink } from "lucide-react";
import FeaturePage from "@/components/dashboard/FeaturePage";

export default function InfluencerDirectory() {
  return (
    <FeaturePage
      title="Influencer Directory"
      description="Halaman profil publik yang menampilkan portofolio, statistik, dan informasi lengkap Anda untuk UMKM."
      icon={Users}
      gradient="bg-kolabora"
    >
      <div className="max-w-3xl mx-auto">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="h-32 bg-kolabora" />
          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-12 mb-6">
              <div className="w-24 h-24 rounded-2xl border-4 border-white dark:border-zinc-900 bg-pink-500 flex items-center justify-center text-white text-2xl font-bold shadow-xl">
                SB
              </div>
              <div className="flex-1 pt-2 sm:pt-0">
                <h2 className="text-xl font-bold">Sarah Beauty</h2>
                <p className="text-sm text-zinc-500">@sarahbeauty_official</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">Beauty & Skincare Content Creator 🎀 | 45K+ di Instagram | 78K+ di TikTok | Collab: sarah@email.com</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-kolabora hover:bg-kolabora-dark transition-all">
                  <Share2 className="w-3.5 h-3.5" /> Bagikan
                </button>
                <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-zinc-700 bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all">
                  <ExternalLink className="w-3.5 h-3.5" /> Preview
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { icon: Users, label: "Total Followers", value: "123.7K" },
                { icon: TrendingUp, label: "Eng. Rate", value: "7.1%" },
                { icon: Globe, label: "Kategori", value: "Kecantikan" },
                { icon: MapPin, label: "Lokasi", value: "Jakarta" },
              ].map((s, i) => (
                <div key={i} className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-center">
                  <s.icon className="w-4 h-4 mx-auto mb-1 text-zinc-400" />
                  <p className="text-sm font-bold">{s.value}</p>
                  <p className="text-xs text-zinc-500">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-sm mb-3">Tarif Kolaborasi</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { platform: "Instagram Feed", rate: "Rp 1,5 - 3 Jt" },
                  { platform: "Instagram Reels", rate: "Rp 2 - 4 Jt" },
                  { platform: "TikTok Video", rate: "Rp 2,5 - 5 Jt" },
                ].map((r, i) => (
                  <div key={i} className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-center">
                    <p className="text-xs text-zinc-500">{r.platform}</p>
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{r.rate}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-sm mb-3">Portofolio</h3>
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="aspect-square rounded-xl bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-600 flex items-center justify-center">
                    <Star className="w-6 h-6 text-zinc-400" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </FeaturePage>
  );
}
