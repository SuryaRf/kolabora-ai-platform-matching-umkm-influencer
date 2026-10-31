# Deploy Kolabora ke VPS (kolabora.tech)

Panduan ini memasang aplikasi dari repository ke sebuah VPS Ubuntu/Debian,
menjalankan Next.js hasil build produksi di bawah **PM2**, dan memberi HTTPS
otomatis lewat **Caddy** untuk domain `kolabora.tech`.

Ringkasnya:

```
Browser ──HTTPS──► Caddy (80/443) ──► Next.js (127.0.0.1:3000, PM2) ──► PostgreSQL (5432)
                                                                  └──► api.deepseek.com (AI)
```

---

## 0. Yang dibutuhkan

| Perlengkapan | Keterangan |
|---|---|
| VPS Ubuntu 22.04/24.04 atau Debian 12 | minimal 1 vCPU / 1 GB RAM (2 GB lebih nyaman untuk `next build`) |
| Akses SSH | user biasa yang bisa `sudo` |
| Domain `kolabora.tech` | sudah dibeli (tidak perlu Vercel/Supabase lagi) |
| Kunci DeepSeek (opsional) | <https://platform.deepseek.com/api_keys>, format `sk-...` |

Rekomendasi spesifikasi: Contabo/Vultr/Railway/IDCloudHost 1 vCPU + 2 GB RAM.

---

## 1. Arahkan DNS ke IP VPS

Di panel DNS (mis. Cloudflare, Niagahoster, DomaiNesia) buat **dua record A**:

| Type | Name | Content | Catatan |
|------|------|---------|---------|
| A | `@` | `IP_VPS` (mis. `103.x.x.x`) | `TTL` otomatis / 300 |
| A | `www` | `IP_VPS` | sama |

Bila memakai Cloudflare, **matikan "Proxy status" (jadikan DNS only)** sementara
setup — Caddy perlu mengakses port 80 VPS untuk verifikasi Let's Encrypt.
Setelah HTTPS jalan, proxy Cloudflare boleh diaktifkan lagi (mode *Full*).

Cek propagasi DNS (dari laptop):

```bash
dig +short A kolabora.tech
dig +short A www.kolabora.tech
```

Keduanya harus menghasilkan IP VPS. Kalau masih kosong, Caddy akan gagal
mengambil sertifikat.

---

## 2. Masuk VPS dan jalankan satu naskah ini

```bash
ssh user@IP_VPS
sudo apt-get update && sudo apt-get install -y git curl
git clone https://github.com/<user>/<repo>.git /var/www/kolabora
cd /var/www/kolabora
sudo -u $(whoami) bash scripts/deploy-vps.sh --domain kolabora.tech
```

Naskah `scripts/deploy-vps.sh` mengerjakan semuanya secara **idempoten**
(boleh dijalankan berulang untuk update):

1. pasang Node.js 22 LTS, Caddy, PostgreSQL, build tools, `ufw`;
2. membuat peran `kolabora` + basis data `kolabora` dan menyimpan kata sandinya
   ke `/var/www/kolabora/.dbpass` (chmod 600, tidak pernah di-commit);
3. membuat `/var/www/kolabora/.env` dari `.env.production.example` bila belum ada,
   mengisi `DATABASE_URL`, `AUTH_URL`, `NEXT_PUBLIC_APP_URL`,
   `AUTH_TRUST_HOST`, dan menghasilkan `AUTH_SECRET` acak;
4. `npm ci` → `prisma generate` → `prisma db push` → `next build`;
5. menjalankan `pm2 startOrReload ecosystem.config.js` + `pm2 save` (auto-start
   saat server reboot);
6. menulis `/etc/caddy/Caddyfile` dari `deploy/Caddyfile` lalu `systemctl reload caddy`;
7. membuka firewall hanya untuk SSH, 80, 443;
8. memeriksa `http://127.0.0.1:3000/api/health`.

### Flag yang berguna

```bash
bash scripts/deploy-vps.sh --domain kolabora.tech --seed      # + isi data demo
bash scripts/deploy-vps.sh --domain kolabora.tech --test      # + jalankan uji end-to-end
bash scripts/deploy-vps.sh --skip-build                       # hanya restart (cepat)
bash scripts/deploy-vps.sh --no-db                            # pakai Supabase/DB luar
bash scripts/deploy-vps.sh --reset-db-url                     # paksa pakai PostgreSQL lokal
bash scripts/deploy-vps.sh --no-caddy                         # sudah ada nginx sendiri
```

Bila `.env` lama masih menunjuk ke database lain (mis. Supabase) dan kamu
ingin pindah ke PostgreSQL lokal di VPS, tambahkan `--reset-db-url`.

---

## 3. Mengaktifkan AI DeepSeek

AI aktif bila `DEEPSEEK_API_KEY` berisi kunci berformat `sk-...`. Isi lewat
terminal (nilainya tidak akan tampil di layar maupun riwayat shell — jangan
menempelkan kunci ke chat/log):

```bash
cd /var/www/kolabora
npm run set-key                # ditempel lewat input tersembunyi
npm run set-key -- --check     # pastikan terisi, tanpa mengubah apa pun
pm2 reload kolabora --update-env
```

Pilihan lain: `nano .env` lalu isi `DEEPSEEK_API_KEY="sk-..."`, atau
`bash scripts/set-key.sh --env /var/www/kolabora/.env` dari direktori mana pun.
Naskah membuat salinan sementara `.env` ber-izin `0600` dan hanya mengganti baris
variabel target.

