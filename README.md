# Kolabora

Marketplace kolaborasi UMKM ↔ influencer: campaign, lamaran, chat, escrow simulasi,
review konten, dan **asisten AI asli (DeepSeek)** untuk pencocokan, pembuatan konten,
penyusunan brief, serta penilaian kelayakan campaign.

Stack: **Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · NextAuth v5 · Prisma + PostgreSQL**.

Dua jalur deploy didukung:

| Jalur | Cocok untuk | Dibaca di |
|---|---|---|
| **VPS + Caddy + PM2** (utama, domain `kolabora.tech`) | kontrol penuh, database lokal, tanpa batas gratis | [`docs/DEPLOY-VPS.md`](docs/DEPLOY-VPS.md) |
| Vercel + Supabase | demo cepat, nol administrasi server | bagian 6 |

---

## 1. Menjalankan secara lokal

### Prasyarat
- Node.js 20+ (disarankan 22)
- PostgreSQL: lokal (mis. `brew install postgresql@14`) atau Supabase/Neon gratis
- (opsional) kunci DeepSeek untuk fitur AI sungguhan

### Langkah

```bash
npm install
cp .env.example .env        # lalu isi DATABASE_URL & AUTH_SECRET
npx prisma db push          # buat tabel sesuai skema
npm run db:seed             # data demo + 4 akun uji
npm run dev                 # http://localhost:3000
```

Bila memakai PostgreSQL lokal dan belum punya basis data:

```bash
createdb kolabora_dev
# DATABASE_URL="postgresql/<user>@localhost:5432/kolabora_dev?schema=public"
```

### Environment variables

| Variable | Wajib | Keterangan |
|---|---|---|
| `DATABASE_URL` | ✅ | Connection string Postgres. Supabase: pakai **pooler** port `6543` + `?pgbouncer=true&connection_limit=1`. |
| `AUTH_SECRET` | ✅ | `openssl rand -base64 32` |
| `AUTH_URL` | ✅ | `http://localhost:3000` saat lokal; `https://kolabora.tech` saat deploy |
| `NEXT_PUBLIC_APP_URL` | ✅ | Sama seperti `AUTH_URL` (dipakai tautan & notifikasi) |
| `AUTH_TRUST_HOST` | ⬜ di VPS | Wajib `true` bila aplikasi berada di belakang proxy (Caddy/nginx) |
| `DEEPSEEK_API_KEY` | ⬜ | Kunci AI dari <https://platform.deepseek.com/api_keys>. **Tanpa kunci, fitur AI memakai perhitungan aturan.** |
| `DEEPSEEK_MODEL` | ⬜ | default `deepseek-chat` |
| `DEEPSEEK_BASE_URL` | ⬜ | default `https://api.deepseek.com` |
| `DEEPSEEK_TIMEOUT_MS` | ⬜ | default `40000` |
| `DEEPSEEK_MAX_RETRIES` | ⬜ | default `2` (retry untuk 429/5xx) |
| `AI_RATE_LIMIT_PER_MIN` | ⬜ | default `8` panggilan per akun per menit |
| `AI_RATE_LIMIT_PER_HOUR` | ⬜ | default `60` |
| `AI_RATE_LIMIT_PER_DAY` | ⬜ | default `200` |
| `AI_LOG_USAGE` | ⬜ | `1` untuk mencetak pemakaian token ke log |
| `BLOB_READ_WRITE_TOKEN` | ⬜ | Upload ke Vercel Blob. Tanpa ini unggah memakai input URL |

Contoh `.env` produksi ada di `.env.production.example`; contoh development ada di `.env.example`.
Kunci API **tidak pernah** dikirim ke browser (tanpa prefix `NEXT_PUBLIC_`).

---

## 2. Akun demo (setelah `npm run db:seed`)

Semua password: `password123`

