"use client";

import { Store, Camera, ArrowRight, Zap, TrendingUp, Users, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function DashboardLanding() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-black">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="text-center mb-12">
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <Image src="/logo.png" alt="Kolabora" width={40} height={40} className="w-10 h-10" />
            <span className="text-xl font-bold text-gradient">Kolabora</span>
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Dashboard Kolabora</h1>
          <p className="text-zinc-500">Pilih peran Anda untuk memulai</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          <Link
            href="/dashboard/umkm"
            className="group relative bg-white dark:bg-zinc-900 rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 hover:border-umkm/50 p-8 transition-all hover:shadow-xl hover:-translate-y-1"
          >
            <div className="w-16 h-16 rounded-2xl bg-umkm flex items-center justify-center mb-5 shadow-lg">
              <Store className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold mb-2">UMKM</h2>
            <p className="text-sm text-zinc-500 mb-6">Kelola campaign, temukan influencer, dan optimalkan strategi pemasaran digital Anda dengan bantuan AI.</p>
            <div className="flex items-center gap-2 text-umkm text-sm font-semibold group-hover:gap-3 transition-all">
              Masuk ke Dashboard UMKM <ArrowRight className="w-4 h-4" />
            </div>
            <div className="mt-6 flex items-center gap-4 text-xs text-zinc-400">
              <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5" /> 6 Fitur MVP</span>
              <span className="flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> Smart Matching</span>
            </div>
          </Link>

          <Link
            href="/dashboard/influencer"
            className="group relative bg-white dark:bg-zinc-900 rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 hover:border-influencer/50 p-8 transition-all hover:shadow-xl hover:-translate-y-1"
          >
            <div className="w-16 h-16 rounded-2xl bg-influencer flex items-center justify-center mb-5 shadow-lg">
              <Camera className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold mb-2">Influencer</h2>
            <p className="text-sm text-zinc-500 mb-6">Tingkatkan personal branding, temukan proyek kolaborasi, dan optimalkan tarif dengan kecerdasan AI.</p>
            <div className="flex items-center gap-2 text-influencer text-sm font-semibold group-hover:gap-3 transition-all">
              Masuk ke Dashboard Influencer <ArrowRight className="w-4 h-4" />
            </div>
            <div className="mt-6 flex items-center gap-4 text-xs text-zinc-400">
              <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5" /> 6 Fitur MVP</span>
              <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5" /> Portfolio &amp; Performance</span>
            </div>
          </Link>
        </div>

        <div className="mt-12 text-center">
          <p className="text-xs text-zinc-400">
            Powered by Kolabora AI Smart Matching System
          </p>
        </div>
      </div>
    </div>
  );
}
