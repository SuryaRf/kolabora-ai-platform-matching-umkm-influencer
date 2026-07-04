"use client";

import { Star, TrendingUp, Users, MapPin, Award, Flame } from "lucide-react";
import FeaturePage from "@/components/dashboard/FeaturePage";

const highlights = [
  { rank: 1, name: "Kuliner Jalanan", niche: "Kuliner", followers: "78.1K", engagement: "8.1%", location: "Yogyakarta", trend: "+12%", avatar: "KJ", color: "bg-orange-500" },
  { rank: 2, name: "Sarah Beauty", niche: "Kecantikan", followers: "45.2K", engagement: "6.8%", location: "Jakarta", trend: "+8%", avatar: "SB", color: "bg-pink-500" },
  { rank: 3, name: "Fitness Journey", niche: "Olahraga", followers: "32.8K", engagement: "7.3%", location: "Surabaya", trend: "+15%", avatar: "FJ", color: "bg-green-500" },
  { rank: 4, name: "Mom & Baby", niche: "Parenting", followers: "28.6K", engagement: "9.2%", location: "Jakarta", trend: "+6%", avatar: "MB", color: "bg-purple-500" },
  { rank: 5, name: "TechReview ID", niche: "Teknologi", followers: "120.5K", engagement: "4.2%", location: "Bandung", trend: "+3%", avatar: "TR", color: "bg-blue-500" },
  { rank: 6, name: "Traveler Indo", niche: "Travel", followers: "95.3K", engagement: "5.5%", location: "Bali", trend: "+9%", avatar: "TI", color: "bg-sky-500" },
  { rank: 7, name: "Fashion Vibes", niche: "Fashion", followers: "55.7K", engagement: "6.1%", location: "Bandung", trend: "+11%", avatar: "FV", color: "bg-rose-500" },
  { rank: 8, name: "Gaming Zone", niche: "Gaming", followers: "88.2K", engagement: "5.8%", location: "Jakarta", trend: "+7%", avatar: "GZ", color: "bg-indigo-500" },
];

export default function Highlights() {
  return (
    <FeaturePage
      title="Influencer Highlights"
      description="Daftar influencer dengan performa terbaik berdasarkan kategori dan engagement rate bulan ini."
      icon={Star}
      gradient="bg-kolabora"
    >
      <div className="flex flex-wrap items-center gap-3">
        {["Semua Kategori", "Kuliner", "Kecantikan", "Teknologi", "Travel", "Fashion", "Olahraga", "Parenting"].map((cat) => (
          <button key={cat} className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${cat === "Semua Kategori" ? "bg-umkm text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"}`}>
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {highlights.map((h, i) => (
          <div key={i} className="relative bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all">
            <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30">
              <Award className="w-3 h-3 text-amber-500" />
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">#{h.rank}</span>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-full ${h.color} flex items-center justify-center text-white text-sm font-bold`}>{h.avatar}</div>
              <div>
                <p className="font-semibold text-sm">{h.name}</p>
                <p className="text-xs text-zinc-500">{h.niche}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs mb-4">
              <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800">
                <Users className="w-3.5 h-3.5 mx-auto mb-0.5 text-zinc-400" />
                <span className="text-zinc-600 dark:text-zinc-400">{h.followers}</span>
              </div>
              <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800">
                <TrendingUp className="w-3.5 h-3.5 mx-auto mb-0.5 text-zinc-400" />
                <span className="text-zinc-600 dark:text-zinc-400">{h.engagement}</span>
              </div>
              <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800">
                <MapPin className="w-3.5 h-3.5 mx-auto mb-0.5 text-zinc-400" />
                <span className="text-zinc-600 dark:text-zinc-400">{h.location}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-influencer" />
                <span className="text-xs font-medium text-influencer">{h.trend}</span>
              </div>
              <button className="text-xs font-medium text-kolabora hover:underline">Lihat Profil</button>
            </div>
          </div>
        ))}
      </div>
    </FeaturePage>
  );
}
