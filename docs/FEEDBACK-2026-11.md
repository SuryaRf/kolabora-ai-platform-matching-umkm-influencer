# Feedback tester 1–3 Nov 2026 — temuan, perbaikan, dan verifikasi

Status: **semua poin sudah live di `https://kolabora.tech`** (deploy 3 Nov 2026,
commit `3afbe28`..`e920c94`, smoke 85/85 terhadap URL produksi).

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

Status: **siap deploy, menunggu persetujuan** (butuh `prisma db push` di VPS karena ada
kolom baru; belum dijalankan di produksi).

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

## Yang dibutuhkan saat deploy

1. `npx prisma db push` di VPS (menambah 3 kolom, non-destruktif, default aman untuk
   baris lama: `dealConfirmedBy = {}`).
2. Tidak ada migrasi data: baris `NEGOTIATION` produksi yang ada (kolaborasi tester)
   justru akan dimulai dari nol konfirmasi → kedua pihak harus klik "Konfirmasi Deal".
   Baris lama yang sudah `AGREED` tidak disentuh dan di UI tidak mengklaim
   "dikonfirmasi kedua pihak" kalau datanya memang tidak ada.
3. Setelah deploy: smoke terhadap `https://kolabora.tech`, bersihkan baris
   `SMOKE%`/`Uji%`/`Sinkronisasi%`, lalu cek kedua dashboard.
