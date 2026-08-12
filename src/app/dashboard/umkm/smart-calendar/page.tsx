"use client";

import { Calendar, ChevronLeft, ChevronRight, Clock, Target, CheckCircle, AlertCircle } from "lucide-react";
import FeaturePage from "@/components/dashboard/FeaturePage";

const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const days = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

const events = [
  { date: 5, title: "Briefing Campaign", type: "briefing" },
  { date: 8, title: "Produksi Konten", type: "production" },
  { date: 12, title: "Review Konten", type: "review" },
  { date: 15, title: "Publikasi Post 1", type: "publish" },
  { date: 18, title: "Monitoring", type: "monitoring" },
  { date: 22, title: "Publikasi Post 2", type: "publish" },
  { date: 28, title: "Evaluasi", type: "evaluation" },
];

const typeStyles: Record<string, string> = {
  briefing: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  production: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  review: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800",
  publish: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  monitoring: "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700",
  evaluation: "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800",
};

const recommendations = [
  { day: "Senin, 15 Jul", time: "10:00 - 12:00", activity: "Briefing Campaign", reason: "Engagement rate tinggi di awal pekan" },
  { day: "Kamis, 18 Jul", time: "19:00 - 21:00", activity: "Publikasi Post 1", reason: "Prime time audiens (19.00-21.00)" },
  { day: "Sabtu, 20 Jul", time: "10:00 - 12:00", activity: "Produksi Konten", reason: "Weekend produktif untuk shooting" },
];

export default function SmartCalendar() {
  return (
    <FeaturePage
      title="Smart Calendar"
      description="Kalender cerdas untuk rekomendasi tenggat proyek dan jadwal penayangan iklan terbaik."
      icon={Calendar}
      gradient="bg-kolabora"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold">Juli 2026</h3>
            <div className="flex items-center gap-2">
              <button className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"><ChevronLeft className="w-4 h-4" /></button>
              <button className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {days.map((d) => (
              <div key={d} className="text-xs font-medium text-zinc-500 py-2">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {Array.from({ length: 31 }, (_, i) => {
              const day = i + 1;
              const dayEvents = events.filter((e) => e.date === day);
              return (
                <div key={day} className={`relative p-2 rounded-xl text-sm transition-colors ${dayEvents.length > 0 ? "bg-kolabora/10 text-kolabora font-medium" : "hover:bg-zinc-50 dark:hover:bg-zinc-800"}`}>
                  {day}
                  {dayEvents.length > 0 && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-kolabora" />}
                </div>
              );
            })}
          </div>
          <div className="mt-6 space-y-2">
            {events.map((e, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800">
                <span className={`px-2 py-0.5 rounded text-xs font-medium border ${typeStyles[e.type]}`}>{e.type}</span>
                <span className="text-sm flex-1">{e.title}</span>
                <span className="text-xs text-zinc-500">{e.date} Jul 2026</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-umkm" />
              <h3 className="font-semibold text-sm">Rekomendasi AI</h3>
            </div>
            <div className="space-y-3">
              {recommendations.map((r, i) => (
                <div key={i} className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                  <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
                    <Clock className="w-3 h-3" />
                    <span>{r.day}</span>
                    <span>•</span>
                    <span>{r.time}</span>
                  </div>
                  <p className="text-sm font-medium">{r.activity}</p>
                  <p className="text-xs text-zinc-400 mt-1">{r.reason}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
            <h3 className="font-semibold text-sm mb-3">Statistik</h3>
            <div className="space-y-3">
              {[
                { icon: CheckCircle, label: "Campaign Selesai", value: "3", color: "text-emerald-500" },
                { icon: AlertCircle, label: "Akan Datang", value: "2", color: "text-amber-500" },
                { icon: Clock, label: "Sedang Berlangsung", value: "1", color: "text-blue-500" },
              ].map((s, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <s.icon className={`w-4 h-4 ${s.color}`} />
                    <span className="text-xs text-zinc-500">{s.label}</span>
                  </div>
                  <span className="text-sm font-semibold">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </FeaturePage>
  );
}
