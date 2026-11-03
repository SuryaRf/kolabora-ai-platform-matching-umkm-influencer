/**
 * Uji cepat seluruh alur Kolabora terhadap URL apa pun (dev lokal / VPS).
 *
 * Pemakaian:
 *   node scripts/smoke-test.mjs
 *   BASE_URL=https://kolabora.tech node scripts/smoke-test.mjs
 *   SMOKE_UMKM=umkm@kolabora.id SMOKE_KOL=influencer@kolabora.id SMOKE_PASS=password123 node scripts/smoke-test.mjs
 *
 * Alur yang diuji (sesuai mesin status di /api/collaborations/[id]/action):
 *   lamar -> terima lamaran (langsung NEGOTIATION) -> confirm_deal oleh KEDUA
 *   pihak pada tarif yang sama (satu klik belum menutup deal; mengganti tarif =
 *   penawaran ulang yang menghapus konfirmasi) -> AGREED -> hold_escrow (UMKM,
 *   escrow = tarif hasil negosiasi)
 *   -> start_production (INFLUENCER) -> kirim konten (POST /api/reviews)
 *   -> approve (PATCH /api/reviews) -> complete/lepas escrow (UMKM)
 * plus endpoint AI, endpoint insight berbasis data asli, penjaga peran,
 * undangan kolaborasi dari halaman Highlights (accept PROPOSED -> NEGOTIATION,
 * lalu dibatalkan), dan pemanggilan seluruh halaman.
 */

const BASE = (process.env.BASE_URL || "http://localhost:3000").replace(
  /\/+$/,
  "",
);
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
    const res = await fetch(this.base + path, {
      method,
      headers,
      body: payload,
      redirect: "manual",
    });
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
    if (csrf.status !== 200 || !csrf.json?.csrfToken)
      throw new Error(`Gagal mengambil csrfToken (HTTP ${csrf.status})`);
    await this.request("/api/auth/callback/credentials", {
      method: "POST",
      form: {
        csrfToken: csrf.json.csrfToken,
        email,
        password,
        callbackUrl: `${this.base}/dashboard`,
        json: "true",
      },
    });
    const session = await this.request("/api/auth/session");
    if (!session.json?.user?.id)
      throw new Error(
        `Login ${email} gagal: ${JSON.stringify(session.json ?? {}).slice(0, 120)}`,
      );
    this.user = session.json.user;
    return session.json.user;
  }
}

