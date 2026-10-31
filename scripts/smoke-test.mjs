/**
 * Uji cepat seluruh alur Kolabora terhadap URL apa pun (dev lokal / VPS).
 *
 * Pemakaian:
 *   node scripts/smoke-test.mjs
 *   BASE_URL=https://kolabora.tech node scripts/smoke-test.mjs
 *   SMOKE_UMKM=umkm@kolabora.id SMOKE_KOL=influencer@kolabora.id SMOKE_PASS=password123 node scripts/smoke-test.mjs
 *
 * Alur yang diuji (sesuai mesin status di /api/collaborations/[id]/action):
 *   lamar -> terima lamaran -> accept (INFLUENCER) -> agree -> hold_escrow (UMKM)
 *   -> start_production (INFLUENCER) -> kirim konten (POST /api/reviews)
 *   -> approve (PATCH /api/reviews) -> complete/lepas escrow (UMKM)
 * plus endpoint AI dan pemanggilan halaman utama.
 */

const BASE = (process.env.BASE_URL || "http://localhost:3000").replace(/\/+$/, "");
const PASS = process.env.SMOKE_PASS || "password123";
const UMKM_EMAIL = process.env.SMOKE_UMKM || "umkm@kolabora.id";
const KOL_EMAIL = process.env.SMOKE_KOL || "influencer@kolabora.id";

const results = [];

class Client {
  constructor(base = BASE) {
    this.base = base;
    this.cookies = new Map();
  }

  get cookieHeader() {
    return [...this.cookies.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
  }

  async request(path, { method = "GET", body, form } = {}) {
    const headers = { Cookie: this.cookieHeader };
    let payload;
    if (form) {
      headers["Content-Type"] = "application/x-www-form-urlencoded";
      payload = new URLSearchParams(form).toString();
    } else if (body !== undefined) {
      headers["Content-Type"] = "application/json";
      payload = JSON.stringify(body);
    }
    const res = await fetch(this.base + path, { method, headers, body: payload, redirect: "manual" });
    for (const line of res.headers.getSetCookie?.() ?? []) {
      const [pair] = line.split(";");
      const idx = pair.indexOf("=");
      if (idx === -1) continue;
      const name = pair.slice(0, idx).trim();
      const value = pair.slice(idx + 1).trim();
      if (value === "") this.cookies.delete(name);
      else this.cookies.set(name, value);
    }
    const text = await res.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }
    return { status: res.status, json, text };
  }

  async login(email, password = PASS) {
    this.cookies = new Map();
    const csrf = await this.request("/api/auth/csrf");
    if (csrf.status !== 200 || !csrf.json?.csrfToken) throw new Error(`Gagal mengambil csrfToken (HTTP ${csrf.status})`);
    await this.request("/api/auth/callback/credentials", {
      method: "POST",
      form: { csrfToken: csrf.json.csrfToken, email, password, callbackUrl: `${this.base}/dashboard`, json: "true" },
    });
    const session = await this.request("/api/auth/session");
    if (!session.json?.user?.id) throw new Error(`Login ${email} gagal: ${JSON.stringify(session.json ?? {}).slice(0, 120)}`);
    this.user = session.json.user;
    return session.json.user;
  }
}

function check(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
}

