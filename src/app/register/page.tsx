"use client";

import { useState } from "react";
import { Mail, Lock, Store, Camera, Eye, EyeOff, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<"UMKM" | "INFLUENCER" | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [category, setCategory] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) {
      setError("Pilih peran Anda terlebih dahulu");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          businessName: role === "UMKM" ? businessName : undefined,
          displayName: role === "INFLUENCER" ? displayName : undefined,
          category,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Pendaftaran gagal");
      } else {
        router.push("/login?registered=true");
      }
    } catch (err) {
      setError("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

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
                  onClick={() => setRole("UMKM")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    role === "UMKM"
                      ? "border-umkm bg-amber-50 dark:bg-amber-900/20"
                      : "border-zinc-200 dark:border-zinc-700 hover:border-umkm/50"
                  }`}
                >
                  <Store
                    className={`w-6 h-6 ${
                      role === "UMKM" ? "text-umkm" : "text-zinc-400"
                    }`}
                  />
                  <span
                    className={`text-xs font-medium ${
                      role === "UMKM" ? "text-umkm" : "text-zinc-500"
                    }`}
                  >
                    UMKM
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("INFLUENCER")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    role === "INFLUENCER"
                      ? "border-influencer bg-rose-50 dark:bg-rose-900/20"
                      : "border-zinc-200 dark:border-zinc-700 hover:border-influencer/50"
                  }`}
                >
                  <Camera
                    className={`w-6 h-6 ${
                      role === "INFLUENCER" ? "text-influencer" : "text-zinc-400"
                    }`}
                  />
                  <span
                    className={`text-xs font-medium ${
                      role === "INFLUENCER"
                        ? "text-influencer"
                        : "text-zinc-500"
                    }`}
                  >
                    Influencer
                  </span>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama Lengkap"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-kolabora/50 focus:border-kolabora transition-colors"
                />
              </div>

              {role === "UMKM" && (
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Nama Usaha / Bisnis
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Nama Brand / Toko"
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-kolabora/50 focus:border-kolabora transition-colors"
                  />
                </div>
              )}

              {role === "INFLUENCER" && (
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Username / Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="@username"
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-kolabora/50 focus:border-kolabora transition-colors"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Kategori
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Contoh: Kuliner, Fashion, Gadget"
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-kolabora/50 focus:border-kolabora transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    required
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 karakter"
                    required
                    minLength={8}
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

              <button
                type="submit"
                disabled={loading}
                className="block w-full text-center py-2.5 rounded-xl text-sm font-semibold text-white bg-kolabora hover:bg-kolabora-dark transition-all shadow-lg shadow-kolabora/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Buat Akun"}
              </button>
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
