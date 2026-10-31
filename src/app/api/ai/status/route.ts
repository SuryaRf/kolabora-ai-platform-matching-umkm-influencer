import { NextResponse } from "next/server";
import { aiInfo, aiIsConfigured } from "@/lib/ai";
import { aiLimits } from "@/lib/rate-limit";
import { requireAiSession } from "@/lib/ai-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/ai/status
 * Memberi tahu UI apakah AI asli sudah siap, model apa yang dipakai,
 * dan batas pemakaian. Dengan ?test=1 dilakukan panggilan kecil ke DeepSeek
 * untuk memastikan kunci benar (berguna saat deploy ke VPS).
 */
export async function GET(req: Request) {
  const guard = await requireAiSession();
  if (!guard.ok) return guard.res;

  const info = aiInfo();
  const limits = aiLimits();
  const wantsTest = new URL(req.url).searchParams.get("test") === "1";

  if (wantsTest) {
    if (!info.configured) {
      return NextResponse.json({ ...info, limits, test: { ok: false, message: "DEEPSEEK_API_KEY belum diisi." } });
    }
    try {
      const started = Date.now();
      const { aiChat } = await import("@/lib/ai");
      const reply = await aiChat({
        messages: [
          { role: "system", content: "Balas hanya dengan kata: SIAP" },
          { role: "user", content: "Balas dengan satu kata." },
        ],
        maxTokens: 8,
        temperature: 0,
        timeoutMs: 20000,
      });
      return NextResponse.json({
        ...info,
        limits,
        test: { ok: true, latencyMs: Date.now() - started, reply: reply.trim().slice(0, 40) },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Tidak dapat terhubung ke DeepSeek.";
      return NextResponse.json({ ...info, limits, test: { ok: false, message } }, { status: 502 });
    }
  }

  return NextResponse.json({
    ...info,
    limits,
    endpoints: ["/api/ai/content", "/api/ai/brief", "/api/ai/score-campaign", "/api/ai/match"],
    fallback: "Bila AI gagal, fitur tetap berjalan dengan perhitungan aturan (rule-based).",
    configured: aiIsConfigured(),
  });
}
