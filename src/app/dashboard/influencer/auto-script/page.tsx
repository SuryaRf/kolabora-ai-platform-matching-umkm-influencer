"use client";

import { useState } from "react";
import { FileText, Sparkles, Copy, Check, RefreshCw, SwitchCamera, Music2, Camera, Video } from "lucide-react";
import FeaturePage from "@/components/dashboard/FeaturePage";

const scriptTemplates = [
  {
    platform: "TikTok / Reels",
    icon: Music2,
    color: "bg-zinc-800",
    content: `HOOK (0-3 detik):
"Kalian percaya nggak kalau [produk] ini bisa [manfaat utama] dalam [waktu]?"

BODY (3-30 detik):
"Halo semuanya! Balik lagi sama [nama kreator]. Hari ini gue mau kasih tau kalian tentang [produk] yang lagi viral banget nih.

Jadi gini [ceritakan problem] -> [perkenalan produk] -> [tunjukkan solusi].

Coba liat nih [demonstrasi produk], hasilnya [tunjukkan hasil].

Yang paling gue suka tuh [fitur favorit], bikin [manfaat].

CLOSING (30-45 detik):
Udah pada penasaran? Langsung aja cek link di bio gue ya!
Jangan lupa like, comment, and follow buat konten menarik lainnya! 🚀

#Sponsored #[NamaBrand] #ProductReview`,
  },
  {
    platform: "Instagram Feed",
    icon: Camera,
    color: "bg-pink-500",
    content: `CAPTION:

Pernah ngalamin [masalah]? 🙋‍♂️

Gue juga dulu gitu sampe akhirnya nemu [produk]! Setelah [waktu] pemakaian, hasilnya bener-bener [hasil positif].

Apa yang bikin produk ini beda?
✅ [Fitur 1]
✅ [Fitur 2]
✅ [Fitur 3]

Yang paling penting, produk ini [unique selling point].

Buat kalian yang mau coba, bisa langsung order lewat link di bio! 🎉

Siapa tau ini solusi yang selama ini kalian cari. ✨

#Sponsored #[BrandName] #ProductReview #[Niche]`,
  },
  {
    platform: "YouTube",
    icon: Video,
    color: "bg-red-500",
    content: [
      "INTRO (0-30 detik):",
      '"Halo semuanya, welcome back to my channel! [Nama kreator] here! 🎬',
      "",
      "Di video kali ini, gue bakal [topik video] yang udah banyak banget kalian request.",
      "",
      'Sebelum mulai, video ini sponsored by [nama brand], makasih banyak ya udah support channel gue!"',
      "",
      "MAIN CONTENT (30 detik - menit):",
      "[Bagian 1: Perkenalan masalah]",
      '"Jadi gini ceritanya..."',
      "",
      "[Bagian 2: Perkenalan produk]",
      '"Gue baru nyobain [produk] dan..."',
      "",
      "[Bagian 3: Demonstrasi/detail]",
      '"Sekarang gue demo-in langsung..."',
      "",
      "[Bagian 4: Hasil]",
      '"Hasilnya setelah [waktu]..."',
      "",
      "OUTRO:",
      '"Ok guys, that\\\'s all for today\\\'s video!',
      "Gue harap review ini bermanfaat buat kalian.",
      "Jangan lupa like, subscribe, dan nyalain loncengnya! 🔔",
      'See you di video selanjutnya! 👋"',
    ].join("\n"),
  },
];

const shortScripts = [
  { platform: "TikTok", hook: "Cuma 15 detik langsung laku keras! Rahasia promo pakai [produk]...", duration: "15-30 detik", vibe: "Casual & Energetic" },
  { platform: "Reels", hook: "Stop scrolling! Video ini bakal bikin kamu sadar kalau [produk] itu...", duration: "30-60 detik", vibe: "Storytelling" },
  { platform: "Stories", hook: "QUIZ: Tebak berapa harga [produk] ini? Jawab di poll ya! 👇", duration: "15 detik", vibe: "Interaktif" },
];

export default function AutoScript() {
  const [selected, setSelected] = useState(0);
  const [copied, setCopied] = useState<number | null>(null);

  const copyToClipboard = (idx: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(idx);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <FeaturePage
      title="Auto-Script Generator"
      description="Hasilkan draft naskah konten, caption, dan storytelling secara otomatis sesuai brief dari UMKM."
      icon={FileText}
      gradient="bg-kolabora"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            {scriptTemplates.map((t, i) => {
              const activeClass = i === selected ? "bg-kolabora text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700";
              return (
                <button key={i} onClick={() => setSelected(i)} className={"flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all " + activeClass}>
                  <t.icon className="w-4 h-4" /> {t.platform}
                </button>
              );
            })}
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={"w-8 h-8 rounded-lg " + scriptTemplates[selected].color + " flex items-center justify-center"}>
                  {scriptTemplates[selected].icon === Music2 ? <Music2 className="w-4 h-4 text-white" /> :
                   scriptTemplates[selected].icon === Camera ? <Camera className="w-4 h-4 text-white" /> :
                   <Video className="w-4 h-4 text-white" />}
                </div>
                <span className="font-semibold text-sm">{scriptTemplates[selected].platform} Script</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => copyToClipboard(selected, scriptTemplates[selected].content)} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">
                  {copied === selected ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-zinc-400" />}
                </button>
                <button className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">
                  <RefreshCw className="w-4 h-4 text-zinc-400" />
                </button>
              </div>
            </div>
            <pre className="whitespace-pre-wrap text-xs leading-relaxed text-zinc-600 dark:text-zinc-400 font-sans">{scriptTemplates[selected].content}</pre>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
            <h3 className="font-semibold text-sm mb-3">Short Script Ideas</h3>
            <div className="space-y-3">
              {shortScripts.map((s, i) => (
                <div key={i} className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                  <div className="flex items-center gap-1.5 mb-2">
                    {s.platform === "TikTok" ? <Music2 className="w-3.5 h-3.5" /> : <Camera className="w-3.5 h-3.5" />}
                    <span className="text-xs font-semibold">{s.platform}</span>
                    <span className="text-xs text-zinc-400">• {s.duration}</span>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 italic">&ldquo;{s.hook}&rdquo;</p>
                  <p className="text-xs text-zinc-400 mt-1">Vibe: {s.vibe}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-sky-50 to-blue-50 dark:from-zinc-800 dark:to-zinc-800 rounded-2xl border border-sky-200 dark:border-zinc-700 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-kolabora" />
              <h3 className="font-semibold text-sm">Generate Custom Script</h3>
            </div>
            <textarea
              placeholder="Tempel brief dari UMKM di sini..."
              rows={4}
              className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/80 text-sm focus:outline-none focus:ring-2 focus:ring-kolabora/50 resize-none"
            />
            <button className="w-full mt-3 py-2.5 rounded-xl text-xs font-semibold text-white bg-kolabora hover:bg-kolabora-dark transition-all flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" /> Generate Script
            </button>
          </div>
        </div>
      </div>
    </FeaturePage>
  );
}
