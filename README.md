# Kolabora

Marketplace kolaborasi UMKM ↔ influencer dengan **AI Smart Matching** (rule-based), campaign, lamaran, chat real-time-ish, escrow simulasi, dan review konten.

Stack: **Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · NextAuth v5 · Prisma + PostgreSQL · Vercel Blob**.

---

## 1. Menjalankan secara lokal

### Prasyarat
- Node.js 20+ (disarankan 20/22)
- Database PostgreSQL gratis: [Supabase](https://supabase.com) atau [Neon](https://neon.tech)
- (opsional) Vercel Blob token untuk upload file

### Langkah

```bash
npm install
cp .env.example .env      # lalu isi nilainya
npx prisma db push        # buat tabel di database
npm run db:seed           # opsional: data demo
npm run dev
```

Buka http://localhost:3000.

### Environment variables

| Variable | Wajib | Keterangan |
|---|---|---|
| `DATABASE_URL` | ✅ | Connection string Postgres. Untuk Supabase gunakan **Connection Pooler** (port `6543`) dan tambahkan `?pgbouncer=true`. |
| `AUTH_SECRET` | ✅ | `openssl rand -base64 32` |
| `AUTH_URL` | ✅ | `http://localhost:3000` saat lokal, URL Vercel saat deploy |
| `NEXT_PUBLIC_APP_URL` | ✅ | Sama seperti `AUTH_URL` |
| `BLOB_READ_WRITE_TOKEN` | ⬜ | Upload file (portfolio, konten). Tanpa ini upload dinonaktifkan; portfolio masih bisa pakai URL. |
| `NEXT_PUBLIC_SUPABASE_URL` | ⬜ | Hanya jika memakai Supabase. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | ⬜ | Hanya jika memakai Supabase. |

Contoh Supabase (Project Settings → Database → Connection string → **URI**, mode *Transaction pooler*):

```env
DATABASE_URL="postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true&schema=public"
```

> Catatan: `prisma db push` butuh koneksi langsung? Pooler Supabase mendukung `db push`; jika gagal, pakai **Direct connection** (port `5432`) untuk push lalu kembali ke pooler untuk runtime.

---

## 2. Akun demo (setelah `npm run db:seed`)

Semua password: `password123`

| Email | Peran | Profil |
|---|---|---|
| `umkm@kolabora.id` | UMKM | Kopi Senja (Yogyakarta) |
| `brand@kolabora.id` | UMKM | Batik Ayu (Solo) |
| `influencer@kolabora.id` | Influencer | Sarah Beauty (Kecantikan) |
| `foodie@kolabora.id` | Influencer | Rizky Foodie (Kuliner) |

Seed juga membuat contoh campaign, lamaran, satu kolaborasi **IN_PRODUCTION** dengan escrow terkunci, dan satu tawaran **PROPOSED** yang menunggu respons influencer.

---

## 3. Alur produk

1. **UMKM** membuat campaign (`/dashboard/umkm/campaigns`).
2. **Influencer** menemukan campaign lewat *Cari Campaign* atau **AI Smart Matching**, lalu melamar dengan proposal + tarif.
3. **UMKM** menerima lamaran → sistem membuat kolaborasi `PROPOSED` + chat otomatis.
4. Negosiasi di **Chat** (polling 3,5 detik).
5. Kedua pihak menyepakati deal (`AGREED`).
6. **UMKM** membayar simulasi → dana `ESCROW_HELD` (modal pembayaran punya animasi sukses/gagal; 8% peluang gagal).
7. **Influencer** mulai produksi (`IN_PRODUCTION`) dan mengirim konten (`CONTENT_SUBMITTED`).
8. **UMKM** review di `/dashboard/umkm/review-campaign`: setujui (`APPROVED`) atau minta revisi (`REVISION_REQUESTED`).
9. **UMKM** mencairkan escrow (`COMPLETED`).

Status lengkap: `PROPOSED → NEGOTIATION → AGREED → ESCROW_HELD → IN_PRODUCTION → CONTENT_SUBMITTED/UNDER_REVIEW → REVISION_REQUESTED → APPROVED → COMPLETED` (plus `CANCELLED`, `DISPUTED`).

### Aturan Smart Matching
Skor 0–100 dari kombinasi:
- kecocokan niche/kategori (35)
- lokasi (15)
- followers (20)
- engagement (15)
- kecocokan budget/tarif (15)

Skor dan alasan ditampilkan per kandidat di UI one-by-one.

---

## 4. Struktur penting

```
prisma/schema.prisma            # model & enum
prisma/seed.mjs                 # data demo
src/auth.ts                     # NextAuth (Credentials + JWT)
src/lib/collab.ts               # status, step, aksi (client-safe)
src/lib/collab-server.ts        # serialisasi kolaborasi (server only)
src/app/api/...                 # API routes
src/app/dashboard/umkm|influencer/...
src/components/dashboard/CollaborationHistory.tsx   # inti alur kolaborasi
src/components/dashboard/ChatRoom.tsx               # chat polling
```

Proteksi route: server layout per role + pengecekan session di tiap API. `src/middleware.ts` sengaja no-op (`matcher: []`) agar Prisma tidak ikut ke edge runtime.

---

## 5. Deploy gratis ke Vercel

1. Push repo ke GitHub.
2. Import project di [vercel.com/new](https://vercel.com/new).
3. Tambahkan environment variables: `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, `NEXT_PUBLIC_APP_URL`, `BLOB_READ_WRITE_TOKEN` (opsional).
4. Deploy. Build command default sudah benar: `prisma generate && next build`.
5. Setelah deploy, jalankan `npx prisma db push` (dan `npm run db:seed` bila ingin data demo) dengan `DATABASE_URL` production dari mesin lokal.
6. Untuk upload file: aktifkan **Blob** di dashboard Vercel, lalu copy `BLOB_READ_WRITE_TOKEN` ke environment variables.

> Vercel free tier + Supabase/Neon free tier cukup untuk demo dan penggunaan skala kecil. Tidak perlu VPS.

---

## 6. Scripts

```bash
npm run dev        # development server
npm run build      # prisma generate + next build
npm run start      # production server
npm run lint       # eslint
npm run db:push    # sinkronkan schema ke DB
npm run db:seed    # data demo
npm run db:studio  # Prisma Studio
```

---

## 7. Catatan pembayaran

Tidak ada payment gateway sungguhan. `/api/payments/simulate` mensimulasikan hasil transaksi (berhasil/gagal) lalu escrow dicatat di database. Aman untuk demo, **jangan** dipakai untuk transaksi nyata tanpa integrasi Midtrans/Xendit dan rekening escrow resmi.
