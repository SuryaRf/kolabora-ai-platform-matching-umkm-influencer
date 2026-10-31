/**
 * Lapisan koneksi ke DeepSeek Chat API (terkompatibel OpenAI).
 *
 * HANYA BOLEH dipakai dari Server Component / Route Handler.
 * Variable tanpa prefix NEXT_PUBLIC tidak dikirim ke browser, jadi
 * DEEPSEEK_API_KEY aman di sini.
 *
 * Perilaku penting:
 *  - Timeout keras (default 40 detik) supaya tidak menggantung sampai
 *   Function Vercel/VPS mati.
 *  - Retry otomatis untuk 429 / 5xx / koneksi putus (DeepSeek sering
 *    menolak request paralel dengan 429 "Need for speed").
 *  - aiJson() memaksa format JSON dan memulihkan respons yang rusak
 *    (fence ```json, teks pembuka, kontrol karakter) sebelum parsing.
 */

export type AiRole = "system" | "user" | "assistant";

export interface AiMessage {
  role: AiRole;
  content: string;
}

export type AiErrorCode =
  | "NOT_CONFIGURED"
  | "TIMEOUT"
  | "RATE_LIMIT"
  | "QUOTA_EXCEEDED"
  | "INVALID_KEY"
  | "UPSTREAM"
  | "BAD_JSON"
  | "TOO_LARGE";

export class AiError extends Error {
  code: AiErrorCode;
  status?: number;
  retryable: boolean;

  constructor(code: AiErrorCode, message: string, options?: { status?: number; retryable?: boolean }) {
    super(message);
    this.name = "AiError";
    this.code = code;
    this.status = options?.status;
    this.retryable = options?.retryable ?? false;
  }
}

interface AiConfig {
  baseUrl: string;
  model: string;
  key: string;
  timeoutMs: number;
  maxRetries: number;
}

