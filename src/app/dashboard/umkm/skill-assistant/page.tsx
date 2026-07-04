"use client";

import { useState } from "react";
import { Bot, Send, Sparkles, Copy, Check, Lightbulb, Target, PenLine, MessageSquare } from "lucide-react";
import FeaturePage from "@/components/dashboard/FeaturePage";

const suggestions = [
  { icon: PenLine, text: "Buat caption promosi untuk produk kopi lokal dengan gaya storytelling", color: "text-umkm" },
  { icon: Lightbulb, text: "Ide konten TikTok untuk produk skincare bulan ini", color: "text-kolabora" },
  { icon: Target, text: "Strategi promosi untuk UMKM fashion memasuki pasar Gen Z", color: "text-influencer" },
  { icon: MessageSquare, text: "Brief kerja sama untuk campaign food launching", color: "text-emerald-500" },
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
      "Di balik setiap produk [Nama Produk], ada cerja keras [nama pengrajin/owner] yang telah mendedikasikan [lama] tahun untuk melestarikan [kearifan lokal/keahlian tradisional]. Mulai dari [proses produksi], setiap langkah dilakukan dengan penuh cinta dan ketelitian. 💚\n\nSaatnya kita bangga menggunakan produk lokal berkualitas tinggi yang tidak kalah dengan brand internasional!",
  },
];

export default function SkillAssistant() {
  const [prompt, setPrompt] = useState("");
  const [copied, setCopied] = useState<number | null>(null);

  const copyToClipboard = (idx: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(idx);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <FeaturePage
      title="AI Skill Assistant"
      description="Asisten AI yang membantu menyusun brief, caption, ide konten, dan strategi pemasaran digital."
      icon={Bot}
      gradient="bg-kolabora"
    >
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-umkm flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-sm">AI Assistant</p>
            <p className="text-xs text-zinc-500">Siap membantu Anda 24/7</p>
          </div>
        </div>
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Tulis pertanyaan atau perintah untuk AI Assistant..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-umkm/50 resize-none"
          />
          <button className="absolute right-3 bottom-3 p-2 rounded-lg bg-umkm text-white hover:bg-umkm-dark transition-all">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-sm mb-3">Rekomendasi Prompt</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => setPrompt(s.text)}
              className="flex items-start gap-3 p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-umkm/50 transition-all text-left"
            >
              <s.icon className={`w-5 h-5 ${s.color} flex-shrink-0 mt-0.5`} />
              <span className="text-sm text-zinc-600 dark:text-zinc-400">{s.text}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-sm mb-3">Template Siap Pakai</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {templates.map((t, i) => (
            <div key={i} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-sm">{t.title}</h4>
                <button onClick={() => copyToClipboard(i, t.content)} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                  {copied === i ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-zinc-400" />}
                </button>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed whitespace-pre-line">{t.content}</p>
            </div>
          ))}
        </div>
      </div>
    </FeaturePage>
  );
}
