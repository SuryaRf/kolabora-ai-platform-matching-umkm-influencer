"use client";

import { useState } from "react";
import { Mail, Lock, Store, Camera, Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function RegisterPage() {
  const [role, setRole] = useState<"umkm" | "influencer" | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-zinc-50 to-white dark:from-zinc-950 dark:to-black">
      <nav className="p-4">
        <Link href="/" className="inline-flex items-center gap-2">
          <Image src="/logo.png" alt="Kolabora" width={32} height={32} className="w-8 h-8" />
          <span className="text-lg font-bold text-gradient">Kolabora</span>
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold mb-2">Daftar Akun</h1>
              <p className="text-sm text-zinc-500">
                Bergabung dengan ribuan UMKM & Influencer
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-3">
                Daftar sebagai
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("umkm")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    role === "umkm"
                      ? "border-umkm bg-amber-50 dark:bg-amber-900/20"
                      : "border-zinc-200 dark:border-zinc-700 hover:border-umkm/50"
                  }`}
                >
                  <Store
                    className={`w-6 h-6 ${
                      role === "umkm" ? "text-umkm" : "text-zinc-400"
                    }`}
                  />
                  <span
                    className={`text-xs font-medium ${
                      role === "umkm" ? "text-umkm" : "text-zinc-500"
                    }`}
                  >
                    UMKM
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("influencer")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    role === "influencer"
                      ? "border-influencer bg-rose-50 dark:bg-rose-900/20"
                      : "border-zinc-200 dark:border-zinc-700 hover:border-influencer/50"
                  }`}
                >
                  <Camera
                    className={`w-6 h-6 ${
                      role === "influencer" ? "text-influencer" : "text-zinc-400"
                    }`}
                  />
                  <span
                    className={`text-xs font-medium ${
                      role === "influencer"
                        ? "text-influencer"
                        : "text-zinc-500"
                    }`}
                  >
                    Influencer
                  </span>
                </button>
              </div>
            </div>

            <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Nama Depan
                  </label>
                  <input
                    type="text"
                    placeholder="Nama"
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-kolabora/50 focus:border-kolabora transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Nama Belakang
                  </label>
                  <input
                    type="text"
                    placeholder="Belakang"
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-kolabora/50 focus:border-kolabora transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="email"
                    placeholder="nama@email.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-kolabora/50 focus:border-kolabora transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Kata Sandi
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 8 karakter"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-kolabora/50 focus:border-kolabora transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-zinc-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-zinc-400" />
                    )}
                  </button>
                </div>
              </div>

              <Link
                href="/dashboard"
                className="block w-full text-center py-2.5 rounded-xl text-sm font-semibold text-white bg-kolabora hover:bg-kolabora-dark transition-all shadow-lg shadow-kolabora/25"
              >
                Buat Akun
              </Link>
            </form>

            <p className="text-center text-xs text-zinc-500 mt-6">
              Sudah punya akun?{" "}
              <Link
                href="/login"
                className="text-kolabora font-medium hover:underline"
              >
                Masuk
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