Verifikasi (harus `test.ok: true`, latency ±1–3 detik):

```bash
curl -s http://127.0.0.1:3000/api/health | head -c 400
# lalu dari browser: https://kolabora.tech/api/ai/status?test=1 (harus login)
```

Fitur AI aktif di: **AI Smart Matching**, **AI Content Assistant**,
**AI Skill Assistant**, penilai brief pada **Buat Campaign**, **Optimizer Profil**
(`profile-optimizer`), dan **Kartu Tarif** (`rate-recommendation`).
Tanpa kunci, semua fitur itu otomatis memakai perhitungan aturan
(tanpa biaya, tetap jalan).

Biaya: `deepseek-chat` ±US$0,27 per juta token masukan dan US$1,11 per juta
token keluar. Dengan batas `AI_RATE_LIMIT_PER_MIN=8` / `PER_DAY=200` pemakaian
satu akun terkendali; angka itu bisa diubah di `.env`.

---

## 4. Update & rollback

```bash
cd /var/www/kolabora
git log -1 --oneline
bash scripts/deploy-vps.sh --domain kolabora.tech --test     # pull + build + reload
```

Naskah tidak menarik kode otomatis bila ada perubahan lokal (dijaga lewat
`git status --porcelain`) supaya hasil kerjamu tidak hilang.

Rollback cepat ke commit sebelumnya:

```bash
cd /var/www/kolabora
git checkout <commit-sebelumnya>
bash scripts/deploy-vps.sh --domain kolabora.tech --skip-build   # atau full tanpa --skip-build
pm2 restart kolabora
```

> Perubahan skema Prisma (`db push`) tidak otomatis dibalik. Untuk perubahan
> skema besar, cadangkan DB dulu (bagian 5) lalu jalankan `prisma migrate`.

---

## 5. Cadangan basis data

```bash
bash scripts/backup-db.sh                       # → /var/backups/kolabora/kolabora-<tanggal>.dump
bash scripts/backup-db.sh --plain               # → .sql teks (bisa ditempel ke Supabase)
bash scripts/backup-db.sh --out ~/backup --keep 30 --with-env
```

Jadwalkan harian dengan cron (`crontab -e` di VPS):

```cron
15 3 * * * cd /var/www/kolabora && bash scripts/backup-db.sh --with-env >> /var/log/kolabora/backup.log 2>&1
```

Salin keluar VPS (jangan taruh cadangan hanya di mesin yang sama):

```bash
rsync -av VPS:/var/backups/kolabora/ ./backup-kolabora/
```

Pulihkan:

```bash
pg_restore -d "$(sed -n 's/^DATABASE_URL="\(.*\)"/\1/p' /var/www/kolabora/.env)" \
  --no-owner --clean --if-exists /var/backups/kolabora/kolabora-YYYYMMDD-HHMMSS.dump
```

---

## 6. Menjalankan & memonitor

```bash
pm2 status                      # semua proses + status
pm2 logs kolabora --lines 50    # log aplikasi
pm2 monit                       # CPU/RAM real-time
sudo journalctl -u caddy -f     # log Caddy (termasuk saat sertifikat terbit)
sudo systemctl status caddy nginx postgresql
tail -f /var/log/nginx/access.log
curl -s http://127.0.0.1:3000/api/health
```

Bila HTTPS belum jalan: `sudo caddy validate --config /etc/caddy/Caddyfile`,
lalu cek DNS benar (langkah 1) dan port 80 terbuka dari internet:

```bash
nc -vz kolabora.tech 80
```

---

## 7. Kalau memilih tetap di Vercel + Supabase

Alternatif ini tidak butuh VPS dan tetap didukung:

1. **Supabase** → Project Settings → Database → *Connection pooling* →
   salin string **URI (port 6543)** untuk Vercel. Aktifkan *Non-SSL connection*
   supaya libpq/Prisma tidak menuntut sertifikat klien.
   Bila ingin mengisi skema tanpa `prisma db push` (jaringan sering bermasalah):
   buka **SQL Editor** dan jalankan
   `supabase/migrations/0001_init.sql` lalu `supabase/migrations/0002_seed_demo.sql`
   (yang kedua idempoten — aman dijalankan dua kali).
2. **Vercel** → Project → Settings → Environment Variables:
   `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL=https://kolabora.tech`,
   `NEXT_PUBLIC_APP_URL=https://kolabora.tech`, `AUTH_TRUST_HOST=true`,
   `DEEPSEEK_API_KEY`. Tambahkan domain `kolabora.tech` + `www.kolabora.tech`
   di Settings → Domains, lalu arahkan DNS (CNAME/A) sesuai petunjuk Vercel.
3. `git push` ke branch produksi → Vercel build otomatis.

Catatan: tanpa token `BLOB_READ_WRITE_TOKEN`, unggah gambar memakai input URL
(sudah didukung halaman Profil & Portfolio).

---

## 8. Daftar periksa setelah deploy

- [ ] `https://kolabora.tech` hijau (sertifikat Let's Encrypt dari Caddy)
- [ ] `/api/health` → `database: "up"`
- [ ] `/api/ai/status?test=1` → `test.ok: true` (bila kunci diisi)
- [ ] Login akun demo: `umkm@kolabora.id` / `password123` (setelah `--seed`)
- [ ] Buat campaign → skor brief muncul → publikasi → influencer melamar
- [ ] Chat dua arah, escrow (tahan → lepas), review, status `COMPLETED`
- [ ] Cadangan harian terisi: `ls -la /var/backups/kolabora`
