"use client";

import { Store, MapPin, Users, Star, TrendingUp, ArrowRight, Briefcase, Sparkles } from "lucide-react";
import FeaturePage from "@/components/dashboard/FeaturePage";
import Link from "next/link";

const umkmList = [
  { name: "Kopi Nusantara", location: "Yogyakarta", niche: "F&B / Kopi", campaign: "Launching Produk Baru", budget: "Rp 5-10 Jt", match: 96, avatar: "KN", color: "bg-amber-700" },
  { name: "Skincare Glowing", location: "Jakarta", niche: "Kecantikan", campaign: "Review Produk", budget: "Rp 3-7 Jt", match: 92, avatar: "SG", color: "bg-pink-500" },
  { name: "Batik Nusantara", location: "Solo", niche: "Fashion Tradisional", campaign: "Brand Awareness", budget: "Rp 4-8 Jt", match: 88, avatar: "BN", color: "bg-indigo-500" },
  { name: "Sporty Apparel", location: "Bandung", niche: "Olahraga", campaign: "Promo Produk Baru", budget: "Rp 3-6 Jt", match: 85, avatar: "SA", color: "bg-emerald-500" },
  { name: "TechGadget ID", location: "Jakarta", niche: "Teknologi", campaign: "Review Gadget", budget: "Rp 5-12 Jt", match: 82, avatar: "TG", color: "bg-blue-500" },
  { name: "MomCare Baby", location: "Surabaya", niche: "Parenting", campaign: "Branding Produk Bayi", budget: "Rp 2-5 Jt", match: 79, avatar: "MC", color: "bg-purple-500" },
];

export default function UMKMInsight() {
  return (
    <FeaturePage
      title="UMKM Insight & Recommendation"
      description="Rekomendasi daftar UMKM lokal yang mencari kreator sesuai profil dan domisili."
      icon={Store}
      gradient="bg-gradient-to-br from-amber-500 to-orange-600"
    >
      <div className="flex flex-wrap items-center gap-3">
        {["Semua Lokasi", "Jakarta", "Bandung", "Yogyakarta", "Surabaya", "Solo", "Bali"].map((loc) => (
          <button key={loc} className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${loc === "Semua Lokasi" ? "bg-amber-500 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"}`}>
            {loc}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {umkmList.map((u, i) => (
          <div key={i} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full ${u.color} flex items-center justify-center text-white text-sm font-bold`}>{u.avatar}</div>
                <div>
                  <p className="font-semibold text-sm">{u.name}</p>
                  <p className="text-xs text-zinc-500">{u.niche}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 rounded-full">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{u.match}%</span>
                <Star className="w-3 h-3 text-emerald-500 fill-emerald-500" />
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <MapPin className="w-3.5 h-3.5" />
                <span>{u.location}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <Briefcase className="w-3.5 h-3.5" />
                <span>{u.campaign}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Budget: {u.budget}</span>
              </div>
            </div>

            <button className="w-full py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 transition-all flex items-center justify-center gap-1.5">
              Ajukan Diri <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-zinc-800 dark:to-zinc-800 rounded-2xl border border-amber-200 dark:border-zinc-700 p-5">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <h3 className="font-semibold text-sm">Tips Mendapatkan Kolaborasi</h3>
        </div>
        <ul className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
          <li className="flex items-start gap-2">
            <span className="text-amber-500 font-bold">•</span>
            Lengkapi profil dengan portofolio terbaik untuk meningkatkan match score
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-500 font-bold">•</span>
            Aktif merespons undangan kolaborasi dari UMKM
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-500 font-bold">•</span>
            Gunakan AI Rate Recommendation untuk menentukan tarif kompetitif
          </li>
        </ul>
      </div>
    </FeaturePage>
  );
}
