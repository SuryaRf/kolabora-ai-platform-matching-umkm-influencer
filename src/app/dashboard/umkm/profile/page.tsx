"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Save, Store, Upload, UserCog } from "lucide-react";
import FeaturePage from "@/components/dashboard/FeaturePage";
import { useSession } from "next-auth/react";

interface ProfileResponse {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  umkmProfile: {
    businessName: string;
    category: string;
    description: string | null;
    location: string | null;
    website: string | null;
    logoUrl: string | null;
  } | null;
}

export default function UMKMProfilePage() {
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    businessName: "",
    category: "",
    description: "",
    location: "",
    website: "",
    logoUrl: "",
  });

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/profile", { cache: "no-store" });
      if (!res.ok) return;
      const data: ProfileResponse = await res.json();
      setForm({
        name: data.name ?? "",
        businessName: data.umkmProfile?.businessName ?? "",
        category: data.umkmProfile?.category ?? "",
        description: data.umkmProfile?.description ?? "",
        location: data.umkmProfile?.location ?? "",
        website: data.umkmProfile?.website ?? "",
        logoUrl: data.umkmProfile?.logoUrl ?? data.image ?? "",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const uploadLogo = async (file: File) => {
    setUploading(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Upload logo gagal");
        return;
      }
      setForm((f) => ({ ...f, logoUrl: data.url }));
    } catch {
      setError("Upload logo gagal");
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
          businessName: form.businessName,
          category: form.category,
          description: form.description,
          location: form.location,
          website: form.website,
          logoUrl: form.logoUrl,
          image: form.logoUrl || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal menyimpan profil");
        return;
      }
      setNotice("Profil usaha berhasil disimpan.");
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
      title="Profil Usaha"
      description="Informasi ini digunakan influencer untuk mengenal bisnis Anda dan ditampilkan pada campaign yang Anda buat."
      icon={Store}
      gradient="bg-umkm"
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
            <UserCog className="w-4 h-4" /> Logo Usaha
          </h3>
          <div className="flex flex-col items-center gap-3">
            <div className="w-28 h-28 rounded-2xl bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex items-center justify-center">
              {form.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.logoUrl}
                  alt="Logo"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Store className="w-10 h-10 text-zinc-300" />
              )}
            </div>
            <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700">
              {uploading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5" />
              )}
              {uploading ? "Mengunggah..." : "Unggah Logo"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void uploadLogo(file);
                }}
              />
            </label>
            <p className="text-[10px] text-zinc-400 text-center">
              Atau tempel URL logo di kolom kanan.
            </p>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5">
                Nama Pemilik / PIC
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-umkm/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">
                Nama Usaha
              </label>
              <input
                required
                value={form.businessName}
                onChange={(e) =>
                  setForm({ ...form, businessName: e.target.value })
                }
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-umkm/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">
                Kategori Usaha
              </label>
              <input
                required
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="Kuliner, Fashion, Skincare..."
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-umkm/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">
                Lokasi
              </label>
              <input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Yogyakarta"
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-umkm/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">
                Website / Link Toko
              </label>
              <input
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                placeholder="https://..."
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-umkm/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">
                URL Logo
              </label>
              <input
                value={form.logoUrl}
                onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                placeholder="https://..."
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-umkm/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5">
              Deskripsi Usaha
            </label>
            <textarea
              rows={5}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Ceritakan produk unggulan, keunikan, dan target pasar usaha Anda."
              className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-umkm/50"
            />
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <p className="text-[11px] text-zinc-400">
              Email akun: {session?.user?.email}
            </p>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-umkm hover:bg-umkm-dark disabled:opacity-50"
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
