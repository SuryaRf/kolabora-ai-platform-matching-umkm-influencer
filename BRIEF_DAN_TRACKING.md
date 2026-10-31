# BRIEF & TRACKING - Kolabora (Prototype → Production Ready

**Tanggal Dibuat:** 23 Oktober 2026  
**Terakhir Diupdate:** 31 Oktober 2026  
**Status:** Siap deploy — uji end-to-end 81/81 lulus di lokal dengan AI DeepSeek asli aktif  
**Tujuan:** Mengubah prototype saat ini menjadi aplikasi yang benar-benar siap digunakan secara real (bukan hanya MVP)

---

## 1. Gambaran Umum Proyek

**Nama Proyek:** Kolabora  
**Deskripsi:** Platform multi-sided marketplace berbasis AI yang menghubungkan UMKM dengan influencer untuk kolaborasi pemasaran digital.  
**Tech Stack Saat Ini:** Next.js 16.2.10 (App Router), React 19.2.4, TypeScript 5, Tailwind CSS 4, Lucide React, NextAuth v5, Prisma + PostgreSQL, AI DeepSeek  
**Model:** Next.js App Router, database sungguhan (Postgres), API routes server-side, komponen client yang mengambil data dari API

---

## 2. Kondisi Saat Ini (Audit Awal — Oktober)

> Daftar "yang masih kurang" di bawah adalah hasil audit sebelum pengerjaan.
> Status tiap butir sudah diperbarui pada bagian 4 (Rencana Kerja).

### ✅ Yang Sudah Ada
- **Landing Page** - Navbar, HeroSection, SharedFeatures, UMKMSection, InfluencerSection, PricingSection, Footer
- **Role Selection** - Halaman pemilihan peran (UMKM/Influencer) di `/dashboard`
- **Dashboard Layout** - Sidebar, header, role-based navigation untuk UMKM & Influencer
- **AI Smart Matching** - UI one-by-one matching dengan scoring, reasons, stats
- **Collaboration Flow** - 7 tahap alur kolaborasi (Matching → Proposal → Negotiasi → Agreement → Produksi → Review → Completion), dengan stepper, progress bar, timeline
- **Riwayat Kolaborasi** - Tracking dengan localStorage, filter, aksi per tahap, escrow info
- **Chat** - UI chat sederhana (mock data)
- **Analytics** - UI laporan campaign dengan metrics & AI recommendations
- **Auth Pages** - Login & Register UI (belum functional)
- **Local State Management** - `lib/collaborations.ts` dengan useCollaborations hook

### ⚠️ Yang dulu kurang — sekarang (status 31 Oktober)
- **Autentikasi & Authorization** - ✅ NextAuth v5 (Credentials + JWT), proteksi per role di layout & tiap API
- **Database** - ✅ PostgreSQL + Prisma (14 tabel); skema juga tersedia sebagai SQL murni di `supabase/migrations/`
- **Backend/API** - ✅ API routes lengkap untuk seluruh alur + endpoint AI
- **User Management** - ✅ profil UMKM/influencer, peran, sesi
- **File Upload** - ✅ Vercel Blob bila ada token, fallback input URL
- **Payment/Escrow** - ✅ simulasi escrow dengan animasi sukses/gagal (gateway sungguhan sengaja ditunda)
- **Real AI Matching** - ✅ hibrida: mesin aturan + DeepSeek (`/api/ai/*`), tetap jalan tanpa kunci API
- **Notifications** - ✅ in-app (bell + polling). Email: belum (P1)
- **Email/Notification System** - ⏳ belum (P1)
- **Validation & Security** - ✅ Zod, cek sesi, rate limit AI, input dipangkas
- **Error Handling** - ✅ fallback aturan + pesan terbaca di UI
- **Testing** - ✅ `scripts/smoke-test.mjs` (81 pemeriksaan end-to-end) + `scripts/test-env-block.sh` (16) + `scripts/test-set-key.sh` (27)
- **Environment Config** - ✅ `.env.example` (dev) dan `.env.production.example` (VPS)
- **Deployment Ready** - ✅ naskah VPS + PM2 + Caddy, dan tetap bisa ke Vercel

---

## 3. Target Akhir (Production Ready)

