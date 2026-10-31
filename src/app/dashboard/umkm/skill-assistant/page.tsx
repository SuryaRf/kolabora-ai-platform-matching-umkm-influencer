"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bot, Send, Sparkles, Copy, Check, Lightbulb, Target, PenLine, MessageSquare, Loader2, AlertTriangle, Zap } from "lucide-react";
import FeaturePage from "@/components/dashboard/FeaturePage";

const suggestions = [
  { icon: PenLine, text: "Buat caption promosi untuk produk kopi lokal dengan gaya storytelling", mode: "caption" },
  { icon: Lightbulb, text: "Ide konten TikTok untuk produk skincare bulan ini", mode: "ide" },
  { icon: Target, text: "Strategi promosi untuk UMKM fashion memasuki pasar Gen Z", mode: "strategi" },
  { icon: MessageSquare, text: "Brief kerja sama untuk campaign food launching", mode: "brief" },
];

const modes = [
  { value: "strategi", label: "Strategi" },
  { value: "brief", label: "Brief Campaign" },
  { value: "caption", label: "Caption" },
  { value: "ide", label: "Ide Konten" },
  { value: "analisis", label: "Analisis" },
  { value: "chat", label: "Tanya Jawab" },
];

const templates = [
  {
    title: "Caption Promosi Produk",
    content:
      "Halo #SobatKolabora! ✨\n\nKami dengan bangga mempersembahkan [Nama Produk] — solusi [manfaat utama] untuk kamu yang [target audiens].\n\nDengan [fitur unggulan], [Nama Produk] siap menemani aktivitasmu sehari-hari.\n\n🔥 Promo spesial untuk 50 pembeli pertama!\n💰 Harga: Rp [harga]\n📍 Pesan sekarang di [link]\n\n#UMKMIndonesia #ProdukLokal #Kolabora",
  },
  {
    title: "Brief Kerja Sama Influencer",
    content:
      "**Brief Campaign: [Nama Produk]**\n\nTujuan: Meningkatkan brand awareness [produk] di kalangan [target audiens]\n\nPlatform: Instagram & TikTok\n\nKey Message: [pesan utama]\n\nDeliverables:\n- 1 video Reels (15-30 detik)\n- 2 feed posts with stories\n- 1 TikTok video\n\nTimeline:\n- Briefing: [tanggal]\n- Konten selesai: [tanggal]\n- Publikasi: [tanggal]\n\nBudget: Rp [nominal]",
  },
  {
    title: "Storytelling Produk Lokal",
    content:
      "Di balik setiap produk [Nama Produk], ada kerja keras [nama pengrajin/owner] yang telah mendedikasikan [lama] tahun untuk melestarikan [kearifan lokal/keahlian tradisional]. Mulai dari [proses produksi], setiap langkah dilakukan dengan penuh cinta dan ketelitian. 💚\n\nSaatnya kita bangga menggunakan produk lokal berkualitas tinggi yang tidak kalah dengan brand internasional!",
  },
];

interface Turn {
  id: number;
  question: string;
  answer: string;
  mode: string;
  model: string | null;
  createdAt: number;
}

function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i} className="font-semibold text-zinc-900 dark:text-zinc-100">{part.slice(2, -2)}</strong>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

