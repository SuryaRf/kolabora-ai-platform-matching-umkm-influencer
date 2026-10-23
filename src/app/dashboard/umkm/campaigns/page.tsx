"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Megaphone,
  Plus,
  Loader2,
  Users,
  Wallet,
  MapPin,
  ArrowRight,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import FeaturePage from "@/components/dashboard/FeaturePage";
import Modal from "@/components/ui/Modal";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Campaign {
  id: string;
  title: string;
  description: string;
  category: string;
  budgetMin: number;
  budgetMax: number;
  location: string | null;
  status: string;
  createdAt: string;
  _count: { applications: number };
}

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
  DRAFT: "bg-zinc-100 dark:bg-zinc-800 text-zinc-500",
  CLOSED: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
  COMPLETED: "bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400",
};

const EMPTY_FORM = {
  title: "",
  description: "",
  category: "",
  budgetMin: "",
  budgetMax: "",
  location: "",
  requirements: "",
  deliverables: "",
};

export default function UMKMCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/campaigns?mine=1", { cache: "no-store" });
      if (res.ok) setCampaigns(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal membuat campaign");
        return;
      }
      setOpen(false);
      setForm(EMPTY_FORM);
      await load();
    } catch {
      setError("Gagal membuat campaign");
    } finally {
      setSaving(false);
    }
  };

  const totalApplicants = campaigns.reduce(
    (acc, c) => acc + c._count.applications,
    0,
  );
  const active = campaigns.filter((c) => c.status === "ACTIVE").length;
  const closed = campaigns.filter((c) => c.status === "CLOSED").length;

  return (
    <FeaturePage
      title="Campaign Saya"
      description="Buat campaign baru, pantau pelamar, dan kelola campaign yang sedang berjalan."
      icon={Megaphone}
      gradient="bg-umkm"
    >
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
          {[
            { label: "Total Campaign", value: campaigns.length, icon: Megaphone },
            { label: "Aktif", value: active, icon: CheckCircle2 },
            { label: "Ditutup", value: closed, icon: XCircle },
            { label: "Total Pelamar", value: totalApplicants, icon: Users },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4"
            >
              <div className="flex items-center gap-2 mb-1">
                <s.icon className="w-4 h-4 text-zinc-400" />
                <span className="text-xs text-zinc-500">{s.label}</span>
              </div>
              <p className="text-xl font-bold">{s.value}</p>
            </div>
          ))}
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-umkm hover:bg-umkm-dark transition-all"
        >
          <Plus className="w-4 h-4" /> Buat Campaign
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-sm text-zinc-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Memuat campaign...
        </div>
      ) : campaigns.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-10 text-center">
          <Megaphone className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <h3 className="font-semibold">Belum ada campaign</h3>
          <p className="text-sm text-zinc-500 mt-1 mb-5">
            Buat campaign pertama Anda agar influencer dapat mulai melamar.
          </p>
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-umkm hover:bg-umkm-dark"
          >
            <Plus className="w-4 h-4" /> Buat Campaign
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {campaigns.map((c) => (
            <Link
              key={c.id}
              href={`/dashboard/umkm/campaigns/${c.id}`}
              className="group bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 hover:shadow-lg hover:border-umkm/40 transition-all"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p className="font-semibold group-hover:text-umkm transition-colors">
                    {c.title}
                  </p>
                  <p className="text-xs text-zinc-500">{c.category}</p>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                    STATUS_STYLE[c.status] ?? STATUS_STYLE.DRAFT
                  }`}
                >
                  {c.status === "ACTIVE"
                    ? "Aktif"
                    : c.status === "CLOSED"
                      ? "Ditutup"
                      : c.status}
                </span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 mb-3">
                {c.description}
              </p>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 text-zinc-500">
                  <Wallet className="w-3.5 h-3.5" />{" "}
                  {formatCurrency(c.budgetMin)} - {formatCurrency(c.budgetMax)}
                </span>
                <span className="flex items-center gap-1 text-zinc-500">
                  <Users className="w-3.5 h-3.5" /> {c._count.applications} pelamar
                </span>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-400">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {c.location ?? "Remote"}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {formatDate(c.createdAt)}
                </span>
                <span className="flex items-center gap-1 text-umkm font-semibold">
                  Kelola <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Buat Campaign Baru"
        description="Campaign akan langsung tampil dan bisa dilamar influencer."
        maxWidth="max-w-2xl"
      >
        <form onSubmit={submit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium mb-1.5">
              Judul Campaign
            </label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Contoh: Promosi Kopi Lokal Edisi Kemerdekaan"
              className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-umkm/50"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5">
                Kategori
              </label>
              <input
                required
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="Kuliner, Fashion, Gadget..."
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-umkm/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">
                Lokasi Target
              </label>
              <input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Jakarta / Remote"
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-umkm/50"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5">
                Budget Minimum (Rp)
              </label>
              <input
                required
                type="number"
                min={0}
                value={form.budgetMin}
                onChange={(e) => setForm({ ...form, budgetMin: e.target.value })}
                placeholder="1000000"
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-umkm/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">
                Budget Maksimum (Rp)
              </label>
              <input
                required
                type="number"
                min={0}
                value={form.budgetMax}
                onChange={(e) => setForm({ ...form, budgetMax: e.target.value })}
                placeholder="5000000"
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-umkm/50"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5">
              Deskripsi & Brief
            </label>
            <textarea
              required
              rows={4}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Jelaskan produk, target audiens, pesan utama, dan ekspektasi konten."
              className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-umkm/50"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5">
                Persyaratan Influencer
              </label>
              <textarea
                rows={3}
                value={form.requirements}
                onChange={(e) =>
                  setForm({ ...form, requirements: e.target.value })
                }
                placeholder="Minimal 5k followers, niche kuliner..."
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-umkm/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">
                Deliverables
              </label>
              <textarea
                rows={3}
                value={form.deliverables}
                onChange={(e) =>
                  setForm({ ...form, deliverables: e.target.value })
                }
                placeholder="1 video TikTok, 3 story Instagram..."
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-umkm/50"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white bg-umkm hover:bg-umkm-dark disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Publikasikan Campaign
          </button>
        </form>
      </Modal>
    </FeaturePage>
  );
}
