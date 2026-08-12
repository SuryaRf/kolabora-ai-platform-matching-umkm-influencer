"use client";

import { TrendingUp, Target, Users, Clock, Zap, Bot, Eye, ArrowRight, LayoutDashboard, MessageSquare, BarChart3 } from "lucide-react";
import Link from "next/link";

const stats = [
  { icon: TrendingUp, label: "Total Campaign", value: "12", change: "+3", positive: true, color: "bg-kolabora" },
  { icon: Target, label: "AI Match Rate", value: "94%", change: "+5%", positive: true, color: "bg-emerald-500" },
  { icon: Users, label: "Kolaborasi Aktif", value: "4", change: "+2", positive: true, color: "bg-amber-500" },
  { icon: Clock, label: "Menunggu Respon", value: "3", change: "-1", positive: false, color: "bg-rose-500" },
];

const quickActions = [
  { icon: Zap, label: "Smart Matching", href: "/dashboard/umkm/smart-matching", color: "bg-kolabora" },
  { icon: Bot, label: "AI Assistant", href: "/dashboard/umkm/skill-assistant", color: "bg-umkm" },
  { icon: LayoutDashboard, label: "Campaign", href: "/dashboard/umkm/campaigns", color: "bg-sky-500" },
  { icon: MessageSquare, label: "Chat", href: "/dashboard/umkm/chat", color: "bg-emerald-500" },
  { icon: Eye, label: "Review Campaign", href: "/dashboard/umkm/review-campaign", color: "bg-purple-500" },
  { icon: BarChart3, label: "Analytics", href: "/dashboard/umkm/analytics", color: "bg-rose-500" },
];

const recentMatches = [
  { name: "Sarah Beauty", niche: "Kecantikan", match: "96%", avatar: "SB", color: "bg-pink-500" },
  { name: "TechReview ID", niche: "Teknologi", match: "92%", avatar: "TR", color: "bg-blue-500" },
  { name: "Kuliner Jalanan", niche: "Kuliner", match: "89%", avatar: "KJ", color: "bg-orange-500" },
];

export default function UMKMOverview() {
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard UMKM</h1>
        <p className="text-sm text-zinc-500 mt-1">Selamat datang kembali! Kelola kampanye dan temukan influencer terbaik.</p>
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
            <h3 className="font-semibold text-sm">Rekomendasi AI Terbaru</h3>
            <Link href="/dashboard/umkm/smart-matching" className="text-xs text-kolabora hover:underline flex items-center gap-1">Lihat Semua <ArrowRight className="w-3 h-3" /></Link>
          </div>
          <div className="space-y-3">
            {recentMatches.map((m, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${m.color} flex items-center justify-center text-white text-xs font-bold`}>{m.avatar}</div>
                  <div>
                    <p className="text-sm font-medium">{m.name}</p>
                    <p className="text-xs text-zinc-500">{m.niche}</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-emerald-500">{m.match}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
