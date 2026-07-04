"use client";

import { DollarSign, TrendingUp, Users, Heart, BarChart3, Info, Sparkles } from "lucide-react";
import FeaturePage from "@/components/dashboard/FeaturePage";

const factors = [
  { label: "Followers", value: "135.6K", weight: "25%", score: 85 },
  { label: "Engagement Rate", value: "6.5%", weight: "35%", score: 92 },
  { label: "Niche Demand", value: "Tinggi", weight: "20%", score: 80 },
  { label: "Content Quality", value: "A-", weight: "15%", score: 78 },
  { label: "Market Trend", value: "Stabil", weight: "5%", score: 75 },
];

const rateRanges = [
  { platform: "Instagram Feed", range: "Rp 1.500.000 - 3.000.000", per: "post", demand: "Tinggi" },
  { platform: "Instagram Reels", range: "Rp 2.000.000 - 4.000.000", per: "video", demand: "Sangat Tinggi" },
  { platform: "TikTok Video", range: "Rp 2.500.000 - 5.000.000", per: "video", demand: "Sangat Tinggi" },
  { platform: "YouTube Video", range: "Rp 3.000.000 - 7.000.000", per: "video", demand: "Sedang" },
  { platform: "Bundle Campaign", range: "Rp 5.000.000 - 12.000.000", per: "campaign", demand: "Tinggi" },
];

export default function RateRecommendation() {
  return (
    <FeaturePage
      title="AI Rate Recommendation"
      description="Dapatkan estimasi tarif kerja sama yang kompetitif berdasarkan analisis data dan tren pasar."
      icon={DollarSign}
      gradient="bg-kolabora"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold">Rate Analysis Factors</h3>
              <div className="flex items-center gap-1 text-xs text-zinc-500">
                <Info className="w-3 h-3" /> Berdasarkan data pasar terkini
              </div>
            </div>
            <div className="space-y-4">
              {factors.map((f, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{f.label}</span>
                      <span className="text-xs text-zinc-400">({f.weight})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500">{f.value}</span>
                      <span className="w-8 text-right text-xs font-bold text-kolabora">{f.score}</span>
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                    <div className="h-full rounded-full bg-kolabora" style={{ width: `${f.score}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="font-semibold text-sm">Estimasi Tarif per Platform</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800">
                    <th className="text-left p-4 font-medium text-zinc-500">Platform</th>
                    <th className="text-left p-4 font-medium text-zinc-500">Estimasi Tarif</th>
                    <th className="text-left p-4 font-medium text-zinc-500">Per</th>
                    <th className="text-left p-4 font-medium text-zinc-500">Permintaan Pasar</th>
                  </tr>
                </thead>
                <tbody>
                  {rateRanges.map((r, i) => (
                    <tr key={i} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                      <td className="p-4 font-medium">{r.platform}</td>
                      <td className="p-4 font-semibold text-emerald-600 dark:text-emerald-400">{r.range}</td>
                      <td className="p-4 text-zinc-500">{r.per}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          r.demand === "Sangat Tinggi" ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" :
                          r.demand === "Tinggi" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" :
                          "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                        }`}>{r.demand}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-zinc-800 dark:to-zinc-800 rounded-2xl border border-emerald-200 dark:border-zinc-700 p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <DollarSign className="w-7 h-7 text-white" />
            </div>
            <p className="text-xs text-zinc-500 mb-1">Estimated Rate Range</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">Rp 2,5 - 5 Jt</p>
            <p className="text-xs text-zinc-500 mt-1">per campaign</p>
            <div className="mt-4 p-3 rounded-xl bg-white/80 dark:bg-zinc-900/80">
              <p className="text-xs text-zinc-500">AI Confidence Score</p>
              <p className="text-lg font-bold text-kolabora">92%</p>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
            <h3 className="font-semibold text-sm mb-3">Tips Negosiasi</h3>
            <ul className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
              <li className="flex items-start gap-2">
                <Sparkles className="w-3.5 h-3.5 text-influencer flex-shrink-0 mt-0.5" />
                <span>Siapkan media kit profesional untuk menunjukkan value Anda.</span>
              </li>
              <li className="flex items-start gap-2">
                <Sparkles className="w-3.5 h-3.5 text-influencer flex-shrink-0 mt-0.5" />
                <span>Tawarkan bundle paket untuk campaign multi-platform.</span>
              </li>
              <li className="flex items-start gap-2">
                <Sparkles className="w-3.5 h-3.5 text-influencer flex-shrink-0 mt-0.5" />
                <span>Gunakan data engagement riil sebagai bahan negosiasi.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </FeaturePage>
  );
}
