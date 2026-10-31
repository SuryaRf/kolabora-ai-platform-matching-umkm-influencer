"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Store,
  MapPin,
  Users,
  Loader2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Send,
  Target,
} from "lucide-react";
import FeaturePage from "@/components/dashboard/FeaturePage";
import Modal from "@/components/ui/Modal";
import { formatCurrency } from "@/lib/utils";
import { colorForName, initialsOf } from "@/lib/avatar";

interface MatchReason {
  label: string;
  pct: number;
}

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
  reasons: MatchReason[];
}

export default function UMKMInsight() {
  const [items, setItems] = useState<CampaignMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profilKosong, setProfilKosong] = useState(false);
  const [lokasi, setLokasi] = useState("Semua lokasi");

  const [target, setTarget] = useState<CampaignMatch | null>(null);
  const [proposal, setProposal] = useState("");
  const [rate, setRate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const res = await fetch("/api/matching/campaigns", { cache: "no-store" });
      const json = await res.json().catch(() => null);
      if (res.status === 400) {
        setProfilKosong(true);
        return;
      }
      if (!res.ok || !Array.isArray(json)) {
        setError(json?.error ?? "Gagal memuat daftar UMKM dengan campaign aktif.");
        return;
      }
      setItems(json as CampaignMatch[]);
      setProfilKosong(false);
    } catch {
      setError("Koneksi terputus saat memuat campaign.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  const lokasiList = useMemo(() => {
    const set = new Set(items.map((i) => i.location).filter((l): l is string => Boolean(l)));
    return ["Semua lokasi", ...Array.from(set).sort()];
  }, [items]);

  const filtered = useMemo(
    () =>
      items
        .filter((i) => lokasi === "Semua lokasi" || i.location === lokasi)
        .sort((a, b) => b.score - a.score),
    [items, lokasi],
  );

  const openApply = (item: CampaignMatch) => {
    setTarget(item);
    setModalError("");
    setRate(String(item.budgetMin));
    setProposal(
      `Halo ${item.businessName}, saya ${item.category.toLowerCase()} creator dengan audiens yang cocok untuk "${item.title}". ` +
        `Saya bisa menyiapkan deliverable sesuai brief dalam rentang budget ${formatCurrency(item.budgetMin)} - ${formatCurrency(item.budgetMax)}. ` +
        `Contoh karya saya ada di portofolio Kolabora.`,
    );
  };

  const submit = async () => {
    if (!target) return;
    if (proposal.trim().length < 20) {
      setModalError("Proposal minimal 20 karakter.");
      return;
    }
    setSubmitting(true);
    setModalError("");
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
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setModalError(json.error ?? "Gagal mengirim lamaran.");
        return;
      }
      setNotice(`Lamaran ke ${target.businessName} terkirim. Pantau di Campaign Saya.`);
      setTarget(null);
      await load();
    } catch {
      setModalError("Koneksi terputus. Lamaran belum terkirim.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FeaturePage
      title="UMKM Insight & Recommendation"
      description="Daftar UMKM yang sedang membuka campaign, diurutkan dari kecocokan tertinggi dengan profil kamu (niche, lokasi, tarif, persaingan pelamar)."
      icon={Store}
      gradient="bg-gradient-to-br from-amber-500 to-orange-600"
    >
      {notice && (
        <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-sm text-emerald-700 dark:text-emerald-400">
          <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Loader2 className="w-4 h-4 animate-spin" /> Memuat UMKM yang membuka campaign...
        </div>
      ) : profilKosong ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 text-center">
          <p className="font-semibold">Profil influencer belum dibuat</p>
          <p className="text-sm text-zinc-500 mt-1">
            Kecocokan dihitung dari kategori, niche, lokasi, dan tarif kamu.
          </p>
          <Link
            href="/dashboard/influencer/profile"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-influencer hover:bg-influencer-dark transition-colors"
          >
            Lengkapi profil <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <>
          {error && (
            <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            {lokasiList.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLokasi(l)}
                className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                  lokasi === l
                    ? "bg-amber-500 text-white"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }`}
              >
                {l}
              </button>
            ))}
            <button
              type="button"
              onClick={() => void load()}
              className="ml-auto text-xs font-semibold px-3 py-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
            >
              Segarkan
            </button>
          </div>

          {filtered.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 text-center text-sm text-zinc-500">
              Tidak ada campaign aktif pada filter ini. Coba lokasi lain atau tunggu UMKM membuka
              campaign baru.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((item) => (
                <div
                  key={item.campaignId}
                  className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 flex flex-col"
                >
                  <div className="flex items-start justify-between mb-4 gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-12 h-12 rounded-full ${colorForName(item.businessName)} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}
                      >
                        {initialsOf(item.businessName)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{item.businessName}</p>
                        <p className="text-xs text-zinc-500 truncate">{item.category}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold px-2 py-1 rounded-full bg-kolabora/10 text-kolabora flex-shrink-0">
                      {item.score}
                    </span>
                  </div>

                  <p className="text-sm font-medium line-clamp-1">{item.title}</p>
                  <p className="text-xs text-zinc-500 line-clamp-2 mt-1">{item.description}</p>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs my-4">
                    <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800">
                      <MapPin className="w-3.5 h-3.5 mx-auto mb-0.5 text-zinc-400" />
                      <span className="text-zinc-600 dark:text-zinc-400 block truncate">
                        {item.location ?? "-"}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800">
                      <Users className="w-3.5 h-3.5 mx-auto mb-0.5 text-zinc-400" />
                      <span className="text-zinc-600 dark:text-zinc-400">{item.applicants} pelamar</span>
                    </div>
                    <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800">
                      <Target className="w-3.5 h-3.5 mx-auto mb-0.5 text-zinc-400" />
                      <span className="text-zinc-600 dark:text-zinc-400 block truncate">
                        {Math.round(item.budgetMin / 1000)}-{Math.round(item.budgetMax / 1000)}rb
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-zinc-500 mb-3 line-clamp-2">
                    {item.reasons[0]?.label ?? "Kecocokan dihitung dari niche dan lokasi."}
                  </p>

                  <div className="mt-auto flex gap-2">
                    <button
                      type="button"
                      onClick={() => openApply(item)}
                      className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 transition-all"
                    >
                      <Send className="w-3.5 h-3.5" /> Lamar campaign
                    </button>
                    <Link
                      href="/dashboard/influencer/smart-matching"
                      className="inline-flex items-center justify-center px-3 py-2.5 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <Modal
        open={Boolean(target)}
        onClose={() => setTarget(null)}
        title={target ? `Lamar — ${target.title}` : "Lamar campaign"}
        description={
          target
            ? `Dikirim ke ${target.businessName}. Budget campaign ${formatCurrency(target.budgetMin)} - ${formatCurrency(target.budgetMax)}.`
            : undefined
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Proposal</label>
            <textarea
              value={proposal}
              onChange={(e) => setProposal(e.target.value)}
              rows={6}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 resize-none"
            />
            <p className="text-[11px] text-zinc-400 mt-1">
              Ubah teks ini supaya menyebut hasil konkret yang pernah kamu capai — jangan mengarang angka.
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">
              Tarif yang kamu ajukan (Rp)
            </label>
            <input
              value={rate}
              onChange={(e) => setRate(e.target.value.replace(/[^0-9]/g, ""))}
              inputMode="numeric"
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>
          {modalError && <p className="text-xs text-red-500">{modalError}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTarget(null)}
              className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 transition-all disabled:opacity-60"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Kirim lamaran
            </button>
          </div>
        </div>
      </Modal>
    </FeaturePage>
  );
}
