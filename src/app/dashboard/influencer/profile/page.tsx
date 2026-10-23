"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Camera,
  Loader2,
  Save,
  Upload,
  UserCog,
  Wallet,
} from "lucide-react";
import FeaturePage from "@/components/dashboard/FeaturePage";
import { useSession } from "next-auth/react";

interface ProfileResponse {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  influencerProfile: {
    displayName: string;
    category: string;
    bio: string | null;
    location: string | null;
    followers: number;
    engagement: number;
    rateMin: number | null;
    rateMax: number | null;
    niches: string[];
    platforms: unknown;
  } | null;
}

export default function InfluencerProfilePage() {
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    displayName: "",
    category: "",
    bio: "",
    location: "",
    followers: "",
    engagement: "",
    rateMin: "",
    rateMax: "",
    niches: "",
    platforms: "",
    image: "",
  });

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/profile", { cache: "no-store" });
      if (!res.ok) return;
      const data: ProfileResponse = await res.json();
      const p = data.influencerProfile;
      setForm({
        name: data.name ?? "",
        displayName: p?.displayName ?? data.name ?? "",
        category: p?.category ?? "",
        bio: p?.bio ?? "",
        location: p?.location ?? "",
        followers: p ? String(p.followers) : "",
        engagement: p ? String(p.engagement) : "",
        rateMin: p?.rateMin != null ? String(p.rateMin) : "",
        rateMax: p?.rateMax != null ? String(p.rateMax) : "",
        niches: p?.niches?.join(", ") ?? "",
        platforms: Array.isArray(p?.platforms)
          ? (p?.platforms as string[]).join(", ")
          : "",
        image: data.image ?? "",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const uploadAvatar = async (file: File) => {
    setUploading(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Upload foto gagal");
        return;
      }
      setForm((f) => ({ ...f, image: data.url }));
    } catch {
      setError("Upload foto gagal");
    } finally {
      setUploading(false);
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          displayName: form.displayName,
          category: form.category,
          bio: form.bio,
          location: form.location,
          followers: form.followers ? Number(form.followers) : 0,
          engagement: form.engagement ? Number(form.engagement) : 0,
          rateMin: form.rateMin ? Number(form.rateMin) : null,
          rateMax: form.rateMax ? Number(form.rateMax) : null,
          niches: form.niches
            .split(",")
            .map((n) => n.trim())
            .filter(Boolean),
          platforms: form.platforms
            .split(",")
            .map((p) => p.trim())
            .filter(Boolean),
          image: form.image || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal menyimpan profil");
        return;
      }
      setNotice("Profil influencer berhasil disimpan.");
      await update();
    } catch {
      setError("Gagal menyimpan profil");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-sm text-zinc-500">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Memuat profil...
      </div>
    );
  }

  return (
    <FeaturePage
      title="Profil Influencer"
      description="Semakin lengkap profil Anda, semakin akurat rekomendasi AI Smart Matching dan semakin besar peluang diterima brand."
      icon={Camera}
      gradient="bg-influencer"
    >
      {notice && (
        <div className="px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 text-sm text-emerald-700 dark:text-emerald-400">
          {notice}
        </div>
      )}
      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={save} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 h-fit">
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <UserCog className="w-4 h-4" /> Foto Profil
          </h3>
          <div className="flex flex-col items-center gap-3">
            <div className="w-28 h-28 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex items-center justify-center">
              {form.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.image}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Camera className="w-10 h-10 text-zinc-300" />
              )}
            </div>
            <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700">
              {uploading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5" />
              )}
              {uploading ? "Mengunggah..." : "Unggah Foto"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void uploadAvatar(file);
                }}
              />
            </label>
          </div>

          <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500">Followers</span>
              <span className="font-semibold">
                {Number(form.followers || 0).toLocaleString("id-ID")}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500">Engagement</span>
              <span className="font-semibold">{form.engagement || 0}%</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500">Tarif</span>
              <span className="font-semibold">
                {form.rateMin
                  ? `Rp ${Number(form.rateMin).toLocaleString("id-ID")}`
                  : "Nego"}
              </span>
            </div>
          </div>

          <Link
            href="/dashboard/influencer/portfolio"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-influencer"
          >
            <Wallet className="w-3.5 h-3.5" /> Kelola Portfolio{" "}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5">
                Nama Lengkap
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-influencer/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">
                Nama Tampilan / Username
              </label>
              <input
                required
                value={form.displayName}
                onChange={(e) =>
                  setForm({ ...form, displayName: e.target.value })
                }
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-influencer/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">
                Kategori Utama
              </label>
              <input
                required
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="Kuliner, Kecantikan, Teknologi..."
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-influencer/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">
                Lokasi
              </label>
              <input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Jakarta"
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-influencer/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">
                Total Followers
              </label>
              <input
                type="number"
                min={0}
                value={form.followers}
                onChange={(e) =>
                  setForm({ ...form, followers: e.target.value })
                }
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-influencer/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">
                Engagement Rate (%)
              </label>
              <input
                type="number"
                min={0}
                step="0.1"
                value={form.engagement}
                onChange={(e) =>
                  setForm({ ...form, engagement: e.target.value })
                }
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-influencer/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">
                Tarif Minimum (Rp)
              </label>
              <input
                type="number"
                min={0}
                value={form.rateMin}
                onChange={(e) =>
                  setForm({ ...form, rateMin: e.target.value })
                }
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-influencer/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">
                Tarif Maksimum (Rp)
              </label>
              <input
                type="number"
                min={0}
                value={form.rateMax}
                onChange={(e) =>
                  setForm({ ...form, rateMax: e.target.value })
                }
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-influencer/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5">
              Niche (pisahkan dengan koma)
            </label>
            <input
              value={form.niches}
              onChange={(e) => setForm({ ...form, niches: e.target.value })}
              placeholder="Kuliner, Food Review, Travel"
              className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-influencer/50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5">
              Platform (pisahkan dengan koma)
            </label>
            <input
              value={form.platforms}
              onChange={(e) => setForm({ ...form, platforms: e.target.value })}
              placeholder="Instagram, TikTok, YouTube"
              className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-influencer/50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5">
              Bio
            </label>
            <textarea
              rows={4}
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="Ceritakan gaya konten, audiens, dan pengalaman kolaborasi Anda."
              className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-influencer/50"
            />
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <p className="text-[11px] text-zinc-400">
              Email akun: {session?.user?.email}
            </p>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-influencer hover:bg-influencer-dark disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Simpan Profil
            </button>
          </div>
        </div>
      </form>
    </FeaturePage>
  );
}
