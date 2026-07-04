"use client";

import { useState } from "react";
import { Sparkles, Mail, Lock, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-zinc-50 to-white dark:from-zinc-950 dark:to-black">
      <nav className="p-4">
        <Link href="/" className="inline-flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-kolabora" />
          <span className="text-lg font-bold text-gradient">Kolabora</span>
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold mb-2">Selamat Datang Kembali</h1>
              <p className="text-sm text-zinc-500">
                Masuk ke akun Kolabora Anda
              </p>
            </div>

            <form
              onSubmit={(e) => e.preventDefault()}
              className="space-y-4"
            >
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
                    placeholder="Masukkan kata sandi"
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

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="rounded border-zinc-300 text-kolabora focus:ring-kolabora/50"
                  />
                  <span className="text-xs text-zinc-500">Ingat saya</span>
                </label>
                <button
                  type="button"
                  className="text-xs text-kolabora hover:underline"
                >
                  Lupa sandi?
                </button>
              </div>

              <Link
                href="/dashboard"
                className="block w-full text-center py-2.5 rounded-xl text-sm font-semibold text-white bg-kolabora hover:bg-kolabora-dark transition-all shadow-lg shadow-kolabora/25"
              >
                Masuk
              </Link>
            </form>

            <p className="text-center text-xs text-zinc-500 mt-6">
              Belum punya akun?{" "}
              <Link
                href="/register"
                className="text-kolabora font-medium hover:underline"
              >
                Daftar sekarang
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
