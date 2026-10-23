"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  BarChart3,
  LogOut,
  Store,
  Camera,
  Zap,
  PieChart,
  ChevronLeft,
  ChevronRight,
  X,
  Menu,
  Eye,
  History,
  Megaphone,
  Wallet,
  UserCog,
  Search,
} from "lucide-react";
import Image from "next/image";
import { signOut } from "next-auth/react";
import NotificationBell from "@/components/dashboard/NotificationBell";
import { initialsOf } from "@/lib/avatar";

interface NavItem {
  icon: typeof LayoutDashboard;
  label: string;
  href: string;
}

export interface DashboardUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: "UMKM" | "INFLUENCER";
}

const umkmNav: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard/umkm" },
  { icon: Megaphone, label: "Campaign Saya", href: "/dashboard/umkm/campaigns" },
  { icon: Zap, label: "AI Smart Matching", href: "/dashboard/umkm/smart-matching" },
  { icon: History, label: "Riwayat Kolaborasi", href: "/dashboard/umkm/history" },
  { icon: MessageSquare, label: "Chat & Collaboration", href: "/dashboard/umkm/chat" },
  { icon: Eye, label: "Review Konten", href: "/dashboard/umkm/review-campaign" },
  { icon: BarChart3, label: "Campaign Analytics", href: "/dashboard/umkm/analytics" },
  { icon: UserCog, label: "Profil Usaha", href: "/dashboard/umkm/profile" },
];

const influencerNav: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard/influencer" },
  { icon: Search, label: "Cari Campaign", href: "/dashboard/influencer/discover" },
  { icon: Wallet, label: "Campaign Saya", href: "/dashboard/influencer/campaigns" },
  { icon: Zap, label: "AI Smart Matching", href: "/dashboard/influencer/smart-matching" },
  { icon: History, label: "Riwayat Kolaborasi", href: "/dashboard/influencer/history" },
  { icon: MessageSquare, label: "Chat & Collaboration", href: "/dashboard/influencer/chat" },
  { icon: PieChart, label: "Portfolio & Performance", href: "/dashboard/influencer/portfolio" },
  { icon: BarChart3, label: "Campaign Analytics", href: "/dashboard/influencer/analytics" },
  { icon: UserCog, label: "Profil Influencer", href: "/dashboard/influencer/profile" },
];

const roleConfig = {
  UMKM: {
    nav: umkmNav,
    icon: Store,
    label: "UMKM",
    color: "text-umkm",
    chip: "bg-umkm/10 text-umkm",
    home: "/dashboard/umkm",
  },
  INFLUENCER: {
    nav: influencerNav,
    icon: Camera,
    label: "Influencer",
    color: "text-influencer",
    chip: "bg-influencer/10 text-influencer",
    home: "/dashboard/influencer",
  },
};

export default function DashboardLayout({
  children,
  role,
  user,
}: {
  children: React.ReactNode;
  role: "UMKM" | "INFLUENCER";
  user: DashboardUser;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const config = roleConfig[role];
  const RoleIcon = config.icon;

  const displayName =
    user.name ?? (role === "UMKM" ? "Pemilik Usaha" : "Influencer");

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex">
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 transition-all duration-300 flex flex-col ${
          collapsed ? "w-16" : "w-64"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
          <Link
            href="/"
            className={`flex items-center gap-2 ${collapsed ? "justify-center w-full" : ""}`}
          >
            <Image
              src="/logo.png"
              alt="Kolabora"
              width={28}
              height={28}
              className="w-7 h-7 flex-shrink-0"
            />
            {!collapsed && (
              <span className="text-lg font-bold text-gradient">Kolabora</span>
            )}
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:block p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label="Lipat sidebar"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4 text-zinc-400" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-zinc-400" />
            )}
          </button>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label="Tutup menu"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        <div
          className={`px-3 py-2 border-b border-zinc-200 dark:border-zinc-800 ${
            collapsed ? "text-center" : ""
          }`}
        >
          <div
            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg ${
              config.chip
            } ${collapsed ? "justify-center" : ""}`}
          >
            <RoleIcon className="w-4 h-4" />
            {!collapsed && (
              <span className="text-xs font-semibold">{config.label}</span>
            )}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {config.nav.map((item) => {
            const isHome = item.href === config.home;
            const active = isHome
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
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
          <div
            className={`flex items-center gap-2 px-2 py-2 mb-1 ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-kolabora flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden">
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.image}
                  alt={displayName}
                  className="w-8 h-8 object-cover"
                />
              ) : (
                initialsOf(displayName)
              )}
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate">{displayName}</p>
                <p className="text-[10px] text-zinc-400 truncate">
                  {user.email}
                </p>
              </div>
            )}
          </div>
          <button
            onClick={() => void signOut({ callbackUrl: "/" })}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>Keluar</span>}
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3">
            <div className="flex items-center gap-3">
              <button
                className="lg:hidden p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                onClick={() => setMobileOpen(true)}
                aria-label="Buka menu"
              >
                <Menu className="w-5 h-5 text-zinc-500" />
              </button>
              <div>
                <p className="text-xs text-zinc-400">Dashboard</p>
                <p className="text-sm font-semibold">{config.label}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell />
              <Link
                href={
                  role === "UMKM"
                    ? "/dashboard/umkm/profile"
                    : "/dashboard/influencer/profile"
                }
                className="w-9 h-9 rounded-full bg-kolabora flex items-center justify-center text-white text-xs font-bold overflow-hidden"
                title={displayName}
              >
                {user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.image}
                    alt={displayName}
                    className="w-9 h-9 object-cover"
                  />
                ) : (
                  initialsOf(displayName)
                )}
              </Link>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