| Email | Peran | Profil |
|---|---|---|
| `umkm@kolabora.id` | UMKM | Kopi Senja (Yogyakarta) |
| `brand@kolabora.id` | UMKM | Batik Ayu (Solo) |
| `influencer@kolabora.id` | Influencer | Sarah Beauty (Kecantikan) |
| `foodie@kolabora.id` | Influencer | Rizky Foodie (Kuliner) |

Seed juga membuat contoh campaign, lamaran, satu kolaborasi **IN_PRODUCTION** dengan
escrow terkunci, dan satu tawaran **PROPOSED** yang menunggu respons influencer.
Data yang sama tersedia sebagai SQL: `supabase/migrations/0002_seed_demo.sql`
(idempoten, aman dijalankan dua kali).

---

## 3. Alur produk

1. **UMKM** membuat campaign di `/dashboard/umkm/campaigns/new` — form ini menilai
   brief secara langsung (skor kesiapan 0–100) dan bisa menyusun draf dengan AI.
2. **Influencer** menemukan campaign lewat *Cari Campaign* atau **AI Smart Matching**,
   lalu melamar dengan proposal + tarif.
3. **UMKM** menerima lamaran di halaman detail campaign → sistem membuat kolaborasi
   `PROPOSED` + ruang chat.
4. Negosiasi di **Chat** (polling 3,5 detik).
5. Kedua pihak menyepakati deal (`accept` → `agree`).
6. **UMKM** membayar simulasi → dana `ESCROW_HELD` (modal pembayaran punya animasi
   sukses/gagal; 8% peluang gagal).
7. **Influencer** mulai produksi (`start_production`) dan mengirim konten
   (`POST /api/reviews` → `CONTENT_SUBMITTED`).
8. **UMKM** review di `/dashboard/umkm/review-campaign`: setujui
   (`PATCH /api/reviews {action:"approve"}` → `APPROVED`) atau minta revisi
   (`revision` → `REVISION_REQUESTED`).
9. **UMKM** mencairkan escrow (`complete` → `COMPLETED`, `escrowStatus=RELEASED`).

Status lengkap: `PROPOSED → NEGOTIATION → AGREED → ESCROW_HELD → IN_PRODUCTION →
CONTENT_SUBMITTED → UNDER_REVIEW → REVISION_REQUESTED → APPROVED → COMPLETED`
(plus `CANCELLED`, `DISPUTED`).

Halaman pendukung juga memakai data asli, bukan angka contoh: *Kreator Unggulan*
menampilkan peringkat kreator dari mesin pencocok dan bisa mengirim tawaran
kolaborasi langsung; *Kalender Kolaborasi* menyusun agenda dari tanggal campaign
dan tahap kolaborasi; di sisi kreator ada *Optimizer Profil*, *Rekomendasi Tarif*,
*Priority Matching* (visibilitas), dan *UMKM Insight* yang bisa dipakai melamar.
Tautan bertanda `?collaboration=<id>` membuka ruang chat / item riwayat yang
bersangkutan.

---

## 4. Fitur AI (DeepSeek)

| Fitur | Halaman | Endpoint | Tanpa kunci API |
|---|---|---|---|
| Pencocokan kampanye hibrida | `/dashboard/influencer/smart-matching` | `POST /api/ai/match` | skor aturan murni, tombol **Mode AI: OFF** |
| Generator konten (caption/hook/skrip) | `/dashboard/influencer/ai-content-assistant` | `POST /api/ai/content` | pesan jelas: AI belum aktif |
| Asisten brief & strategi UMKM | `/dashboard/umkm/skill-assistant` | `POST /api/ai/brief` | tombol tetap ada, hasil tidak dibuat |
| Penilai kelayakan brief | `/dashboard/umkm/campaigns/new` | `POST /api/ai/score-campaign` | skor aturan (instan, 0 biaya) |
| Optimasi profil & draf bio | `/dashboard/influencer/profile-optimizer` | `POST /api/ai/optimize-profile` | skor 6 komponen + draf bio dari data profil (`src/lib/profile-score.ts`) |
| Kartu tarif per jenis konten | `/dashboard/influencer/rate-recommendation` | `POST /api/ai/rate-card` | tarif aturan; AI hanya menggeser maks. 25% |
| Status & uji koneksi AI | — | `GET /api/ai/status?test=1` | `configured: false` |

