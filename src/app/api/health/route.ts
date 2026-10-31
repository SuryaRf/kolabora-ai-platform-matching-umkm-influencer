import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { aiInfo } from "@/lib/ai";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/health — pemeriksaan cepat untuk uptime monitor dan verifikasi deploy.
 * Publik dan tidak membocorkan data sensitif (hanya status + versi).
 */
export async function GET() {
  const started = Date.now();
  let database: "up" | "down" = "down";
  let detail: string | undefined;

  try {
    const result = await prisma.$queryRaw<{ ok: number }[]>`SELECT 1 AS ok`;
    database = result.length > 0 ? "up" : "down";
  } catch (err) {
    detail = (err instanceof Error ? err.message : String(err)).slice(0, 180);
  }

  const ai = aiInfo();

  return NextResponse.json(
    {
      ok: database === "up",
      app: "kolabora",
      version: process.env.npm_package_version ?? "1.0",
      env: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
      time: new Date().toISOString(),
      durationMs: Date.now() - started,
      database,
      databaseDetail: database === "down" ? detail : undefined,
      ai: { configured: ai.configured, model: ai.model },
      uptimeSec: Math.round(process.uptime()),
    },
    { status: database === "up" ? 200 : 503 },
  );
}