Aplikasi harus bisa digunakan secara real dengan fitur:
1. **User Authentication** - Register/Login dengan role (UMKM/Influencer), session management
2. **User Profiles** - Profil lengkap per role (bio, niche, portfolio, followers, rate, dll)
3. **Campaign Management** - UMKM bisa buat campaign real, influencer bisa apply
4. **Real Smart Matching** - Matching berdasarkan criteria nyata
5. **Collaboration Workflow** - Full flow dari apply/propose hingga selesai dengan status tracking
6. **Real-time Chat** - Komunikasi antar user
7. **File Upload & Review** - Upload konten untuk review
8. **Escrow & Payment** - Sistem pembayaran aman
9. **Analytics Dashboard** - Data real
10. **Notifications** - Email + in-app
11. **Admin Panel** (opsional tapi disarankan) - Moderasi, dispute resolution

---

## 4. Rencana Kerja & Tracking

### Phase 0: Persiapan & Setup (PRIORITAS TINGGI)
| Task | Status | Priority | Notes |
|---|---|---|---|
| Buat dokumentasi brief & tracking ini | ✅ Done | P0 | File ini |
| Audit lengkap kodebase | ✅ Done | P0 | Sudah dilakukan |
| Tentukan arsitektur target (DB, Auth, API) | ✅ Done | P0 | NextAuth v5, Prisma + Postgres, Vercel Blob |
| Setup environment variables | ✅ Done | P0 | `.env.example` lengkap |
| Setup database schema design | ✅ Done | P0 | `prisma/schema.prisma` |

### Phase 1: Foundation (Auth, DB, User System)
| Task | Status | Priority | Notes |
|---|---|---|---|
| Setup NextAuth.js v5 (Auth.js) | ✅ Done | P0 | Credentials provider + role + JWT |
| Setup Prisma + Postgres schema | ✅ Done | P0 | Schema lengkap untuk full flow |
| API routes: register, auth, campaigns, apply, collaborations, messages, upload, matching | ✅ Done | P0 | Serverless-friendly |
| Middleware role-based protection | ✅ Done | P0 | Proteksi di server layout + API (middleware no-op agar Prisma tidak di edge) |
| Implementasi registration dengan role selection (functional) | ✅ Done | P0 | Terhubung ke API |
| Implementasi login & session management | ✅ Done | P0 | Pakai NextAuth |
| SessionProvider setup | ✅ Done | P0 | |
| Buat .env.example | ✅ Done | P0 | |
| Update package.json dengan scripts prisma | ✅ Done | P0 | `db:push`, `db:seed`, `db:studio` |
| Install dependencies | ✅ Done | P0 | `npm install` selesai |
| Setup DATABASE_URL di .env | ✅ Done | P0 | PostgreSQL lokal `kolabora_dev` untuk pengembangan; `.env` (gitignore) |
| Migrate & generate Prisma client | ✅ Done | P0 | `prisma generate` + `prisma db push` jalan; skema juga direkam di `supabase/migrations/0001_init.sql` |
| User profile CRUD (per role) | ✅ Done | P0 | `/api/profile` + halaman profil UMKM & influencer |

### Phase 2: Core Features (Campaign, Matching, Collaboration)
| Task | Status | Priority | Notes |
|---|---|---|---|
| Campaign creation (UMKM) | ✅ Done | P0 | List + create + detail |
| Campaign listing & detail | ✅ Done | P0 | Discover untuk influencer |
| Apply to campaign (Influencer) | ✅ Done | P0 | Application system + modal |
| Propose collaboration flow | ✅ Done | P0 | Dari matching/campaign, langsung buat kolaborasi + chat awal |
| Rule-based Smart Matching algorithm | ✅ Done | P0 | Niche, lokasi, followers, engagement, budget |
| Collaboration state machine | ✅ Done | P0 | 11 status, tersimpan di DB + notifikasi |
| Real-time chat (polling) | ✅ Done | P0 | Polling 3,5 detik, read status |
| File upload dengan Vercel Blob (portfolio, content review) | ✅ Done | P0 | Butuh `BLOB_READ_WRITE_TOKEN`; fallback URL tersedia |