Semua halaman itu memakai angka yang benar-benar ada di database — tidak ada data
contoh yang ditulis di dalam komponen. Endpoint pendukung (bukan AI, tetap butuh login):

| Endpoint | Dipakai oleh | Isi |
|---|---|---|
| `GET /api/insights/influencer` | `/dashboard/influencer/priority-matching` | skor profil, visibilitas & peringkat antar kreator, funnel lamaran, total escrow yang cair |
| `GET /api/insights/umkm` | `/dashboard/umkm/smart-calendar` | ringkasan campaign/pelamar/escrow, agenda dari tanggal asli (`startDate`, `escrowHeldAt`, dst.), daftar "perlu ditangani" |
| `GET /api/matching/influencers` | `/dashboard/umkm/highlights` | peringkat kreator + alasan pencocokan; filter `category`, `location`, `budget` |
| `GET /api/health` | pemantau publik | versi, kondisi database, konfigurasi AI |

Cara kerjanya:

- **Hibrida.** Perhitungan aturan (`src/lib/matching.ts`, `src/lib/campaign-score.ts`,
  `src/lib/profile-score.ts`) selalu jalan; AI menambahkan alasan, skor kualitatif,
  draf lamaran, draf bio, dan risiko. Skor akhir = 40% aturan + 60% AI (penilaian
  brief) atau dicampur lewat `blendScores()` (pencocokan).
- **Tahan banting.** Timeout keras, retry otomatis untuk 429/5xx, dan JSON yang
  rusak dipulihkan sebelum parsing. Bila AI gagal, halaman tetap menampilkan hasil
  aturan beserta alasannya (`aiUsed: false`, `aiError`).
- **Dibatasi.** Kuota per pengguna per menit/jam/hari (`src/lib/rate-limit.ts`),
  dan semua input dipangkas panjangnya agar biaya token terkendali.
- **Konteks dari database.** Prompt hanya berisi profil & campaign milik pengguna
  yang sedang login (diambil lewat Prisma), bukan data orang lain.

Liveness cepat setelah deploy:

```bash
curl -s https://kolabora.tech/api/health      # database, versi, status AI
```

---

## 5. Deploy ke VPS (kolabora.tech)

```bash
ssh user@IP_VPS
git clone https://github.com/<user>/<repo>.git /var/www/kolabora && cd /var/www/kolabora
bash scripts/deploy-vps.sh --domain kolabora.tech
```

