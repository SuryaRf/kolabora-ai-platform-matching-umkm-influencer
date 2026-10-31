/**
 * Penjaga bersama untuk semua endpoint AI: sesi, peran, dan pemetaan error
 * agar balasan ke UI selalu konsisten (Bahasa Indonesia + kode yang bisa dicek).
 */

import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { AiError } from "@/lib/ai";

export type UserRole = "UMKM" | "INFLUENCER";

type Guard =
  | { ok: true; session: Session; userId: string; role: UserRole }
  | { ok: false; res: NextResponse };

export async function requireAiSession(roles?: UserRole[]): Promise<Guard> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, res: NextResponse.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 }) };
  }
  const role = session.user.role ?? null;
  if (!role) {
    return {
      ok: false,
      res: NextResponse.json({ error: "Peran akun tidak dikenali. Masuk ulang untuk menyegarkan sesi." }, { status: 403 }),
    };
  }
  if (roles && !roles.includes(role as UserRole)) {
    return { ok: false, res: NextResponse.json({ error: "Akun Anda tidak punya akses fitur ini." }, { status: 403 }) };
  }
  return { ok: true, session, userId: session.user.id, role: role as UserRole };
}

/** Semua error AI dipetakan ke status HTTP + pesan yang aman ditampilkan. */
export function aiErrorResponse(err: unknown): NextResponse {
  if (err instanceof AiError) {
    const statusByCode: Record<string, number> = {
      NOT_CONFIGURED: 503,
      INVALID_KEY: 500,
      QUOTA_EXCEEDED: 402,
      RATE_LIMIT: 429,
      TIMEOUT: 504,
      BAD_JSON: 502,
      TOO_LARGE: 413,
      UPSTREAM: 502,
    };
    return NextResponse.json(
      { error: err.message, code: err.code },
      { status: statusByCode[err.code] ?? 500 },
    );
  }
  console.error("[ai] error tidak terduga:", err);
  return NextResponse.json(
    { error: "Terjadi kesalahan pada layanan. Silakan coba lagi.", code: "UNKNOWN" },
    { status: 500 },
  );
}

/** Validasi teks input dari browser */
export function readString(value: unknown, field: string, min: number, max: number): string | NextResponse {
  const text = typeof value === "string" ? value.trim() : "";
  if (text.length < min) {
    return NextResponse.json({ error: `${field} terlalu pendek (minimal ${min} karakter).`, code: "VALIDATION" }, { status: 400 });
  }
  if (text.length > max) {
    return NextResponse.json({ error: `${field} terlalu panjang (maksimal ${max} karakter).`, code: "VALIDATION" }, { status: 400 });
  }
  return text;
}

export function isResponse(value: unknown): value is NextResponse {
  return value instanceof NextResponse;
}
