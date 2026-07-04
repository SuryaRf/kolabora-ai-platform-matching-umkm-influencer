"use client";

import { Users, Search, MapPin, SlidersHorizontal, Star, TrendingUp, DollarSign, Grid3X3, List } from "lucide-react";
import FeaturePage from "@/components/dashboard/FeaturePage";

const influencers = [
  { name: "Sarah Beauty", niche: "Kecantikan", followers: "45.2K", engagement: "6.8%", location: "Jakarta", rate: "Rp 1-3 Jt", rating: 4.9, avatar: "SB", color: "bg-pink-500" },
  { name: "TechReview ID", niche: "Teknologi", followers: "120.5K", engagement: "4.2%", location: "Bandung", rate: "Rp 3-7 Jt", rating: 4.8, avatar: "TR", color: "bg-blue-500" },
  { name: "Kuliner Jalanan", niche: "Kuliner", followers: "78.1K", engagement: "8.1%", location: "Yogyakarta", rate: "Rp 2-5 Jt", rating: 4.9, avatar: "KJ", color: "bg-orange-500" },
  { name: "Fitness Journey", niche: "Olahraga", followers: "32.8K", engagement: "7.3%", location: "Surabaya", rate: "Rp 1-3 Jt", rating: 4.7, avatar: "FJ", color: "bg-green-500" },
  { name: "Traveler Indo", niche: "Travel", followers: "95.3K", engagement: "5.5%", location: "Bali", rate: "Rp 3-8 Jt", rating: 4.8, avatar: "TI", color: "bg-sky-500" },
  { name: "Mom & Baby", niche: "Parenting", followers: "28.6K", engagement: "9.2%", location: "Jakarta", rate: "Rp 1-2 Jt", rating: 4.6, avatar: "MB", color: "bg-purple-500" },
  { name: "Fashion Vibes", niche: "Fashion", followers: "55.7K", engagement: "6.1%", location: "Bandung", rate: "Rp 2-5 Jt", rating: 4.7, avatar: "FV", color: "bg-rose-500" },
  { name: "Gaming Zone", niche: "Gaming", followers: "88.2K", engagement: "5.8%", location: "Jakarta", rate: "Rp 2-4 Jt", rating: 4.5, avatar: "GZ", color: "bg-indigo-500" },
];

export default function Directory() {
  return (
    <FeaturePage
      title="Influencer Directory"
      description="Jelajahi ribuan influencer dengan filter lengkap untuk menemukan partner kolaborasi yang tepat."
      icon={Users}
      gradient="bg-kolabora"
    >
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input type="text" placeholder="Cari influencer atau niche..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-kolabora/50" />
        </div>
        <div className="flex items-center gap-2">
          {["Kategori", "Lokasi", "Followers", "Tarif"].map((f) => (
            <button key={f} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700">
              <SlidersHorizontal className="w-3 h-3" /> {f}
            </button>
          ))}
          <button className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700">
            <Grid3X3 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {influencers.map((inf, i) => (
          <div key={i} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-full ${inf.color} flex items-center justify-center text-white text-sm font-bold`}>{inf.avatar}</div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{inf.name}</p>
                <p className="text-xs text-zinc-500">{inf.niche}</p>
              </div>
              <div className="flex items-center gap-0.5">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span className="text-xs font-semibold">{inf.rating}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center text-xs mb-4">
              <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800">
                <Users className="w-3.5 h-3.5 mx-auto mb-0.5 text-zinc-400" />
                <span className="text-zinc-600 dark:text-zinc-400">{inf.followers}</span>
              </div>
              <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800">
                <TrendingUp className="w-3.5 h-3.5 mx-auto mb-0.5 text-zinc-400" />
                <span className="text-zinc-600 dark:text-zinc-400">{inf.engagement}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-zinc-400" />
                <span className="text-xs text-zinc-500">{inf.location}</span>
              </div>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{inf.rate}</span>
            </div>
            <button className="w-full mt-3 py-2 rounded-xl text-xs font-semibold text-white bg-kolabora hover:bg-kolabora-dark transition-all">Ajukan Kolaborasi</button>
          </div>
        ))}
      </div>
    </FeaturePage>
  );
}
