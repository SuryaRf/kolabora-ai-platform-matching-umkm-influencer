"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Camera,
  ExternalLink,
  Image as ImageIcon,
  Loader2,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import FeaturePage from "@/components/dashboard/FeaturePage";
import Modal from "@/components/ui/Modal";

interface PortfolioItem {
  id: string;
  title: string;
  imageUrl: string;
  link: string | null;
  createdAt: string;
}

interface Profile {
  influencerProfile: {
    displayName: string;
    followers: number;
    engagement: number;
    category: string;
  } | null;
}

export default function PortfolioPage() {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [profile, setProfile] = useState<Profile["influencerProfile"]>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const load = useCallback(async () => {
    try {
      const [portfolioRes, profileRes] = await Promise.all([
        fetch("/api/portfolio", { cache: "no-store" }),
        fetch("/api/profile", { cache: "no-store" }),
      ]);
      if (portfolioRes.ok) setItems(await portfolioRes.json());
      if (profileRes.ok) {
        const data: Profile = await profileRes.json();
        setProfile(data.influencerProfile);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const resetForm = () => {
    setTitle("");
    setLink("");
    setImageUrl("");
    setFile(null);
    setError("");
  };

  const submit = async () => {
    if (!title) return;
    setSaving(true);
    setError("");
    try {
      let res: Response;
      if (file) {
        const body = new FormData();
        body.append("file", file);
        body.append("title", title);
        if (link) body.append("link", link);
        res = await fetch("/api/portfolio", { method: "POST", body });
      } else {
        res = await fetch("/api/portfolio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, link, imageUrl }),
        });
      }
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal menambah portfolio");
        return;
      }
      setOpen(false);
      resetForm();
      await load();
    } catch {
      setError("Gagal menambah portfolio");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Hapus item portfolio ini?")) return;
    await fetch(`/api/portfolio?id=${id}`, { method: "DELETE" });
    await load();
  };

  return (
    <FeaturePage
      title="Portfolio & Performance"
      description="Tampilkan karya terbaik Anda. Portfolio membantu brand menilai kualitas konten sebelum mengajak kolaborasi."
      icon={Camera}
      gradient="bg-influencer"
    >
      {profile && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Followers", value: profile.followers.toLocaleString("id-ID") },
            { label: "Engagement", value: `${profile.engagement}%` },
            { label: "Kategori", value: profile.category },
            { label: "Karya", value: String(items.length) },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4"
            >
              <p className="text-xs text-zinc-500 mb-1">{s.label}</p>
              <p className="text-sm font-bold truncate">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Karya Saya</h3>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-influencer hover:bg-influencer-dark"
        >
          <Plus className="w-4 h-4" /> Tambah Karya
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-sm text-zinc-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Memuat portfolio...
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-10 text-center">
          <ImageIcon className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <h3 className="font-semibold">Portfolio masih kosong</h3>
          <p className="text-sm text-zinc-500 mt-1 mb-5">
            Unggah foto atau tautan konten terbaik Anda untuk menarik brand.
          </p>
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-influencer"
          >
            <Plus className="w-4 h-4" /> Tambah Karya
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="group bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
            >
              <div className="aspect-video bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <div className="p-4">
                <p className="font-medium text-sm truncate">{item.title}</p>
                <div className="flex items-center justify-between mt-2">
                  {item.link ? (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-kolabora hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" /> Lihat karya
                    </a>
                  ) : (
                    <span className="text-xs text-zinc-400">Tanpa tautan</span>
                  )}
                  <button
                    onClick={() => void remove(item.id)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                    aria-label="Hapus"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          resetForm();
        }}
        title="Tambah Karya Portfolio"
        description="Unggah gambar atau tempel URL gambar publik."
      >
        <div className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium mb-1.5">
              Judul Karya
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Review produk skincare — 120K views"
              className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-influencer/50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5">
              Unggah Gambar
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full text-xs file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-influencer/10 file:text-influencer"
            />
            <p className="text-[10px] text-zinc-400 mt-1">
              Butuh Vercel Blob. Jika belum dikonfigurasi, gunakan URL gambar.
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5">
              URL Gambar
            </label>
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-influencer/50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5">
              Tautan Karya (opsional)
            </label>
            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://instagram.com/p/..."
              className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-influencer/50"
            />
          </div>
          <button
            onClick={() => void submit()}
            disabled={saving || !title || (!file && !imageUrl)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white bg-influencer hover:bg-influencer-dark disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            Simpan Karya
          </button>
        </div>
      </Modal>
    </FeaturePage>
  );
}
