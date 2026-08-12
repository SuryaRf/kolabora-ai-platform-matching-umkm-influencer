"use client";

import { useState } from "react";
import { Bot, Sparkles, Copy, Check, FileText, Wand2, Lightbulb, Send } from "lucide-react";
import FeaturePage from "@/components/dashboard/FeaturePage";

const quickActions = [
  { icon: FileText, title: "Buat Caption Promosi", desc: "Hasilkan caption menarik untuk produk UMKM" },
  { icon: Wand2, title: "Ide Konten Kreatif", desc: "Dapatkan konsep konten yang viral" },
  { icon: Lightbulb, title: "Strategi Engagement", desc: "Tips meningkatkan interaksi audiens" },
  { icon: Bot, title: "Optimasi Personal Branding", desc: "Saran memperkuat personal brand" },
];

const recentResults = [
  "Storytelling untuk produk kopi: 'Mulai hari dengan secangkir...'",
  "Caption produk skincare: 'Skincare routine yang bikin glowing...'",
  "Hook TikTok: 'Kamu pasti nggak nyangka kalau...'",
];

export default function AIContentAssistant() {
  const [prompt, setPrompt] = useState("");
  const [copied, setCopied] = useState<number | null>(null);

  const copyToClipboard = (idx: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(idx);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <FeaturePage
      title="AI Content Assistant"
      description="Akses tanpa batas generator draf skrip video otomatis (Auto-Script Generator) dan asisten konten berbasis AI."
      icon={Bot}
      gradient="bg-gradient-to-br from-violet-500 to-purple-600"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-violet-500" />
              <h3 className="font-semibold text-sm">AI Content Generator</h3>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Deskripsikan konten yang ingin kamu buat...&#10;Contoh: &quot;Buat hook TikTok untuk promosi produk kopi dengan gaya storytelling yang relatable untuk anak muda&quot;"
              rows={5}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none"
            />
            <button className="w-full mt-3 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-500/25">
              <Sparkles className="w-4 h-4" /> Generate Konten
            </button>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
            <h3 className="font-semibold text-sm mb-3">Hasil Generate Terakhir</h3>
            <div className="space-y-2">
              {recentResults.map((result, i) => (
                <div key={i} className="flex items-start justify-between gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{result}</p>
                  <button onClick={() => copyToClipboard(i, result)} className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 flex-shrink-0">
                    {copied === i ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
            <h3 className="font-semibold text-sm mb-3">Quick Actions</h3>
            <div className="space-y-2">
              {quickActions.map((action, i) => (
                <button key={i} onClick={() => setPrompt(`Bantu saya: ${action.desc}`)} className="w-full text-left p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:border-violet-200 dark:hover:border-violet-700 transition-all group">
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
            <h3 className="font-semibold text-sm mb-2">Tips Penggunaan</h3>
            <ul className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
              <li className="flex items-start gap-2">
                <span className="text-violet-500 font-bold">•</span>
                Semakin detail brief, semakin relevan hasilnya
              </li>
              <li className="flex items-start gap-2">
                <span className="text-violet-500 font-bold">•</span>
                Cantumkan platform target (TikTok/IG/YouTube)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-violet-500 font-bold">•</span>
                Sebutkan tone yang diinginkan (funny/inspirational)
              </li>
            </ul>
          </div>
        </div>
      </div>
    </FeaturePage>
  );
}
