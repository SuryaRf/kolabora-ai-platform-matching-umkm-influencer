# Feedback tester 1–3 Nov 2026 — temuan, perbaikan, dan verifikasi

Status: **semua poin sudah live di `https://kolabora.tech`** — ronde 1–2 (deploy 3 Nov,
commit `3afbe28`..`e920c94`, smoke 85/85) dan **ronde 3** (deploy 3 Nov malam, commit
`e75b45c` + `a8e50d1`: jalur penolakan lamaran + catatan brand + kunci duplikasi
kolaborasi; perjalanan penuh 120/120 dan smoke 110/110 terhadap URL produksi).

## Ringkasan keputusan

| # | Keluhan | Akar masalah | Yang diubah |
|---|---|---|---|
| 1 | Tombol `Dashboard` & `Masuk` di landing dobel | `/dashboard` tanpa sesi = `redirect("/login")` | tautan Dashboard dihapus dari navbar (desktop + mobile) dan footer |
| 2 | Register & login | tidak ada temuan | tidak diubah; diminta studi kasus bila masih gagal |
| 3 | Influencer masih "Terima Tawaran" setelah lamaran diterima | `PATCH /api/applications` membuat Collaboration di `PROPOSED` | jalur itu kini melahirkan `NEGOTIATION`; jalur undangan langsung tetap `PROPOSED` |
| 4 | Sisi UMKM masih "Ajukan Kolaborasi" untuk campaign yang sudah jalan | akar yang sama (`statusToStep = 1`) | status `NEGOTIATION` → tahap 2 di kedua dashboard |
| 3b | Kartu "Campaign Saya" tidak sesuai jumlah sebenarnya | `collaborations.length + applications.length` (campaign sama dihitung 2×) dan "Sedang Berjalan" = tahap 3–5 | total = ID campaign unik; berjalan = tahap 2–5 lewat helper bersama; kartu dimuat ulang saat tab fokus |
| 5 | Chat terpisah untuk campaign berbeda? | memang begitu: `Message.collaborationId` wajib, 1 ruang = 1 kolaborasi | mekanisme tetap, label dipertegas: `Campaign: <judul>` |

Ekstra yang ikut dibereskan: `CANCELLED` tidak lagi menampilkan "Tahap 0 dari 6"
(`stageHint` mengembalikan `null`), bucket analytics UMKM diberi label
"Penawaran & Negosiasi", dan pencarian chat ikut mencocokkan judul campaign.

## Perbaikan data

Data lama dinormalkan dengan `scripts/sql/fix-negotiation-status.sql` (ber-guard,
idempoten, tidak menyentuh `updatedAt`). Tepat **1 baris** berubah:

```
cmvxnqfch000nbzgcnbd5tjw0  "Review Koleksi Batik Ayu Solo untuk Gaya Etnik Harian"
  PROPOSED -> NEGOTIATION     (lamaran cmvxnp624000fbzgc9rycd82n = ACCEPTED, chat 5 pesan)
```

Kolaborasi undangan (`Batik Ayu Lebaran Collection`) sengaja tetap `PROPOSED`,
`IN_PRODUCTION` tidak tersentuh, dan baris seed aman. Basis data produksi sesudah
smoke test + pembersih: 9 user / 4 campaign / 4 lamaran / 3 kolaborasi / 12 pesan,
sisa baris uji = 0.

## Verifikasi pasca-deploy (menarik API produksi langsung)

```
OK  sisi UMKM: status NEGOTIATION | tahap 2 | label Diskusi & Negosiasi | terhitung "Sedang Berjalan"
OK  sisi INFLUENCER: status NEGOTIATION | tahap 2 | label sama | dua sisi sinkron (2 vs 2)
OK  Total Campaign memakai campaign unik (lama=4 -> unik=3)
OK  Ruang chat: "Campaign: Review Koleksi Batik Ayu Solo untuk Gaya Etnik Harian"
OK  landing tanpa href="/dashboard" (0), tombol Masuk & Daftar tetap ada
OK  /api/health ok + database up; /dashboard/* tanpa sesi -> 307 ke /login
85/85 pemeriksaan smoke lulus terhadap https://kolabora.tech
```

---

## Balasan untuk tester

### 1) Landing page: tombol "Dashboard" dan "Masuk" dobel
Betul, keduanya jatuh ke halaman yang sama untuk pengunjung yang belum login
(`/dashboard` hanya menggeser ke `/login`). Tautan **Dashboard dihapus** dari navbar
(desktop & mobile) dan footer. Yang tersisa: **Masuk** dan **Daftar**. Setelah login
arahnya tetap ke `/dashboard`.

### 2) Register & Login
Tidak ada temuan bug di kode: registrasi → auto-login → dashboard dan login ulang
sudah sesuai. Kalau ada kasus spesifik yang gagal (email/peran/pesan error tertentu),
kirimkan langkahnya supaya kupastikan ulang.

### 3) & 4) Status "Terima Tawaran" / "Ajukan Kolaborasi" padahal sudah diterima
Akar masalahnya satu: saat brand menerima lamaran, kolaborasi dibuat dengan status
`PROPOSED` (= "menunggu respons"), padahal kreatornya yang melamar. Sekarang:

