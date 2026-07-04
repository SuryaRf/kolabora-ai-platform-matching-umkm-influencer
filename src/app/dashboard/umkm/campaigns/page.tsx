"use client";

import { LayoutDashboard, Plus, MoreHorizontal, CheckCircle, Clock, AlertCircle, FileText } from "lucide-react";
import FeaturePage from "@/components/dashboard/FeaturePage";

const campaigns = [
  { name: "Launch Produk Kopi Lokal", influencer: "Kuliner Jalanan", platform: "Instagram & TikTok", status: "Aktif", deadline: "5 hari lagi", progress: 60, color: "emerald" },
  { name: "Review Skincare Baru", influencer: "Sarah Beauty", platform: "YouTube", status: "Review", deadline: "2 hari lagi", progress: 85, color: "amber" },
  { name: "Promo Fashion Muslim", influencer: "Fashion Vibes", platform: "Instagram", status: "Draf", deadline: "10 hari lagi", progress: 25, color: "blue" },
  { name: "Batik Nusantara Campaign", influencer: "Traveler Indo", platform: "TikTok", status: "Selesai", deadline: "Selesai", progress: 100, color: "emerald" },
  { name: "Gadget Review Season 2", influencer: "TechReview ID", platform: "YouTube & TikTok", status: "Negosiasi", deadline: "14 hari lagi", progress: 10, color: "purple" },
];

const statusStyles: Record<string, string> = {
  Aktif: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
  Review: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
  Draf: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
  Selesai: "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400",
  Negosiasi: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
};

const progressColors: Record<string, string> = {
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  blue: "bg-blue-500",
  purple: "bg-purple-500",
};

export default function Campaigns() {
  return (
    <FeaturePage
      title="Campaign Dashboard"
      description="Kelola seluruh aktivitas kampanye dari pembuatan proyek hingga evaluasi dalam satu dashboard."
      icon={LayoutDashboard}
      gradient="bg-kolabora"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {["Semua", "Aktif", "Review", "Draf", "Selesai"].map((s) => (
            <button key={s} className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${s === "Semua" ? "bg-kolabora text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"}`}>{s}</button>
          ))}
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-kolabora hover:bg-kolabora-dark transition-all">
          <Plus className="w-4 h-4" /> Campaign Baru
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th className="text-left p-4 font-medium text-zinc-500">Campaign</th>
                <th className="text-left p-4 font-medium text-zinc-500">Influencer</th>
                <th className="text-left p-4 font-medium text-zinc-500">Platform</th>
                <th className="text-left p-4 font-medium text-zinc-500">Status</th>
                <th className="text-left p-4 font-medium text-zinc-500">Progress</th>
                <th className="text-left p-4 font-medium text-zinc-500">Deadline</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c, i) => (
                <tr key={i} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-zinc-500" />
                      </div>
                      <span className="font-medium">{c.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-zinc-600 dark:text-zinc-400">{c.influencer}</td>
                  <td className="p-4 text-zinc-600 dark:text-zinc-400">{c.platform}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[c.status]}`}>{c.status}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                        <div className={`h-full rounded-full ${progressColors[c.color]} ${c.progress === 100 ? "" : ""}`} style={{ width: `${c.progress}%` }} />
                      </div>
                      <span className="text-xs text-zinc-500">{c.progress}%</span>
                    </div>
                  </td>
                  <td className="p-4 text-zinc-600 dark:text-zinc-400">{c.deadline}</td>
                  <td className="p-4">
                    <button className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700"><MoreHorizontal className="w-4 h-4 text-zinc-400" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </FeaturePage>
  );
}
