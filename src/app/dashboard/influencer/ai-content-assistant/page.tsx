"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bot, Sparkles, Copy, Check, FileText, Wand2, Lightbulb, Loader2, RefreshCw, AlertTriangle, Zap } from "lucide-react";
import FeaturePage from "@/components/dashboard/FeaturePage";

interface AiStatus {
  configured: boolean;
  model: string;
}

interface CampaignOption {
  id: string;
  title: string;
  category: string;
  businessName?: string;
}

interface GeneratedItem {
  id: number;
  content: string;
  prompt: string;
  format: string;
  platform: string;
  model: string | null;
  createdAt: number;
}

const FORMATS = [
  { value: "caption", label: "Caption promosi" },
  { value: "hook", label: "Hook pembuka video" },
  { value: "skrip", label: "Skrip video utuh" },
  { value: "carousel", label: "Outline carousel" },
  { value: "stories", label: "Rangkaian Story" },
  { value: "ide", label: "Ide & angle konten" },
];

const PLATFORMS = ["TikTok", "Instagram Reels", "Instagram Feed", "Instagram Story", "YouTube Shorts"];

const TONES = ["santai & akrab", "edukatif", "storytelling", "lucu & hiperbolis", "profesional & elegan", "persuasif hard-selling"];

const quickActions = [
  { icon: FileText, title: "Buat Caption Promosi", desc: "Caption menarik untuk produk UMKM", format: "caption" },
  { icon: Wand2, title: "Skrip Video 30 Detik", desc: "Skrip lengkap dengan penanda detik", format: "skrip" },
  { icon: Lightbulb, title: "Ide Konten Kreatif", desc: "Angle konten yang belum biasa dipakai", format: "ide" },
  { icon: Bot, title: "Hook Pembuka", desc: "3 hook kuat untuk 3 detik pertama", format: "hook" },
];

/** Ubah penanda **tebal** dari model menjadi elemen yang aman ditampilkan */
function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i} className="font-semibold text-zinc-900 dark:text-zinc-100">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

