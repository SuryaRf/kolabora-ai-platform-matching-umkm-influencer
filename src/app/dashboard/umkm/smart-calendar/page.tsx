"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  AlertTriangle,
  CheckCircle,
  ListChecks,
  Wallet,
  Users,
  Megaphone,
  ArrowRight,
} from "lucide-react";
import FeaturePage from "@/components/dashboard/FeaturePage";
import { formatCurrency } from "@/lib/utils";

type EventType = "briefing" | "production" | "review" | "publish" | "payment" | "evaluation";

interface CalendarEvent {
  id: string;
  date: string;
  title: string;
  type: EventType;
  collaborationId?: string;
  campaignId?: string;
  done: boolean;
}

interface ActionItem {
  title: string;
  reason: string;
  href: string;
  urgent: boolean;
}

interface Insight {
  business: { name: string; category: string; location: string | null };
  campaigns: {
    total: number;
    active: number;
    closed: number;
    completed: number;
    draft: number;
    budgetCommitted: number;
  };
  applications: { total: number; pending: number };
  collaborations: {
    total: number;
    active: number;
    completed: number;
    escrowHeld: number;
    escrowReleased: number;
    heldCount: number;
  };
  events: CalendarEvent[];
  upcomingCount: number;
  upcomingMonths: string[];
  actions: ActionItem[];
}

const TYPE_META: Record<EventType, { label: string; chip: string; dot: string }> = {
  briefing: {
    label: "Briefing",
    chip: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    dot: "bg-blue-500",
  },
  production: {
    label: "Produksi",
    chip: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    dot: "bg-amber-500",
  },
  review: {
    label: "Review & batas waktu",
    chip: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800",
    dot: "bg-purple-500",
  },
  publish: {
    label: "Publikasi konten",
    chip: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    dot: "bg-emerald-500",
  },
  payment: {
    label: "Pembayaran / escrow",
    chip: "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800",
    dot: "bg-rose-500",
  },
  evaluation: {
    label: "Tonggak capaian",
    chip: "bg-kolabora-100 dark:bg-kolabora-900/30 text-kolabora dark:text-kolabora-light border-kolabora-200 dark:border-kolabora-800",
    dot: "bg-kolabora",
  },
};

const DAYS_SHORT = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

const keyOfMonth = (isoLike: string) => isoLike.slice(0, 7);
const keyOfDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function monthLabel(monthKey: string) {
  const [y, m] = monthKey.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" });
}

