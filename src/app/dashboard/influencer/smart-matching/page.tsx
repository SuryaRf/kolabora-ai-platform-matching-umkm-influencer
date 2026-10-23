"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Zap,
  Wallet,
  Users,
  MapPin,
  Sparkles,
  Loader2,
  Send,
  Store,
} from "lucide-react";
import FeaturePage from "@/components/dashboard/FeaturePage";
import OneByOneMatch, {
  type MatchItem,
} from "@/components/dashboard/OneByOneMatch";
import Modal from "@/components/ui/Modal";
import { formatCurrency } from "@/lib/utils";
import { colorForName, initialsOf } from "@/lib/avatar";

interface CampaignMatch {
  campaignId: string;
  title: string;
  description: string;
  category: string;
  location: string | null;
  budgetMin: number;
  budgetMax: number;
  businessName: string;
  applicants: number;
  score: number;
  reasons: { label: string; pct: number }[];
}

export default function InfluencerSmartMatching() {
  const [matches, setMatches] = useState<CampaignMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileMissing, setProfileMissing] = useState(false);
  const [target, setTarget] = useState<CampaignMatch | null>(null);
  const [proposal, setProposal] = useState("");
  const [rate, setRate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/matching/campaigns", { cache: "no-store" });
      if (res.ok) {
        const data: CampaignMatch[] = await res.json();
        setMatches(data);
      } else if (res.status === 400) {
        setProfileMissing(true);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const items: MatchItem[] = matches.map((m) => ({
    name: m.title,
    subtitle: `${m.businessName} • ${m.category}`,
    avatar: initialsOf(m.businessName),
    color: colorForName(m.businessName),
    score: m.score,
    budget: `${formatCurrency(m.budgetMin)} - ${formatCurrency(m.budgetMax)}`,
    reasons: m.reasons,
    stats: [
      {
        icon: Wallet,
        label: "Budget",
        value: formatCurrency(m.budgetMax),
      },
      { icon: Users, label: "Pelamar", value: String(m.applicants) },
      { icon: MapPin, label: "Lokasi", value: m.location ?? "Remote" },
      { icon: Store, label: "Brand", value: m.businessName },
    ],
  }));

  const openApply = (title: string) => {
    const match = matches.find((m) => m.title === title);
    if (!match) return Promise.resolve(false);
    setTarget(match);
    setProposal(
      `Halo ${match.businessName}! Saya tertarik dengan campaign "${match.title}". Saya akan membuat konten yang menonjolkan keunggulan produk dengan gaya natural dan sesuai target audiens Anda.`,
    );
    setRate(String(match.budgetMin));
    setError("");
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  };

  const cancel = () => {
    resolverRef.current?.(false);
    resolverRef.current = null;
    setTarget(null);
  };

  const submit = async () => {
    if (!target) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/campaigns/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: target.campaignId,
          proposal,
          proposedRate: rate ? Number(rate) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal mengirim lamaran");
        return;
      }
      resolverRef.current?.(true);
      resolverRef.current = null;
      setTarget(null);
      setNotice(
        `Lamaran untuk "${target.title}" berhasil dikirim. Pantau di Campaign Saya.`,
      );
    } catch {
      setError("Gagal mengirim lamaran");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FeaturePage
      title="AI Smart Matching"
      description="Sistem pencocokan berbasis aturan. Lihat campaign yang paling cocok dengan niche, lokasi, tarif, dan peluang Anda — satu per satu, tanpa distraksi."
      icon={Zap}
      gradient="bg-kolabora"
    >
      {notice && (
        <div className="px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 text-sm text-emerald-700 dark:text-emerald-400">
          {notice}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-sm text-zinc-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Menghitung kecocokan...
        </div>
      ) : profileMissing ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-10 text-center">
          <Sparkles className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <h3 className="font-semibold">Lengkapi profil influencer dulu</h3>
          <p className="text-sm text-zinc-500 mt-1 mb-5">
            Isi niche, lokasi, followers, engagement, dan tarif agar sistem bisa
            menghitung kecocokan campaign untuk Anda.
          </p>
          <a
            href="/dashboard/influencer/profile"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-influencer hover:bg-influencer-dark"
          >
            <Sparkles className="w-4 h-4" /> Lengkapi Profil
          </a>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-10 text-center">
          <Zap className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <h3 className="font-semibold">Belum ada campaign aktif</h3>
          <p className="text-sm text-zinc-500 mt-1">
            Campaign dari UMKM akan otomatis muncul di sini.
          </p>
        </div>
      ) : (
        <OneByOneMatch
          items={items}
          noun="campaign"
          ctaLabel="Lamar Campaign Ini"
          ctaSuccess="Lamaran terkirim. Pantau statusnya di Campaign Saya."
          historyHref="/dashboard/influencer/campaigns"
          onMatch={(item) => openApply(item.name)}
        />
      )}

      <Modal
        open={!!target}
        onClose={cancel}
        title="Lamar Campaign"
        description={
          target
            ? `${target.title} • ${target.businessName}`
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
              Proposal / Pitch
            </label>
            <textarea
              rows={5}
              value={proposal}
              onChange={(e) => setProposal(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-influencer/50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5">
              Penawaran Tarif (Rp)
            </label>
            <input
              type="number"
              min={0}
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-influencer/50"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={cancel}
              className="flex-1 py-3 rounded-xl text-sm font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            >
              Batal
            </button>
            <button
              onClick={() => void submit()}
              disabled={submitting || proposal.trim().length < 20}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white bg-influencer hover:bg-influencer-dark disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Kirim Lamaran
            </button>
          </div>
        </div>
      </Modal>
    </FeaturePage>
  );
}
