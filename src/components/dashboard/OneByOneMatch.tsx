"use client";

import { useState } from "react";
import {
  Check,
  X,
  Sparkles,
  RotateCcw,
  Send,
  CheckCircle2,
  ChevronLeft,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface MatchStat {
  icon: LucideIcon;
  label: string;
  value: string;
}

export interface MatchReason {
  label: string;
  pct: number;
}

export interface MatchItem {
  name: string;
  subtitle: string;
  avatar: string;
  color: string;
  score: number;
  reasons: MatchReason[];
  stats: MatchStat[];
}

interface OneByOneMatchProps {
  items: MatchItem[];
  noun: string;
  ctaLabel: string;
  ctaSuccess: string;
}

export default function OneByOneMatch({
  items,
  noun,
  ctaLabel,
  ctaSuccess,
}: OneByOneMatchProps) {
  const [index, setIndex] = useState(0);
  const [matched, setMatched] = useState<number[]>([]);
  const [justMatched, setJustMatched] = useState<string | null>(null);

  const done = index >= items.length;
  const current = done ? null : items[index];

  const scoreColor = (s: number) =>
    s >= 90
      ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
      : s >= 80
        ? "border-kolabora text-kolabora"
        : "border-amber-500 text-amber-600 dark:text-amber-400";

  const handleSkip = () => {
    if (!current) return;
    setJustMatched(null);
    setIndex((i) => i + 1);
  };

  const handleMatch = () => {
    if (!current) return;
    setMatched((m) => [...m, index]);
    setJustMatched(current.name);
    setIndex((i) => i + 1);
  };

  const reset = () => {
    setIndex(0);
    setMatched([]);
    setJustMatched(null);
  };

  return (
    <div className="space-y-4">
      <div className="max-w-2xl mx-auto w-full">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-1.5">
            {index > 0 && !done && (
              <button
                onClick={() => setIndex((i) => i - 1)}
                className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                title="Kembali"
              >
                <ChevronLeft className="w-4 h-4 text-zinc-400" />
              </button>
            )}
            <p className="text-sm text-zinc-500">
              {done ? (
                "Matching selesai"
              ) : (
                <>
                  Menampilkan {noun} ke-
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                    {index + 1}
                  </span>{" "}
                  dari{" "}
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                    {items.length}
                  </span>
                </>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {matched.length > 0 && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                {matched.length} cocok
              </span>
            )}
            <div className="flex items-center gap-1">
              {items.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i < index
                      ? "w-3 bg-kolabora"
                      : i === index
                        ? "w-6 bg-kolabora"
                        : "w-1.5 bg-zinc-200 dark:bg-zinc-700"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {justMatched && (
        <div className="max-w-2xl mx-auto w-full flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-sm text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>
            <strong>{justMatched}</strong> — {ctaSuccess}
          </span>
        </div>
      )}

      {done ? (
        <div className="max-w-2xl mx-auto w-full bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-10 text-center">
          <div className="w-16 h-16 rounded-full bg-kolabora/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-kolabora" />
          </div>
          <h3 className="text-lg font-bold mb-1">Semua {noun} sudah dilihat</h3>
          <p className="text-sm text-zinc-500 mb-6">
            {matched.length > 0
              ? `${matched.length} ${noun} berhasil dipilih untuk kolaborasi.`
              : "Belum ada yang cocok kali ini, coba mulai ulang untuk melihat rekomendasi lain."}
          </p>
          {matched.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {matched.map((idx) => (
                <span
                  key={idx}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${items[idx].color} text-white`}
                >
                  {items[idx].avatar} {items[idx].name}
                </span>
              ))}
            </div>
          )}
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-kolabora hover:bg-kolabora-dark transition-all"
          >
            <RotateCcw className="w-4 h-4" /> Mulai Ulang Matching
          </button>
        </div>
      ) : (
        current && (
          <div className="max-w-2xl mx-auto w-full bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-16 h-16 rounded-full ${current.color} flex items-center justify-center text-white text-xl font-bold flex-shrink-0`}
                  >
                    {current.avatar}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{current.name}</h2>
                    <p className="text-sm text-zinc-500">{current.subtitle}</p>
                  </div>
                </div>
                <div className="flex flex-col items-center flex-shrink-0">
                  <div
                    className={`w-20 h-20 rounded-full border-4 flex items-center justify-center ${scoreColor(current.score)}`}
                  >
                    <span className="text-lg font-bold">{current.score}%</span>
                  </div>
                  <span className="flex items-center gap-1 text-xs text-zinc-400 mt-1.5">
                    <Sparkles className="w-3 h-3" /> Skor Kecocokan
                  </span>
                </div>
              </div>

              <div className="mt-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">
                  Alasan AI merekomendasikan
                </p>
                <div className="space-y-2.5">
                  {current.reasons.map((r, i) => (
                    <div key={i} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span className="text-sm text-zinc-700 dark:text-zinc-300 truncate">
                          {r.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="w-24 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-kolabora"
                            style={{ width: `${r.pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-zinc-500 w-9 text-right">
                          {r.pct}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
                {current.stats.map((s, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-center"
                  >
                    <s.icon className="w-4 h-4 mx-auto mb-1 text-zinc-400" />
                    <p className="text-sm font-semibold truncate">{s.value}</p>
                    <p className="text-xs text-zinc-500">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
                <button
                  onClick={handleSkip}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
                >
                  <X className="w-4 h-4" /> Find Next
                </button>
                <button
                  onClick={handleMatch}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white bg-kolabora hover:bg-kolabora-dark transition-all"
                >
                  <Send className="w-4 h-4" /> {ctaLabel}
                </button>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}