- Kolaborasi dari **lamaran yang diterima** langsung lahir di tahap **Diskusi &
  Negosiasi** — kedua dashboard menampilkan label yang sama, badge "Negosiasi",
  tombol "Sepakati Deal" (brand) dan "Setujui Deal" (kreator). Tidak ada lagi
  "Terima Tawaran" yang membingungkan.
- Kolaborasi dari **undangan langsung** (brand menawarkan lewat Smart Matching /
  Highlights) **tetap** "Tawaran Baru" — di sana kreator memang belum merespons,
  jadi tombol "Terima Tawaran" di situ benar dan tetap berfungsi.
- Data lama milikmu (kolaborasi *"Review Koleksi Batik Ayu Solo untuk Gaya Etnik
  Harian"*) sudah kunormalkan, tidak perlu reset akun. Buka lagi: sekarang tampil
  **"Diskusi & Negosiasi" — Tahap 2 dari 6**.

### 3b) Angka kartu "Campaign Saya"
Bukan gagal refresh — rumusnya dobel hitung: "Total Campaign" = jumlah kolaborasi +
jumlah lamaran, sehingga satu campaign dihitung 2 kali saat kamu melamar lalu
diterima (sebelumnya tampil 4, campaign unik sebenarnya 3). Sekarang dihitung dari
**ID campaign unik**. "Sedang Berjalan" juga diperluas supaya fase **diskusi/negosiasi**
ikut terhitung (sebelumnya tahap itu tidak masuk kartu mana pun), definisinya disamakan
di dashboard, riwayat, dan analytics, dan kartunya dimuat ulang saat tab kembali fokus.

### 5) Chat — apakah per campaign?
Ya: **satu ruang chat = satu kolaborasi = satu campaign**, dan itu disengaja. Brief,
negosiasi tarif, approval konten, dan escrow menempel ke satu campaign, jadi kalau
disatukan per orang, pesan "deal disetujui" jadi ambigu untuk campaign yang mana.
Supaya tidak membingungkan, judul percakapan kini ditulis eksplisit
**`Campaign: <judul>`** (kalau tidak terikat campaign: `Kolaborasi: <judul>`) di daftar
maupun header ruang chat, dan pencarian chat ikut mencocokkan judul campaign.

### Tambahan yang sekalian dibereskan
- Kolaborasi **dibatalkan** tidak lagi menampilkan tulisan aneh "Tahap 0 dari 6"
  (cukup badge "Dibatalkan", bar progres jadi abu-abu).
- Grafik analytics sisi brand tidak lagi menaruh "Negosiasi" di bawah label
  "Menunggu Respons" — sekarang "Penawaran & Negosiasi".
- Pembayaran masih **simulasi** dan dilabeli jujur di UI (badge "Simulasi").

Catatan verifikasi: 85 pemeriksaan otomatis (alur lamar → diterima → negosiasi → deal
→ escrow → produksi → review → selesai, plus jalur undangan → terima tawaran → batal)
lulus semua di URL produksi setelah deploy.

---

# Ronde 2 (3 Nov 2026) — memperjelas alur & mencatat hasil negosiasi

Status: **LIVE di `https://kolabora.tech` dan fallback Vercel** (deploy 3 Nov 2026 jam
18:55 WIB, commit `9032850`..`8a76785`, smoke **96/96** terhadap URL produksi).

## Pertanyaan tester

> "Di tahap diskusi, trigger-nya apa buat lanjut ke tahap berikutnya? Perjelas alur
> kolaborasi sampai selesai, dan pastikan data statusnya sinkron."

Trigger tiap tahap, dibaca dari kode (`TRANSITIONS` + `getCollabActions`):

| Tahap | Status | Giliran | Pemicu lanjut |
|---|---|---|---|
| 2 | `PROPOSED` | kreator | **Terima Tawaran** (`accept`) → `NEGOTIATION`; brand bisa **Batalkan** (`cancel`) |
| 3 | `NEGOTIATION` | kedua pihak | **Konfirmasi Deal** dari *brand dan kreator* pada tarif yang sama → `AGREED` |
| 4 | `AGREED` | brand | **Bayar & Kunci Escrow** (`hold_escrow`, simulasi) → `ESCROW_HELD` |
| 4 | `ESCROW_HELD` | kreator | **Mulai Produksi** (`start_production`) → `IN_PRODUCTION` |
| 5 | `IN_PRODUCTION` / `REVISION_REQUESTED` | kreator | **Kirim Konten** (`POST /api/reviews`) → `CONTENT_SUBMITTED` |
| 6 | `CONTENT_SUBMITTED` / `UNDER_REVIEW` | brand | **Setujui** → `APPROVED`; **Minta Revisi** → kembali ke tahap 5 |
| 7 | `APPROVED` | brand | **Cairkan Dana** (`complete`) → `COMPLETED`, escrow `RELEASED` |

Audit data produksi (8 aturan konsistensi status vs `agreedAt`/`startedAt`/
`submittedAt`/`approvedAt`/`completedAt`/escrow): **0 pelanggaran** — angka di kartu
`Rp 500.000` juga terbukti = `proposedRate` lamaran yang `ACCEPTED`, bukan angka acak.

## Akar masalah "alur tidak jelas"

1. **BUG: tombol aksi tidak pernah muncul di tahap negosiasi.** Kartu merender
   `action.href ? <Link> : <button>` — aksi yang punya pintasan (`href`) otomatis
   **tidak pernah** jadi tombol. Karena `Sepakati Deal`/`Setujui Deal` membawa
   `href: chat`, kedua sisi cuma melihat "Buka Chat". Persis keluhan tester.
2. **Angka tahap salah.** Timeline punya 7 kotak, tapi `stageHint` menulis `/6` dan
   memakai indeks 0-based sebagai nomor tahap.
3. **Hint membaca seperti fakta** ("...sudah disepakati") padahal chat masih menawar.
4. **Hasil negosiasi tidak tercatat.** `budget` hanya ditulis saat kolaborasi dibuat
   dan tidak ada jalur untuk mengubahnya → escrow mengunci angka lama, bukan angka
   yang disepakati di chat.
5. **Satu klik langsung `AGREED`** (role `ANY`) — pihak yang tidak ikut berdiskusi
   bisa menutup deal sepihak, dan tidak ada jejak tarif final.
6. Kartu **tanpa tombol** tidak menampilkan apa pun (bahkan "Buka Chat" ikut hilang),
   jadi sisi yang menunggu tampak "macet".

## Yang diubah (A + B + C, sesuai persetujuan)

- **A — alur terbaca.** `COLLAB_STAGES` di `src/lib/collab.ts` jadi satu sumber 7 tahap
  (dipakai stepper, timeline, dan teks "Tahap x dari 7"). Tiap tahap punya baris
  *pemicu* ("Pemicu lanjut: ..."). Hint tombol ditulis ulang sebagai pemicu + langkah
  berikutnya. Baris **"Giliran brand/kreator: ..."** muncul saat kartu tidak punya
  tombol, dan **"Buka Chat" selalu tersedia**. Label tahap 1 kreator: "Lamar / Terima
  Tawaran". Kolaborasi `CANCELLED` memakai indeks -1 (semua kotak abu).
- **B — deal tercatat.** Klik "Konfirmasi Deal" membuka modal **Tarif final + catatan
  kesepakatan**; angkanya ditulis ke `Collaboration.budget` (snapshot di `dealAmount`)
  dan kejadian dicatat sebagai pesan `SYSTEM` di chat (dirender sebagai pill di tengah,
  bukan gelembung dari pihak lawan). Escrow otomatis mengunci tarif negosiasi.
- **C — konfirmasi dua sisi.** Kolom baru: `dealConfirmedBy String[] @default([])`,
  `dealAmount Int?`, `agreedNote String?`. Aksi `agree` dihapus, diganti
  `confirm_deal`: klik pertama hanya mencatat (tetap `NEGOTIATION`), klik kedua dari
  pihak lain pada tarif yang sama menutup deal → `AGREED` + `agreedAt`. Tarif berbeda
  = **penawaran ulang**: `budget` diganti dan seluruh konfirmasi direset. Update dijaga
  `status = 'NEGOTIATION'` (`updateMany`) sehingga dua klik bersamaan tidak menutup
  deal dua kali.
- Bonus: `UNDER_REVIEW` (status yang sebelumnya tidak punya tombol sama sekali) kini
  memberi brand pintasan "Buka Review".

## Verifikasi lokal (sebelum deploy)

| Suite | Hasil |
|---|---|
| `tsc --noEmit`, `eslint`, `next build` | bersih |
| `scripts/smoke-test.mjs` (build produksi, localhost) | **94/96** — 2 sisanya endpoint AI DeepSeek (HTTP 503 dari provider, bukan kode; pada run sebelumnya PASS) |
| `node /tmp/collab-harness.mjs` (tabel benar helper alur) | **189/189** |
| Probe sinkronisasi dua sisi (`/tmp/deal-sync.mjs`) | **20/20** — satu klik tidak menaikkan tahap, penawaran ulang mereset konfirmasi, deal tertutup pada tarif sama, escrow = tarif negosiasi, jejak SYSTEM di chat |
| Sisa data uji di `kolabora_dev` | dibersihkan, bentuk DB kembali 4 user / 3 campaign / 2 kolaborasi / 2 lamaran / 4 pesan |

## Yang dibutuhkan saat deploy — dan yang sebenarnya dijalankan

Urutan aman yang dipakai (skema dulu, baru kode, supaya tidak ada host yang
menjalankan kode dengan kolom belum ada):

| # | Langkah | Hasil |
|---|---|---|
| 0 | Cadangan DB VPS sebelum menyentuh produksi | `/root/backups/kolabora-pre-deal-20261103T115353Z.sql.gz` (9,6 KB) |
| 1 | 3 kolom additif di **Supabase** (DB fallback Vercel) lewat `ALTER TABLE … IF NOT EXISTS` | `dealConfirmedBy text[] NOT NULL DEFAULT ARRAY[]::text[]`, `dealAmount int`, `agreedNote text` — 2 kolaborasi lama tidak berubah |
| 2 | 3 kolom yang sama di **PostgreSQL VPS** | sama; `konfirmasi {}`, `dealAmount` kosong untuk ketiga baris |
| 3 | `git push origin main` → Vercel build dengan skema siap | `68f6bd6..8a76785` |
| 4 | `bash scripts/deploy-vps.sh --domain kolabora.tech --port 3050 --no-caddy` | HEAD `8a76785`, `db push` jadi no-op, health `database: up` |
| 5 | `BASE_URL=https://kolabora.tech node scripts/smoke-test.mjs` | **96/96 LULUS**, termasuk 13 pemeriksaan deal dua sisi (satu klik tetap `NEGOTIATION`, penawaran ulang mereset konfirmasi, escrow = tarif negosiasi Rp 1.100.000, `agree` lawas ditolak 400) |
| 6 | Probe terautentikasi kedua host | VPS: `/api/collaborations` 200 + field deal ada; Vercel: 200 + field deal ada; halaman `history`/`analytics` 200, tidak ada lagi angka "/6" atau "dari 6" |
| 7 | Pembersihan sisa uji dengan naskah berpenjaga (`/tmp/prod-cleanup.sql`) | dry-run (ROLLBACK) dulu, 4 penjaga keras lolos → COMMIT. 3 kolaborasi + 2 campaign + 1 lamaran + 8 pesan + 1 review + 21 notifikasi uji dihapus |

Bentuk DB produksi **setelah** pembersihan: 9 user / 4 campaign / 3 kolaborasi /
4 lamaran / 13 pesan / 0 review / 15 notifikasi, 0 pelanggaran invarian, dan
**0 notifikasi yatim** (3 yatim sisa smoke 1 Nov ikut dibersihkan — diverifikasi
dulu bahwa isinya string chat literal dari `scripts/smoke-test.mjs` dan link-nya
menggantung).

Kolaborasi `cmvxnqfch000nbzgcnbd5tjw0` (Review Koleksi Batik Ayu Solo, Rp 500.000,
`NEGOTIATION`) **tidak disentuh** — tetap `dealConfirmedBy = {}` sehingga kedua sisi
memang harus menekan "Konfirmasi Deal" sekali. Enam pesan chat aslinya utuh.

## Temuan baru saat verifikasi produksi

Akun tester `ARTIZ@gmail.com` ternyata berperan **INFLUENCER** dan satu-satunya
lamarannya (campaign "Review Koleksi Batik Ayu Solo") berstatus **REJECTED** — ia
tidak punya kolaborasi sama sekali. Jadi keluhannya soal "alur tidak jelas"
dilihat dari sisi orang yang perjalanannya berhenti di tolakan, bukan dari dalam
tahap negosiasi. Kolaborasi `NEGOTIATION` yang mereka lihat adalah milik akun demo
`brand@kolabora.id` × `influencer@kolabora.id`.

Implikasi untuk sesi uji berikutnya (butuh keputusan, jangan diubah diam-diam):
- Tester perlu lamarannya dibuka lagi (accept) atau memakai akun demo agar bisa
  mencoba tombol "Konfirmasi Deal" dari kursinya sendiri.
- Perlu dipertimbangkan: memberi tahu pelamar bahwa lamarannya ditolak *dan* apa
  yang bisa mereka lakukan setelahnya (cari campaign lain), karena tahap "ditolak"
  sekarang diam.

Baris demo untuk klik-manual dibuat di **DB dev lokal** saja (`kolabora_dev`):
"Demo Alur Deal — Batik Nusantara (silakan dicoba)", `umkm@kolabora.id` ×
`foodie@kolabora.id`, tarif lamaran Rp 750.000, 2 chat penawaran, nol konfirmasi
sehingga kedua tombol aktif. Tidak ada baris demo yang dibuat di produksi.

## Tindakan atas data tester (3 Nov 2026, 19:20 WIB — atas persetujuan)

Lamaran `ARTIZ@gmail.com` (`cmvxnpxn4000jbzgcey37p0n5`) yang sebelumnya **REJECTED**
dibuka kembali lewat **endpoint asli** `PATCH /api/applications` sebagai pemilik
campaign (`brand@kolabora.id`), bukan lewat UPDATE manual, supaya efeknya identik
dengan brand yang menekan "Terima":

- aplikasi → `ACCEPTED`
- kolaborasi baru `cmw0npaoq001tbzw7vx6ky0yb` — `NEGOTIATION`, budget **Rp 1.000.000**
  (= `proposedRate` lamaran, bukan angka campaign), peserta brand + ARTIZ
- 1 pesan `SYSTEM` di chat ("Selamat! Lamaran Anda … diterima")
- 1 notifikasi `APPLICATION` "Lamaran diterima" untuk ARTIZ
- `dealConfirmedBy = {}` → kedua sisi memang harus menekan "Konfirmasi Deal"

Kolaborasi `cmvxnqfch000nbzgcnbd5tjw0` (Rp 500.000) tetap tidak berubah. Audit
invarian sesudahnya: 0 pelanggaran. Bentuk DB: 9 user / 4 campaign / 4 kolaborasi /
4 lamaran / 14 pesan / 16 notifikasi.


## Ronde 3 — jalur "lamaran ditolak" dan kunci duplikasi (3 Nov 2026, malam)

Permintaan tester yang tersisa dari ronde 2: *"tahap ditolak itu diam"*. Diuji
lewat perjalanan penuh (AI Smart Matching → pencairan) terhadap build produksi.

### Cara menguji

Naskah `/tmp/journey-sim.mjs` memakai **endpoint asli UI**, bukan jalur karangan:
undangan dibuat lewat `POST /api/collaborations` dengan `{participantId,title,brief,budget}`
dan tarif di-prefill dari `rateMin` hasil matching — sama persis dengan yang dikirim
halaman AI Smart Matching. Empat FAIL pada run pertama ternyata **artefak naskah**
(baca snapshot sebelum aksinya jalan; `escrowHeldAt`/`escrowReleasedAt` memang tidak
diekspos DTO), dibuktikan lewat query DB, lalu naskahnya dikoreksi. Angka akhir:
**120/120 lokal**, **104/104 → 110/110 smoke**, audit SQL **20 invarian / 0 pelanggaran**.

### Akar masalah "ditolak tanpa arah"

1. Kartu lamaran `REJECTED` di dashboard kreator tidak punya baris giliran, alasan,
   maupun tombol lanjutan — blok aksi sebelumnya hanya dirender untuk `ACCEPTED`.
2. Notifikasi "Lamaran belum cocok" menaut `/dashboard/influencer/campaigns`, halaman
   yang selalu membuka tab **Kolaborasi** — padahal lamaran ada di tab **Lamaran**, dan
   halaman itu sama sekali tidak membaca parameter URL.
3. Brand menolak dengan satu klik tanpa catatan, jadi kreator tidak tahu apa yang
   bisa diperbaiki (padahal data alasannya ada: tarif vs rentang budget, kategori profil).
4. Tidak ada penjaga status: lamaran yang sudah `ACCEPTED` masih bisa "ditolak" lewat
   API dan meninggalkan kolaborasi aktif tanpa lamaran yang mendukungnya.

### Perubahan

- **`src/lib/application.ts`** (baru) — helper murni `getApplicationGuidance(app, note)`:
  headline per status, baris "giliran siapa", hints yang **dibaca dari data** (tarif di
  atas/di bawah `budgetMin–budgetMax`, tidak mencantumkan tarif, kategori profil ≠
  kategori campaign, catatan brand), dan tombol langkah berikutnya. Tarif dan kategori
  adalah dua sinyal berbeda jadi keduanya boleh muncul bareng, maksimal tiga baris.
  Sengaja tanpa import supaya bisa diuji langsung seperti `collab.ts`.
- **`PATCH /api/applications`** — zod `{id, action, note}` (note maks 200 karakter →
  400, bukan 500); hanya `PENDING|REVIEWED` yang boleh diputus → 409 dengan pesan
  "Lamaran sudah diputus, muat ulang halaman"; `updateMany` berpenjaga status di cabang
  accept dan reject (menolak lomba balap dua tab); catatan disimpan di
  `Application.feedback`; notifikasi penolakan membawa `Catatan dari brand: "…"` dan
  menaut `…/campaigns?tab=lamaran`.
- **`schema.prisma`** — `Application.feedback String?` (aditif, `TEXT`).
- **`CampaignDetailClient`** — tombol "Tolak" membuka modal dengan catatan opsional;
  lamaran yang sudah diputus menampilkan catatan yang pernah dikirim.
- **Dashboard lamaran kreator** — membaca `?tab=` lewat `useSearchParams` di dalam
  pembungkus `Suspense` + `key` (bukan `setState` di effect, agar patuh
  `react-hooks/set-state-in-effect`), lalu tiap kartu menampilkan bimbingan + tombol.
- **Kunci duplikasi kolaborasi** (`POST /api/collaborations`) — temuan audit: jalur
  *undangan* tidak mengunci duplikasi padahal jalur *terima lamaran* menguncinya,
  sehingga satu brand bisa punya dua kartu terbuka identik untuk campaign yang sama dan
  tahapannya jalan sendiri-sendiri. Sekarang 409 + `existingId`: kalau menempel campaign
  → cukup satu kolaborasi non-`COMPLETED|CANCELLED` untuk pasangan brand+kreator itu;
  kalau tanpa campaign → yang dikunci hanya judul yang sama (case-insensitive), supaya
  dua proyek berbeda dari orang yang sama tetap boleh. Cek di jalur accept disamakan
  (hanya status terbuka yang menghalangi, 409 bukan 400, pesan menyebut judul kartunya).
  Kedua pemanggil UI (`smart-matching`, `highlights`) sudah menampilkan `json.error`,
  jadi pesan 409 terbaca utuh tanpa perubahan klien.

### Konsekuensi yang perlu diketahui

- Membuka kembali lamaran yang **sudah diputus** tidak bisa lagi lewat API (dulu dipakai
  untuk membuka lamaran `ARTIZ@gmail.com` → kini 409). Kalau perlu, jalannya lewat DB
  langsung dengan persetujuan.
- Status `REVIEWED` dan `WITHDRAWN` masih **tidak pernah ditulis** kode mana pun — ada di
  enum dan di tipos UI, tapi tidak ada aksi yang mengisinya. Disepakati dibiarkan
  (tidak dihapus) agar data lama tidak bermigrasi paksa; helper tetap menangani kedua
  status itu kalau nanti diisi.

### Verifikasi

Lokal terhadap build produksi: `tsc` ✓, `eslint src scripts` ✓, `build` ✓, perjalanan
penuh 120/120, smoke 110/110 (96 → 104 → 110), harness 189/189, deal-sync 20/20,
lifecycle-sim 32/32, audit SQL 20 invarian 0 pelanggaran.

## Deploy ronde 3 ke produksi (3 Nov 2026, 21:50–22:00 WIB)

Urutan yang dijalankan (kolom kanan = hasil nyata):

| # | Langkah | Hasil |
|---|---|---|
| 1 | Snapshot DB VPS sebelum sentuh | `/root/backups/kolabora-pre-ronde3-20261103T145021Z.sql.gz` (9,6 KB) |
| 2 | `ALTER TABLE "Application" ADD COLUMN IF NOT EXISTS "feedback" TEXT` | Supabase ✓ lalu VPS ✓ (kolom `text`, nullable) — **sebelum** kode baru jalan |
| 3 | `git push` → VPS `merge --ff-only` | HEAD `a8e50d1` (2 commit ronde 3: `e75b45c` + `a8e50d1`) |
| 4 | `deploy-vps.sh --domain kolabora.tech --port 3050 --no-caddy --skip-nginx` | percobaan pertama **GAGAL di langkah Caddy** (`deb.caddyserver.com` tidak resolve dari VPS; caddy memang tidak dipakai di host ini — nginx yang serve). Run kedua dengan `--no-caddy`: `prisma db push` → *"already in sync"* (karena langkah 2), build OK, pm2 reload, health `database: up` |
| 5 | Perjalanan penuh di `https://kolabora.tech` | **120/120**, nol regresi; jalur B2 (penolakan) lulus 16/16 di produksi |
| 6 | Smoke suit di produksi | **110/110** |
| 7 | Audit invarian (jejak uji) | 20 aturan, **0 pelanggaran** |
| 8 | Pembersihan jejak uji berpenjaga | dry-run ROLLBACK → daftar 10 kolaborasi + 5 campaign + 51 notif → 3 penjaga lolos → COMMIT. Baseline produksi kembali: **9 user / 4 campaign / 4 kolaborasi / 4 lamaran / 14 pesan / 0 review / 16 notif** |
| 9 | Verifikasi bundel klien live | chunk halaman kreator memuat `Giliran brand: meninjau dan memutuskan` (dibungkus `createProxy(...)`), `Prioritaskan campaign yang se-kategori`, `Perbaiki Profil`, `Cek Rekomendasi Tarif`, `tab=lamaran`; chunk halaman brand memuat `Tolak lamaran ini`, `Catatan untuk kreator (opsional)`, `Catatan yang Anda kirim`. Modal dirender lewat portal sehingga teksnya baru muncul di chunk route terkait, jadi pengecekan dilakukan per halaman |

Penjaga diuji terhadap **data tester yang sungguhan** (bukan data uji):

```
sebelum                                   : ACCEPTED
PATCH reject pada lamaran yang diputus    : 409 "Lamaran ini sudah diputus sebelumnya"
PATCH accept ulang                        : 409
sesudah                                   : ACCEPTED, feedback=null  → TERKUNCI
undangan kembar di campaign tester        : 409 "Kolaborasi untuk campaign ini dengan ARTIZZ
   masih berjalan (“Review Koleksi Batik Ayu Solo untuk Gaya Etnik Harian”)."
```

Kolaborasi tester `cmvxnqfch000nbzgcnbd5tjw0` (Rp 500.000, 6 pesan) dan
`cmw0npaoq001tbzw7vx6ky0yb` (Rp 1.000.000, 1 pesan) tetap `NEGOTIATION`,
`dealConfirmedBy = {}` — kedua sisi masih harus menekan "Konfirmasi Deal" sekali.
Vercel/Supabase (fallback) tidak berubah bentuknya: 7 user / 3 campaign / 2 kolaborasi /
2 lamaran / 11 notif, kini plus kolom `feedback`. Catatan: akun demo tidak bisa login di
fallback Vercel (hash kata sandinya beda dari seed sekarang) — tester tetap wajib memakai
`kolabora.tech`.

## Temuan baru: baris seed lama tidak memenuhi invarian ronde 2

`Konten TikTok Racikan Signature` (baris demo seed, status `IN_PRODUCTION`) melanggar 4
invarian di **dev dan produksi sekaligus** — dan hanya baris itu:

| Invarian | Kenapa bocor |
|---|---|
| `dealAmount = budget` setelah deal | seed menulis status `IN_PRODUCTION` langsung, tanpa `dealAmount`/`agreedAt`/`dealConfirmedBy` (field itu baru ada mulai ronde 2) |
| `escrowAmount = dealAmount` saat HELD | `escrowAmount` terisi, `dealAmount` kosong |
| monotonet `agreedAt >= createdAt` | `agreedAt` diisi 4 hari **sebelum** `createdAt` (tanggal sintetis seed) |
| minimal 2 pesan SYSTEM untuk deal dua sisi | tidak ada pesan `SYSTEM` sama sekali di chat-nya |
| (aturan 18) lamaran PENDING + kolaborasi terbuka pasangan sama | campaign yang sama punya lamaran `PENDING` dari kreator yang kolaborasinya sudah berjalan |

Dampak ke pengguna: kartu itu tetap jalan (aksi tahap 5 tersedia), tapi riwayat deal-nya
tidak lengkap — dan kalau brand menekan "Terima" pada lamaran PENDING itu hari ini, ia
dapat **409** dari kunci duplikasi (dulu: kolaborasi kembar). Jadi bukan bug alur, tapi
data demo yang belum diselaraskan. Belum kutambal — butuh keputusan: selaraskan
`prisma/seed.mjs` + UPDATE dua baris live, atau biarkan apa adanya.

Audit global baru (`/tmp/global-audit.sql`, 22 aturan) dipakai untuk menemukan ini; ia
bukan pengganti audit berlingkup `JALAN%`, tapi memeriksa seluruh baris sehingga temuan
tidak terbatas pada jejak ujiku sendiri.

## Balasan untuk tester (ronde 3)

1. **"Lamaran ditolak" sekarang bicara.** Di tab **Lamaran** (dashboard kreator), kartu
   yang ditolak menampilkan: siapa yang giliran, **alasan yang dibaca dari data**
   (tarif kamu di atas/di bawah rentang budget campaign, kamu tidak menulis tarif, atau
   kategori profilmu beda dari kategori campaign), plus catatan bila brand menuliskan
   sesuatu — dan tombol lanjutan: *Cari Campaign Lain*, *Campaign Cocok Untuk Anda*,
   *Perbaiki Profil*, *Cek Rekomendasi Tarif*. Notifikasi "Lamaran belum cocok" kini
   langsung membuka tab Lamaran, bukan halaman yang salah.
2. **Brand bisa menulis alasan.** Tombol "Tolak" di halaman campaign kini membuka modal
   dengan catatan opsional (maks 200 karakter) yang dikirim ke kreator. Tidak wajib diisi,
   jadi menolak cepat tetap bisa.
3. **Satu campaign + satu kreator = satu kartu.** Mengirim tawaran kedua untuk campaign
   yang sama sekarang ditolak dengan pesan yang menyebut kartu mana yang masih berjalan
   (dan kartu lama harus diselesaikan/dibatalkan dulu). Untuk undangan bebas tanpa
   campaign, yang dikunci hanya judul yang sama — dua proyek berbeda tetap boleh.
4. **Lamaran yang sudah diputus tidak bisa dibalik lewat layar.** Mencegah keadaan
   "kolaborasi aktif tapi lamarannya berstatus ditolak". Kalau memang perlu membuka
   kembali, itu jalur khusus (tulis langsung ke database), bukan tombol.

Status `REVIEWED` (sedang ditinjau) dan `WITHDRAWN` (ditarik) sampai sekarang **tidak
pernah ditulis** oleh alur mana pun — tidak ada tombol "Tandai sudah ditinjau" atau "Tarik
lamaran". Keduanya dibiarkan ada di sistem (data lama tidak diapa-apakan) dan kartu dengan
status itu tetap diberi bimbingan yang benar, tapi sampai ada permintaan nyata lebih baik
tidak dibuat.

# Ronde 4 (4 Nov 2026) — penanda "sudah ditinjau" oleh pelamar + seed yang diselaraskan

Dua hal yang ditahan ronde 3 akhirnya diminta: status `REVIEWED` dihidupkan lewat aksi
nyata, dan baris seed yang melanggar invarian dibenahi.

## Yang diminta dan yang dipilih

| Permintaan | Pilihan | Alasan |
|---|---|---|
| `REVIEWED` tidak pernah ditulis | tombol **"Tandai sudah ditinjau"** di kartu lamaran sisi **kreator** | keluhan ronde 3 adalah "tahap ini diam"; yang menunggu dan ingin tahu kondisi lamaran itu pelamar, bukan brand |
| `WITHDRAWN` juga tak pernah ditulis | **belum** | butuh aturan baru (boleh ditarik sampai kapan? apa dampak ke kartu yang sudah menerima?) — menunggu Permintaan 1 versi jelas |
| Baris seed melanggar invarian | **selaraskan `prisma/seed.mjs` + tambal baris live** | data demo yang tidak memenuhi aturan sendiri lebih membingungkan daripada kosong |

## Makna aksi (dan batasnya)

`PENDING → REVIEWED` adalah **penanda, bukan keputusan**. Kepemilikannya milik pelamar:
hanya `applicantId` sendiri yang boleh (brand maupun kreator lain → **403**). Setelah
ditandai, brand tetap bisa menerima/menolak — itu dijaga `DECIDABLE = ["PENDING","REVIEWED"]`
di `PATCH /api/applications`. Klik ulang → **409** "Lamaran sudah ditandai", dan penulisannya
`updateMany({ where: { id, status: "PENDING" } })` supaya dua tab tidak menghasilkan dua
notifikasi.

## Konsekuensi yang ternyata menyentuh seluruh dashboard

Menambah status baru = menelusuri setiap tempat yang memperlakukan `PENDING` sebagai
"belum diputus". Yang ditemukan dan dibenahi:

1. **Brand bisa kehilangan tombol keputusannya sendiri.** `CampaignDetailClient` hanya
   merender Terima/Tolak untuk `PENDING` — begitu pelamar menandai, kartu itu tidak punya
   aksi sama sekali. Kini pakai `isUndecided(status)`.
2. **Angka "menunggu" ikut turun tiap ada yang menandai.** Diperbaiki di tiga tempat:
   tab Lamaran kreator, kartu ringkasan dashboard kreator, dan `applications.pending` pada
   `GET /api/insights/umkm` (dipakai halaman *Pelamar menunggu* di Smart Calendar). Semua
   lewat `UNDECIDED`/`isUndecided` yang sama. Funnel Priority Matching sudah memisahkan
   `pending`/`reviewed` di `lib/facts.ts`, jadi teksnya kukoraksikan: "N menunggu (M ditandai
   ditinjau)".
