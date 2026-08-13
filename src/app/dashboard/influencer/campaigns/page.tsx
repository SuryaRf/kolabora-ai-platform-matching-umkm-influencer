"use client";

import { LayoutDashboard, MoreHorizontal, CheckCircle, Clock, AlertCircle, FileText, ArrowRight } from "lucide-react";
import FeaturePage from "@/components/dashboard/FeaturePage";

const campaigns = [
  { brand: "Kopi Nusantara", type: "Instagram & TikTok", brief: "Promosi produk kopi premium", budget: "Rp 4 Jt", status: "Review", deadline: "5 hari", progress: 60, color: "emerald" },
  { brand: "Skincare Glowing", type: "YouTube Video", brief: "Review skincare lengkap", budget: "Rp 5 Jt", status: "Produksi", deadline: "2 hari", progress: 85, color: "amber" },
  { brand: "TechGadget ID", type: "TikTok", brief: "Unboxing & review gadget", budget: "Rp 7 Jt", status: "Dikonfirmasi", deadline: "14 hari", progress: 15, color: "blue" },
  { brand: "Sporty Apparel", type: "Instagram", brief: "Promo koleksi olahraga", budget: "Rp 2,5 Jt", status: "Selesai", deadline: "Selesai", progress: 100, color: "emerald" },
  { brand: "Bali Retreat", type: "Instagram & TikTok", brief: "Viral challenge campaign", budget: "Rp 6 Jt", status: "Negosiasi", deadline: "-", progress: 0, color: "purple" },
];

const statusStyles: Record<string, string> = {
  Negosiasi: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
  Dikonfirmasi: "bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400",
  Produksi: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400",
  Review: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
  Selesai: "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400",
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
      description="Dasbor bersama untuk memantau status proyek, linimasa, dan draf konten secara kolaboratif."
      icon={LayoutDashboard}
      gradient="bg-kolabora"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {["Semua", "Negosiasi", "Dikonfirmasi", "Produksi", "Review", "Selesai"].map((s) => (
            <button key={s} className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${s === "Semua" ? "bg-kolabora text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"}`}>{s}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {campaigns.map((c, i) => (
          <div key={i} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-semibold">{c.brand}</p>
                <p className="text-xs text-zinc-500">{c.type}</p>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[c.status]}`}>{c.status}</span>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-3">{c.brief}</p>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                <div className={`h-full rounded-full ${progressColors[c.color]}`} style={{ width: `${c.progress}%` }} />
              </div>
              <span className="text-xs text-zinc-500">{c.progress}%</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-zinc-400" />
                <span className="text-zinc-500">{c.deadline}</span>
              </div>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">{c.budget}</span>
            </div>
          </div>
        ))}
      </div>
    </FeaturePage>
  );
}