export function aiConfig(): AiConfig {
  return {
    baseUrl: (process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com").replace(/\/+$/, ""),
    model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
    key: process.env.DEEPSEEK_API_KEY || "",
    timeoutMs: Number(process.env.DEEPSEEK_TIMEOUT_MS || 40000),
    maxRetries: Number(process.env.DEEPSEEK_MAX_RETRIES ?? 2),
  };
}

export function aiIsConfigured(): boolean {
  return aiConfig().key.length > 0;
}

/** Informasi model untuk ditampilkan di UI / endpoint /api/ai/status */
export function aiInfo() {
  const { baseUrl, model, timeoutMs } = aiConfig();
  return {
    configured: aiIsConfigured(),
    model,
    baseUrl,
    timeoutMs,
    keyPreview: aiConfig().key ? `${aiConfig().key.slice(0, 6)}…(${aiConfig().key.length} karakter)` : null,
  };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface ChatOptions {
  messages: AiMessage[];
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
  /** Pemanggil bisa memperpendek/memperpanjang timeout per endpoint */
  timeoutMs?: number;
  signal?: AbortSignal;
}

interface RawChatResponse {
  choices?: { message?: { content?: string }; finish_reason?: string }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
  error?: { message?: string; type?: string };
}

/**
 * Kirim request chat ke DeepSeek, kembalikan teks mentah.
 */
export async function aiChat(options: ChatOptions): Promise<string> {
  const cfg = aiConfig();
  if (!cfg.key) {
    throw new AiError(
      "NOT_CONFIGURED",
      "AI belum diaktifkan. Isi DEEPSEEK_API_KEY pada file .env, lalu restart server.",
    );
  }
  if (!options.messages?.length) {
    throw new AiError("TOO_LARGE", "Prompt kosong, tidak ada yang bisa diproses.");
  }

  const body: Record<string, unknown> = {
    model: cfg.model,
    messages: options.messages,
    stream: false,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 1600,
  };
  if (options.jsonMode) body.response_format = { type: "json_object" };

  const attempts = Math.max(0, cfg.maxRetries) + 1;
  let lastError: AiError | null = null;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort("timeout"), options.timeoutMs ?? cfg.timeoutMs);
    try {
      const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cfg.key}`,
        },
        body: JSON.stringify(body),
        signal: options.signal ? AbortSignal.any([options.signal, controller.signal]) : controller.signal,
      });

      const text = await res.text();
      let data: RawChatResponse | null = null;
      try {
        data = text ? (JSON.parse(text) as RawChatResponse) : null;
      } catch {
        data = null;
      }

      if (!res.ok) {
        const upstreamMessage = data?.error?.message ?? text.slice(0, 200);
        if (res.status === 401 || res.status === 403) {
          throw new AiError("INVALID_KEY", `Kunci API DeepSeek ditolak (HTTP ${res.status}). Periksa DEEPSEEK_API_KEY.`, {
            status: res.status,
          });
        }
        if (res.status === 429) {
          const retryAfter = Number(res.headers.get("retry-after") || 0);
          throw new AiError(
            "RATE_LIMIT",
            retryAfter > 0
              ? `Terlalu banyak permintaan. Coba lagi dalam ${retryAfter} detik.`
              : "Layanan AI sedang sibuk (antrian penuh). Sedang dicoba ulang…",
            { status: res.status, retryable: true },
          );
        }
        if (res.status === 402) {
          throw new AiError("QUOTA_EXCEEDED", "Kuota/limit billing DeepSeek habis. Isi ulang saldo di platform.deepseek.com.", {
            status: res.status,
          });
        }
        if (res.status === 500 || res.status === 502 || res.status === 503) {
          throw new AiError("UPSTREAM", `Server DeepSeek bermasalah (HTTP ${res.status}).`, {
            status: res.status,
            retryable: true,
          });
        }
        throw new AiError("UPSTREAM", `Gagal memanggil AI (HTTP ${res.status}): ${upstreamMessage}`, {
          status: res.status,
        });
      }

      const content = data?.choices?.[0]?.message?.content;
      if (typeof content !== "string" || content.trim() === "") {
        throw new AiError("UPSTREAM", "Respons AI kosong. Silakan coba lagi.", { retryable: true });
      }

      if (process.env.AI_LOG_USAGE === "1" && data?.usage) {
        console.log(
          `[ai] ${cfg.model} prompt=${data.usage.prompt_tokens} completion=${data.usage.completion_tokens} total=${data.usage.total_tokens}`,
        );
      }
      return content;
    } catch (err) {
      const aiError =
        err instanceof AiError
          ? err
          : (err as Error)?.name === "AbortError"
            ? new AiError("TIMEOUT", "AI tidak merespons dalam batas waktu. Coba perpendek permintaan atau ulangi.", {
                retryable: true,
              })
            : new AiError("UPSTREAM", `Tidak dapat terhubung ke ${cfg.baseUrl}: ${(err as Error)?.message ?? "jaringan bermasalah"}`, {
                retryable: true,
              });

      lastError = aiError;
      const canRetry = aiError.retryable && attempt < attempts - 1;
      if (!canRetry) throw aiError;

      // Backoff: 900ms, lalu 2400ms (+jitter) agar tidak menabrak antrian yang sama
      const backoff = 900 * 2 ** attempt + Math.floor(Math.random() * 350);
      console.warn(`[ai] percobaan ${attempt + 1}/${attempts} gagal (${aiError.code}); tunggu ${backoff}ms`);
      await sleep(backoff);
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError ?? new AiError("UPSTREAM", "Pemanggilan AI gagal.");
}

/** Ambil isi teks dan bersihkan pembungkus markdown yang sering menempel */
function stripFences(raw: string): string {
  let out = raw.trim();
  const fence = out.match(/^```(?:json|json5)?\s*([\s\S]*?)\s*```$/i);
  if (fence) out = fence[1].trim();
  return out;
}

/**
 * Karakter kontrol yang membuat JSON.parse gagal (\0, \b, \v, form feed, ESC).
 * \n, \r, dan \t dibiarkan karena diizinkan di luar string.
 */
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g;

/**
 * Perbaiki JSON yang rusak ringan: pembungkus teks model, karakter kontrol,
 * koma ganda, koma menggantung, lalu potong ke objek/aliran terluar.
 */
export function repairJson(raw: string): string {
  let text = stripFences(raw).replace(CONTROL_CHARS, "");

  // Ambil bagian dari { atau [ pertama sampai pasangannya yang terakhir
  const start = text.search(/[[{]/);
  if (start > 0) text = text.slice(start);
  const lastBrace = Math.max(text.lastIndexOf("}"), text.lastIndexOf("]"));
  if (lastBrace >= 0) text = text.slice(0, lastBrace + 1);

  // Koma ganda dan koma sebelum penutup
  text = text.replace(/,\s*,/g, ",").replace(/,\s*([}\]])/g, "$1");

  // String yang belum ditutup dengan tanda kutip
  if ((text.match(/"/g)?.length ?? 0) % 2 === 1) text += '"';

  return text.trim();
}

/**
 * Baca JSON dari teks respons AI.
 * Urutan: parse bersih -> parse hasil repairJson -> ekstrak blok terluar ->
 * (opsional) nilai cadangan dari pemanggil.
 */
export function parseJsonResponse<T>(raw: string, fallback?: T): T {
  const attempts: string[] = [];
  const cleaned = stripFences(raw);
  attempts.push(cleaned, repairJson(raw));

  const firstBrace = cleaned.search(/[[{]/);
  if (firstBrace >= 0) {
    const lastBrace = Math.max(cleaned.lastIndexOf("}"), cleaned.lastIndexOf("]"));
    if (lastBrace > firstBrace) attempts.push(cleaned.slice(firstBrace, lastBrace + 1));
  }

  for (const candidate of attempts) {
    if (!candidate) continue;
    try {
      return JSON.parse(candidate) as T;
    } catch {
      // lanjut ke kandidat berikutnya
    }
  }

  if (fallback !== undefined) return fallback;
  throw new AiError("BAD_JSON", "Hasil AI tidak berbentuk JSON yang sah. Silakan coba lagi.");
}

/** Versi aiChat + parsing JSON sekaligus */
export async function aiJson<T>(options: ChatOptions & { fallback?: T }): Promise<T> {
  const raw = await aiChat({ ...options, jsonMode: true });
  try {
    return parseJsonResponse<T>(raw, options.fallback);
  } catch (err) {
    if (err instanceof AiError && err.code === "BAD_JSON") {
      console.warn("[ai] JSON tidak valid, mencoba sekali lagi. Cuplikan:", raw.slice(0, 240));
      const again = await aiChat({ ...options, jsonMode: true, temperature: 0.2 });
      return parseJsonResponse<T>(again, options.fallback);
    }
    throw err;
  }
}

/** Batasi panjang input pengguna agar prompt tidak membengkak */
export function clampText(value: unknown, max: number): string {
  const text = typeof value === "string" ? value.trim() : "";
  return text.length > max ? text.slice(0, max) : text;
}

/** Estimasi kasar: 1 token ≈ 3 karakter untuk campuran Indonesia/Inggris */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 3);
}
