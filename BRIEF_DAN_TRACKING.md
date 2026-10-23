# BRIEF & TRACKING - Kolabora (Prototype → Production Ready

**Tanggal Dibuat:** 23 Oktober 2026  
**Status:** In Progress  
**Tujuan:** Mengubah prototype saat ini menjadi aplikasi yang benar-benar siap digunakan secara real (bukan hanya MVP)

---

## 1. Gambaran Umum Proyek

**Nama Proyek:** Kolabora  
**Deskripsi:** Platform multi-sided marketplace berbasis AI yang menghubungkan UMKM dengan influencer untuk kolaborasi pemasaran digital.  
**Tech Stack Saat Ini:** Next.js 16.2.10 (App Router), React 19.2.4, TypeScript 5, Tailwind CSS 4, Lucide React  
**Model:** Next.js 16 dengan App Router, client-side components, localStorage untuk data sementara

---

## 2. Kondisi Saat Ini (Audit)

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

### ⚠️ Yang Masih Kurang / Perlu Diperbaiki untuk Production
- **Autentikasi & Authorization** - Login/Register hanya UI, tidak ada auth system (NextAuth, Clerk, dll)
- **Database** - Semua data menggunakan localStorage, perlu database real (Postgres/MySQL + Prisma/Drizzle)
- **Backend/API** - Tidak ada API routes, semua logic client-side
- **User Management** - Tidak ada user profiles, roles, sessions
- **File Upload** - Untuk portfolio, konten review, dll
- **Payment/Escrow** - Hanya UI/info, perlu integrasi payment gateway (Midtrans/Xendit) & escrow logic
- **Real AI Matching** - Saat ini hardcoded data, perlu AI/ML atau rule-based engine yang sebenarnya
- **Notifications** - Hanya UI bell, tidak functional
- **Email/Notification System** - Belum ada
- **Validation & Security** - Belum ada (auth, CSRF, rate limiting, input validation)
- **Error Handling** - Minimal
- **Testing** - Tidak ada
- **Environment Config** - Perlu .env setup
- **Deployment Ready** - Perlu setup untuk production

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
| Setup DATABASE_URL di .env | ⏳ To Do | P0 | **Masih placeholder** — isi connection string Supabase/Neon |
| Migrate & generate Prisma client | 🟡 Partial | P0 | `prisma generate` ✅; `prisma db push` menunggu DATABASE_URL |
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
| .env.example lengkap | ✅ Done | P0 | |
| Setup untuk Vercel deployment (tanpa VPS) | ✅ Done | P0 | README + Blob |
| Deployment (Vercel + Neon/Supabase) | ⏳ To Do | P0 | Menunggu DATABASE_URL production |


---

## 5. Keputusan & Konfirmasi (Sudah Dikonfirmasi)

### A. Arsitektur & Tech Stack
1. **Database** - **Postgres gratisan** (Neon/Supabase) yang bisa dipakai di Vercel tanpa VPS. Akan pakai **Prisma**.
2. **Authentication** - **NextAuth.js v5 (Auth.js)** dengan credentials provider + role-based access (UMKM/Influencer).
3. **File Storage** - **Vercel Blob**.
4. **Payment Gateway** - **Skip dulu**. Cukup mockup dengan animasi "transaksi berhasil/gagal" pura-pura (untuk simulasi escrow).
5. **Real-time Chat** - Butuh **real-time** (A kirim, B langsung nerima). Akan pakai pendekatan yang compatible dengan serverless/Vercel (polling dengan interval pendek atau Server-Sent Events). Hindari self-hosted websocket server.

### B. Scope & Prioritas
6. **Prioritas pertama** - **Full flow** (campaign → apply/propose → chat → collaboration) biar bisa dipakai real
7. **Target** - **Full production-ready**, disesuaikan untuk hosting gratisan (Vercel) tanpa sewa VPS. Package & struktur akan dioptimasi untuk serverless.
8. **Data lokal** - **Mulai fresh** (focus ke database). localStorage bisa dipertahankan sebagai fallback/dev aja.
9. **AI Matching** - **Rule-based sederhana** berdasarkan niche, lokasi, engagement, followers, dll.

### C. Deployment
10. **Deployment target** - **Vercel** (gratisan)
11. **Environment** - Setup dari awal (.env.example + konfigurasi)

---

## 6. Progress Terbaru & Next Steps

### Sudah Dikerjakan
- ✅ Full audit kodebase
- ✅ Brief & tracking document
- ✅ Prisma schema lengkap (User, Profiles, Campaign, Application, Collaboration, Messages, Review, Notification, Portfolio)
- ✅ NextAuth.js v5 setup dengan Credentials provider + role-based (UMKM/INFLUENCER)
- ✅ API routes lengkap: auth, campaigns (+detail/apply), applications, collaborations (+state machine), messages, reviews, upload, notifications, profile, portfolio, matching, payments
- ✅ Proteksi route server-side per role + pengecekan session per API
- ✅ Login & Register functional (terhubung API)
- ✅ Campaign management UMKM (list, create, detail + kelola pelamar)
- ✅ Discover campaign & apply untuk influencer
- ✅ AI Smart Matching rule-based (dua arah) dengan modal proposal/lamaran
- ✅ Chat DB + polling 3,5 detik, unread badge, kirim pesan
- ✅ Mock payment/escrow dengan animasi sukses/gagal (`/api/payments/simulate`)
- ✅ Review konten: submit (influencer), approve/revisi (UMKM)
- ✅ Dashboard & analytics real dari database (UMKM & influencer)
- ✅ Profil & portfolio (upload Blob opsional, fallback URL)
- ✅ Notifikasi in-app (bell + polling + halaman terkait)
- ✅ `.env.example`, README setup/deploy, `prisma/seed.mjs`, script `db:seed`
- ✅ TypeScript check bersih (`npx tsc --noEmit`)

### Next Steps (Langkah Selanjutnya)
1. **Isi `DATABASE_URL`** di `.env` dengan connection string Supabase (pooler port 6543) atau Neon.
2. **Push schema**: `npx prisma db push`.
3. **Seed data demo**: `npm run db:seed`.
4. **Jalankan dev server & smoke test alur lengkap**:
   register → login → buat campaign → apply → terima lamaran → chat → agree → escrow → produksi → kirim konten → review → approve → cairkan escrow.
5. **`npm run build`** untuk memastikan build production bersih.
6. **Deploy ke Vercel** dengan env yang sama (ganti `AUTH_URL`/`NEXT_PUBLIC_APP_URL` ke domain Vercel).
7. **Opsional**: aktifkan Vercel Blob (`BLOB_READ_WRITE_TOKEN`) agar upload file aktif.
8. **Opsional (P1)**: rating & review setelah kolaborasi selesai, admin panel/dispute.

**Catatan:** Semua setup disesuaikan untuk hosting gratis di Vercel tanpa VPS. Chat memakai polling agar kompatibel serverless. Payment hanya simulasi dengan animasi, bukan gateway sungguhan.


---

*File ini akan diupdate secara berkala seiring progress pengerjaan.*