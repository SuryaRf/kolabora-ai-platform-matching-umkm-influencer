/**
 * Pembatas pemakaian AI per pengguna (in-memory, sliding window).
 *
 * Kenapa in-memory: aplikasi ini berjalan pada satu proses Node di VPS,
 * jadi pembatas sederhana ini cukup untuk menahan penyalahgunaan.
 * Kalau kelak dipakai >1 instance (auto-scaling), ganti penyimpanan ke
 * Redis/Upstash agar hitungan konsisten.
 */

import { NextResponse } from "next/server";

interface Bucket {
  count: number;
  resetAt: number;
}

const store = new Map<string, Bucket>();
let lastSweep = Date.now();

function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of store) {
    if (bucket.resetAt <= now) store.delete(key);
  }
}

export interface LimitResult {
  ok: boolean;
  limit: number;
  remaining: number;
  retryAfterSec: number;
}

export function checkLimit(key: string, limit: number, windowMs: number): LimitResult {
  const now = Date.now();
  sweep(now);
  const bucket = store.get(key);

  if (!bucket || bucket.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, limit, remaining: Math.max(0, limit - 1), retryAfterSec: 0 };
  }

  if (bucket.count >= limit) {
    return {
      ok: false,
      limit,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;
  return { ok: true, limit, remaining: Math.max(0, limit - bucket.count), retryAfterSec: 0 };
}

/** Batas bisa diset lewat .env tanpa mengubah kode */
export function aiLimits() {
  return {
    perMinute: Number(process.env.AI_RATE_LIMIT_PER_MIN ?? 8),
    perHour: Number(process.env.AI_RATE_LIMIT_PER_HOUR ?? 60),
    perDay: Number(process.env.AI_RATE_LIMIT_PER_DAY ?? 200),
  };
}

/**
 * Periksa kuota AI milik satu pengguna.
 * Mengembalikan NextResponse 429 bila habis, atau null bila boleh lanjut.
 */
export function guardAiQuota(userId: string): NextResponse | null {
  const { perMinute, perHour, perDay } = aiLimits();
  const checks: [string, number, number][] = [
    [`ai:m:${userId}`, perMinute, 60_000],
    [`ai:h:${userId}`, perHour, 3_600_000],
    [`ai:d:${userId}`, perDay, 86_400_000],
  ];

  for (const [key, limit, windowMs] of checks) {
    const res = checkLimit(key, limit, windowMs);
    if (!res.ok) {
      return NextResponse.json(
        {
          error: `Batas pemakaian AI terlampaui. Coba lagi dalam ${res.retryAfterSec} detik.`,
          code: "RATE_LIMITED",
          retryAfterSec: res.retryAfterSec,
        },
        { status: 429, headers: { "Retry-After": String(res.retryAfterSec) } },
      );
    }
  }
  return null;
}