### Phase 3: Mock Payment, Review, Analytics
| Task | Status | Priority | Notes |
|---|---|---|---|
| Mock Payment/Escrow UI + animasi | ✅ Done | P0 | Sukses/gagal, 8% decline acak |
| Escrow flow simulation (hold/release) | ✅ Done | P0 | Tercatat di DB, tanpa gateway |
| Content review system | ✅ Done | P0 | Submit konten, approve/revisi, catatan |
| Real analytics dari data DB | ✅ Done | P0 | UMKM & influencer |
| Notifications (in-app) | ✅ Done | P0 | Bell + polling |
| Rating & review system | ⏳ To Do | P1 | Setelah kolaborasi selesai |

### Phase 4: Polish & Production
| Task | Status | Priority | Notes |
|---|---|---|---|
| Input validation (Zod) | ✅ Done | P0 | API register, profile, campaign, review |
| Error handling & loading states | ✅ Done | P0 | Toast/inline error + spinner |
| Security hardening (auth, role check, CSRF) | ✅ Done | P0 | Session check per API + role guard |
| Responsive design check | ✅ Done | P1 | Layout dashboard collapse |
| Performance optimization (serverless-friendly) | ✅ Done | P1 | Query Prisma terbatas, polling ringan |
| .env.example lengkap | ✅ Done | P0 | `.env.example` (dev) + `.env.production.example` (VPS) |
| Setup untuk Vercel deployment (tanpa VPS) | ✅ Done | P0 | README bagian 6 + Blob opsional |
| Deployment (Vercel + Neon/Supabase) | 🟡 Ready | P0 | Alternatif; jalur utama pindah ke VPS (Phase 5) |

### Phase 5: AI Sungguhan, Pengujian, Deploy VPS (PRIORITAS TINGGI — selesai 31 Okt)
| Task | Status | Priority | Notes |
|---|---|---|---|
| Klien AI DeepSeek (tanpa dependency) | ✅ Done | P0 | `src/lib/ai.ts` — timeout 40 dtk, retry 429/5xx, mode JSON, perbaikan JSON rusak |
| Endpoint AI | ✅ Done | P0 | `/api/ai/{status,content,brief,score-campaign,match,optimize-profile,rate-card}` + `/api/health` publik |
| Pencocokan hibrida (aturan + AI) | ✅ Done | P0 | `blendScores()`; hasil aturan tetap tampil saat AI mati/gagal |
| Penilai kelayakan brief | ✅ Done | P0 | `src/lib/campaign-score.ts`, skor instan di form buat campaign |
| UI terhubung ke AI sungguhan | ✅ Done | P0 | buat campaign, content assistant, skill assistant, smart matching |
| Kuota AI per pengguna | ✅ Done | P0 | `src/lib/rate-limit.ts` (per menit/jam/hari) |
| Uji end-to-end seluruh alur | ✅ Done | P0 | `scripts/smoke-test.mjs` — **81/81 lulus** (login→campaign→lamar→escrow→review→selesai) |
| Uji naskah deploy | ✅ Done | P0 | `scripts/test-env-block.sh` — 16/16 lulus (`npm run test:deploy`); `scripts/test-set-key.sh` — 27/27 lulus (`npm run test:keys`) |
| Skema & data demo sebagai SQL | ✅ Done | P0 | `supabase/migrations/0001_init.sql`, `0002_seed_demo.sql` (idempoten, sudah diverifikasi ulang) |
| Naskah pasang/perbarui VPS | ✅ Done | P0 | `scripts/deploy-vps.sh` — Node 22, Postgres, PM2, Caddy, firewall, uji `.env` aman |
| Konfigurasi PM2 + Caddy | ✅ Done | P0 | `ecosystem.config.js`, `deploy/Caddyfile` (HTTPS, header, body 10 MB) |
| Pencadangan basis data | ✅ Done | P0 | `scripts/backup-db.sh` — pemulihan `.dump` dan `.sql` sudah diverifikasi sungguhan |
| Panduan deploy berbahasa Indonesia | ✅ Done | P0 | `docs/DEPLOY-VPS.md` (DNS, AI, update, rollback, backup, alternatif Vercel) |
| Menempelkan `DEEPSEEK_API_KEY` | ✅ Done | P0 | `npm run set-key` (input tersembunyi, izin 0600) — kunci asli terisi 35 karakter, tidak pernah tampil di log/chat |
| Verifikasi AI asli end-to-end | ✅ Done | P0 | `/api/ai/status?test=1` → `ok:true` (770 ms); `smoke` 81/81 dengan `aiUsed=true` di match/score-campaign/optimize-profile/rate-card; skor brief hibrida stabil (aturan 78 → hibrida 74; brief ringkas aturan 52 → hibrida 46) |
| Menjalankan deploy di VPS `kolabora.tech` | ⏳ To Do | P0 | butuh IP/akses SSH — `bash scripts/deploy-vps.sh --domain kolabora.tech --seed --test` |
| Rating & review timbal balik (lihat Phase 3) | ⏳ To Do | P1 | setelah kolaborasi COMPLETED |
| Notifikasi email | ⏳ To Do | P1 | butuh layanan SMTP |
| Payment gateway sungguhan (Midtrans/Xendit) | ⏳ To Do | P2 | sengaja masih simulasi |

