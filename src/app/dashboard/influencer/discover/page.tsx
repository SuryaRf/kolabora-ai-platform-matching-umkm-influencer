"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  Loader2,
  Sparkles,
  Wallet,
  MapPin,
  Users,
  CheckCircle2,
  Send,
} from "lucide-react";
import FeaturePage from "@/components/dashboard/FeaturePage";
import Modal from "@/components/ui/Modal";
import { formatCurrency } from "@/lib/utils";

interface Campaign {
  id: string;
  title: string;
  description: string;
  category: string;
  budgetMin: number;
  budgetMax: number;
  location: string | null;
  createdAt: string;
  owner: {
    name: string | null;
    image: string | null;
    umkmProfile: { businessName: string; category: string; location: string | null } | null;
  };
  _count: { applications: number };
}

interface MatchInfo {
  campaignId: string;
  score: number;
  reasons: { label: string; pct: number }[];
}

interface Application {
  id: string;
  campaign: { id: string };
  status: string;
}

export default function InfluencerDiscoverPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [matches, setMatches] = useState<Record<string, MatchInfo>>({});
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Semua");
  const [selected, setSelected] = useState<Campaign | null>(null);
  const [proposal, setProposal] = useState("");
  const [rate, setRate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [campaignRes, matchRes, appRes] = await Promise.all([
        fetch("/api/campaigns", { cache: "no-store" }),
        fetch("/api/matching/campaigns", { cache: "no-store" }),
        fetch("/api/applications", { cache: "no-store" }),
      ]);

      if (campaignRes.ok) setCampaigns(await campaignRes.json());
      if (matchRes.ok) {
        const data: MatchInfo[] = await matchRes.json();
        setMatches(
          Object.fromEntries(data.map((m) => [m.campaignId, m])),
        );
      }
      if (appRes.ok) setApplications(await appRes.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const appliedIds = useMemo(
    () => new Set(applications.map((a) => a.campaign.id)),
    [applications],
  );

  const categories = useMemo(
    () => ["Semua", ...Array.from(new Set(campaigns.map((c) => c.category)))],
    [campaigns],
  );

  const filtered = campaigns
    .filter((c) => {
      const matchCategory = category === "Semua" || c.category === category;
      const matchSearch =
        !search ||
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.description.toLowerCase().includes(search.toLowerCase());
      return matchCategory && matchSearch;
    })
    .sort((a, b) => (matches[b.id]?.score ?? 0) - (matches[a.id]?.score ?? 0));

  const openApply = (campaign: Campaign) => {
    setSelected(campaign);
    setProposal("");
    setRate(String(campaign.budgetMin));
    setError("");
  };

  const submitApply = async () => {
    if (!selected) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/campaigns/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: selected.id,
          proposal,
          proposedRate: rate ? Number(rate) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal mengirim lamaran");
        return;
      }
      setSelected(null);
      setNotice("Lamaran berhasil dikirim. Pantau statusnya di Campaign Saya.");
      await load();
    } catch {
      setError("Gagal mengirim lamaran");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FeaturePage
      title="Cari Campaign"
      description="Temukan campaign yang cocok dengan niche, lokasi, dan tarif Anda. Skor kecocokan dihitung otomatis dari profil Anda."
      icon={Search}
      gradient="bg-influencer"
    >
      {notice && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 text-sm text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="w-4 h-4" /> {notice}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari campaign atau brand..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-influencer/50"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-influencer/50"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-sm text-zinc-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Memuat campaign...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-10 text-center">
          <Search className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <h3 className="font-semibold">Belum ada campaign yang cocok</h3>
          <p className="text-sm text-zinc-500 mt-1">
            Coba ubah filter atau kembali lagi nanti.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((c) => {
            const match = matches[c.id];
            const applied = appliedIds.has(c.id);
            const brand =
              c.owner.umkmProfile?.businessName ??
              c.owner.name ??
              "Brand";
            return (
              <div
                key={c.id}
                className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 flex flex-col"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{c.title}</p>
                    <p className="text-xs text-zinc-500">
                      {brand} • {c.category}
                    </p>
                  </div>
                  {match && (
                    <span
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0 ${
                        match.score >= 85
                          ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                          : match.score >= 70
                            ? "bg-kolabora/10 text-kolabora"
                            : "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      <Sparkles className="w-3 h-3" /> {match.score}%
                    </span>
                  )}
                </div>

                <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-3 mb-3">
                  {c.description}
                </p>

                {match && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {match.reasons.slice(0, 2).map((r, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                      >
                        {r.label}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-auto flex items-center justify-between gap-2 text-xs text-zinc-500">
                  <span className="flex items-center gap-1">
                    <Wallet className="w-3.5 h-3.5" />{" "}
                    {formatCurrency(c.budgetMin)} - {formatCurrency(c.budgetMax)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />{" "}
                    {c.location ?? "Remote"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> {c._count.applications}
                  </span>
                </div>

                <button
                  onClick={() => openApply(c)}
                  disabled={applied}
                  className={`mt-4 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    applied
                      ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
                      : "text-white bg-influencer hover:bg-influencer-dark"
                  }`}
                >
                  {applied ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Sudah Dilamar
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Lamar Campaign
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Lamar Campaign"
        description={selected?.title}
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
              placeholder="Jelaskan ide konten, pengalaman Anda, dan alasan Anda cocok untuk campaign ini."
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
          <button
            onClick={() => void submitApply()}
            disabled={submitting || proposal.trim().length < 20}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white bg-influencer hover:bg-influencer-dark disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Kirim Lamaran
          </button>
        </div>
      </Modal>
    </FeaturePage>
  );
}
