"use client";

import { Zap, Star, MapPin, Users, TrendingUp, Filter, Store, Clock } from "lucide-react";
import FeaturePage from "@/components/dashboard/FeaturePage";

const campaigns = [
  { brand: "Kopi Nusantara", category: "Kuliner & Minuman", target: "Gen Z & Milenial", location: "Yogyakarta", budget: "Rp 3-5 Jt", match: 96, deadline: "7 hari", avatar: "KN", color: "bg-orange-500" },
  { brand: "Skincare Glowing", category: "Kecantikan", target: "Wanita 20-35", location: "Jakarta", budget: "Rp 5-8 Jt", match: 94, deadline: "10 hari", avatar: "SG", color: "bg-pink-500" },
  { brand: "TechGadget ID", category: "Teknologi", target: "Pria 18-35", location: "Bandung", budget: "Rp 7-12 Jt", match: 91, deadline: "14 hari", avatar: "TG", color: "bg-blue-500" },
  { brand: "Sporty Apparel", category: "Olahraga", target: "Aktif & Fitness", location: "Surabaya", budget: "Rp 2-5 Jt", match: 87, deadline: "5 hari", avatar: "SA", color: "bg-green-500" },
  { brand: "Bali Retreat", category: "Travel", target: "Wisatawan 25-45", location: "Bali", budget: "Rp 4-8 Jt", match: 84, deadline: "21 hari", avatar: "BR", color: "bg-sky-500" },
  { brand: "MomCare", category: "Parenting", target: "Ibu Muda", location: "Jakarta", budget: "Rp 1-3 Jt", match: 79, deadline: "7 hari", avatar: "MC", color: "bg-purple-500" },
];

export default function InfluencerSmartMatching() {
  return (
    <FeaturePage
      title="AI Smart Matching"
      description="Dapatkan rekomendasi kampanye dari UMKM yang paling sesuai dengan niche, audiens, dan performa Anda."
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
        {campaigns.map((c, i) => (
          <div key={i} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full ${c.color} flex items-center justify-center text-white text-sm font-bold`}>{c.avatar}</div>
                <div>
                  <p className="font-semibold text-sm">{c.brand}</p>
                  <p className="text-xs text-zinc-500">{c.category}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 rounded-full">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{c.match}%</span>
                <Star className="w-3 h-3 text-emerald-500 fill-emerald-500" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center text-xs mb-4">
              <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800">
                <Users className="w-3.5 h-3.5 mx-auto mb-0.5 text-zinc-400" />
                <span className="text-zinc-600 dark:text-zinc-400">{c.target}</span>
              </div>
              <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800">
                <MapPin className="w-3.5 h-3.5 mx-auto mb-0.5 text-zinc-400" />
                <span className="text-zinc-600 dark:text-zinc-400">{c.location}</span>
              </div>
            </div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1">
                <Store className="w-3 h-3 text-zinc-400" />
                <span className="text-xs text-zinc-500">{c.budget}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-zinc-400" />
                <span className="text-xs text-zinc-500">{c.deadline}</span>
              </div>
            </div>
            <button className="w-full py-2 rounded-xl text-xs font-semibold text-white bg-kolabora hover:bg-kolabora-dark transition-all">Ajukan Diri</button>
          </div>
        ))}
      </div>
    </FeaturePage>
  );
}