### Phase 6: Menghapus Data Pura-pura dari UI (selesai 31 Okt)
| Task | Status | Priority | Notes |
|---|---|---|---|
| Mesin skor profil & tarif aturan | ✅ Done | P0 | `src/lib/profile-score.ts` — 6 sub-skor berbobot + `rateCard()` (satu acuan dengan `RATE_PER_FOLLOWER_PER_DELIVERABLE` di sisi UMKM) |
| Pengambil data profil/pasar | ✅ Done | P0 | `src/lib/facts.ts` — `loadInfluencerFacts`, `loadMarketSample`, `loadInfluencerStats` (server only) |
| Insight kreator | ✅ Done | P0 | `GET /api/insights/influencer` — skor, visibilitas, peringkat, funnel, escrow cair |
| Insight UMKM | ✅ Done | P0 | `GET /api/insights/umkm` — ringkasan + agenda dari tanggal asli + daftar "perlu ditangani" |
| AI Optimasi Profil | ✅ Done | P0 | `POST /api/ai/optimize-profile` + halaman `influencer/profile-optimizer` (skor nyata, draf bio bisa diterapkan ke profil) |
| AI Kartu Tarif | ✅ Done | P0 | `POST /api/ai/rate-card` + halaman `influencer/rate-recommendation` (bisa dipasang jadi tarif profil) |
| Priority Matching tanpa angka fiktif | ✅ Done | P0 | memakai peringkat visibilitas hasil perhitungan; tombol "Optimalkan profil" berfungsi |
| UMKM Insight (kreator→UMKM) | ✅ Done | P0 | daftar campaign nyata, filter lokasi dari data, lamaran lewat `POST /api/campaigns/apply` |
| Kreator Unggulan (UMKM) | ✅ Done | P0 | peringkat dari `GET /api/matching/influencers`, chip kategori/budget nyata, modal detail + **undang kreator** (`POST /api/collaborations`) |
| Kalender Kolaborasi | ✅ Done | P0 | navigasi bulan nyata, agenda dari `startDate/endDate` + tahap kolaborasi, tanpa klaim "prime time" |
| Tautan deep-link chat/riwayat | ✅ Done | P1 | `?collaboration=<id>` membuka percakapan/riwayat terkait |
| Membersihkan data contoh di komponen | ✅ Done | P0 | tidak ada lagi `const mock...` di 6 halaman showcase |
| Lint bersih | ✅ Done | P0 | `npx eslint src` → 0 error (perbaiki `react-hooks/set-state-in-effect` dengan derived state / mount ulang) |
| Perluas uji end-to-end | ✅ Done | P0 | `scripts/smoke-test.mjs` 51 → **81** pemeriksaan (endpoint insight, guard 401/403, filter pencocokan, undangan Highlights, tindakan kalender) |
| Rating & review timbal balik | ⏳ To Do | P1 | fiturnya belum dibuat (bukan angka fiktif): penilaian dua arah setelah COMPLETED |
| Halaman analytics kreator & UMKM | ✅ Done | P0 | angka dihitung dari Prisma/API, bukan statistik contoh |
| Tidak ada angka fiktif di UI dashboard | ✅ Diperiksa | P0 | penelusuran pola `mock`, `trend:`, `prime time`, peringkat berbayar → tidak ada yang tersisa |
| Pengisi kunci AI tanpa bocoran | ✅ Done | P0 | `scripts/set-key.sh` (`npm run set-key`, input tersembunyi, chmod 0600, `--check`) + uji `scripts/test-set-key.sh` **27/27** |