export default function SkillAssistant() {
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState("strategi");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [copied, setCopied] = useState<number | null>(null);
  const [status, setStatus] = useState<{ configured: boolean; model: string } | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/ai/status", { cache: "no-store" });
        if (res.ok) setStatus(await res.json());
      } catch {
        /* abaikan */
      }
    })();
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [turns.length]);

  const ask = async (text?: string, overrideMode?: string) => {
    const question = (text ?? prompt).trim();
    const usedMode = overrideMode ?? mode;
    if (question.length < 8) {
      setError("Tulis pertanyaan atau perintah minimal 8 karakter.");
      return;
    }
    setBusy(true);
    setError("");
    if (overrideMode) setMode(overrideMode);
    try {
      const res = await fetch("/api/ai/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: question, mode: usedMode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Asisten AI tidak dapat dihubungi.");
        return;
      }
      setTurns((prev) => [...prev, { id: Date.now(), question, answer: String(data.content ?? ""), mode: usedMode, model: data.model ?? null, createdAt: Date.now() }]);
      setPrompt("");
    } catch {
      setError("Koneksi ke asisten AI terputus. Coba lagi.");
    } finally {
      setBusy(false);
    }
  };

  const copy = (text: string, id: number) => {
    void navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <FeaturePage
      title="AI Skill Assistant"
      description="Asisten AI asli untuk UMKM: menyusun brief kampanye, caption promosi, ide konten, dan strategi pemasaran berdasarkan profil usaha Anda di Kolabora."
      icon={Bot}
      gradient="bg-umkm"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-umkm flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-sm">AI Assistant</p>
                  <p className="text-xs text-zinc-500">Membaca profil usaha Anda saat menjawab</p>
                </div>
              </div>
              <span
                className={`text-[11px] px-2.5 py-1 rounded-full font-medium inline-flex items-center gap-1 ${
                  status?.configured ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" : "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                }`}
              >
                <Zap className="w-3 h-3" />
                {status?.configured ? status.model : "AI belum aktif"}
              </span>
            </div>

            {!status?.configured && (
              <div className="mb-4 flex items-start gap-2 px-3 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-400">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  Isi <code className="font-mono">DEEPSEEK_API_KEY</code> di file <code className="font-mono">.env</code> lalu restart server untuk mengaktifkan jawaban AI asli.
                </span>
              </div>
            )}

            <div className="flex flex-wrap gap-1.5 mb-3">
              {modes.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMode(m.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    mode === m.value ? "bg-umkm text-white" : "bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void ask();
                }}
                placeholder="Tulis pertanyaan atau perintah untuk AI Assistant... (mis. “susunkan brief campaign launching es kopi susu di Bandung dengan budget 2 juta”)"
                rows={3}
                className="w-full px-4 py-3 pr-14 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-umkm/50 resize-none"
              />
              <button
                onClick={() => void ask()}
                disabled={busy}
                className="absolute right-2.5 bottom-2.5 p-2 rounded-lg bg-umkm text-white hover:bg-umkm-dark disabled:opacity-60 transition-all"
                title="Kirim (Ctrl/Cmd + Enter)"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>

            {error && (
              <div className="mt-3 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}
          </div>

          {turns.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 p-10 text-center">
              <Sparkles className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Belum ada percakapan</p>
              <p className="text-xs text-zinc-500 mt-1">Pilih mode di atas lalu kirim permintaan, atau pakai rekomendasi prompt.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {turns.map((t) => (
                <div key={t.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
                  <p className="text-xs font-semibold text-umkm mb-2">{modes.find((m) => m.value === t.mode)?.label ?? t.mode}</p>
                  <p className="text-sm text-zinc-800 dark:text-zinc-200 mb-3">“{t.question}”</p>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-wrap border-l-2 border-umkm/30 pl-3">
                    <RichText text={t.answer} />
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                    <span className="text-[10px] text-zinc-400">{t.model ? `${t.model} · ` : ""}{new Date(t.createdAt).toLocaleTimeString("id-ID")}</span>
                    <button onClick={() => copy(t.answer, t.id)} className="inline-flex items-center gap-1.5 text-[11px] text-zinc-500 hover:text-zinc-800">
                      {copied === t.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      Salin jawaban
                    </button>
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
            <h3 className="font-semibold text-sm mb-3">Rekomendasi Prompt</h3>
            <div className="space-y-2">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setPrompt(s.text);
                    void ask(s.text, s.mode);
                  }}
                  disabled={busy}
                  className="w-full flex items-start gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-umkm/50 disabled:opacity-60 transition-all text-left"
                >
                  <s.icon className="w-4 h-4 text-umkm flex-shrink-0 mt-0.5" />
                  <span className="text-xs text-zinc-600 dark:text-zinc-400">{s.text}</span>
                </button>
              ))}
            </div>
            <LinkNewCampaign />
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
            <h3 className="font-semibold text-sm mb-3">Template Siap Pakai</h3>
            <div className="space-y-3">
              {templates.map((t, i) => (
                <div key={i} className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <h4 className="text-xs font-semibold">{t.title}</h4>
                    <button onClick={() => copy(t.content, -i - 1)} className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                      {copied === -i - 1 ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-500 leading-relaxed whitespace-pre-line line-clamp-4">{t.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </FeaturePage>
  );
}

/** Pintasan menuju form campaign yang sudah dilengkapi penilai brief */
function LinkNewCampaign() {
  return (
    <Link
      href="/dashboard/umkm/campaigns/new"
      className="mt-4 flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-umkm/10 text-umkm text-xs font-semibold hover:bg-umkm/15 transition-colors"
    >
      <span className="inline-flex items-center gap-2">
        <Target className="w-4 h-4" /> Susun campaign dengan penilai brief
      </span>
      <span>→</span>
    </Link>
  );
}
