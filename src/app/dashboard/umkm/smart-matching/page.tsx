"use client";

import { Zap, Star, MapPin, Users, TrendingUp, Filter } from "lucide-react";
import FeaturePage from "@/components/dashboard/FeaturePage";

const recommendations = [
  { name: "Sarah Beauty", niche: "Kecantikan & Skincare", followers: "45.2K", engagement: "6.8%", location: "Jakarta", match: 96, avatar: "SB", color: "bg-pink-500" },
  { name: "TechReview ID", niche: "Teknologi & Gadget", followers: "120.5K", engagement: "4.2%", location: "Bandung", match: 92, avatar: "TR", color: "bg-blue-500" },
  { name: "Kuliner Jalanan", niche: "Kuliner & Food", followers: "78.1K", engagement: "8.1%", location: "Yogyakarta", match: 89, avatar: "KJ", color: "bg-orange-500" },
  { name: "Fitness Journey", niche: "Olahraga & Kesehatan", followers: "32.8K", engagement: "7.3%", location: "Surabaya", match: 85, avatar: "FJ", color: "bg-green-500" },
  { name: "Traveler Indo", niche: "Travel & Lifestyle", followers: "95.3K", engagement: "5.5%", location: "Bali", match: 82, avatar: "TI", color: "bg-sky-500" },
  { name: "Mom & Baby", niche: "Parenting & Keluarga", followers: "28.6K", engagement: "9.2%", location: "Jakarta", match: 78, avatar: "MB", color: "bg-purple-500" },
];

export default function UMKMSmartMatching() {
  return (
    <FeaturePage
      title="AI Smart Matching"
      description="Temukan influencer yang paling sesuai dengan kebutuhan promosi Anda berdasarkan analisis AI mendalam."
      icon={Zap}
      gradient="bg-kolabora"
    >
      <div className="flex flex-wrap items-center gap-3">
        {["Semua Kategori", "Kuliner", "Kecantikan", "Teknologi", "Travel", "Fashion", "Olahraga"].map((cat) => (
          <button key={cat} className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${cat === "Semua Kategori" ? "bg-kolabora text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"}`}>
            {cat}
          </button>
        ))}
        <button className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700">
          <Filter className="w-3 h-3" /> Filter
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {recommendations.map((r, i) => (
          <div key={i} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full ${r.color} flex items-center justify-center text-white text-sm font-bold`}>{r.avatar}</div>
                <div>
                  <p className="font-semibold text-sm">{r.name}</p>
                  <p className="text-xs text-zinc-500">{r.niche}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 rounded-full">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{r.match}%</span>
                <Star className="w-3 h-3 text-emerald-500 fill-emerald-500" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800">
                <Users className="w-3.5 h-3.5 mx-auto mb-0.5 text-zinc-400" />
                <span className="text-zinc-600 dark:text-zinc-400">{r.followers}</span>
              </div>
              <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800">
                <TrendingUp className="w-3.5 h-3.5 mx-auto mb-0.5 text-zinc-400" />
                <span className="text-zinc-600 dark:text-zinc-400">{r.engagement}</span>
              </div>
              <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800">
                <MapPin className="w-3.5 h-3.5 mx-auto mb-0.5 text-zinc-400" />
                <span className="text-zinc-600 dark:text-zinc-400">{r.location}</span>
              </div>
            </div>
            <button className="w-full mt-4 py-2 rounded-xl text-xs font-semibold text-white bg-kolabora hover:bg-kolabora-dark transition-all">Lihat Profil</button>
          </div>
        ))}
      </div>
    </FeaturePage>
  );
}