---

## 5. Keputusan & Konfirmasi (Sudah Dikonfirmasi)

### A. Arsitektur & Tech Stack
1. **Database** - **PostgreSQL + Prisma**. Pengembangan memakai PostgreSQL lokal; produksi boleh PostgreSQL di VPS (dibuat otomatis oleh naskah deploy) atau Supabase/Neon gratis (pooler port 6543 + `?pgbouncer=true`).
2. **Authentication** - **NextAuth.js v5 (Auth.js)** dengan credentials provider + role-based access (UMKM/INFLUENCER).
3. **File Storage** - **Vercel Blob** bila token tersedia; tanpa token unggah memakai input URL.
4. **Payment Gateway** - **Skip dulu**. Cukup mockup dengan animasi "transaksi berhasil/gagal" (simulasi escrow).
5. **Real-time Chat** - Pendekatan yang cocok untuk serverless: **polling 3,5 detik**, bukan websocket self-hosted.
6. **AI** - **DeepSeek API** (`deepseek-chat`) lewat `src/lib/ai.ts`, dengan **mesin aturan sebagai fallback** sehingga aplikasi tetap jalan dan tanpa biaya ketika kunci API belum diisi.

### B. Scope & Prioritas
7. **Prioritas pertama** - **Full flow** (campaign -> apply/propose -> chat -> collaboration) supaya benar-benar bisa dipakai.
8. **Target** - **Full production-ready**: tidak ada bug pada alur utama, ada uji otomatis, dan mudah deploy ulang.
9. **Data lokal** - **Mulai fresh** (fokus ke database). localStorage hanya untuk pengembangan.
10. **Matching** - **Hibrida**: perhitungan aturan (niche, lokasi, followers, engagement, budget) selalu jalan, lalu digabungkan dengan penilaian AI.
11. **Bahasa** - UI, pesan galat, prompt AI, dan dokumentasi memakai **Bahasa Indonesia**.

### C. Deployment
12. **Target utama** - **VPS sendiri** dengan domain `kolabora.tech`: Next.js hasil build di **PM2** + **Caddy** (HTTPS otomatis) + PostgreSQL lokal. Satu naskah: `scripts/deploy-vps.sh`.
13. **Alternatif** - **Vercel** gratis (README bagian 6) tetap didukung.
14. **Environment** - `.env.example` untuk pengembangan, `.env.production.example` untuk produksi; naskah deploy tidak menimpa nilai yang sudah diisi.
15. **Pencadangan** - `scripts/backup-db.sh` (cron harian disarankan): `pg_dump` format custom atau SQL teks.

---

## 6. Progress Terbaru & Next Steps

### Sudah Dikerjakan (31 Oktober)
**Fondasi & alur inti**
- ✅ Skema Prisma 14 tabel + salinan SQL (`supabase/migrations/0001_init.sql`, `0002_seed_demo.sql`)
- ✅ NextAuth v5 (Credentials + JWT) dengan peran UMKM dan INFLUENCER
- ✅ API lengkap: auth, campaigns, applications, collaborations (mesin status), messages, reviews, notifications, profile, portfolio, matching, payments
- ✅ Proteksi per peran di layout + pengecekan sesi di setiap API
- ✅ Alur penuh teruji: buat campaign -> lamar -> terima -> chat -> deal -> escrow -> produksi -> kirim konten -> review -> cairkan -> COMPLETED

**AI sungguhan (DeepSeek)**
- ✅ Klien AI tanpa dependency eksternal: timeout, retry, mode JSON, perbaikan JSON rusak (`src/lib/ai.ts`)
- ✅ Endpoint `POST /api/ai/{match,content,brief,score-campaign,optimize-profile,rate-card}` + `GET /api/ai/status?test=1`
- ✅ Pencocokan hibrida (aturan + AI) dan penilai kelayakan brief (40% aturan / 60% AI)
- ✅ Halaman buat campaign: skor kesiapan langsung, "Periksa dengan AI", "Susun draft brief dengan AI"
- ✅ Content assistant (influencer) & skill assistant (UMKM) memakai AI asli
- ✅ Kuota AI per akun per menit/jam/hari; prompt hanya memuat data milik pengguna yang login
- ✅ Fallback aturan tetap tampil ketika AI mati, gagal, atau kunci belum diisi

