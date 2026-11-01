# Deploy Kolabora ke VPS (kolabora.tech)

Dokumen ini adalah jalur yang **sudah terbukti jalan** pada 1 November 2026 untuk
`https://kolabora.tech`: Ubuntu 24.04, SSH sebagai `root`, **nginx** (bukan Caddy)
di port 80/443, PostgreSQL 16 lokal, Next.js build produksi di bawah **PM2**
pada port internal `3050`, sertifikat Let's Encrypt lewat `certbot --nginx`.

```
Browser ─HTTPS─► nginx :443 ─proxy─► Next.js 127.0.0.1:3050 (PM2) ──► PostgreSQL lokal :5432
              (certbot/TLS)                                            └─► api.deepseek.com (AI)
                                                                       └─► Vercel Blob (opsional, unggah gambar)
```

Kalau server kamu masih kosong (belum ada web server apa pun), biarkan naskah
memasang **Caddy** — tidak perlu flag apa pun. Bagian di bawah ini berfokus pada
kasus yang lebih umum: **server sudah dipakai situs lain dengan nginx**.

---

## 0. Yang dibutuhkan

| Perlengkapan | Keterangan |
|---|---|
| VPS Ubuntu 22.04/24.04 atau Debian 12 | 1 vCPU / 2 GB RAM nyaman untuk `next build` (1 GB masih bisa, lebih lambat) |
| Akses SSH | `root` **atau** user biasa yang bisa `sudo` — keduanya didukung |
| Domain mengarah ke IP VPS | record A `@` dan `www` → IP VPS (`dig +short kolabora.tech`) |
| nginx sudah terpasang | hanya untuk jalur `--no-caddy`; port 80/443 tidak boleh dipakai web server lain |
| Kunci DeepSeek (opsional) | <https://platform.deepseek.com/api_keys>, format `sk-...` |
| `certbot` + plugin nginx | `apt-get install -y certbot python3-certbot-nginx` |

Sebelum mulai, cek port yang sudah dipakai agar port Node tidak bentrok:

```bash
ss -tlnp | grep -E ":3000|:3001|:3100|:3101|:3050"
ls /etc/nginx/sites-enabled/
```

Di `kolabora.tech` ternyata 3000/3001/3100/3101 sudah dipakai aplikasi lain,
sehingga Kolabora dipasang di **3050**.

---

## 1. Pasang sekali jalan

```bash
git clone https://github.com/SuryaRf/kolabora-ai-platform-matching-umkm-influencer.git /var/www/kolabora
cd /var/www/kolabora
bash scripts/deploy-vps.sh --domain kolabora.tech --email admin@kolabora.tech --no-caddy --port 3050
```

Naskahnya idempoten (boleh dijalankan ulang untuk update). Urutan kerjanya:

1. pasang paket dasar, Node.js 22 LTS bila belum ada, `ufw`;
2. **nginx terdeteksi** → tidak menyentuh Caddy, dan di akhir menjalankan
   `scripts/setup-nginx.sh` (lihat langkah 2);
3. memastikan PostgreSQL ada, lalu memastikan peran `kolabora` + basis data
   `kolabora` **benar-benar ada** (kata sandi disimpan di `.dbpass`, chmod 600).
   Peran aplikasi diberi `CREATEDB` karena `prisma db push` membuat *shadow
   database*; tanpa hak itu perintahnya menggantung tanpa pesan galat;
4. sinkron kode (`git pull` dilewati bila ada perubahan pada berkas ter-commit),
   membuat `.env` dari `.env.production.example`, mengisi `DATABASE_URL`,
   `AUTH_URL`, `NEXT_PUBLIC_APP_URL`, `AUTH_TRUST_HOST`, `AUTH_SECRET` acak;
5. `npm ci` → `prisma generate` → `prisma db push` (maks. 10 menit) → `next build`;
6. `pm2 startOrReload ecosystem.config.js` → `pm2 startup systemd` → `pm2 save`
   (tanpa `pm2 startup`, proses tidak hidup lagi setelah server reboot);