Naskah tersebut memasang Node 22, Caddy (HTTPS otomatis Let's Encrypt), PostgreSQL
lokal, menjalankan build produksi di PM2, membuka firewall, lalu memeriksa
`/api/health`. Idempoten — jalankan lagi setiap kali ingin memperbarui.
Detail, flag, pencadangan, dan pemulihan ada di **[`docs/DEPLOY-VPS.md`](docs/DEPLOY-VPS.md)**.

Perkakas yang dipakai: `ecosystem.config.js` (PM2), `deploy/Caddyfile` (reverse proxy),
`scripts/backup-db.sh` (cadangan Postgres).

---

## 6. Deploy gratis ke Vercel + Supabase (alternatif)

1. Buat proyek Supabase → **SQL Editor** → jalankan `supabase/migrations/0001_init.sql`
   lalu `supabase/migrations/0002_seed_demo.sql` (cara ini tidak butuh akses jaringan
   dari laptop).
2. Salin *Connection pooling* (port `6543`) → jadikan `DATABASE_URL`
   (aktifkan *Non-SSL connection* bila Prisma menolak sertifikat).
3. Push repo ke GitHub → import di [vercel.com/new](https://vercel.com/new).
4. Environment variables: `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`,
   `NEXT_PUBLIC_APP_URL`, `AUTH_TRUST_HOST=true`, `DEEPSEEK_API_KEY` (opsional),
   `BLOB_READ_WRITE_TOKEN` (opsional).
5. Settings → Domains → tambahkan `kolabora.tech` & `www.kolabora.tech`, lalu ikuti
   arahan DNS-nya.

---

## 7. Struktur penting

```
prisma/schema.prisma                 # model & enum (14 tabel)
prisma/seed.mjs                      # data demo
supabase/migrations/0001_init.sql    # skema sebagai SQL murni
supabase/migrations/0002_seed_demo.sql
src/auth.ts                          # NextAuth v5 (Credentials + JWT)
src/lib/ai.ts                        # klien DeepSeek: timeout, retry, JSON repair
src/lib/prompts.ts                   # prompt sistem Bahasa Indonesia
src/lib/rate-limit.ts                # kuota AI per pengguna
src/lib/ai-route.ts                  # penjaga sesi/peran + pemetaan error AI
src/lib/matching.ts                  # skor pencocokan aturan
src/lib/campaign-score.ts            # skor kelayakan brief aturan + penggabungan AI
src/lib/profile-score.ts             # skor profil 6 komponen + kalkulator tarif aturan
src/lib/facts.ts                     # pengambil data profil/pasar (server only)
src/lib/collab.ts                    # status, langkah, aksi (client-safe)
src/app/api/ai/...                   # endpoint AI (match, content, brief, score-campaign,
                                     #   optimize-profile, rate-card, status)
src/app/api/insights/...             # data halaman: influencer & umkm
src/app/api/health/route.ts          # probe database + AI + versi
src/app/api/collaborations/[id]/action/route.ts  # mesin status kolaborasi
scripts/deploy-vps.sh                # pasang/perbarui VPS
scripts/smoke-test.mjs               # uji end-to-end seluruh alur
scripts/backup-db.sh                 # cadangan Postgres
docs/DEPLOY-VPS.md                   # panduan VPS lengkap
```

Proteksi route: server layout per peran + pengecekan sesi di tiap API.
`src/middleware.ts` sengaja no-op agar Prisma tidak ikut ke edge runtime.

---

## 8. Scripts & pengujian

```bash
npm run dev             # development server
npm run build           # prisma generate + next build
npm run start           # production server
npm run lint            # eslint
npm run db:push         # sinkronkan skema ke DB
npm run db:seed         # data demo
npm run db:studio       # Prisma Studio
npm run smoke           # uji end-to-end (login→campaign→lamar→escrow→review→selesai)
npm run test:deploy     # uji blok .env pada naskah VPS
npm run backup:db       # cadangkan basis data
```

`npm run smoke` memakai `BASE_URL` (default `http://localhost:3000`) dan akun
`SMOKE_UMKM` / `SMOKE_KOL` / `SMOKE_PASS`. Naskahnya membuat campaign sendiri,
lalu menutup/membatalkan objek uji, jadi aman dijalankan berulang. Setelah deploy:

```bash
BASE_URL=https://kolabora.tech npm run smoke
```

Yang diperiksa (81 butir): logika alur penuh (lamar → terima → escrow → review →
selesai), seluruh API (termasuk penjaga 401/403 per peran), endpoint AI beserta
fallback dan pembatas kuota, perhitungan tarif & skor profil, undangan kolaborasi
dari halaman Highlights, agenda kalender, dan 32 halaman yang harus ter-render.

Status saat ini: **81/81 pemeriksaan lulus** di dev lokal (AI dalam mode aturan
karena kunci belum diisi).

---

## 9. Catatan pembayaran

Tidak ada payment gateway sungguhan. `/api/payments/simulate` mensimulasikan hasil
transaksi (berhasil/gagal) lalu escrow dicatat di database. Aman untuk demo,
**jangan** dipakai untuk transaksi nyata tanpa integrasi Midtrans/Xendit dan
rekening escrow resmi.
