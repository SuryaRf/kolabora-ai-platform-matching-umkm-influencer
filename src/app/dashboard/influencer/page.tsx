"use client";

import { TrendingUp, Target, Users, Clock, Zap, PieChart, Wand2, DollarSign, FileText, ArrowRight } from "lucide-react";
import Link from "next/link";

const stats = [
  { icon: TrendingUp, label: "Total Campaign", value: "8", change: "+3", positive: true, color: "bg-kolabora" },
  { icon: Target, label: "AI Match Rate", value: "91%", change: "+6%", positive: true, color: "bg-emerald-500" },
  { icon: Users, label: "Total Followers", value: "135.6K", change: "+4.2K", positive: true, color: "bg-amber-500" },
  { icon: Clock, label: "Pending Offers", value: "2", change: "+1", positive: false, color: "bg-rose-500" },
];

const quickActions = [
  { icon: Zap, label: "Smart Matching", href: "/dashboard/influencer/smart-matching", color: "bg-kolabora" },
  { icon: PieChart, label: "Portfolio", href: "/dashboard/influencer/portfolio", color: "bg-purple-500" },
  { icon: Wand2, label: "Optimizer", href: "/dashboard/influencer/profile-optimizer", color: "bg-influencer" },
  { icon: DollarSign, label: "Rate", href: "/dashboard/influencer/rate-recommendation", color: "bg-emerald-500" },
  { icon: FileText, label: "Auto-Script", href: "/dashboard/influencer/auto-script", color: "bg-sky-500" },
  { icon: Users, label: "Directory", href: "/dashboard/influencer/directory", color: "bg-kolabora-dark" },
];

const campaignUpdates = [
  { brand: "Kopi Nusantara", status: "Review", statusColor: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" },
  { brand: "Skincare Glowing", status: "Produksi", statusColor: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" },
  { brand: "TechGadget ID", status: "Diterima", statusColor: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" },
];

export default function InfluencerOverview() {
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard Influencer</h1>
        <p className="text-sm text-zinc-500 mt-1">Pantau performa, kelola campaign, dan temukan peluang kolaborasi baru.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center`}>
                <s.icon className="w-5 h-5 text-white" />
              </div>
              <span className={`text-xs font-semibold ${s.positive ? "text-emerald-500" : "text-red-500"}`}>{s.change}</span>
            </div>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-zinc-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
          <h3 className="font-semibold text-sm mb-4">Akses Cepat</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {quickActions.map((qa, i) => (
              <Link key={i} href={qa.href} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all text-center group">
                <div className={`w-10 h-10 rounded-xl ${qa.color} flex items-center justify-center`}>
                  <qa.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{qa.label}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm">Update Campaign</h3>
            <Link href="/dashboard/influencer/campaigns" className="text-xs text-kolabora hover:underline flex items-center gap-1">Lihat Semua <ArrowRight className="w-3 h-3" /></Link>
          </div>
          <div className="space-y-3">
            {campaignUpdates.map((c, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800">
                <span className="text-sm font-medium">{c.brand}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${c.statusColor}`}>{c.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