7. membuka `ufw` untuk SSH/80/443 saja;
8. memeriksa `http://127.0.0.1:3050/api/health` lalu `https://kolabora.tech/api/health`.

### Flag yang berguna

| Flag | Fungsi |
|---|---|
| `--domain` / `--email` | domain produksi & email Let's Encrypt |
| `--port <p>` | port Node internal (**wajib** bila 3000 sudah dipakai) |
| `--no-caddy` | server sudah punya web server sendiri |
| `--skip-nginx` | jangan sentuh nginx walau terpasang (pasang proxy manual) |
| `--skip-build` | hanya pull + pm2 reload + proxy (cek konfigurasi, ±1 menit) |
| `--no-db` | pakai database luar (mis. Supabase) — isi `DATABASE_URL` sendiri di `.env` |
| `--reset-db-url` | paksa `DATABASE_URL` kembali ke PostgreSQL lokal |
| `--seed` | isi data demo (akun `*@kolabora.id` / `password123`) |
| `--test` | jalankan `scripts/smoke-test.mjs` setelah deploy |

> **`--seed` jangan dipakai di host publik.** Akun demo memakai sandi
> `password123` dan langsung terlihat di internet. Pakai hanya untuk server
> percobaan, atau ganti sandinya begitu data demo masuk.

---

## 2. nginx + HTTPS (bagian `--no-caddy`)

`scripts/setup-nginx.sh` menulis `/etc/nginx/sites-available/kolabora`
dari template `deploy/nginx/kolabora.conf`, membuat symlink ke
`sites-enabled`, `nginx -t`, reload, lalu `certbot --nginx`.

```bash
bash scripts/setup-nginx.sh --domain kolabora.tech --port 3050 --email admin@kolabora.tech
```

Perilaku yang sengaja dibangun:

- **tidak menimpa situs lain** — hanya menambah berkas `kolabora`;
- bila file sudah berisi `listen 443` (certbot sudah bekerja), ia **tidak ditulis
  ulang** saat deploy berikutnya, jadi sertifikat tidak hilang;
- konfigurasi lama dicadangkan ke `kolabora.bak-<tanggal>` dan **dipulihkan
  otomatis** bila `nginx -t` gagal;
- `map $http_upgrade $kolabora_connection_upgrade` memakai nama khas agar tidak
  bentrok dengan situs lain di mesin yang sama;
- `client_max_body_size 12m` (aplikasi membatasi unggahan 8 MB) dan
  `proxy_buffering off` karena pemanggilan AI bisa 30–60 detik.

Isi `.env` yang relevan: `AUTH_TRUST_HOST=true` dan `AUTH_URL=https://kolabora.tech`
ditulis naskah, sehingga cookie sesi NextAuth ditandai aman dan URL balik-ke-laman
benar di belakang proxy.

---

## 3. Kunci rahasia (AI & penyimpanan gambar)

Masuk ke server, lalu isi **tanpa menempel nilai apa pun ke chat/riwayat shell**:

```bash
cd /var/www/kolabora
bash scripts/set-key.sh                          # DEEPSEEK_API_KEY (input tersembunyi)
bash scripts/set-key.sh --name BLOB_READ_WRITE_TOKEN   # Vercel Blob (opsional)
bash scripts/set-key.sh --name DEEPSEEK_API_KEY --check # verifikasi tanpa mengubah
pm2 reload kolabora --update-env
```

`scripts/set-key.sh` membaca dari stdin bila tidak ada terminal, jadi kunci bisa
disalurkan lewat aluran SSH:

```bash
# dari laptop (nilai tidak pernah muncul di ps/log)
ssh root@IP_VPS 'cd /var/www/kolabora && bash scripts/set-key.sh --name DEEPSEEK_API_KEY' < kunci.txt
```