3. **Empat halaman mengarang labelnya sendiri.** `src/app/dashboard/influencer/page.tsx`,
   `umkm/page.tsx`, `influencer/analytics/page.tsx`, dan `CampaignDetailClient.tsx` memakai
   ternary kelas+label yang beda-beda, dengan cabang fallback `"Ditinjau"` — sehingga
   `WITHDRAWN` terbaca "Ditinjau" dan `REVIEWED` bisa berarti dua hal tergantung halaman.
   Sekarang satu sumber: `applicationChip(status, "brand" | "kreator")` di
   `src/lib/application.ts`. Labelnya memang sengaja berbeda per sisi karena subjeknya
   berbeda: brand melihat **"Ditinjau pelamar"**, kreator melihat **"Sudah ditandai"**.
4. Tab Lamaran kreator tinggal menyimpan **ikon** (`APP_ICON`), label/warna dari helper.

## Verifikasi lokal (sebelum deploy)

| Suite | Hasil |
|---|---|
| `tsc --noEmit`, `eslint src scripts prisma`, `next build` | bersih |
| Uji aksi end-to-end (`/tmp/review-action-test.mjs`, build produksi + `kolabora_dev`) | **14/14** — 403 kreator lain, 403 brand, 200 `REVIEWED`, 409 klik ulang, brand melihat penandanya, tepat satu notifikasi dengan tautan campaign yang benar, `REVIEWED` tetap bisa ditolak, 409 setelah diputus, dua halaman tetap 200 |
| Perjalanan penuh `/tmp/journey-sim.mjs` | **132/132** (blok `[B3]` baru: 12 pemeriksaan aksi penanda + penjagaannya) |
| `scripts/smoke-test.mjs` | **120/120** (blok "PENANDA SUDAH DITINJAU": 10 pemeriksaan, termasuk note >240 karakter → 400) |
| `/tmp/collab-harness.mjs` / `/tmp/deal-sync.mjs` / `/tmp/lifecycle-sim.mjs` | 189/189 · 20/20 · 32/32 |
| Seed di DB kosong (`kolabora_seedtest`) | **27 aturan / 0 pelanggaran** |
| `kolabora_dev` sesudah tambalan + bersih dari jejak uji | **27 aturan / 0 pelanggaran**, bentuk 4 user / 4 campaign / 3 kolaborasi / 3 lamaran / 10 pesan / 4 notif |

