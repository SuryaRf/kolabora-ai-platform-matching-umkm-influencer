"use client";

import { PieChart, Users, Heart, Eye, TrendingUp, Camera, Video, Music2, Globe, ExternalLink, Star } from "lucide-react";
import FeaturePage from "@/components/dashboard/FeaturePage";

const platformStats = [
  { icon: Camera, name: "Instagram", followers: "45.2K", engagement: "6.8%", posts: "342", color: "bg-pink-500" },
  { icon: Music2, name: "TikTok", followers: "78.1K", engagement: "8.2%", posts: "156", color: "bg-zinc-800" },
  { icon: Video, name: "YouTube", followers: "12.3K", engagement: "4.5%", videos: "89", color: "bg-red-500" },
];

const pastCampaigns = [
  { brand: "Kopi Nusantara", platform: "Instagram & TikTok", reach: "45.2K", engagement: "6.2K", rate: "4.8%", rating: 4.9, status: "Selesai" },
  { brand: "Skincare Glowing", platform: "Instagram", reach: "32.1K", engagement: "4.8K", rate: "5.2%", rating: 4.8, status: "Selesai" },
  { brand: "TechGadget ID", platform: "YouTube & TikTok", reach: "78.3K", engagement: "8.9K", rate: "3.8%", rating: 4.7, status: "Selesai" },
  { brand: "Sporty Apparel", platform: "Instagram", reach: "28.4K", engagement: "3.2K", rate: "4.1%", rating: 4.5, status: "Berlangsung" },
];

export default function Portfolio() {
  return (
    <FeaturePage
      title="Portfolio & Performance Dashboard"
      description="Dasbor yang menampilkan portofolio digital, statistik performa media sosial, dan histori campaign."
      icon={PieChart}
      gradient="bg-kolabora"
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { icon: Users, label: "Total Followers", value: "135.6K" },
          { icon: Heart, label: "Total Engagement", value: "28.4K" },
          { icon: Eye, label: "Total Reach (30d)", value: "245.6K" },
          { icon: TrendingUp, label: "Avg. Engagement Rate", value: "6.5%" },
        ].map((s, i) => (
          <div key={i} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
            <div className="flex items-center gap-2 mb-2">
              <s.icon className="w-4 h-4 text-zinc-400" />
              <span className="text-xs text-zinc-500">{s.label}</span>
            </div>
            <p className="text-xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {platformStats.map((p, i) => (
          <div key={i} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl ${p.color} flex items-center justify-center`}>
                <p.icon className="w-5 h-5 text-white" />
              </div>
              <p className="font-semibold">{p.name}</p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800">
                <Users className="w-3.5 h-3.5 mx-auto mb-0.5 text-zinc-400" />
                <span className="text-zinc-600 dark:text-zinc-400 font-medium">{p.followers}</span>
              </div>
              <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800">
                <Heart className="w-3.5 h-3.5 mx-auto mb-0.5 text-zinc-400" />
                <span className="text-zinc-600 dark:text-zinc-400 font-medium">{p.engagement}</span>
              </div>
              <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800">
                <Globe className="w-3.5 h-3.5 mx-auto mb-0.5 text-zinc-400" />
                <span className="text-zinc-600 dark:text-zinc-400 font-medium">{p.posts || p.videos}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
        <h3 className="font-semibold text-sm mb-4">Riwayat Kolaborasi</h3>
        <div className="space-y-3">
          {pastCampaigns.map((pc, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                  <ExternalLink className="w-4 h-4 text-zinc-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">{pc.brand}</p>
                  <p className="text-xs text-zinc-500">{pc.platform}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-zinc-500">
                <span>Reach: {pc.reach}</span>
                <span>Eng: {pc.engagement}</span>
                <span className="font-semibold text-kolabora">{pc.rate}</span>
                <div className="flex items-center gap-0.5">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span className="font-semibold">{pc.rating}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${pc.status === "Selesai" ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" : "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"}`}>{pc.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </FeaturePage>
  );
}