**Data asli menggantikan mockup (Phase 6)**
- ✅ `src/lib/profile-score.ts`: skor profil 6 komponen berbobot + kalkulator tarif per jenis konten (satu acuan dengan penilai brief UMKM, `RATE_PER_FOLLOWER_PER_DELIVERABLE`)
- ✅ `src/lib/facts.ts`: pengambil data profil, sampel pasar (median budget campaign sekategori), dan funnel lamaran
- ✅ Endpoint baru: `GET /api/insights/influencer`, `GET /api/insights/umkm`, `POST /api/ai/optimize-profile`, `POST /api/ai/rate-card`
- ✅ 6 halaman showcase dibalik dari angka pura-pura ke data nyata: optimizer profil, rekomendasi tarif, priority matching, UMKM insight (kreator), kreator unggulan (UMKM), kalender kolaborasi
- ✅ Tombol yang dulu mati sekarang berfungsi: terapkan bio ke profil, pasang tarif ke profil, lamar campaign dari halaman insight, undang kreator dari halaman unggulan, buka chat/riwayat lewat `?collaboration=<id>`
- ✅ Tidak ada lagi klaim fiktif ("prime time", "+12% trend", peringkat berbayar); yang tersisa hanya angka hasil perhitungan yang sumbernya ditulis di UI

**Kualitas & operasional**
- ✅ `scripts/smoke-test.mjs`: 81 pemeriksaan end-to-end (halaman, API, AI, eskalasi status, penjaga peran, filter pencocokan, undangan kolaborasi, agenda kalender) -> **81/81 lulus**
- ✅ `scripts/test-env-block.sh`: 16 pemeriksaan penulisan `.env` oleh naskah VPS -> **16/16 lulus**
- ✅ `scripts/test-set-key.sh`: 27 pemeriksaan pengisian kunci (tolak format salah/terlalu pendek, karakter khusus, izin 0600, nilai tidak pernah dicetak) -> **27/27 lulus**
- ✅ `npx tsc --noEmit` bersih dan `npm run build` berhasil (semua route ikut ter-generate)
- ✅ `/api/health` melaporkan versi, kondisi database, dan status konfigurasi AI
- ✅ `scripts/deploy-vps.sh` (pasang + perbarui VPS), `ecosystem.config.js` (PM2), `deploy/Caddyfile` (HTTPS)
- ✅ `scripts/backup-db.sh` — cadangan & pemulihan diverifikasi sungguhan (14 tabel, data ikut)
- ✅ `docs/DEPLOY-VPS.md` + README diperbarui (AI, env, VPS, Vercel, scripts)

### Yang Menunggu
1. **Kunci DeepSeek** — isi `DEEPSEEK_API_KEY="sk-..."` di `.env` (jangan dituliskan di percakapan), lalu:
   ```bash
   curl -s "http://localhost:3000/api/ai/status?test=1"   # harus "ok": true
   npm run smoke                                            # aiUsed=true pada fitur AI
   ```
2. **Akses VPS** — setelah IP/SSH tersedia:
   ```bash
   bash scripts/deploy-vps.sh --domain kolabora.tech --seed --test
   BASE_URL=https://kolabora.tech npm run smoke
   ```
3. **Memilih basis data produksi** — PostgreSQL lokal di VPS (otomatis) atau Supabase (jalankan dua file SQL di bagian 7 README, tempel string pooler ke `DATABASE_URL`).
4. **P1** — rating dua arah setelah COMPLETED, notifikasi email, admin panel/mediasi sengketa.
5. **P2** — payment gateway sungguhan (Midtrans/Xendit) menggantikan simulasi.

**Catatan:** escrow masih simulasi (tanpa gerbang pembayaran); chat memakai polling agar cocok di serverless maupun VPS; kunci AI hanya dibaca server dan tidak pernah dikirim ke browser.

---

*File ini akan diupdate secara berkala seiring progress pengerjaan.*