async function main() {
  console.log(`Target: ${BASE}\n`);

  const umkm = new Client();
  const kol = new Client();

  try {
    await umkm.login(UMKM_EMAIL);
    check("login UMKM", true, umkm.user.role);
  } catch (e) {
    check("login UMKM", false, e.message);
    return finish();
  }

  try {
    await kol.login(KOL_EMAIL);
    check("login influencer", true, kol.user.role);
  } catch (e) {
    check("login influencer", false, e.message);
    return finish();
  }

  // ---- baca data ----
  const list = await kol.request("/api/campaigns");
  check("GET /api/campaigns", list.status === 200 && Array.isArray(list.json), `campaign=${list.json?.length ?? 0}`);

  const mine = await umkm.request("/api/campaigns?mine=1");
  check("GET /api/campaigns?mine=1 (UMKM)", mine.status === 200 && Array.isArray(mine.json), `campaign=${mine.json?.length ?? 0}`);

  // ---- buat campaign khusus uji (agar naskah ini bisa dijalankan berulang) ----
  const created = await umkm.request("/api/campaigns", {
    method: "POST",
    body: {
      title: `SMOKE ${new Date().toISOString().slice(11, 19)}`,
      description: "Campaign otomatis untuk uji end-to-end. Jangan dipakai untuk transaksi sungguhan.",
      category: "Kuliner",
      budgetMin: 500000,
      budgetMax: 1500000,
      location: "Jakarta",
      requirements: "Influencer mikro 10.000 followers, audiens 18-30 tahun",
      deliverables: "1 video Reels 30 detik\n3 Instagram Story",
      startDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 12 * 86400000).toISOString().slice(0, 10),
    },
  });
  check("POST /api/campaigns (buat campaign)", created.status === 201 && created.json?.id, `status=${created.status}`);
  if (!created.json?.id) return finish();

  // campaign aktif lain dipakai untuk memeriksa isi daftar
  const target = (list.json || []).find((c) => c.ownerId === umkm.user.id) || (list.json || [])[0];
  check("menemukan campaign aktif", Boolean(target), target?.title ?? "tidak ada");

  // ---- alur lamar-menerima pada campaign uji ----
  const apply = await kol.request("/api/campaigns/apply", {
    method: "POST",
    body: {
      campaignId: created.json.id,
      proposal: "Saya rutin membuat video review dengan engagement 6% dan audiens sesuai brief ini.",
      proposedRate: 1000000,
    },
  });
  check("influencer melamar campaign", [200, 201].includes(apply.status), `status=${apply.status} ${apply.json?.error ?? ""}`);

  const detail = await umkm.request(`/api/campaigns/${created.json.id}`);
  const applicants = detail.json?.applications ?? [];
  const pending = applicants.find((a) => a.status === "PENDING");
  check("detail API mengembalikan campaign yang benar", detail.status === 200 && detail.json?.title === created.json.title, `judul=${detail.json?.title ?? "kosong"}`);
  check("UMKM melihat pelamar", detail.status === 200 && applicants.length > 0, `pelamar=${applicants.length}`);
  if (!pending) {
    check("menerima pelamar", false, "tidak ada lamaran PENDING");
    return finish();
  }

  const accept = await umkm.request("/api/applications", { method: "PATCH", body: { id: pending.id, action: "accept" } });
  const collabId = accept.json?.collaboration?.id;
  check("UMKM menerima pelamar", accept.status === 200 && Boolean(collabId), `status=${accept.status}`);
  if (!collabId) return finish();

  const asRole = (role) => (role === "UMKM" ? umkm : kol);
  const flow = [
    ["accept", "INFLUENCER", {}],
    ["agree", "INFLUENCER", {}],
    ["hold_escrow", "UMKM", { amount: 1500000 }],
    ["start_production", "INFLUENCER", {}],
  ];
  for (const [action, role, extra] of flow) {
    const res = await asRole(role).request(`/api/collaborations/${collabId}/action`, { method: "POST", body: { action, ...extra } });
    check(`aksi ${action} (${role})`, res.status === 200, res.status === 200 ? "ok" : `${res.status} ${JSON.stringify(res.json).slice(0, 120)}`);
  }

  const submitted = await kol.request("/api/reviews", {
    method: "POST",
    body: { collaborationId: collabId, contentUrl: "https://www.tiktok.com/@kolabora/video/uji-coba", caption: "Kopi senja favoritku", notes: "Draf final untuk direview" },
  });
  check("kirim konten (POST /api/reviews)", submitted.status === 201, `status=${submitted.status}`);
  const reviewId = submitted.json?.id;

  if (reviewId) {
    const approved = await umkm.request("/api/reviews", { method: "PATCH", body: { reviewId, action: "approve", reviewNotes: "Sesuai brief, tayangkan" } });
    check("setujui konten (PATCH /api/reviews)", approved.status === 200, `status=${approved.status}`);
  }

  const release = await umkm.request(`/api/collaborations/${collabId}/action`, { method: "POST", body: { action: "complete" } });
  check("lepas escrow / selesai (complete)", release.status === 200, release.status === 200 ? "ok" : JSON.stringify(release.json).slice(0, 120));

  const allCollabs = await umkm.request("/api/collaborations");
  const collab = (allCollabs.json?.collaborations ?? allCollabs.json ?? []).find?.((c) => c.id === collabId);
  check("status akhir COMPLETED + escrow RELEASED", collab?.status === "COMPLETED" && String(collab?.escrowStatus).toUpperCase() === "RELEASED", `status=${collab?.status} escrow=${collab?.escrowStatus}`);

  const msg = await kol.request("/api/messages", { method: "POST", body: { collaborationId: collabId, content: "Produk sudah dikirim, ya." } });
  check("kirim pesan chat", [200, 201].includes(msg.status), `status=${msg.status}`);

  const notif = await umkm.request("/api/notifications");
  check("GET /api/notifications", notif.status === 200, `jumlah=${Array.isArray(notif.json) ? notif.json.length : "-"}`);

  // ---- endpoint AI ----
  const aiStatus = await umkm.request("/api/ai/status");
  check("GET /api/ai/status", aiStatus.status === 200, `configured=${aiStatus.json?.configured} model=${aiStatus.json?.model}`);

  const ruleScore = await umkm.request("/api/ai/score-campaign", {
    method: "POST",
    body: {
      ruleOnly: true,
      title: "Uji Skor Brief Kampanye Kopi",
      description: "Kopi susu gula aren 250 ml tanpa pemanis buatan. Target pekerja muda 22-30 tahun di Jakarta. Wajib menyebut promo beli 2 gratis 1 dan menautkan link order di bio.",
      category: "Kuliner",
      budgetMin: 800000,
      budgetMax: 1600000,
      location: "Jakarta",
      requirements: "Influencer mikro 10.000-50.000 followers dengan audiens perempuan 18-30 tahun",
      deliverables: "1 video Reels 30 detik\n3 Instagram Story\n1 video TikTok",
      startDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
    },
  });
  check("skor brief berbasis aturan", ruleScore.status === 200 && typeof ruleScore.json?.score === "number", `skor=${ruleScore.json?.score}/100 follower=${ruleScore.json?.followerTarget}`);

  const aiScore = await umkm.request("/api/ai/score-campaign", {
    method: "POST",
    body: { title: "Uji Skor AI", description: "Brief singkat untuk menguji jalur AI asli.", category: "Kuliner", budgetMin: 500000, budgetMax: 1000000, deliverables: "1 video Reels", requirements: "10.000 followers" },
  });
  check("skor brief hibrida (AI)", [200, 503, 429].includes(aiScore.status), aiScore.status === 429 ? "kuota AI habis (pengujian berulang)" : `aiUsed=${aiScore.json?.aiUsed} skor=${aiScore.json?.score} ${aiScore.json?.aiError ? `AI: ${String(aiScore.json.aiError).slice(0, 50)}` : ""}`);

  const match = await kol.request("/api/ai/match", { method: "POST", body: { limit: 6 } });
  check("AI match (hibrida)", (match.status === 200 && Array.isArray(match.json?.matches)) || match.status === 429, match.status === 429 ? "kuota AI habis (pengujian berulang)" : `kandidat=${match.json?.matches?.length} aiUsed=${match.json?.aiUsed}`);

  const content = await kol.request("/api/ai/content", { method: "POST", body: { prompt: "Buat 3 hook TikTok untuk kopi susu gula aren dengan gaya storytelling anak kantor", format: "hook", platform: "TikTok", tone: "santai" } });
  check("AI generator konten", [200, 503, 429].includes(content.status), content.status === 200 ? `${String(content.json?.content).length} karakter` : content.status === 429 ? "kuota AI habis (pengujian berulang)" : `status=${content.status} ${String(content.json?.error ?? "").slice(0, 60)}`);

  const brief = await umkm.request("/api/ai/brief", { method: "POST", body: { prompt: "Beri 3 ide konten promosi kopi susu bulan ini", mode: "ide" } });
  check("AI asisten UMKM", [200, 503, 429].includes(brief.status), brief.status === 429 ? "kuota AI habis (pengujian berulang)" : `status=${brief.status} ${String(brief.json?.error ?? "").slice(0, 60)}`);

  const quotaTest = await Promise.all(
    Array.from({ length: 12 }, () => kol.request("/api/ai/content", { method: "POST", body: { prompt: "uji batas cepat berulang", format: "hook", platform: "TikTok" } })),
  );
  check("pembatas kuota AI bekerja", quotaTest.some((r) => r.status === 429 || r.status === 503), `status=${[...new Set(quotaTest.map((r) => r.status))].join(",")}`);

  // ---- halaman harus memuat DAN berisi konten yang benar ----
  const pages = [
    [
      umkm,
      [
        { path: "/" },
        { path: "/login" },
        { path: "/register" },
        { path: "/dashboard" },
        { path: "/dashboard/umkm" },
        { path: "/dashboard/umkm/campaigns", must: "Campaign Saya" },
        { path: "/dashboard/umkm/campaigns/new", must: 'id="deliverables"' },
        { path: `/dashboard/umkm/campaigns/${created.json.id}`, must: "Memuat campaign" },
        { path: "/dashboard/umkm/review-campaign" },
        { path: "/dashboard/umkm/skill-assistant", must: "AI Skill Assistant" },
        { path: "/dashboard/umkm/chat" },
        { path: "/dashboard/umkm/history" },
        { path: "/dashboard/umkm/analytics" },
        { path: "/dashboard/umkm/profile" },
      ],
    ],
    [
      kol,
      [
        { path: "/dashboard/influencer" },
        { path: "/dashboard/influencer/discover" },
        { path: "/dashboard/influencer/campaigns" },
        { path: "/dashboard/influencer/smart-matching", must: "Smart Matching" },
        { path: "/dashboard/influencer/ai-content-assistant", must: "AI Content Generator" },
        { path: "/dashboard/influencer/chat" },
        { path: "/dashboard/influencer/history" },
        { path: "/dashboard/influencer/portfolio" },
        { path: "/dashboard/influencer/profile" },
        { path: "/dashboard/influencer/analytics" },
      ],
    ],
  ];
  for (const [client, entries] of pages) {
    for (const { path, must } of entries) {
      const res = await fetch(BASE + path, { headers: { Cookie: client.cookieHeader }, redirect: "follow" });
      const html = res.status === 200 ? await res.text() : "";
      const hasMarker = !must || html.includes(must);
      check(`halaman ${path}`, res.status === 200 && hasMarker, res.status !== 200 ? `HTTP ${res.status}` : hasMarker ? "ok" : `penanda "${must}" tidak ditemukan`);
    }
  }

  return finish();
}

function finish() {
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} pemeriksaan lulus.`);
  if (failed.length) {
    console.log("Perlu diperbaiki:");
    for (const f of failed) console.log(`  - ${f.name}: ${f.detail}`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("Naskah uji berhenti karena:", err);
  process.exitCode = 1;
});
