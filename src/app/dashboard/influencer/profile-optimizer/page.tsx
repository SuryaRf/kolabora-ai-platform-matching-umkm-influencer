"use client";

import { Wand2, CheckCircle, AlertCircle, ArrowRight, Sparkles, PenLine, Hash, MessageCircle } from "lucide-react";
import FeaturePage from "@/components/dashboard/FeaturePage";

const analysisScores = [
  { label: "Profil Completeness", score: 75, max: 100, color: "bg-amber-500" },
  { label: "Personal Branding", score: 60, max: 100, color: "bg-blue-500" },
  { label: "Bio Optimization", score: 45, max: 100, color: "bg-red-500" },
  { label: "Keyword Relevance", score: 80, max: 100, color: "bg-emerald-500" },
  { label: "Visual Consistency", score: 70, max: 100, color: "bg-purple-500" },
];

const recommendations = [
  { icon: PenLine, type: "Bio", priority: "High", suggestion: "Tambahkan kata kunci spesifik tentang niche konten Anda di baris pertama bio untuk meningkatkan discoverability." },
  { icon: Hash, type: "Hashtag", priority: "Medium", suggestion: "Gunakan 3-5 hashtag relevan dengan niche di bio, seperti #FoodBlogger #KulinerIndonesia." },
  { icon: MessageCircle, type: "Pinned Post", priority: "High", suggestion: "Sematkan konten dengan performa terbaik sebagai pinned post untuk memberi kesan pertama yang kuat." },
  { icon: Sparkles, type: "Niche", priority: "Low", suggestion: "Pertimbangkan untuk lebih spesifik pada sub-niche untuk memperkuat personal branding." },
];

export default function ProfileOptimizer() {
  return (
    <FeaturePage
      title="AI Profile Optimizer"
      description="Analisis profil media sosial dan dapatkan rekomendasi optimasi personal branding berbasis AI."
      icon={Wand2}
      gradient="bg-kolabora"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
            <h3 className="font-semibold text-sm mb-4">Skor Optimasi Profil</h3>
            <div className="space-y-3">
              {analysisScores.map((s, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-zinc-600 dark:text-zinc-400">{s.label}</span>
                    <span className="font-semibold">{s.score}/{s.max}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                    <div className={`h-full rounded-full ${s.color}`} style={{ width: `${(s.score / s.max) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-center">
              <p className="text-lg font-bold text-kolabora">66/100</p>
              <p className="text-xs text-zinc-500">Overall Optimization Score</p>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-umkm" />
              <h3 className="font-semibold text-sm">AI Rekomendasi Bio</h3>
            </div>
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-600 dark:text-zinc-400 italic">
              &ldquo;Food & Travel Content Creator 🍜✈️ | 78K+ di TikTok | Collab: hello@email.com | Mengulas kuliner Nusantara & destinasi hidden gem se-Indonesia&rdquo;
            </div>
            <button className="w-full mt-3 py-2 rounded-xl text-xs font-semibold text-white bg-influencer hover:bg-influencer-dark transition-all">
              Terapkan Rekomendasi
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
            <h3 className="font-semibold text-sm mb-4">Rekomendasi Optimasi</h3>
            <div className="space-y-3">
              {recommendations.map((r, i) => (
                <div key={i} className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <r.icon className="w-4 h-4 text-influencer" />
                      <span className="text-xs font-semibold">{r.type}</span>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      r.priority === "High" ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" :
                      r.priority === "Medium" ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" :
                      "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                    }`}>{r.priority}</span>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">{r.suggestion}</p>
                </div>
              ))}
            </div>
          </div>

          <button className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-kolabora hover:bg-kolabora-dark transition-all shadow-lg flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4" /> Analisis Ulang Profil
          </button>
        </div>
      </div>
    </FeaturePage>
  );
}