/** Semua bulan antara bulan pertama dan terakhir yang punya data (maks 36 bulan). */
function buildMonthRange(events: CalendarEvent[], fallback: string): string[] {
  if (events.length === 0) return [fallback];
  const keys = events.map((e) => keyOfMonth(e.date)).sort();
  const first = keys[0];
  const last = keys[keys.length - 1];
  const [fy, fm] = first.split("-").map(Number);
  const [ly, lm] = last.split("-").map(Number);
  const out: string[] = [];
  let y = fy;
  let m = fm;
  while (out.length < 36) {
    out.push(`${y}-${String(m).padStart(2, "0")}`);
    if (y === ly && m === lm) break;
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return out;
}

export default function SmartCalendar() {
  const [data, setData] = useState<Insight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profilKosong, setProfilKosong] = useState(false);
  const [monthPick, setMonthPick] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError("");
    try {
      const res = await fetch("/api/insights/umkm", { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (res.status === 400 && json.code === "PROFILE_MISSING") {
        setProfilKosong(true);
        return;
      }
      if (!res.ok) {
        setError(json.error ?? "Gagal memuat agenda.");
        return;
      }
      setData(json as Insight);
      setProfilKosong(false);
    } catch {
      setError("Koneksi terputus saat memuat agenda.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  const now = useMemo(() => new Date(), []);
  const currentMonth = keyOfMonth(now.toISOString());

  const months = useMemo(
    () => buildMonthRange(data?.events ?? [], currentMonth),
    [data, currentMonth],
  );

  // Bulan awal = bulan pertama yang masih punya agenda belum lewat (diturunkan, bukan setState di effect).
  const defaultMonth = useMemo(() => {
    const upcoming = new Set(data?.upcomingMonths ?? []);
    const idx = months.findIndex((m) => upcoming.has(m));
    if (idx >= 0) return months[idx];
    const inRange = months.indexOf(currentMonth);
    return inRange >= 0 ? months[inRange] : months[0] ?? currentMonth;
  }, [data, months, currentMonth]);

  const activeMonth =
    monthPick && months.includes(monthPick) ? monthPick : defaultMonth;
  const activeIndex = Math.max(0, months.indexOf(activeMonth));

  const pindahBulan = (delta: number) => {
    const target = months[activeIndex + delta];
    if (!target) return;
    setMonthPick(target);
    setSelectedDay(null);
  };

  const [year, monthNum] = activeMonth.split("-").map(Number);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of data?.events ?? []) {
      if (keyOfMonth(e.date) !== activeMonth) continue;
      const day = e.date.slice(0, 10);
      map.set(day, [...(map.get(day) ?? []), e]);
    }
    return map;
  }, [data, activeMonth]);

  const monthEvents = useMemo(
    () => data?.events.filter((e) => keyOfMonth(e.date) === activeMonth) ?? [],
    [data, activeMonth],
  );

  const grid = useMemo(() => {
    const firstWeekday = new Date(year, monthNum - 1, 1).getDay();
    const daysInMonth = new Date(year, monthNum, 0).getDate();
    const cells: ({ day: number; key: string } | null)[] = [];
    for (let i = 0; i < firstWeekday; i += 1) cells.push(null);
    for (let d = 1; d <= daysInMonth; d += 1) {
      cells.push({
        day: d,
        key: `${year}-${String(monthNum).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
      });
    }
    return cells;
  }, [year, monthNum]);

  const weekdaySpread = useMemo(() => {
    const counts = new Array(7).fill(0) as number[];
    for (const e of data?.events ?? []) counts[new Date(e.date).getDay()] += 1;
    const max = Math.max(...counts, 1);
    return counts.map((c, i) => ({ day: DAYS_SHORT[i], count: c, pct: Math.round((c / max) * 100) }));
  }, [data]);

  const selectedEvents = selectedDay ? (eventsByDay.get(selectedDay) ?? []) : [];
  const todayKey = keyOfDay(now);
  const typeCounts = useMemo(() => {
    const map = new Map<EventType, number>();
    for (const e of monthEvents) map.set(e.type, (map.get(e.type) ?? 0) + 1);
    return map;
  }, [monthEvents]);

  const shell = (children: React.ReactNode) => (
    <FeaturePage
      title="Kalender Kolaborasi"
      description="Agenda yang dibangun dari tanggal campaign dan kolaborasi kamu di database — bukan contoh."
      icon={Calendar}
      gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
    >
      {children}
    </FeaturePage>
  );

  if (loading) {
    return shell(
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <Loader2 className="w-4 h-4 animate-spin" /> Memuat agenda kampanye...
      </div>,
    );
  }

  if (profilKosong || !data) {
    return shell(
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 text-center">
        <p className="font-semibold">Profil UMKM belum dibuat</p>
        <p className="text-sm text-zinc-500 mt-1">
          {error || "Agenda dihitung dari campaign, lamaran, dan kolaborasi milik akun UMKM kamu."}
        </p>
        <Link
          href="/dashboard/umkm/profile"
          className="inline-flex items-center gap-2 mt-4 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-umkm hover:bg-umkm-dark transition-colors"
        >
          Lengkapi profil <ArrowRight className="w-4 h-4" />
        </Link>
      </div>,
    );
  }

  return shell(
    <>
      {error && (
        <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            icon: Megaphone,
            label: "Campaign aktif",
            value: `${data.campaigns.active}`,
            hint: `budget maks ${formatCurrency(data.campaigns.budgetCommitted)}`,
            color: "text-umkm",
          },
          {
            icon: Users,
            label: "Pelamar menunggu",
            value: `${data.applications.pending}`,
            hint: `${data.applications.total} lamaran masuk`,
            color: "text-purple-500",
          },
          {
            icon: Wallet,
            label: "Dana di escrow",
            value: data.collaborations.escrowHeld ? formatCurrency(data.collaborations.escrowHeld) : "Rp 0",
            hint: `${data.collaborations.heldCount} kolaborasi tertahan`,
            color: "text-rose-500",
          },
          {
            icon: Clock,
            label: "Agenda ke depan",
            value: `${data.upcomingCount}`,
            hint: `${data.events.length} total peristiwa tercatat`,
            color: "text-blue-500",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4"
          >
            <s.icon className={`w-6 h-6 ${s.color} mb-2`} />
            <p className="text-lg font-bold truncate">{s.value}</p>
            <p className="text-xs text-zinc-500">{s.label}</p>
            <p className="text-[11px] text-zinc-400 truncate">{s.hint}</p>
          </div>
        ))}
      </div>

      {data.actions.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
          <div className="flex items-center gap-2 mb-4">
            <ListChecks className="w-4 h-4 text-kolabora" />
            <h3 className="font-semibold text-sm">Perlu ditangani</h3>
            <span className="text-[11px] text-zinc-400">
              status kolaborasi & brief yang belum ada pelamar
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.actions.map((a) => (
              <Link
                key={a.href + a.title}
                href={a.href}
                className={`p-4 rounded-xl border transition-colors ${
                  a.urgent
                    ? "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800 hover:bg-red-100/70 dark:hover:bg-red-900/20"
                    : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                }`}
              >
                <p className="text-sm font-medium flex items-center gap-2">
                  {a.urgent ? (
                    <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  ) : (
                    <Clock className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                  )}
                  {a.title}
                </p>
                <p className="text-xs text-zinc-500 mt-1">{a.reason}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <button
              type="button"
              onClick={() => pindahBulan(-1)}
              disabled={activeIndex <= 0}
              className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-40"
              aria-label="Bulan sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-center">
              <h3 className="font-semibold">{monthLabel(activeMonth)}</h3>
              <p className="text-xs text-zinc-500">
                {monthEvents.length} agenda{typeCounts.size > 0 ? ` · ${typeCounts.size} jenis` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (!months.includes(currentMonth)) return;
                  setMonthPick(currentMonth);
                  setSelectedDay(null);
                }}
                className="px-3 py-2 rounded-lg text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              >
                Sekarang
              </button>
              <button
                type="button"
                onClick={() => pindahBulan(1)}
                disabled={activeIndex >= months.length - 1}
                className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-40"
                aria-label="Bulan berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAYS_SHORT.map((d) => (
              <div key={d} className="text-center text-[11px] font-medium text-zinc-400 py-1">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {grid.map((cell, i) =>
              cell === null ? (
                <div key={`empty-${i}`} className="aspect-square rounded-lg" />
              ) : (
                <button
                  key={cell.key}
                  type="button"
                  onClick={() => setSelectedDay(eventsByDay.has(cell.key) ? cell.key : null)}
                  disabled={!eventsByDay.has(cell.key)}
                  className={`aspect-square rounded-lg p-1 text-left flex flex-col gap-0.5 transition-colors ${
                    selectedDay === cell.key
                      ? "bg-blue-50 dark:bg-blue-900/30 ring-1 ring-blue-400"
                      : eventsByDay.has(cell.key)
                        ? "bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                        : "bg-transparent"
                  }`}
                >
                  <span
                    className={`text-[11px] font-medium ${
                      cell.key === todayKey
                        ? "w-5 h-5 flex items-center justify-center rounded-full bg-blue-600 text-white"
                        : "text-zinc-500"
                    }`}
                  >
                    {cell.day}
                  </span>
                  {(eventsByDay.get(cell.key) ?? []).slice(0, 2).map((e) => (
                    <span
                      key={e.id}
                      className={`h-1.5 rounded-full ${TYPE_META[e.type].dot} ${e.done ? "opacity-40" : ""}`}
                      title={e.title}
                    />
                  ))}
                  {(eventsByDay.get(cell.key)?.length ?? 0) > 2 && (
                    <span className="text-[9px] text-zinc-400">
                      +{(eventsByDay.get(cell.key)?.length ?? 0) - 2}
                    </span>
                  )}
                </button>
              ),
            )}
          </div>

          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            {Object.entries(TYPE_META).map(([key, meta]) => (
              <span key={key} className="inline-flex items-center gap-1.5 text-[11px] text-zinc-500">
                <span className={`w-2.5 h-2.5 rounded-full ${meta.dot}`} />
                {meta.label}
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">
                {selectedDay
                  ? new Date(`${selectedDay}T00:00:00`).toLocaleDateString("id-ID", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })
                  : "Agenda bulan ini"}
              </h3>
              {selectedDay && (
                <button
                  type="button"
                  onClick={() => setSelectedDay(null)}
                  className="text-[11px] text-zinc-400 hover:text-zinc-600"
                >
                  lihat semua
                </button>
              )}
            </div>

            {(selectedEvents.length ? selectedEvents : monthEvents).length === 0 ? (
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-500">
                Tidak ada agenda pada {selectedDay ? "tanggal ini" : monthLabel(activeMonth)}. Agenda
                muncul otomatis dari tanggal campaign (mulai & batas akhir) serta tahap kolaborasi
                (escrow, produksi, pengiriman konten, pencairan).
                <Link
                  href="/dashboard/umkm/campaigns/new"
                  className="block mt-3 font-semibold text-umkm"
                >
                  Buat campaign untuk mengisi jadwal →
                </Link>
              </div>
            ) : (
              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {(selectedEvents.length ? selectedEvents : monthEvents).map((e) => (
                  <div
                    key={e.id}
                    className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${TYPE_META[e.type].chip}`}
                      >
                        {TYPE_META[e.type].label}
                      </span>
                      <span className="text-[11px] text-zinc-400 flex-shrink-0">
                        {new Date(e.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                    <p className="text-xs font-medium">{e.title}</p>
                    {e.done && (
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 inline-flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> sudah lewat / selesai
                      </p>
                    )}
                    {e.collaborationId && (
                      <Link
                        href={`/dashboard/umkm/chat?collaboration=${e.collaborationId}`}
                        className="text-[11px] text-umkm font-medium mt-1 inline-block"
                      >
                        Buka chat kolaborasi →
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
            <h3 className="font-semibold text-sm mb-3">Sebaran agenda per hari</h3>
            <div className="space-y-2">
              {weekdaySpread.map((w) => (
                <div key={w.day} className="flex items-center gap-2">
                  <span className="w-8 text-[11px] text-zinc-500">{w.day}</span>
                  <div className="flex-1 h-2 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{ width: `${w.pct}%` }}
                    />
                  </div>
                  <span className="w-6 text-right text-[11px] font-medium">{w.count}</span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-zinc-400 mt-3">
              Dihitung dari {data.events.length} agenda tercatat pada akun kamu. Ini gambaran jadwal
              sendiri, bukan klaim jam terbaik untuk posting.
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
            <h3 className="font-semibold text-sm mb-3">Ringkasan kerja sama</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-500">Kolaborasi berjalan</span>
                <span className="font-semibold">{data.collaborations.active}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Selesai</span>
                <span className="font-semibold">{data.collaborations.completed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Escrow tertahan</span>
                <span className="font-semibold">{formatCurrency(data.collaborations.escrowHeld)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Sudah dicairkan</span>
                <span className="font-semibold">{formatCurrency(data.collaborations.escrowReleased)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Campaign: aktif / tutup / selesai</span>
                <span className="font-semibold">
                  {data.campaigns.active} / {data.campaigns.closed} / {data.campaigns.completed}
                </span>
              </div>
            </div>
            <Link
              href="/dashboard/umkm/history"
              className="w-full mt-4 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
            >
              Lihat riwayat kolaborasi <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </>,
  );
}