Catatan unggah gambar: `/api/upload` memakai **Vercel Blob**. Tanpa
`BLOB_READ_WRITE_TOKEN` endpoint itu menjawab `503` dengan pesan
"Penyimpanan berkas belum diaktifkan…" dan halaman Profil/Portfolio tetap bisa
memakai tempel URL. Token dari store `kolabora-media` (regional `sin1`) dipakai
oleh kedua host (Vercel & VPS), dan tetap berfungsi dari VPS.

Verifikasi AI (harus `configured: true`, dan `test.ok: true` saat login):

```bash
curl -s https://kolabora.tech/api/health | head -c 300
# lalu buka https://kolabora.tech/api/ai/status?test=1 di browser (harus login)
```

Fitur AI: Smart Matching, Content Assistant, Skill Assistant, penilai brief pada
Buat Campaign, Optimizer Profil, dan Kartu Tarif. Tanpa kunci, semuanya otomatis
turun ke perhitungan aturan (tanpa biaya).

---

## 4. Memindahkan data lama (mis. dari Supabase)

Bila produksi sebelumnya memakai Supabase, datanya bisa dipindah apa adanya.
Contoh nyata dari 1 Nov 2026 (Supabase PostgreSQL 17 → PostgreSQL 16 di VPS):

```bash
# 1) dari laptop: dump HANYA data, tanpa DDL (skema sudah dibuat prisma db push)
pg_dump "postgresql://postgres.<ref>:<sandi>@aws-0-<region>.pooler.supabase.com:5432/postgres?sslmode=require" \
  --schema=public --data-only --inserts --column-inserts --disable-triggers \
  --no-owner --no-privileges -f kolabora-data.sql
scp kolabora-data.sql root@IP_VPS:/root/

# 2) di VPS: pulihkan sebagai superuser (butuh superuser untuk DISABLE TRIGGER)
sed -i '/transaction_timeout/d' /root/kolabora-data.sql     # baris khas pg_dump 17, PG16 tidak mengenalnya
su postgres -c "psql -v ON_ERROR_STOP=1 -q -d kolabora -f /root/kolabora-data.sql"
rm -f /root/kolabora-data.sql
```

Yang perlu diketahui:

- **pakai client `pg_dump` yang sama atau lebih baru** dari server sumber
  (`pg_dump 17` untuk Supabase). Urutan tabel di dump tidak mengikuti dependensi
  FK, karena itu `--disable-triggers` + restore sebagai superuser;
- `--data-only` saja, tanpa `--schema-only`: skema target berasal dari
  `prisma db push`, jadi tidak ada RLS/role `authenticated`/`anon` yang ikut;
- setelah pindah, **ganti sandi akun demo** (`*@kolabora.id`) bila datanya
  berisi akun `password123`;
- kolom waktu diisi Prisma dalam **UTC** sementara `show timezone` server bisa
  `Asia/Jakarta`. Jangan pakai `now() - interval '2 hours'` untuk menyaring baris
  hari ini — bandingkan dengan tanggal eksplisit.

---

## 5. Uji setelah deploy

```bash
# dari laptop, terhadap URL publik
BASE_URL=https://kolabora.tech npm run smoke        # 81 pemeriksaan alur, butuh akun demo
```

`scripts/smoke-test.mjs` membuat kampanye berjudul `SMOKE …` dan beberapa baris
uji. Bersihkan setelahnya supaya halaman demo tidak penuh sampah uji. Tulis berkas
SQL kecil (perhatikan batas tanggal eksplisit — lihat catatan zona waktu bagian 4),
jalankan sebagai superuser, lalu hapus:

```bash
cat > /tmp/bersih.sql <<'SQL'
BEGIN;
CREATE TEMP TABLE camp ON COMMIT DROP AS
  SELECT id FROM "Campaign"
  WHERE "createdAt" >= '2026-11-01 00:00:00' AND (title LIKE 'SMOKE%' OR title LIKE 'Uji %');
CREATE TEMP TABLE collab ON COMMIT DROP AS
  SELECT c.id FROM "Collaboration" c
  WHERE c."campaignId" IN (SELECT id FROM camp)
     OR (c."createdAt" >= '2026-11-01 00:00:00' AND (c.title LIKE 'SMOKE%' OR c.title LIKE 'Uji %'));
DELETE FROM "Message"                    WHERE "collaborationId" IN (SELECT id FROM collab);
DELETE FROM "ContentReview"              WHERE "collaborationId" IN (SELECT id FROM collab);
DELETE FROM "_CollaborationParticipants" WHERE "B" IN (SELECT id FROM collab);
DELETE FROM "Collaboration"              WHERE id IN (SELECT id FROM collab);
DELETE FROM "Application"                WHERE "campaignId" IN (SELECT id FROM camp);
DELETE FROM "PortfolioItem"              WHERE "createdAt" >= '2026-11-01 00:00:00' AND title LIKE 'Uji %';
DELETE FROM "Notification"               WHERE "createdAt" >= '2026-11-01 00:00:00'
                                          AND (title ILIKE '%SMOKE%' OR message ILIKE '%SMOKE%' OR message ILIKE '%Uji %');
DELETE FROM "Campaign"                   WHERE id IN (SELECT id FROM camp);
COMMIT;
SQL
su postgres -c "psql -d kolabora -f /tmp/bersih.sql"
rm -f /tmp/bersih.sql
```

Urutan penghapusan penting: tabel anak dulu (`Message`, `ContentReview`,
`_CollaborationParticipants`), baru `Collaboration`, lalu `Campaign`.

Yang wajib hijau:

- [ ] `https://kolabora.tech/api/health` → `ok: true`, `database: "up"`
- [ ] sertifikat: `sudo certbot certificates` (kedaluwarsa > 30 hari → `certbot renew`)
- [ ] `pm2 status` → `kolaborasi online`, dan `systemctl is-enabled pm2-root.service` → `enabled`
- [ ] login akun yang ada → dashboard, chat dua arah, escrow (tahan → lepas), review, `COMPLETED`
- [ ] unggah gambar (bila `BLOB_READ_WRITE_TOKEN` diisi)
- [ ] `ss -tlnp | grep 3050` → hanya `127.0.0.1`

---

## 6. Update & rollback

```bash
cd /var/www/kolabora
git log -1 --oneline
bash scripts/deploy-vps.sh --domain kolabora.tech --port 3050 --no-caddy --test
```

- Naskah menarik kode terbaru **hanya bila tidak ada perubahan pada berkas
  ter-commit**; kalau ada, ia berhenti menarik dan memberi tahu (`git stash`).
- `--skip-build` untuk mengubah konfigurasi tanpa membangun ulang.
- Satu langkah yang perlu diingat: blok PostgreSQL dijalankan **sebelum** `git
  pull`, jadi perbaikan naskah sendiri baru berlaku pada dijalankan berikutnya.

Rollback cepat:

```bash
git checkout <commit-sebelumnya>
bash scripts/deploy-vps.sh --domain kolabora.tech --port 3050 --no-caddy
pm2 restart kolabora
git checkout main          # kembali ke jalur utama setelah dipastikan aman
```

Perubahan skema Prisma (`db push`) **tidak otomatis dibalik**. Untuk perubahan
besar: cadangkan dulu (bagian 7), kerjakan di salinan database terpisah, atau pakai
`prisma migrate deploy`.

---

## 7. Cadangan basis data

```bash
bash scripts/backup-db.sh                       # → /var/backups/kolabora/kolabora-<tanggal>.dump
bash scripts/backup-db.sh --plain               # → .sql teks
bash scripts/backup-db.sh --out ~/backup --keep 30 --with-env
```

Jadwalkan harian (`crontab -e` di VPS) dan **salin keluar VPS**:

```cron
15 3 * * * cd /var/www/kolabora && bash scripts/backup-db.sh --with-env >> /var/log/kolabora/backup.log 2>&1
```

```bash
rsync -av root@IP_VPS:/var/backups/kolabora/ ./backup-kolabora/
pg_restore -d "$(sed -n 's/^DATABASE_URL="\(.*\)"/\1/p' /var/www/kolabora/.env)" \
  --no-owner --clean --if-exists /var/backups/kolabora/kolabora-YYYYMMDD-HHMMSS.dump
```

---

## 8. Menjalankan & memonitor

```bash
pm2 status                      # semua proses di mesin
pm2 logs kolabora --lines 50
pm2 monit
tail -f /var/log/kolabora/error.log
sudo journalctl -u nginx -f
sudo certbot certificates
curl -s https://kolabora.tech/api/health
```

Log nginx khas Kolabora: `/var/log/nginx/kolabora.access.log` &
`.error.log` (didefinisikan di template).

Bila HTTPS bermasalah:

```bash
sudo nginx -t
nc -vz kolabora.tech 80                 # port 80 harus terbuka dari internet
sudo ufw status numbered                # hanya 22/80/443 yang boleh IN
```

---

## 9. Alternatif: tetap di Vercel + Supabase (tanpa VPS)

Masih didukung dan berguna sebagai cadangan. Yang mengubah keadaan pada
proyek ini:

1. **`DATABASE_URL` harus memakai pooler dengan *connection pooling* aktif**
   (`aws-0-<region>.pooler.supabase.com:6543?...&pgbouncer=true`). Host langsung
   `db.<ref>.supabase.co:5432` **tidak bisa dijangkau** dari runtime Vercel dan
   `/api/health` akan melaporkan `database: "down"`.
2. Isi variabel lewat `vercel env add` (atau `scripts/vercel-sync-env.sh`),
   **bukan** lewat `.env` yang ikut ter-upload — `.vercelignore` sudah menjaga
   `.env*` tidak terkirim.
3. Unggahan gambar: `vercel blob create-store kolabora-media --access public
   --region sin1 --yes --environment production --environment preview`
   (CLI menuliskan `BLOB_READ_WRITE_TOKEN` sendiri; bila nama variabelnya sudah
   ada, store lama harus dihapus/diganti lebih dulu).
4. `git push` ke branch produksi → build otomatis. Deploy manual dari CLI
   (`vercel --prod`) membuat proyek kedua yang **tidak** terhubung GitHub —
   hindari kalau repo-nya sudah terhubung, agar tidak ada dua URL produksi.

Proyek yang terhubung GitHub untuk repo ini:
`kolabora-ai-platform-matching-umkm-influencer`
→ <https://kolabora-ai-platform-matching-umkm.vercel.app>.

---

## 10. Setelah deploy — yang masih perlu diperhatikan

- **Pembatas kuota AI bersifat memori proses.** Di VPS/PM2 (1 proses, long-lived)
  ia bekerja; di Vercel (serverless, banyak-instance) bisa lolos. Uji
  `pembatas kuota AI bekerja` gagal di Vercel justru karena alasan itu.
- **Rotasi kunci**: `DEEPSEEK_API_KEY` pernah ikut ter-upload ke Vercel lewat
  `.env` sebelum `.vercelignore` ada. Ganti kunci di platform.deepseek.com dan
  perbarui `.env` VPS + `vercel env add`.
- **Akun demo memakai `password123`** (hasil seed). Ganti sandinya di basis data
  produksi, atau hapus akun yang tidak dipakai.
- Port Node (`3050`) hanya boleh terjangkau dari `127.0.0.1`; `ufw` sudah
  memblokir dari luar, tetapi jangan menambahkan `ufw allow 3050`.
- nginx di mesin ini melayani juga situs lain (`kecatat.com`, `untungo.com`) —
  setiap perubahan proxy Kolabora lewat `setup-nginx.sh`, jangan edit manual
  lalu lupa memperbarui template di repo.
