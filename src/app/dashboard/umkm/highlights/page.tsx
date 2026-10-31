"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Star,
  Users,
  MapPin,
  Loader2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Send,
  Check,
  Info,
} from "lucide-react";
import FeaturePage from "@/components/dashboard/FeaturePage";
import Modal from "@/components/ui/Modal";
import { formatCurrency } from "@/lib/utils";
import { colorForName, initialsOf } from "@/lib/avatar";

interface MatchReason {
  label: string;
  pct: number;
}

interface Creator {
  userId: string;
  name: string;
  image?: string | null;
  category: string;
  bio?: string | null;
  location?: string | null;
  followers: number;
  engagement: number;
  rateMin: number | null;
  rateMax: number | null;
  niches: string[];
  score: number;
  reasons: MatchReason[];
}

interface OwnCampaign {
  id: string;
  title: string;
  category: string;
  status: string;
  budgetMin: number;
  budgetMax: number;
  _count?: { applications: number };
}

const compact = (value: number) =>
  value >= 1_000_000
    ? `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}Jt`
    : value >= 1000
      ? `${(value / 1000).toFixed(1).replace(/\.0$/, "")}rb`
      : `${value}`;

export default function Highlights() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [campaigns, setCampaigns] = useState<OwnCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [category, setCategory] = useState("");
  const [campaignId, setCampaignId] = useState("");

  const [detail, setDetail] = useState<Creator | null>(null);
  const [notice, setNotice] = useState<{ message: string; href?: string } | null>(null);

  const activeCampaigns = useMemo(
    () => campaigns.filter((c) => c.status === "ACTIVE"),
    [campaigns],
  );
  const chosen = useMemo(
    () => activeCampaigns.find((c) => c.id === campaignId) ?? null,
    [activeCampaigns, campaignId],
  );

  const load = useCallback(async () => {
    setError("");
    try {
      const params = new URLSearchParams();
      if (category) params.set("category", category);
      if (chosen) params.set("budget", String(chosen.budgetMax));
      const res = await fetch(`/api/matching/influencers?${params.toString()}`, {
        cache: "no-store",
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !Array.isArray(json)) {
        setError(typeof json?.error === "string" ? json.error : "Gagal memuat data kreator.");
        setCreators([]);
        return;
      }
      setCreators(json as Creator[]);
    } catch {
      setError("Koneksi terputus saat memuat data kreator.");
    } finally {
      setLoading(false);
    }
  }, [category, chosen]);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  // Kategori & campaign datang dari data asli, bukan daftar tetap.
  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/campaigns?mine=1", { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json();
        if (Array.isArray(json)) setCampaigns(json as OwnCampaign[]);
      } catch {
        // biarkan kosong, halaman tetap jalan dengan data kreator
      }
    })();
  }, []);

  const categories = useMemo(() => {
    const set = new Set(creators.map((c) => c.category).filter(Boolean));
    return Array.from(set).sort();
  }, [creators]);

  const withinBudget = chosen
    ? creators.filter((c) => !c.rateMin || c.rateMin <= chosen.budgetMax).length
    : creators.length;
  const avgEngagement = creators.length
    ? creators.reduce((sum, c) => sum + c.engagement, 0) / creators.length
    : 0;
  const avgFollowers = creators.length
    ? creators.reduce((sum, c) => sum + c.followers, 0) / creators.length
    : 0;

  const distribution = useMemo(() => {
    const map = new Map<string, { count: number; score: number; followers: number }>();
    for (const c of creators) {
      const row = map.get(c.category) ?? { count: 0, score: 0, followers: 0 };
      row.count += 1;
      row.score += c.score;
      row.followers += c.followers;
      map.set(c.category, row);
    }
    return Array.from(map.entries())
      .map(([name, row]) => ({
        name,
        count: row.count,
        score: Math.round(row.score / row.count),
        followers: Math.round(row.followers / row.count),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [creators]);

  const topReasons = useMemo(() => {
    const map = new Map<string, number>();
    creators.forEach((c) =>
      c.reasons.forEach((r) => map.set(r.label, (map.get(r.label) ?? 0) + 1)),
    );
    return Array.from(map.entries())
      .map(([label, count]) => ({ label, count, pct: Math.round((count / Math.max(1, creators.length)) * 100) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [creators]);

  if (loading) {
    return (
      <FeaturePage
        title="Kreator Unggulan (Highlights)"
        description="Peringkat kreator dihitung dari kecocokan nyata dengan campaign kamu."
        icon={Star}
        gradient="bg-gradient-to-br from-amber-500 to-yellow-600"
      >
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Loader2 className="w-4 h-4 animate-spin" /> Memuat peringkat kreator...
        </div>
      </FeaturePage>
    );
  }

  return (
    <FeaturePage
      title="Kreator Unggulan (Highlights)"
      description="Daftar kreator yang benar-benar terdaftar di Kolabora, diurutkan dari skor kecocokan tertinggi terhadap campaign dan budget kamu."
      icon={Star}
      gradient="bg-gradient-to-br from-amber-500 to-yellow-600"
    >
      {notice && (
        <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-sm text-emerald-700 dark:text-emerald-400">
          <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>
            {notice.message}
            {notice.href && (
              <>
                {" "}
                <Link href={notice.href} className="font-semibold underline">
                  Buka chat
                </Link>
              </>
            )}
          </span>
        </div>
      )}
      {error && (
        <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-zinc-500 mb-1">
              Ukur kecocokan terhadap campaign
            </label>
            <select
              value={campaignId}
              onChange={(e) => setCampaignId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            >
              <option value="">Semua campaign (tanpa filter budget)</option>
              {activeCampaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} — {formatCurrency(c.budgetMin)} s/d {formatCurrency(c.budgetMax)}
                </option>
              ))}
            </select>
            {activeCampaigns.length === 0 && (
              <p className="text-[11px] text-zinc-400 mt-1">
                Kamu belum punya campaign aktif.{" "}
                <Link href="/dashboard/umkm/campaigns/new" className="text-umkm font-medium">
                  Buat campaign
                </Link>{" "}
                supaya budget ikut menghitung peringkat.
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-amber-600">{creators.length}</p>
            <p className="text-xs text-zinc-500">
              kreator{chosen ? ` · ${withinBudget} tarifnya masuk budget` : ""}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategory("")}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
              category === ""
                ? "bg-amber-500 text-white"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            }`}
          >
            Semua kategori
          </button>
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                category === c
                  ? "bg-amber-500 text-white"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            icon: Users,
            label: "Jumlah kreator",
            value: `${creators.length}`,
            hint: category ? `kategori ${category}` : "semua kategori",
            color: "text-amber-500",
          },
          {
            icon: Star,
            label: "Skor tertinggi",
            value: creators[0]?.score ? `${creators[0].score}` : "-",
            hint: creators[0]?.name ?? "belum ada data",
            color: "text-yellow-500",
          },
          {
            icon: Sparkles,
            label: "Engagement rata-rata",
            value: avgEngagement ? `${avgEngagement.toFixed(1)}%` : "-",
            hint: "dari profil yang diisi",
            color: "text-emerald-500",
          },
          {
            icon: MapPin,
            label: "Follower rata-rata",
            value: avgFollowers ? compact(Math.round(avgFollowers)) : "-",
            hint: "data profil kreator",
            color: "text-blue-500",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4"
          >
            <s.icon className={`w-6 h-6 ${s.color} mb-2`} />
            <p className="text-xl font-bold">{s.value}</p>
            <p className="text-xs text-zinc-500">{s.label}</p>
            <p className="text-[11px] text-zinc-400 truncate">{s.hint}</p>
          </div>
        ))}
      </div>

      {creators.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 text-center">
          <p className="font-semibold">Belum ada kreator pada filter ini</p>
          <p className="text-sm text-zinc-500 mt-1">
            Ganti kategori, atau lepas filter budget. Jumlah kreator di Kolabora berasal dari akun
            yang benar-benar terdaftar.
          </p>
          <button
            type="button"
            onClick={() => {
              setCategory("");
              setCampaignId("");
            }}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            Atur ulang filter
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3">
            <h3 className="font-semibold">
              Peringkat kecocokan{category ? ` — ${category}` : ""}
              {chosen ? ` (budget ${chosen.title})` : ""}
            </h3>
            <span className="text-[11px] text-zinc-400">urut dari skor tertinggi</span>
          </div>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {creators.map((c, i) => (
              <div
                key={c.userId}
                className="px-6 py-4 flex items-center gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors"
              >
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    i === 0
                      ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                      : i === 1
                        ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                        : i === 2
                          ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
                          : "bg-zinc-50 dark:bg-zinc-900 text-zinc-400"
                  }`}
                >
                  {i + 1}
                </span>
                <div
                  className={`w-11 h-11 rounded-full ${colorForName(c.name)} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}
                >
                  {initialsOf(c.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{c.name}</p>
                  <p className="text-xs text-zinc-500 truncate">
                    {c.category}
                    {c.location ? ` • ${c.location}` : ""}
                  </p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {compact(c.followers)} follower • engagement {c.engagement ? `${c.engagement}%` : "belum diisi"}
                    {c.rateMin && c.rateMax ? ` • ${formatCurrency(c.rateMin)}-${formatCurrency(c.rateMax)}` : " • tarif belum diisi"}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-bold text-amber-600">{c.score}</p>
                    <p className="text-[10px] text-zinc-400">skor</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDetail(c)}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold bg-amber-500 text-white hover:bg-amber-600 transition-all"
                  >
                    Detail <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {creators.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
            <h3 className="font-semibold text-sm mb-4">Sebaran kategori pada hasil ini</h3>
            <div className="space-y-3">
              {distribution.map((d) => (
                <div key={d.name}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-zinc-600 dark:text-zinc-400">{d.name}</span>
                    <span className="font-medium">
                      {d.count} kreator • skor {d.score}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-500 transition-all duration-500"
                      style={{ width: `${Math.round((d.count / creators.length) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
            <h3 className="font-semibold text-sm mb-4">Alasan pencocokan paling sering muncul</h3>
            <div className="space-y-3">
              {topReasons.map((r) => (
                <div key={r.label}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-zinc-600 dark:text-zinc-400">{r.label}</span>
                    <span className="font-medium">
                      {r.count} dari {creators.length} kreator
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-kolabora transition-all duration-500"
                      style={{ width: `${r.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-start gap-2 mt-4 text-[11px] text-zinc-400">
              <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>
                Skor dihitung mesin pencocok: kesamaan niche, satu kota, tarif terhadap budget, dan
                jumlah pelamar campaign. Tidak ada peringkat berbayar di halaman ini.
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/dashboard/umkm/smart-matching"
          className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 hover:border-amber-300 dark:hover:border-amber-700 transition-all"
        >
          <p className="font-semibold text-sm">Pencocokan 1-per-1</p>
          <p className="text-xs text-zinc-500 mt-1">
            Lihat kandidat satu per satu beserta alasan kecocokannya, lalu ajak kolaborasi langsung.
          </p>
        </Link>
        <Link
          href="/dashboard/umkm/campaigns"
          className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 hover:border-amber-300 dark:hover:border-amber-700 transition-all"
        >
          <p className="font-semibold text-sm">Kelola campaign & pelamar</p>
          <p className="text-xs text-zinc-500 mt-1">
            Terima atau tolak lamaran yang masuk sebelum mengundang kreator langgananmu.
          </p>
        </Link>
      </div>

      {detail && (
        <CreatorDetail
          // key memaksa panel mount ulang sehingga nilai awal form mengikuti kreator terpilih
          key={`${detail.userId}-${activeCampaigns.length}`}
          creator={detail}
          campaigns={activeCampaigns}
          onClose={() => setDetail(null)}
          onInvited={(message, href) => {
            setDetail(null);
            setNotice({ message, href });
          }}
        />
      )}
    </FeaturePage>
  );
}

/** Panel detail kreator + undangan kolaborasi nyata (POST /api/collaborations). */
function CreatorDetail({
  creator,
  campaigns,
  onClose,
  onInvited,
}: {
  creator: Creator;
  campaigns: OwnCampaign[];
  onClose: () => void;
  onInvited: (message: string, href: string) => void;
}) {
  // Nilai awal dihitung saat panel dibuka (komponen di-mount ulang lewat `key`),
  // jadi tidak ada setState di dalam useEffect.
  const awal = useMemo(() => {
    const first = campaigns[0];
    return {
      campaignId: first?.id ?? "",
      budget: first ? String(first.budgetMin) : "",
      title: first ? `${first.title} × ${creator.name}` : `Kolaborasi dengan ${creator.name}`,
      brief: first
        ? `Halo ${creator.name}, saya tertarik mengajak kamu bekerja sama untuk "${first.title}" (${first.category}).\n\nTarget: konten promosi yang sesuai gaya kamu.\nDeliverable: [sesuaikan]\nTimeline: [sesuaikan]\n\nBalas chat ini kalau tertarik, kita bahas detail dan tarifnya.`
        : `Halo ${creator.name}, saya ingin mengajak kolaborasi.\n\nBrief: [jelaskan produk, target, deliverable, dan timeline]`,
    };
    // campaigns sengaja tidak ikut: nilai awal hanya dipakai saat panel dibuka.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [creator]);

  const [campaignId, setCampaignId] = useState(awal.campaignId);
  const [budget, setBudget] = useState(awal.budget);
  const [title, setTitle] = useState(awal.title);
  const [brief, setBrief] = useState(awal.brief);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const send = async () => {
    if (title.trim().length < 2) {
      setErr("Judul kolaborasi minimal 2 karakter.");
      return;
    }
    if (brief.trim().length < 10) {
      setErr("Brief minimal 10 karakter — jelaskan target dan deliverable.");
      return;
    }
    const amount = Number(budget);
    if (!Number.isInteger(amount) || amount <= 0) {
      setErr("Budget harus angka bulat rupiah di atas nol.");
      return;
    }
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/collaborations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId: creator.userId,
          title: title.trim(),
          brief: brief.trim(),
          budget: amount,
          campaignId: campaignId || null,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(json.error ?? "Gagal mengirim tawaran kolaborasi.");
        return;
      }
      const id = typeof json.id === "string" ? json.id : "";
      onInvited(
        `Tawaran ke ${creator.name} terkirim. Bahas detail dan tarif di chat.`,
        id ? `/dashboard/umkm/chat?collaboration=${id}` : "/dashboard/umkm/chat",
      );
    } catch {
      setErr("Koneksi terputus. Tawaran belum terkirim.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={creator.name}
      description={`${creator.category}${creator.location ? ` • ${creator.location}` : ""}`}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          {[
            { label: "Follower", value: compact(creator.followers) },
            { label: "Engagement", value: creator.engagement ? `${creator.engagement}%` : "-" },
            {
              label: "Tarif",
              value:
                creator.rateMin && creator.rateMax
                  ? `${compact(creator.rateMin)}-${compact(creator.rateMax)}`
                  : "-",
            },
          ].map((s) => (
            <div key={s.label} className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800">
              <p className="font-bold text-sm">{s.value}</p>
              <p className="text-[11px] text-zinc-500">{s.label}</p>
            </div>
          ))}
        </div>

        <div>
          <p className="text-xs font-medium text-zinc-500 mb-1">Bio</p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {creator.bio?.trim() || "Kreator ini belum mengisi bio."}
          </p>
        </div>

        {creator.niches.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {creator.niches.map((n) => (
              <span key={n} className="text-xs px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">
                {n}
              </span>
            ))}
          </div>
        )}

        <div>
          <p className="text-xs font-medium text-zinc-500 mb-2">
            Skor kecocokan {creator.score}/100
          </p>
          <div className="space-y-2">
            {creator.reasons.map((r) => (
              <div key={r.label}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-zinc-600 dark:text-zinc-400">{r.label}</span>
                  <span className="font-medium">{r.pct}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      r.pct >= 75 ? "bg-emerald-500" : r.pct >= 50 ? "bg-amber-500" : "bg-red-500"
                    }`}
                    style={{ width: `${r.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800 space-y-3">
          <p className="text-xs font-semibold">Undang berkolaborasi</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-zinc-500 mb-1">Campaign terkait</label>
              <select
                value={campaignId}
                onChange={(e) => {
                  setCampaignId(e.target.value);
                  const c = campaigns.find((x) => x.id === e.target.value);
                  if (c) setBudget(String(c.budgetMin));
                }}
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs"
              >
                <option value="">Tanpa campaign</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-zinc-500 mb-1">Budget (Rp)</label>
              <input
                value={budget}
                onChange={(e) => setBudget(e.target.value.replace(/[^0-9]/g, ""))}
                inputMode="numeric"
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] text-zinc-500 mb-1">Judul</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs"
            />
          </div>
          <div>
            <label className="block text-[11px] text-zinc-500 mb-1">Brief awal</label>
            <textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              rows={5}
              className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs resize-none"
            />
          </div>
          {err && <p className="text-xs text-red-500">{err}</p>}
          <button
            type="button"
            onClick={send}
            disabled={busy}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 transition-all disabled:opacity-60"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Kirim tawaran kolaborasi
          </button>
          <p className="text-[11px] text-zinc-400">
            Tawaran membuat chat otomatis dan mengirim notifikasi ke kreator. Status awal:
            MENUNGGU balasan.
          </p>
        </div>
      </div>
    </Modal>
  );
}