Dua hal yang kutemukan dari alatku sendiri, bukan dari aplikasimu:
- aturan 2/6/7 audit "lolos" karena hasilnya `NULL`, bukan `0` — kini semua perbandingan
  ber-`coalesce()`, dan kutambah aturan 22 (lamaran belum diputus tidak berdampingan dengan
  kartu terbuka yang sama), 25 (tautan notifikasi campaign harus menunjuk campaign yang ada),
  27 (`ACCEPTED` harus didukung kolaborasi);
- penyaring notifikasi di smoke/journey hanya mencocokkan **judul**, sehingga gagal saat ada
  run lain meninggalkan notifikasi serupa untuk brand yang sama — disempitkan lewat `link`.

## Menambal baris live (bukan hanya seed)

`/tmp/fix-seed-row.sql` (dev/VPS/Supabase, satu file yang sama): `dealAmount = budget`,
`dealConfirmedBy` = kedua peserta, `createdAt` diturunkan satu hari sebelum jejak deal
pertama, dua pesan `SYSTEM` riwayat deal, dan lamaran kreator di campaign itu
`PENDING → ACCEPTED`. Semua langkah **berpenjaga dan idempoten** — basis waktu dihitung dari
jejak deal saja (`min(agreedAt, escrowHeldAt, startedAt, submittedAt)`), tanpa `createdAt`,
sehingga dijalankan ulang tidak menggeser tanggal lagi (versi pertama melakukan itu,
tertangkap oleh jalankan-dua-kali). Empat penjaga: baris target harus tunggal &
`IN_PRODUCTION`; pesertanya harus 1 brand + 1 kreator; baris tester (`cmvxnqfch…`,
`cmw0npaoq…`) difoto sebelum dan sesudah dan transaksi dibatalkan bila berubah; dan tidak
ada `Message` duplikat (`not exists … like '%sudah mengonfirmasi deal%'`).
Di dev: dijalankan → selaras, dijalankan lagi → seluruh `UPDATE 0 / INSERT 0`.

Kolaborasi itu kini: `createdAt 2026-10-26 15:18` ≤ `agreedAt 10-27` ≤ `escrowHeldAt 10-28`
≤ `startedAt 10-29`, `dealAmount = escrowAmount = Rp 1.500.000`, 2 konfirmasi, 2 pesan SYSTEM,
lamaran `ACCEPTED`.
