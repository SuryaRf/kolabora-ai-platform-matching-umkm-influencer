"use client";

import { BarChart3, TrendingUp, Eye, Heart, MessageCircle, Share2, Download, ArrowUp, ArrowDown } from "lucide-react";
import FeaturePage from "@/components/dashboard/FeaturePage";

const overviewStats = [
  { icon: Eye, label: "Total Reach", value: "245.6K", change: "+12.5%", positive: true },
  { icon: TrendingUp, label: "Total Impressions", value: "892.3K", change: "+18.2%", positive: true },
  { icon: Heart, label: "Engagement", value: "28.4K", change: "+8.7%", positive: true },
  { icon: Share2, label: "Shares", value: "3.2K", change: "-2.1%", positive: false },
];

const campaignReports = [
  { campaign: "Launch Kopi Lokal", platform: "Instagram", reach: "45.2K", impressions: "128.3K", engagement: "6.2K", rate: "4.8%", trend: "up" },
  { campaign: "Launch Kopi Lokal", platform: "TikTok", reach: "78.1K", impressions: "245.6K", engagement: "12.3K", rate: "5.1%", trend: "up" },
  { campaign: "Review Skincare", platform: "YouTube", reach: "32.4K", impressions: "89.1K", engagement: "3.8K", rate: "4.3%", trend: "up" },
  { campaign: "Batik Nusantara", platform: "TikTok", reach: "56.8K", impressions: "198.4K", engagement: "8.9K", rate: "4.5%", trend: "down" },
  { campaign: "Fashion Muslim", platform: "Instagram", reach: "33.1K", impressions: "95.7K", engagement: "4.2K", rate: "4.4%", trend: "up" },
];

const aiRecommendations = [
  "Tingkatkan frekuensi posting di TikTok untuk menjangkau audiens lebih luas pada campaign berikutnya.",
  "Gunakan format video pendek (Reels/Shorts) karena performa 3x lebih baik dibandingkan konten statis.",
  "Campaign dengan storytelling personal memiliki engagement rate 2x lebih tinggi dari konten promosi langsung.",
  "Waktu publikasi optimal pada pukul 19.00-21.00 WIB untuk audiens Indonesia.",
];

export default function Analytics() {
  return (
    <FeaturePage
      title="Campaign Analytics"
      description="Analisis performa kampanye dengan metrik lengkap dan rekomendasi berbasis AI untuk optimasi."
      icon={BarChart3}
      gradient="bg-kolabora"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {overviewStats.map((s, i) => (
          <div key={i} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
            <div className="flex items-center justify-between mb-3">
              <s.icon className="w-5 h-5 text-zinc-400" />
              <span className={`flex items-center gap-0.5 text-xs font-semibold ${s.positive ? "text-emerald-500" : "text-red-500"}`}>
                {s.positive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                {s.change}
              </span>
            </div>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-zinc-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
          <h3 className="font-semibold text-sm">Laporan Campaign</h3>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800">
                <th className="text-left p-4 font-medium text-zinc-500">Campaign</th>
                <th className="text-left p-4 font-medium text-zinc-500">Platform</th>
                <th className="text-left p-4 font-medium text-zinc-500">Reach</th>
                <th className="text-left p-4 font-medium text-zinc-500">Impressions</th>
                <th className="text-left p-4 font-medium text-zinc-500">Engagement</th>
                <th className="text-left p-4 font-medium text-zinc-500">Eng. Rate</th>
                <th className="text-left p-4 font-medium text-zinc-500">Trend</th>
              </tr>
            </thead>
            <tbody>
              {campaignReports.map((r, i) => (
                <tr key={i} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <td className="p-4 font-medium">{r.campaign}</td>
                  <td className="p-4 text-zinc-600 dark:text-zinc-400">{r.platform}</td>
                  <td className="p-4">{r.reach}</td>
                  <td className="p-4">{r.impressions}</td>
                  <td className="p-4">{r.engagement}</td>
                  <td className="p-4">
                    <span className="font-semibold text-kolabora">{r.rate}</span>
                  </td>
                  <td className="p-4">
                    {r.trend === "up" ? (
                      <ArrowUp className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <ArrowDown className="w-4 h-4 text-red-500" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-gradient-to-br from-kolabora/5 to-influencer/5 rounded-2xl border border-kolabora/10 p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-kolabora" />
          <h3 className="font-semibold text-sm">Rekomendasi AI untuk Optimasi</h3>
        </div>
        <ul className="space-y-3">
          {aiRecommendations.map((rec, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-zinc-600 dark:text-zinc-400">
              <span className="w-5 h-5 rounded-full bg-kolabora/20 text-kolabora text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
              <span>{rec}</span>
            </li>
          ))}
        </ul>
      </div>
    </FeaturePage>
  );
}
