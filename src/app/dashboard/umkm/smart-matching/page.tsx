"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Zap,
  Users,
  Heart,
  MapPin,
  Star,
  Loader2,
  Search,
  Sparkles,
  Send,
} from "lucide-react";
import FeaturePage from "@/components/dashboard/FeaturePage";
import OneByOneMatch, {
  type MatchItem,
} from "@/components/dashboard/OneByOneMatch";
import Modal from "@/components/ui/Modal";
import { formatCurrency } from "@/lib/utils";
import { colorForName, initialsOf } from "@/lib/avatar";

interface InfluencerMatch {
  userId: string;
  name: string;
  image: string | null;
  category: string;
  bio: string | null;
  location: string | null;
  followers: number;
  engagement: number;
  rateMin: number | null;
  rateMax: number | null;
  score: number;
  reasons: { label: string; pct: number }[];
}

export default function UMKMSmartMatching() {
  const [matches, setMatches] = useState<InfluencerMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [budget, setBudget] = useState("");

  const [target, setTarget] = useState<InfluencerMatch | null>(null);
  const [title, setTitle] = useState("");
  const [brief, setBrief] = useState("");
  const [offer, setOffer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const resolverRef = useRef<((value: boolean) => void) | null>(null);
  const [round, setRound] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category) params.set("category", category);
      if (location) params.set("location", location);
      if (budget) params.set("budget", budget);
      const res = await fetch(`/api/matching/influencers?${params}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data: InfluencerMatch[] = await res.json();
        setMatches(data);
        setRound((r) => r + 1);
      }
    } finally {
      setLoading(false);
    }
  }, [category, location, budget]);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const items: MatchItem[] = matches.map((m) => ({
    name: m.name,
    subtitle: `${m.category}${m.location ? ` • ${m.location}` : ""}`,
    avatar: initialsOf(m.name),
    color: colorForName(m.name),
    score: m.score,
    budget:
      m.rateMin != null
        ? `${formatCurrency(m.rateMin)}${
            m.rateMax ? ` - ${formatCurrency(m.rateMax)}` : ""
          }`
        : undefined,
    reasons: m.reasons,
    stats: [
      {
        icon: Users,
        label: "Followers",
        value:
          m.followers >= 1000
            ? `${(m.followers / 1000).toFixed(1)}K`
            : String(m.followers),
      },
      { icon: Heart, label: "Engagement", value: `${m.engagement}%` },
      { icon: MapPin, label: "Lokasi", value: m.location ?? "Remote" },
      {
        icon: Star,
        label: "Tarif",
        value: m.rateMin ? formatCurrency(m.rateMin) : "Nego",
      },
    ],
  }));

  const openProposal = (name: string) => {
    const match = matches.find((m) => m.name === name);
    if (!match) return Promise.resolve(false);
    setTarget(match);
    setTitle(`Kolaborasi dengan ${match.name}`);
    setBrief(
      `Halo ${match.name}! Kami tertarik berkolaborasi dengan Anda untuk mempromosikan produk kami. Mohon diskusikan konsep konten dan jadwal publikasi melalui chat.`,
    );
    setOffer(String(match.rateMin ?? 1000000));
    setError("");
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  };

  const cancelProposal = () => {
    resolverRef.current?.(false);
    resolverRef.current = null;
    setTarget(null);
  };

  const submitProposal = async () => {
    if (!target) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/collaborations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId: target.userId,
          title,
          brief,
          budget: Number(offer),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal mengirim tawaran");
        return;
      }
      resolverRef.current?.(true);
      resolverRef.current = null;
      setTarget(null);
      setNotice(
        `Tawaran kolaborasi terkirim ke ${target.name}. Pantau di Riwayat Kolaborasi.`,
      );
    } catch {
      setError("Gagal mengirim tawaran");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FeaturePage
      title="AI Smart Matching"
      description="Sistem pencocokan berbasis aturan (rule-based). Evaluasi kecocokan tiap influencer berdasarkan niche, lokasi, audiens, engagement, dan tarif — lewati yang kurang cocok lalu cari kandidat berikutnya."
      icon={Zap}
      gradient="bg-kolabora"
    >
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-kolabora" />
          <p className="text-sm font-semibold">Kriteria Pencocokan</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Kategori (Kuliner...)"
            className="px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-kolabora/50"
          />
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Lokasi (Jakarta...)"
            className="px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-kolabora/50"
          />
          <input
            type="number"
            min={0}
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="Budget (Rp)"
            className="px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-kolabora/50"
          />
          <button
            onClick={() => void load()}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-kolabora hover:bg-kolabora-dark"
          >
            <Search className="w-4 h-4" /> Cari Kandidat
          </button>
        </div>
      </div>

      {notice && (
        <div className="px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 text-sm text-emerald-700 dark:text-emerald-400">
          {notice}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-sm text-zinc-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Menghitung
          kecocokan...
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-10 text-center">
          <Zap className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <h3 className="font-semibold">Belum ada influencer terdaftar</h3>
          <p className="text-sm text-zinc-500 mt-1">
            Influencer yang mendaftar akan otomatis muncul di sini.
          </p>
        </div>
      ) : (
        <OneByOneMatch
          key={round}
          items={items}
          noun="influencer"
          ctaLabel="Ajukan Kolaborasi"
          ctaSuccess="Tawaran kolaborasi terkirim. Lanjutkan diskusi di Chat."
          historyHref="/dashboard/umkm/history"
          onMatch={(item) => openProposal(item.name)}
        />
      )}

      <Modal
        open={!!target}
        onClose={cancelProposal}
        title="Ajukan Kolaborasi"
        description={
          target
            ? `${target.name} • ${target.category}${
                target.location ? ` • ${target.location}` : ""
              }`
            : undefined
        }
      >
        <div className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium mb-1.5">
              Judul Kolaborasi
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-kolabora/50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5">
              Brief Singkat
            </label>
            <textarea
              rows={4}
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-kolabora/50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5">
              Penawaran Budget (Rp)
            </label>
            <input
              type="number"
              min={0}
              value={offer}
              onChange={(e) => setOffer(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-kolabora/50"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={cancelProposal}
              className="flex-1 py-3 rounded-xl text-sm font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            >
              Batal
            </button>
            <button
              onClick={() => void submitProposal()}
              disabled={submitting || !title || brief.trim().length < 10}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white bg-kolabora hover:bg-kolabora-dark disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Kirim Tawaran
            </button>
          </div>
        </div>
      </Modal>
    </FeaturePage>
  );
}