export default function AIContentAssistant() {
  const [prompt, setPrompt] = useState("");
  const [format, setFormat] = useState("caption");
  const [platform, setPlatform] = useState("TikTok");
  const [tone, setTone] = useState(TONES[0]);
  const [campaignId, setCampaignId] = useState("");
  const [feedback, setFeedback] = useState("");

  const [status, setStatus] = useState<AiStatus | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);
  const [items, setItems] = useState<GeneratedItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<number | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const [s, c] = await Promise.all([fetch("/api/ai/status", { cache: "no-store" }), fetch("/api/campaigns", { cache: "no-store" })]);
        if (s.ok) setStatus(await s.json());
        if (c.ok) {
          const list = await c.json();
          setCampaigns(Array.isArray(list) ? list.map((x) => ({ id: x.id, title: x.title, category: x.category, businessName: x.owner?.umkmProfile?.businessName })) : []);
        }
      } catch {
        /* status AI opsional */
      }
    })();
  }, []);

  const generate = useCallback(
    async (overridePrompt?: string) => {
      const instruction = (overridePrompt ?? prompt).trim();
      if (instruction.length < 10) {
        setError("Tulis permintaan minimal 10 karakter agar hasilnya relevan.");
        return;
      }
      setBusy(true);
      setError("");
      try {
        const res = await fetch("/api/ai/content", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: instruction,
            format,
            platform,
            tone,
            campaignId: campaignId || undefined,
            previous: items[0]?.content,
            feedback: feedback || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Gagal membuat konten.");
          return;
        }
        setItems((prev) =>
          [
            {
              id: Date.now(),
              content: String(data.content ?? ""),
              prompt: instruction,
              format,
              platform,
              model: data.model ?? null,
              createdAt: Date.now(),
            },
            ...prev,
          ].slice(0, 8),
        );
        setFeedback("");
      } catch {
        setError("Koneksi ke asisten AI terputus. Coba lagi.");
      } finally {
        setBusy(false);
      }
    },
    [prompt, format, platform, tone, campaignId, feedback, items],
  );

  const copy = (text: string, id: number) => {
    void navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const selectedCampaign = useMemo(() => campaigns.find((c) => c.id === campaignId), [campaigns, campaignId]);

  return (
    <FeaturePage
      title="AI Content Assistant"
      description="Generator konten asli bertenaga AI (DeepSeek) yang membaca brief campaign dan profil kamu. Hasil langsung siap dipakai, lengkap dengan hook, caption, dan catatan produksi."
      icon={Bot}
      gradient="bg-gradient-to-br from-violet-500 to-purple-600"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-500" />
                <h3 className="font-semibold text-sm">AI Content Generator</h3>
              </div>
              <span
                className={`text-[11px] px-2.5 py-1 rounded-full font-medium inline-flex items-center gap-1 ${
                  status?.configured ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" : "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                }`}
              >
                <Zap className="w-3 h-3" />
                {status?.configured ? `${status.model}` : "AI belum aktif"}
              </span>
            </div>

            {!status?.configured && (
              <div className="mb-4 flex items-start gap-2 px-3 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-400">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  Asisten ini memakai AI asli. Tambahkan <code className="font-mono">DEEPSEEK_API_KEY</code> pada file <code className="font-mono">.env</code> lalu restart server untuk mengaktifkannya.
                </span>
              </div>
            )}

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={'Contoh: "Buat hook TikTok untuk promosi kopi susu gula aren dengan gaya storytelling anak kantor yang relatable"'}
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none"
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
              <div>
                <label className="block text-[11px] font-medium text-zinc-500 mb-1">Jenis keluaran</label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                >
                  {FORMATS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-zinc-500 mb-1">Platform</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                >
                  {PLATFORMS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-zinc-500 mb-1">Tone</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                >
                  {TONES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-3">
              <label className="block text-[11px] font-medium text-zinc-500 mb-1">Kaitkan dengan brief campaign (opsional)</label>
              <select
                value={campaignId}
                onChange={(e) => setCampaignId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              >
                <option value="">Tanpa brief — gunakan permintaan saya saja</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} · {c.businessName ?? c.category}
                  </option>
                ))}
              </select>
              {selectedCampaign && <p className="text-[11px] text-zinc-400 mt-1">AI akan membaca deskripsi, deliverables, dan ketentuan campaign ini.</p>}
            </div>

            {items.length > 0 && (
              <input
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Catatan revisi, mis. “hook-nya jangan clickbait, tambahkan promo beli 2 gratis 1”"
                className="w-full mt-3 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              />
            )}

            {error && (
              <div className="mt-3 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            <button
              onClick={() => void generate()}
              disabled={busy}
              className="w-full mt-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 disabled:opacity-60 transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-500/25"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {busy ? "AI sedang menyusun konten…" : items.length > 0 ? "Generate Ulang" : "Generate Konten"}
            </button>
          </div>

          {items.length > 0 ? (
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={item.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-zinc-400 font-semibold">
                        {FORMATS.find((f) => f.value === item.format)?.label ?? item.format} · {item.platform}
                        {index === 0 ? " · terbaru" : ""}
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">“{item.prompt}”</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {index === 0 && (
                        <button
                          onClick={() => void generate()}
                          disabled={busy}
                          className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50"
                          title="Buat versi baru"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 text-zinc-500 ${busy ? "animate-spin" : ""}`} />
                        </button>
                      )}
                      <button onClick={() => copy(item.content, item.id)} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800" title="Salin">
                        {copied === item.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
                      </button>
                    </div>
                  </div>
                  <div className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                    <RichText text={item.content} />
                  </div>
                  {item.model && <p className="text-[10px] text-zinc-400 mt-3">Dihasilkan oleh {item.model}</p>}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 p-10 text-center">
              <Sparkles className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Belum ada hasil di sesi ini</p>
              <p className="text-xs text-zinc-500 mt-1">Tulis permintaan di atas, lalu klik Generate.</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
            <h3 className="font-semibold text-sm mb-3">Aksi Cepat</h3>
            <div className="space-y-2">
              {quickActions.map((action, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setFormat(action.format);
                    setPrompt(`${action.desc}. Produk: [sebutkan produk], audiens: [sebutkan audiens]`);
                    setError("");
                  }}
                  className="w-full text-left p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:border-violet-200 dark:hover:border-violet-700 transition-all group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <action.icon className="w-3.5 h-3.5 text-violet-500" />
                    <span className="text-xs font-semibold">{action.title}</span>
                  </div>
                  <p className="text-xs text-zinc-500">{action.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-zinc-800 dark:to-zinc-800 rounded-2xl border border-violet-200 dark:border-zinc-700 p-5">
            <h3 className="font-semibold text-sm mb-2">Supaya hasilnya makin bagus</h3>
            <ul className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
              <li className="flex items-start gap-2">
                <span className="text-violet-500 font-bold">•</span>
                Pilih brief campaign di atas — AI akan ikut membaca deliverables & ketentuannya
              </li>
              <li className="flex items-start gap-2">
                <span className="text-violet-500 font-bold">•</span>
                Tulis platform dan tone yang diinginkan
              </li>
              <li className="flex items-start gap-2">
                <span className="text-violet-500 font-bold">•</span>
                Pakai kolom revisi untuk minta versi berbeda, bukan menulis ulang dari nol
              </li>
              <li className="flex items-start gap-2">
                <span className="text-violet-500 font-bold">•</span>
                Jangan lupa cek ulang klaim produk sebelum tayang
              </li>
            </ul>
          </div>
        </div>
      </div>
    </FeaturePage>
  );
}