function check(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(
    `${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`,
  );
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
  check(
    "GET /api/campaigns",
    list.status === 200 && Array.isArray(list.json),
    `campaign=${list.json?.length ?? 0}`,
  );

  const mine = await umkm.request("/api/campaigns?mine=1");
  check(
    "GET /api/campaigns?mine=1 (UMKM)",
    mine.status === 200 && Array.isArray(mine.json),
    `campaign=${mine.json?.length ?? 0}`,
  );

  // ---- buat campaign khusus uji (agar naskah ini bisa dijalankan berulang) ----
  const created = await umkm.request("/api/campaigns", {
    method: "POST",
    body: {
      title: `SMOKE ${new Date().toISOString().slice(11, 19)}`,
      description:
        "Campaign otomatis untuk uji end-to-end. Jangan dipakai untuk transaksi sungguhan.",
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
  check(
    "POST /api/campaigns (buat campaign)",
    created.status === 201 && created.json?.id,
    `status=${created.status}`,
  );
  if (!created.json?.id) return finish();

  // campaign aktif lain dipakai untuk memeriksa isi daftar
  const target =
    (list.json || []).find((c) => c.ownerId === umkm.user.id) ||
    (list.json || [])[0];
  check(
    "menemukan campaign aktif",
    Boolean(target),
    target?.title ?? "tidak ada",
  );

  // ---- alur lamar-menerima pada campaign uji ----
  const apply = await kol.request("/api/campaigns/apply", {
    method: "POST",
    body: {
      campaignId: created.json.id,
      proposal:
        "Saya rutin membuat video review dengan engagement 6% dan audiens sesuai brief ini.",
      proposedRate: 1000000,
    },
  });
  check(
    "influencer melamar campaign",
    [200, 201].includes(apply.status),
    `status=${apply.status} ${apply.json?.error ?? ""}`,
  );

  const detail = await umkm.request(`/api/campaigns/${created.json.id}`);
  const applicants = detail.json?.applications ?? [];
  const pending = applicants.find((a) => a.status === "PENDING");
  check(
    "detail API mengembalikan campaign yang benar",
    detail.status === 200 && detail.json?.title === created.json.title,
    `judul=${detail.json?.title ?? "kosong"}`,
  );
  check(
    "UMKM melihat pelamar",
    detail.status === 200 && applicants.length > 0,
    `pelamar=${applicants.length}`,
  );
  if (!pending) {
    check("menerima pelamar", false, "tidak ada lamaran PENDING");
    return finish();
  }

  const accept = await umkm.request("/api/applications", {
    method: "PATCH",
    body: { id: pending.id, action: "accept" },
  });
  const collabId = accept.json?.collaboration?.id;
  check(
    "UMKM menerima pelamar",
    accept.status === 200 && Boolean(collabId),
    `status=${accept.status}`,
  );
  if (!collabId) return finish();

  // Lamaran yang diterima TIDAK boleh lagi berstatus "menunggu respons"
  // (PROPOSED) — influencer sudah menyatakan diri lewat lamaran, jadi kolaborasi
  // harus langsung masuk tahap diskusi/negosiasi. Kalau ada regresi di sini,
  // kedua dashboard kembali menampilkan "Terima Tawaran" / "Ajukan Kolaborasi".
  check(
    "kolaborasi dari lamaran langsung mulai di NEGOTIATION",
    accept.json?.collaboration?.status === "NEGOTIATION",
    `status=${accept.json?.collaboration?.status ?? "kosong"}`,
  );

  // ---- PENOLAKAN LAMARAN: harus memberi arah, bukan diam ----
  // Dulu brand menolak dengan satu klik tanpa jejak: kreator hanya melihat chip
  // "Ditolak", tidak ada alasan, tidak ada tombol lanjutan, dan notifikasinya
  // menunjuk ke tab yang salah. Penjaga di bawah mengunci bentuk barunya.
  const campReject = await umkm.request("/api/campaigns", {
    method: "POST",
    body: {
      title: `SMOKE TOLAK ${new Date().toISOString().slice(11, 19)}`,
      description:
        "Campaign otomatis untuk uji jalur penolakan lamaran. Bukan transaksi sungguhan.",
      category: "Kuliner",
      budgetMin: 400000,
      budgetMax: 600000,
      location: "Bandung",
      startDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 12 * 86400000).toISOString().slice(0, 10),
    },
  });
  check(
    "campaign uji penolakan dibuat",
    campReject.status === 201 && Boolean(campReject.json?.id),
    `status=${campReject.status}`,
  );
  const apply2 = await kol.request("/api/campaigns/apply", {
    method: "POST",
    body: {
      campaignId: campReject.json?.id,
      proposal: "Lamaran kedua, khusus untuk menguji respons saat ditolak.",
      proposedRate: 900000,
    },
  });
  const app2Id = apply2.json?.id;
  check(
    "lamaran kedua terkirim",
    [200, 201].includes(apply2.status) && Boolean(app2Id),
    `status=${apply2.status}`,
  );

  const noteTooLong = await umkm.request("/api/applications", {
    method: "PATCH",
    body: { id: app2Id, action: "reject", note: "x".repeat(240) },
  });
  check(
    "catatan penolakan yang kepanjangan ditolak (400, bukan 500)",
    noteTooLong.status === 400,
    `status=${noteTooLong.status}`,
  );

  const REJ_NOTE = "Tarifnya di atas budget campaign ini";
  const rejected = await umkm.request("/api/applications", {
    method: "PATCH",
    body: { id: app2Id, action: "reject", note: REJ_NOTE },
  });
  check(
    "lamaran ditolak beserta catatan brand",
    rejected.status === 200 &&
      rejected.json?.status === "REJECTED" &&
      rejected.json?.feedback === REJ_NOTE,
    `status=${rejected.status} feedback=${JSON.stringify(rejected.json?.feedback ?? null)}`,
  );

  const reopen = await umkm.request("/api/applications", {
    method: "PATCH",
    body: { id: app2Id, action: "accept" },
  });
  check(
    "lamaran yang sudah diputus tidak bisa dibalik lagi",
    reopen.status === 409,
    `status=${reopen.status}`,
  );

  const kolNotif = await kol.request("/api/notifications");
  const rejNotif = (kolNotif.json?.notifications ?? []).find((n) =>
    String(n.message ?? "").includes(campReject.json?.title ?? ""),
  );
  check(
    "notifikasi penolakan ikut membawa catatan brand",
    Boolean(rejNotif) && String(rejNotif.message).includes(REJ_NOTE),
    rejNotif ? rejNotif.message.slice(0, 58) : "tidak ada notif",
  );
  check(
    "tautan notifikasi penolakan menuju tab Lamaran",
    String(rejNotif?.link ?? "").includes("campaigns?tab=lamaran"),
    `link=${rejNotif?.link ?? "-"}`,
  );
  const appsOfKol = await kol.request("/api/applications");
  const row2 = (appsOfKol.json ?? []).find((a) => a.id === app2Id);
  check(
    "kreator bisa membaca catatan lewat daftar lamarannya",
    row2?.feedback === REJ_NOTE && row2?.campaign?.budgetMax === 600000,
    `feedback=${JSON.stringify(row2?.feedback ?? null)}`,
  );

  // ---- KUNCI DUPLIKASI: satu pekerjaan = satu kartu ----
  // Audit menemukan brand bisa membuat kolaborasi kembar lewat jalur undangan
  // (jalur unggulan dan halaman Highlights), padahal jalur terima-lamaran menguncinya.
  const twinTitle = `SMOKE KEMBAR ${new Date().toISOString().slice(11, 19)}`;
  const invite = (title, campaignId) =>
    umkm.request("/api/collaborations", {
      method: "POST",
      body: {
        participantId: kol.user.id,
        title,
        brief: "Uji otomatis: kunci duplikasi kolaborasi.",
        budget: 700000,
        ...(campaignId ? { campaignId } : {}),
      },
    });
  const firstInvite = await invite(twinTitle);
  check(
    "undangan pertama dibuat",
    firstInvite.status === 201 && Boolean(firstInvite.json?.id),
    `status=${firstInvite.status}`,
  );
  const twin = await invite(`${twinTitle}`);
  check(
    "undangan kembar (judul sama) ditolak dengan 409 + menunjuk yang lama",
    twin.status === 409 && Boolean(twin.json?.existingId),
    `status=${twin.status} pesan=${String(twin.json?.error).slice(0, 40)}`,
  );
  const secondProject = await invite(`${twinTitle} — proyek lain`);
  check(
    "proyek berbeda (judul beda) dari pasangan yang sama tetap boleh",
    secondProject.status === 201,
    `status=${secondProject.status}`,
  );
  await umkm.request(`/api/collaborations/${firstInvite.json?.id}/action`, {
    method: "POST",
    body: { action: "cancel" },
  });
  const afterCancel = await invite(twinTitle);
  check(
    "kolaborasi yang sudah batal tidak menghalangi lagi",
    afterCancel.status === 201,
    `status=${afterCancel.status}`,
  );
  const campaignInvite = await invite(
    `SMOKE CAMPAIGN A ${twinTitle}`,
    campReject.json?.id,
  );
  check(
    "undangan menempel ke campaign",
    campaignInvite.status === 201,
    `status=${campaignInvite.status}`,
  );
  const campaignTwin = await invite(
    `SMOKE CAMPAIGN B ${twinTitle}`,
    campReject.json?.id,
  );
  check(
    "satu campaign tidak boleh punya dua kolaborasi terbuka untuk pelamar sama",
    campaignTwin.status === 409,
    `status=${campaignTwin.status}`,
  );
  // bereskan supaya naskah bisa dijalankan berulang
  for (const id of [
    secondProject.json?.id,
    afterCancel.json?.id,
    campaignInvite.json?.id,
  ]) {
    if (id) {
      await umkm.request(`/api/collaborations/${id}/action`, {
        method: "POST",
        body: { action: "cancel" },
      });
    }
  }

  const asRole = (role) => (role === "UMKM" ? umkm : kol);
  const act = (role, action, extra) =>
    asRole(role).request(`/api/collaborations/${collabId}/action`, {
      method: "POST",
      body: { action, ...(extra ?? {}) },
    });
  // accept (INFLUENCER) tidak diuji di sini: aksi itu milik jalur undangan
  // langsung, dan porsinya ada di blok "Undangan dari halaman Highlights".
  const dealRow = async () => {
    const list = await umkm.request("/api/collaborations");
    const rows = list.json?.collaborations ?? list.json ?? [];
    return rows.find?.((c) => c.id === collabId) ?? null;
  };

  // ---- deal butuh konfirmasi DUA PIHAK (NEGOTIATION -> AGREED) ----
  const RATE_1 = 900000; // penawaran ulang oleh kreator
  const RATE_2 = 1100000; // tarif final yang disepakati kedua pihak

  const firstConfirm = await act("INFLUENCER", "confirm_deal", {
    budget: RATE_1,
    note: "Uji: 2 reels + 3 story",
  });
  const afterFirst = await dealRow();
  check(
    "satu konfirmasi deal TIDAK langsung jadi AGREED",
    firstConfirm.status === 200 && afterFirst?.status === "NEGOTIATION",
    `status=${afterFirst?.status ?? "?"} http=${firstConfirm.status}`,
  );
  check(
    "konfirmasi tercatat per pihak",
    (afterFirst?.dealConfirmedBy ?? []).length === 1 &&
      (afterFirst?.dealConfirmedBy ?? []).includes(kol.user.id),
    `konfirmasi=${JSON.stringify(afterFirst?.dealConfirmedBy ?? [])}`,
  );
  check(
    "tarif negosiasi langsung menyimpan ke budget",
    afterFirst?.budget === RATE_1,
    `budget=${afterFirst?.budget}`,
  );

  const repeatConfirm = await act("INFLUENCER", "confirm_deal", {
    budget: RATE_1,
  });
  const afterRepeat = await dealRow();
  check(
    "klik berulang dari pihak yang sama tidak menutup deal",
    repeatConfirm.status === 200 &&
      afterRepeat?.status === "NEGOTIATION" &&
      (afterRepeat?.dealConfirmedBy ?? []).length === 1,
    `status=${afterRepeat?.status ?? "?"} konfirmasi=${(afterRepeat?.dealConfirmedBy ?? []).length}`,
  );

  const counterOffer = await act("UMKM", "confirm_deal", { budget: RATE_2 });
  const afterCounter = await dealRow();
  check(
    "ubah tarif = penawaran ulang, konfirmasi direset",
    counterOffer.status === 200 &&
      afterCounter?.status === "NEGOTIATION" &&
      afterCounter?.budget === RATE_2 &&
      (afterCounter?.dealConfirmedBy ?? []).length === 1 &&
      !(afterCounter?.dealConfirmedBy ?? []).includes(kol.user.id),
    `status=${afterCounter?.status ?? "?"} budget=${afterCounter?.budget} konfirmasi=${JSON.stringify(afterCounter?.dealConfirmedBy ?? [])}`,
  );

  const closeDeal = await act("INFLUENCER", "confirm_deal", { budget: RATE_2 });
  const afterClose = await dealRow();
  check(
    "konfirmasi kedua pada tarif yang sama menutup deal",
    afterClose?.status === "AGREED" && Boolean(afterClose?.agreedAt),
    `status=${afterClose?.status ?? "?"} agreedAt=${afterClose?.agreedAt ?? "kosong"}`,
  );
  check(
    "deal mencatat snapshot tarif & catatan",
    afterClose?.dealAmount === RATE_2 &&
      String(afterClose?.agreedNote ?? "").startsWith("Uji:"),
    `dealAmount=${afterClose?.dealAmount} note=${afterClose?.agreedNote ?? "kosong"}`,
  );
  check(
    "deal dicatat sebagai pesan SYSTEM di chat",
    String(closeDeal.json?.dealMessage ?? "").includes("Deal final"),
    JSON.stringify(closeDeal.json?.dealMessage ?? "").slice(0, 90),
  );

  // ---- aksi roles & tahap berikutnya ----
  const wrongRole = await act("INFLUENCER", "hold_escrow");
  check(
    "hanya brand yang bisa mengunci escrow",
    wrongRole.status === 403,
    `http=${wrongRole.status}`,
  );
  const hold = await act("UMKM", "hold_escrow");
  const afterHold = await dealRow();
  check("aksi hold_escrow (UMKM)", hold.status === 200, `http=${hold.status}`);
  check(
    "escrow mengunci tarif hasil NEGOSIASI, bukan angka awal",
    afterHold?.status === "ESCROW_HELD" && afterHold?.escrowAmount === RATE_2,
    `escrowAmount=${afterHold?.escrowAmount} (negosiasi ${RATE_2})`,
  );
  const lateDeal = await act("UMKM", "confirm_deal", { budget: RATE_2 });
  check(
    "konfirmasi deal ditolak setelah negosiasi selesai",
    lateDeal.status === 400,
    `http=${lateDeal.status}`,
  );
  const legacyAgree = await act("INFLUENCER", "agree");
  check(
    "aksi lawas 'agree' tidak diterima lagi",
    legacyAgree.status === 400,
    `http=${legacyAgree.status}`,
  );
  const start = await act("INFLUENCER", "start_production");
  check(
    "aksi start_production (INFLUENCER)",
    start.status === 200,
    `http=${start.status}`,
  );

  const submitted = await kol.request("/api/reviews", {
    method: "POST",
    body: {
      collaborationId: collabId,
      contentUrl: "https://www.tiktok.com/@kolabora/video/uji-coba",
      caption: "Kopi senja favoritku",
      notes: "Draf final untuk direview",
    },
  });
  check(
    "kirim konten (POST /api/reviews)",
    submitted.status === 201,
    `status=${submitted.status}`,
  );
  const reviewId = submitted.json?.id;

  if (reviewId) {
    const approved = await umkm.request("/api/reviews", {
      method: "PATCH",
      body: {
        reviewId,
        action: "approve",
        reviewNotes: "Sesuai brief, tayangkan",
      },
    });
    check(
      "setujui konten (PATCH /api/reviews)",
      approved.status === 200,
      `status=${approved.status}`,
    );
  }

  const release = await umkm.request(`/api/collaborations/${collabId}/action`, {
    method: "POST",
    body: { action: "complete" },
  });
  check(
    "lepas escrow / selesai (complete)",
    release.status === 200,
    release.status === 200 ? "ok" : JSON.stringify(release.json).slice(0, 120),
  );

  const allCollabs = await umkm.request("/api/collaborations");
  const collab = (
    allCollabs.json?.collaborations ??
    allCollabs.json ??
    []
  ).find?.((c) => c.id === collabId);
  check(
    "status akhir COMPLETED + escrow RELEASED",
    collab?.status === "COMPLETED" &&
      String(collab?.escrowStatus).toUpperCase() === "RELEASED",
    `status=${collab?.status} escrow=${collab?.escrowStatus}`,
  );

  const msg = await kol.request("/api/messages", {
    method: "POST",
    body: { collaborationId: collabId, content: "Produk sudah dikirim, ya." },
  });
  check(
    "kirim pesan chat",
    [200, 201].includes(msg.status),
    `status=${msg.status}`,
  );

  const notif = await umkm.request("/api/notifications");
  check(
    "GET /api/notifications",
    notif.status === 200,
    `jumlah=${Array.isArray(notif.json) ? notif.json.length : "-"}`,
  );

  // ---- endpoint AI ----
  const aiStatus = await umkm.request("/api/ai/status");
  check(
    "GET /api/ai/status",
    aiStatus.status === 200,
    `configured=${aiStatus.json?.configured} model=${aiStatus.json?.model}`,
  );

  const ruleScore = await umkm.request("/api/ai/score-campaign", {
    method: "POST",
    body: {
      ruleOnly: true,
      title: "Uji Skor Brief Kampanye Kopi",
      description:
        "Kopi susu gula aren 250 ml tanpa pemanis buatan. Target pekerja muda 22-30 tahun di Jakarta. Wajib menyebut promo beli 2 gratis 1 dan menautkan link order di bio.",
      category: "Kuliner",
      budgetMin: 800000,
      budgetMax: 1600000,
      location: "Jakarta",
      requirements:
        "Influencer mikro 10.000-50.000 followers dengan audiens perempuan 18-30 tahun",
      deliverables: "1 video Reels 30 detik\n3 Instagram Story\n1 video TikTok",
      startDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
    },
  });
  check(
    "skor brief berbasis aturan",
    ruleScore.status === 200 && typeof ruleScore.json?.score === "number",
    `skor=${ruleScore.json?.score}/100 follower=${ruleScore.json?.followerTarget}`,
  );

  const aiScore = await umkm.request("/api/ai/score-campaign", {
    method: "POST",
    body: {
      title: "Uji Skor AI",
      description: "Brief singkat untuk menguji jalur AI asli.",
      category: "Kuliner",
      budgetMin: 500000,
      budgetMax: 1000000,
      deliverables: "1 video Reels",
      requirements: "10.000 followers",
    },
  });
  check(
    "skor brief hibrida (AI)",
    [200, 503, 429].includes(aiScore.status),
    aiScore.status === 429
      ? "kuota AI habis (pengujian berulang)"
      : `aiUsed=${aiScore.json?.aiUsed} skor=${aiScore.json?.score} ${aiScore.json?.aiError ? `AI: ${String(aiScore.json.aiError).slice(0, 50)}` : ""}`,
  );

  const match = await kol.request("/api/ai/match", {
    method: "POST",
    body: { limit: 6 },
  });
  check(
    "AI match (hibrida)",
    (match.status === 200 && Array.isArray(match.json?.matches)) ||
      match.status === 429,
    match.status === 429
      ? "kuota AI habis (pengujian berulang)"
      : `kandidat=${match.json?.matches?.length} aiUsed=${match.json?.aiUsed}`,
  );

  const content = await kol.request("/api/ai/content", {
    method: "POST",
    body: {
      prompt:
        "Buat 3 hook TikTok untuk kopi susu gula aren dengan gaya storytelling anak kantor",
      format: "hook",
      platform: "TikTok",
      tone: "santai",
    },
  });
  check(
    "AI generator konten",
    [200, 503, 429].includes(content.status),
    content.status === 200
      ? `${String(content.json?.content).length} karakter`
      : content.status === 429
        ? "kuota AI habis (pengujian berulang)"
        : `status=${content.status} ${String(content.json?.error ?? "").slice(0, 60)}`,
  );

  const brief = await umkm.request("/api/ai/brief", {
    method: "POST",
    body: {
      prompt: "Beri 3 ide konten promosi kopi susu bulan ini",
      mode: "ide",
    },
  });
  check(
    "AI asisten UMKM",
    [200, 503, 429].includes(brief.status),
    brief.status === 429
      ? "kuota AI habis (pengujian berulang)"
      : `status=${brief.status} ${String(brief.json?.error ?? "").slice(0, 60)}`,
  );

  // ---- insight & halaman berbasis data asli ----
  // (dijalankan sebelum uji kuota, supaya jalur 200 sempat teriksa)
  const infInsight = await kol.request("/api/insights/influencer");
  const vis = infInsight.json?.visibility;
  check(
    "GET /api/insights/influencer",
    infInsight.status === 200 &&
      typeof infInsight.json?.score === "number" &&
      typeof vis?.rank === "number" &&
      typeof vis?.competitors === "number" &&
      Array.isArray(infInsight.json?.subScores) &&
      Array.isArray(infInsight.json?.missing),
    `skor=${infInsight.json?.score} visibilitas=${vis?.score} peringkat=${vis?.rank}/${vis?.competitors} lamaran=${infInsight.json?.funnel?.total}`,
  );

  const umkmInsight = await umkm.request("/api/insights/umkm");
  check(
    "GET /api/insights/umkm",
    umkmInsight.status === 200 &&
      Array.isArray(umkmInsight.json?.events) &&
      Array.isArray(umkmInsight.json?.actions) &&
      typeof umkmInsight.json?.campaigns?.active === "number",
    `campaign=${umkmInsight.json?.campaigns?.active} agenda=${umkmInsight.json?.events?.length} tindakan=${umkmInsight.json?.actions?.length}`,
  );

  const agendaBulanIni = (umkmInsight.json?.events ?? []).every(
    (e) =>
      typeof e.date === "string" &&
      !Number.isNaN(Date.parse(e.date)) &&
      typeof e.title === "string" &&
      e.title.length > 0,
  );
  check(
    "setiap agenda punya tanggal & judul asli",
    agendaBulanIni,
    `jumlah=${umkmInsight.json?.events?.length ?? 0}`,
  );

  const optimize = await kol.request("/api/ai/optimize-profile", {
    method: "POST",
  });
  check(
    "POST /api/ai/optimize-profile",
    [200, 429].includes(optimize.status) &&
      (optimize.status !== 200 ||
        (typeof optimize.json?.overall === "number" &&
          typeof optimize.json?.bio === "string" &&
          optimize.json.bio.length >= 20 &&
          Array.isArray(optimize.json?.recommendations))),
    optimize.status === 429
      ? "kuota AI habis (pengujian berulang)"
      : `skor=${optimize.json?.overall} sumber=${optimize.json?.bioSource} aiUsed=${optimize.json?.aiUsed} saran=${optimize.json?.recommendations?.length}`,
  );

  const rateCard = await kol.request("/api/ai/rate-card", { method: "POST" });
  const rateRows = rateCard.json?.platforms ?? [];
  check(
    "POST /api/ai/rate-card",
    [200, 429].includes(rateCard.status) &&
      (rateCard.status !== 200 ||
        (rateRows.length >= 4 &&
          rateRows.every(
            (p) =>
              Number.isFinite(p.min) &&
              Number.isFinite(p.max) &&
              p.max >= p.min,
          ) &&
          typeof rateCard.json?.base === "number")),
    rateCard.status === 429
      ? "kuota AI habis (pengujian berulang)"
      : `dasar=${rateCard.json?.base} rentang=${rateCard.json?.suggestedMin}-${rateCard.json?.suggestedMax} aiUsed=${rateCard.json?.aiUsed} sampelPasar=${rateCard.json?.market?.sampleSize}`,
  );

  const noNegatif = rateRows.every((p) => p.min > 0);
  check(
    "tarif hasil rate-card selalu positif",
    rateCard.status !== 200 || noNegatif,
    `baris=${rateRows.length}`,
  );

  const quotaTest = await Promise.all(
    Array.from({ length: 12 }, () =>
      kol.request("/api/ai/content", {
        method: "POST",
        body: {
          prompt: "uji batas cepat berulang",
          format: "hook",
          platform: "TikTok",
        },
      }),
    ),
  );
  check(
    "pembatas kuota AI bekerja",
    quotaTest.some((r) => r.status === 429 || r.status === 503),
    `status=${[...new Set(quotaTest.map((r) => r.status))].join(",")}`,
  );

  // Penjaga akses: tanpa login 401, beda peran 403
  const anon = new Client();
  for (const [label, method] of [
    ["/api/insights/influencer", "GET"],
    ["/api/insights/umkm", "GET"],
    ["/api/ai/optimize-profile", "POST"],
    ["/api/ai/rate-card", "POST"],
  ]) {
    const res = await anon.request(label, { method });
    check(
      `tanpa login ditolak: ${label}`,
      res.status === 401,
      `status=${res.status}`,
    );
  }
  const crossA = await kol.request("/api/insights/umkm");
  const crossB = await umkm.request("/api/insights/influencer");
  check(
    "kreator tidak bisa baca insight UMKM",
    crossA.status === 403,
    `status=${crossA.status}`,
  );
  check(
    "UMKM tidak bisa baca insight kreator",
    crossB.status === 403,
    `status=${crossB.status}`,
  );

  // Sumber data halaman Highlights: pencocokan kreator + filter budget nyata
  const creators = await umkm.request("/api/matching/influencers");
  check(
    "GET /api/matching/influencers",
    creators.status === 200 &&
      Array.isArray(creators.json) &&
      creators.json.length > 0,
    `kreator=${creators.json?.length}`,
  );
  const budgetRendah = await umkm.request(
    "/api/matching/influencers?budget=300000",
  );
  const budgetTinggi = await umkm.request(
    "/api/matching/influencers?budget=20000000",
  );
  const byId = new Map(
    (budgetRendah.json ?? []).map((c) => [c.userId, c.score]),
  );
  const budgetMempengaruhi = (budgetTinggi.json ?? []).every(
    (c) => (byId.get(c.userId) ?? 0) <= c.score,
  );
  check(
    "filter budget menaikkan skor kreator yang tarifnya masuk",
    budgetRendah.status === 200 &&
      budgetTinggi.status === 200 &&
      budgetMempengaruhi,
    `rendah=${budgetRendah.json?.length} tinggi=${budgetTinggi.json?.length}`,
  );

  const kategori = await umkm.request(
    "/api/matching/influencers?category=Kecantikan",
  );
  const related = (kategori.json ?? []).filter(
    (c) =>
      String(c.category).toLowerCase().includes("kecantikan") ||
      (c.niches ?? []).some((n) =>
        String(n).toLowerCase().includes("kecantikan"),
      ),
  );
  const others = (kategori.json ?? []).filter(
    (c) =>
      !String(c.category).toLowerCase().includes("kecantikan") &&
      !(c.niches ?? []).some((n) =>
        String(n).toLowerCase().includes("kecantikan"),
      ),
  );
  check(
    "filter kategori menaikkan skor kreator sekategori",
    kategori.status === 200 &&
      related.length > 0 &&
      others.every((o) => related[0].score >= o.score),
    `sekategori=${related.length} lainnya=${others.length} skorTertinggi=${related[0]?.score}`,
  );
  const sortedDesc = (creators.json ?? []).every(
    (c, i, arr) => i === 0 || arr[i - 1].score >= c.score,
  );
  check(
    "peringkat kreator urut dari skor tertinggi",
    sortedDesc,
    `jumlah=${creators.json?.length}`,
  );

  // Undang kreator (tombol "Kirim tawaran kolaborasi" di halaman Highlights)
  const inviteTarget =
    (creators.json ?? []).find((c) => c.userId !== kol.user.id) ??
    (creators.json ?? [])[0];
  const ownActive =
    (mine.json ?? []).find((c) => c.status === "ACTIVE") ?? null;
  if (inviteTarget) {
    const invite = await umkm.request("/api/collaborations", {
      method: "POST",
      body: {
        participantId: inviteTarget.userId,
        title: "Uji undangan dari halaman Highlights",
        brief:
          "Uji otomatis: mengajak kreator berkolaborasi dari daftar unggulan.",
        budget: ownActive?.budgetMin ?? 500000,
        // Campaign uji sendiri: campaign pertama milik brand bisa jadi sudah punya
        // kolaborasi terbuka dengan kreator yang sama, dan kunci anti-duplikasi
        // akan (dengan benar) menolak uji ini.
        campaignId: created.json?.id ?? ownActive?.id ?? null,
      },
    });
    const inviteId = invite.json?.id;
    check(
      "UMKM mengundang kreator dari Highlights",
      [200, 201].includes(invite.status) && Boolean(inviteId),
      `status=${invite.status} ${invite.json?.error ?? ""}`,
    );
    if (inviteId) {
      // Jalur undangan langsung harus TETAP mulai di PROPOSED (pembeda dari
      // jalur lamaran yang kini langsung NEGOTIATION) dan aksi `accept` harus
      // tetap jalan, supaya tidak ada kolaborasi lama yang macet.
      check(
        "undangan langsung lahir di PROPOSED",
        invite.json?.status === "PROPOSED",
        `status=${invite.json?.status ?? "kosong"}`,
      );
      const listAfter = await umkm.request("/api/collaborations");
      const found = (listAfter.json ?? []).find((c) => c.id === inviteId);
      check(
        "undangan muncul di daftar kolaborasi UMKM",
        Boolean(found),
        `status=${found?.status ?? "tidak ada"}`,
      );
      const cancelled = await umkm.request(
        `/api/collaborations/${inviteId}/action`,
        { method: "POST", body: { action: "cancel" } },
      );
      check(
        "undangan uji bisa dibatalkan",
        cancelled.status === 200,
        `status=${cancelled.status} ${cancelled.json?.error ?? ""}`,
      );
    }

    // Undangan ke akun uji itu sendiri: hanya akun ini yang bisa menjalankan
    // aksi `accept`, dan transisi PROPOSED -> NEGOTIATION wajib tetap ada.
    const offer = await umkm.request("/api/collaborations", {
      method: "POST",
      body: {
        participantId: kol.user.id,
        // Judul unik + tanpa campaign: kalau menempel ke campaign yang sudah
        // punya kolaborasi terbuka dengan kol, kunci anti-duplikasi menolak.
        title: `SMOKE Uji terima tawaran ${new Date().toISOString().slice(11, 19)}`,
        brief: "Uji otomatis: menerima tawaran brand lewat aksi accept.",
        budget: ownActive?.budgetMin ?? 500000,
        campaignId: null,
      },
    });
    const offerId = offer.json?.id;
    if (offerId) {
      check(
        "tawaran langsung lahir di PROPOSED",
        offer.json?.status === "PROPOSED",
        `status=${offer.json?.status ?? "kosong"}`,
      );
      const offerAccepted = await kol.request(
        `/api/collaborations/${offerId}/action`,
        { method: "POST", body: { action: "accept" } },
      );
      check(
        "aksi accept (INFLUENCER) pada undangan langsung",
        offerAccepted.status === 200 &&
          offerAccepted.json?.status === "NEGOTIATION",
        `status=${offerAccepted.status} collab=${offerAccepted.json?.status ?? "-"}`,
      );
      const offerCancelled = await umkm.request(
        `/api/collaborations/${offerId}/action`,
        { method: "POST", body: { action: "cancel" } },
      );
      check(
        "tawaran uji bisa dibatalkan",
        offerCancelled.status === 200,
        `status=${offerCancelled.status} ${offerCancelled.json?.error ?? ""}`,
      );
    } else {
      check(
        "membuat tawaran untuk akun uji",
        false,
        `status=${offer.status} ${offer.json?.error ?? ""}`,
      );
    }
  } else {
    check(
      "UMKM mengundang kreator dari Highlights",
      false,
      "tidak ada kreator untuk diundang",
    );
  }

  // Panel "Perlu ditangani" di kalender: campaign aktif tanpa pelamar harus memunculkan tindakan
  const tanpaPelamar = await umkm.request("/api/campaigns", {
    method: "POST",
    body: {
      title: `SMOKE TANPA PELAMAR ${new Date().toISOString().slice(11, 19)}`,
      description:
        "Campaign uji untuk memeriksa tindakan otomatis pada kalender UMKM.",
      category: "Kuliner",
      budgetMin: 100000,
      budgetMax: 150000,
      deliverables: "1 video Reels",
      requirements: "Kreator dengan tarif sangat rendah",
    },
  });
  check(
    "membuat campaign tanpa pelamar",
    tanpaPelamar.status === 201 && Boolean(tanpaPelamar.json?.id),
    `status=${tanpaPelamar.status}`,
  );

  const insightSetelah = await umkm.request("/api/insights/umkm");
  const tindakan = (insightSetelah.json?.actions ?? []).find((a) =>
    String(a.href).includes(tanpaPelamar.json?.id ?? "__kosong__"),
  );
  check(
    "campaign tanpa pelamar memunculkan tindakan",
    Boolean(tindakan) && String(tindakan?.reason ?? "").length > 10,
    tindakan
      ? `judul="${tindakan.title}"`
      : `tindakan=${(insightSetelah.json?.actions ?? []).length}`,
  );

  if (tanpaPelamar.json?.id) {
    const tutup = await umkm.request(`/api/campaigns/${tanpaPelamar.json.id}`, {
      method: "PATCH",
      body: { status: "CLOSED" },
    });
    check(
      "campaign uji ditutup lagi",
      tutup.status === 200 && tutup.json?.status === "CLOSED",
      `status=${tutup.status}`,
    );
  }

  const agendaSetelahTutup = await umkm.request("/api/insights/umkm");
  check(
    "menutup campaign menghapusnya dari daftar tindakan",
    agendaSetelahTutup.status === 200 &&
      !(agendaSetelahTutup.json?.actions ?? []).some((a) =>
        String(a.href).includes(tanpaPelamar.json?.id ?? "__kosong__"),
      ),
    `tindakan=${(agendaSetelahTutup.json?.actions ?? []).length}`,
  );

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
        {
          path: `/dashboard/umkm/campaigns/${created.json.id}`,
          must: "Memuat campaign",
        },
        { path: "/dashboard/umkm/review-campaign" },
        { path: "/dashboard/umkm/skill-assistant", must: "AI Skill Assistant" },
        {
          path: "/dashboard/umkm/highlights",
          must: "Memuat peringkat kreator",
        },
        {
          path: "/dashboard/umkm/smart-calendar",
          must: "Memuat agenda kampanye",
        },
        { path: "/dashboard/umkm/smart-matching", must: "Smart Matching" },
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
        {
          path: "/dashboard/influencer/smart-matching",
          must: "Smart Matching",
        },
        {
          path: "/dashboard/influencer/ai-content-assistant",
          must: "AI Content Generator",
        },
        { path: "/dashboard/influencer/chat" },
        { path: "/dashboard/influencer/history" },
        { path: "/dashboard/influencer/portfolio" },
        {
          path: "/dashboard/influencer/profile-optimizer",
          must: "Menganalisis profil",
        },
        {
          path: "/dashboard/influencer/rate-recommendation",
          must: "Menghitung tarif",
        },
        {
          path: "/dashboard/influencer/priority-matching",
          must: "Memuat data visibilitas",
        },
        {
          path: "/dashboard/influencer/umkm-insight",
          must: "Memuat UMKM yang membuka campaign",
        },
        { path: "/dashboard/influencer/profile" },
        { path: "/dashboard/influencer/analytics" },
      ],
    ],
  ];
  for (const [client, entries] of pages) {
    for (const { path, must } of entries) {
      const res = await fetch(BASE + path, {
        headers: { Cookie: client.cookieHeader },
        redirect: "follow",
      });
      const html = res.status === 200 ? await res.text() : "";
      const hasMarker = !must || html.includes(must);
      check(
        `halaman ${path}`,
        res.status === 200 && hasMarker,
        res.status !== 200
          ? `HTTP ${res.status}`
          : hasMarker
            ? "ok"
            : `penanda "${must}" tidak ditemukan`,
      );
    }
  }

  return finish();
}

function finish() {
  const failed = results.filter((r) => !r.ok);
  console.log(
    `\n${results.length - failed.length}/${results.length} pemeriksaan lulus.`,
  );
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
