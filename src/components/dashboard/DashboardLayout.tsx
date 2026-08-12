"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Search,
  LayoutDashboard,
  MessageSquare,
  BarChart3,
  LogOut,
  Store,
  Camera,
  Zap,
  Bot,
  PieChart,
  ChevronLeft,
  ChevronRight,
  X,
  Menu,
  Eye,
} from "lucide-react";
import Image from "next/image";

interface NavItem {
  icon: typeof LayoutDashboard;
  label: string;
  href: string;
}

const umkmNav: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Zap, label: "AI Smart Matching", href: "/dashboard/umkm/smart-matching" },
  { icon: Bot, label: "AI Skill Assistant", href: "/dashboard/umkm/skill-assistant" },
  { icon: LayoutDashboard, label: "Campaign Dashboard", href: "/dashboard/umkm/campaigns" },
  { icon: MessageSquare, label: "Chat & Collaboration", href: "/dashboard/umkm/chat" },
  { icon: Eye, label: "Review Campaign", href: "/dashboard/umkm/review-campaign" },
  { icon: BarChart3, label: "Campaign Analytics", href: "/dashboard/umkm/analytics" },
];

const influencerNav: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Zap, label: "AI Smart Matching", href: "/dashboard/influencer/smart-matching" },
  { icon: PieChart, label: "Portfolio & Performance", href: "/dashboard/influencer/portfolio" },
  { icon: Bot, label: "AI Content Assistant", href: "/dashboard/influencer/ai-content-assistant" },
  { icon: LayoutDashboard, label: "Campaign Dashboard", href: "/dashboard/influencer/campaigns" },
  { icon: MessageSquare, label: "Chat & Collaboration", href: "/dashboard/influencer/chat" },
  { icon: BarChart3, label: "Campaign Analytics", href: "/dashboard/influencer/analytics" },
];

const roleConfig = {
  umkm: { nav: umkmNav, icon: Store, label: "UMKM", color: "text-umkm", gradient: "from-amber-50 to-orange-50", border: "border-umkm/20" },
  influencer: { nav: influencerNav, icon: Camera, label: "Influencer", color: "text-influencer", gradient: "from-pink-50 to-rose-50", border: "border-influencer/20" },
};

export default function DashboardLayout({
  children,
  role,
}: {
  children: React.ReactNode;
  role: "umkm" | "influencer";
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const config = roleConfig[role];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex">
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 transition-all duration-300 flex flex-col ${
          collapsed ? "w-16" : "w-64"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
          <Link href="/" className={`flex items-center gap-2 ${collapsed ? "justify-center w-full" : ""}`}>
            <Image src="/logo.png" alt="Kolabora" width={28} height={28} className="w-7 h-7 flex-shrink-0" />
            {!collapsed && <span className="text-lg font-bold text-gradient">Kolabora</span>}
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:block p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            {collapsed ? <ChevronRight className="w-4 h-4 text-zinc-400" /> : <ChevronLeft className="w-4 h-4 text-zinc-400" />}
          </button>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        <div className={`px-3 py-2 border-b border-zinc-200 dark:border-zinc-800 ${collapsed ? "text-center" : ""}`}>
          <div className={`flex items-center gap-2 px-2 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 ${collapsed ? "justify-center" : ""}`}>
            <config.icon className={`w-4 h-4 ${config.color}`} />
            {!collapsed && <span className={`text-xs font-semibold ${config.color}`}>{config.label}</span>}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {config.nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  active
                    ? "bg-gradient-to-r from-kolabora/10 to-influencer/10 text-kolabora font-medium"
                    : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                } ${collapsed ? "justify-center" : ""}`}
                title={collapsed ? item.label : undefined}
                onClick={() => setMobileOpen(false)}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800">
          <Link
            href="/"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all ${collapsed ? "justify-center" : ""}`}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>Keluar</span>}
          </Link>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3">
            <div className="flex items-center gap-4">
              <button className="lg:hidden p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800" onClick={() => setMobileOpen(true)}>
                <Menu className="w-5 h-5 text-zinc-500" />
              </button>
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder={role === "umkm" ? "Cari influencer..." : "Cari kampanye..."}
                  className="w-64 pl-10 pr-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-kolabora/50"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="relative p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <Bell className="w-5 h-5 text-zinc-500" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-influencer rounded-full" />
              </button>
              <div className="w-8 h-8 rounded-full bg-kolabora flex items-center justify-center text-white text-xs font-bold">
                K
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
