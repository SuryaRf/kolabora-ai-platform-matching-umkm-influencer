#!/usr/bin/env bash
# ============================================================================
# Kolabora — pemasang & pemantau deploy untuk VPS Ubuntu/Debian
#
# Usage di server (login sebagai user yang bisa sudo):
#   git clone <repo-kamu> /var/www/kolabora && cd /var/www/kolabora
#   bash scripts/deploy-vps.sh --domain kolabora.tech
#
# Flag:
#   --domain <domain>     domain produksi (default: kolabora.tech)
#   --email <email>       email TLS Let's Encrypt (default: admin@<domain>)
#   --app-dir <path>      folder aplikasi (default: /var/www/kolabora)
#   --repo <git-url>      alamat git bila folder masih kosong
#   --branch <nama>       branch yang dipakai (default: main)
#   --port <port>         port Node internal (default: 3000)
#   --no-db               jangan pasang PostgreSQL lokal (pakai Supabase/luar)
#   --reset-db-url        ganti DATABASE_URL di .env dengan basis data lokal
#   --no-caddy            jangan pasang Caddy (sudah ada nginx sendiri)
#   --skip-build          lewati npm ci + build (hanya restart)
#   --seed                isi data demo bila database masih kosong
#   --test                jalankan scripts/smoke-test.mjs setelah deploy
#
# Sifat naskah: idempoten (boleh dijalankan berulang untuk update), tidak
# pernah menghapus database, dan tidak menimpa .env yang sudah berisi kunci.
# ============================================================================
set -Eeuo pipefail

DOMAIN="${DOMAIN:-kolabora.tech}"
TLS_EMAIL="${TLS_EMAIL:-}"
APP_DIR="${APP_DIR:-/var/www/kolabora}"
REPO="${REPO:-}"
BRANCH="${BRANCH:-main}"
PORT="${PORT:-3000}"
DB_NAME="kolabora"
DB_USER="kolabora"
DB_HOST="127.0.0.1"
WITH_DB=1
WITH_CADDY=1
SKIP_BUILD=0
DO_SEED=0
RUN_TESTS=0
FORCE_DB_URL=0

log()  { printf '\033[1;36m==>\033[0m %s\n' "$*"; }
ok()   { printf '\033[1;32m  ✓\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m  !\033[0m %s\n' "$*"; }
die()  { printf '\033[1;31mGAGAL:\033[0m %s\n' "$*" >&2; exit 1; }
trap 'printf "\033[1;31mGAGAL pada baris %s\033[0m\n" "$LINENO" >&2' ERR

# ---------------------------------------------------------------- argumen
while [[ $# -gt 0 ]]; do
  case "$1" in
    --domain)     DOMAIN="$2"; shift 2 ;;
    --email)      TLS_EMAIL="$2"; shift 2 ;;
    --app-dir)    APP_DIR="$2"; shift 2 ;;
    --repo)       REPO="$2"; shift 2 ;;
    --branch)     BRANCH="$2"; shift 2 ;;
    --port)       PORT="$2"; shift 2 ;;
    --no-db)      WITH_DB=0; shift ;;
    --reset-db-url) FORCE_DB_URL=1; shift ;;
    --no-caddy)   WITH_CADDY=0; shift ;;
    --skip-build) SKIP_BUILD=1; shift ;;
    --seed)       DO_SEED=1; shift ;;
    --test)       RUN_TESTS=1; shift ;;
    -h|--help)    sed -n '2,25p' "$0"; exit 0 ;;
    *) die "Argumen tidak dikenal: $1" ;;
  esac
done
if [[ -z "$TLS_EMAIL" ]]; then TLS_EMAIL="admin@${DOMAIN}"; fi

# ---------------------------------------------------------------- sudo
if [[ $EUID -eq 0 ]]; then SUDO=""; elif command -v sudo >/dev/null 2>&1; then SUDO="sudo"; else die "Perlu root atau sudo."; fi
$SUDO true

log "Sistem: $(. /etc/os-release && echo "$PRETTY_NAME") | domain: $DOMAIN | direktori: $APP_DIR"

command -v apt-get >/dev/null 2>&1 || die "Naskah ini untuk Ubuntu/Debian (apt-get tidak ditemukan)."

# ---------------------------------------------------------------- paket dasar
log "Memasang paket dasar (git, curl, build tools, openssl, ufw)"
export DEBIAN_FRONTEND=noninteractive
$SUDO apt-get update -qq
$SUDO apt-get install -y -qq curl git ca-certificates gnupg openssl build-essential ufw >/dev/null

# ---------------------------------------------------------------- Node.js
need_node=1
if command -v node >/dev/null 2>&1; then
  major="$(node -p 'process.versions.node.split(".")[0]')"
  if [[ "$major" -ge 20 ]]; then need_node=0; else warn "Node $major terlalu lama, akan dipasang Node 22."; fi
fi
if [[ $need_node -eq 1 ]]; then
  log "Memasang Node.js 22 LTS (NodeSource)"
  curl -fsSL https://deb.nodesource.com/setup_22.x | $SUDO -E bash - >/dev/null
  $SUDO apt-get install -y -qq nodejs >/dev/null
fi
ok "Node $(node -v) / npm $(npm -v)"

# ---------------------------------------------------------------- Caddy
if [[ $WITH_CADDY -eq 1 ]]; then
  if ! command -v caddy >/dev/null 2>&1; then
    log "Memasang Caddy (reverse proxy + HTTPS otomatis)"
    curl -fsSL https://deb.caddyserver.com/stable.gpg | $SUDO gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
    echo "deb [signed-by=/usr/share/keyrings/caddy-stable-archive-keyring.gpg] https://deb.caddyserver.com/stable23 $(. /etc/os-release && echo "$VERSION_CODENAME") main" \
      | $SUDO tee /etc/apt/sources.list.d/caddy.stable.list >/dev/null
    $SUDO apt-get update -qq
    $SUDO apt-get install -y -qq caddy >/dev/null
  else
    ok "Caddy sudah terpasang: $(caddy version)"
  fi
fi

# ---------------------------------------------------------------- PostgreSQL
if [[ $WITH_DB -eq 1 ]]; then
  if ! command -v psql >/dev/null 2>&1; then
    log "Memasang PostgreSQL 16"
    $SUDO apt-get install -y -qq postgresql postgresql-contrib >/dev/null
    $SUDO systemctl enable --now postgresql >/dev/null
  fi
  ok "PostgreSQL: $(psql --version | awk '{print $3}')"

  DB_PASSWORD_FILE="$APP_DIR/.dbpass"
  if [[ ! -f "$DB_PASSWORD_FILE" ]]; then
    DB_PASSWORD="$(openssl rand -hex 16)"
    # APP_DIR biasanya /var/www/... dan belum ada saat VPS masih kosong.
    if [[ ! -d "$APP_DIR" ]]; then
      $SUDO mkdir -p "$APP_DIR"
      $SUDO chown "$(id -u):$(id -g)" "$APP_DIR"
    fi
    umask 077
    printf '%s\n' "$DB_PASSWORD" > "$DB_PASSWORD_FILE"
    umask 022
    if [[ -n "$SUDO" ]]; then $SUDO chown "$(id -u):$(id -g)" "$DB_PASSWORD_FILE"; fi
    chmod 600 "$DB_PASSWORD_FILE" 2>/dev/null || true
    log "Membuat peran basis data '$DB_USER' dan database '$DB_NAME'"
    $SUDO -u postgres psql -v ON_ERROR_STOP=1 -tc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" | grep -q 1 \
      || $SUDO -u postgres psql -c "CREATE ROLE ${DB_USER} LOGIN PASSWORD '$DB_PASSWORD'"
    $SUDO -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1 \
      || $SUDO -u postgres createdb -O "${DB_USER}" "${DB_NAME}"
  else
    DB_PASSWORD="$(cat "$DB_PASSWORD_FILE")"
    ok "Peran basis data sudah ada (kata sandi diambil dari .dbpass)"
  fi
  DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:5432/${DB_NAME}?schema=public&connection_limit=10&connect_timeout=10"
else
  DATABASE_URL="${DATABASE_URL:-}"
  if [[ -z "$DATABASE_URL" ]]; then
    warn "--no-db dipakai: pastikan DATABASE_URL Supabase/VPS sudah ada di $APP_DIR/.env"
  fi
fi

# ---------------------------------------------------------------- kode sumber
if [[ ! -d "$APP_DIR/.git" ]]; then
  if [[ -z "$REPO" ]]; then
    die "$APP_DIR belum berisi repositori git. Jalankan dengan --repo <git-url> atau git clone dulu."
  fi
  log "Mengambil kode dari $REPO (branch $BRANCH)"
  if [[ ! -d "$APP_DIR" ]]; then
    $SUDO mkdir -p "$(dirname "$APP_DIR")"
    $SUDO chown "$(id -u):$(id -g)" "$(dirname "$APP_DIR")" 2>/dev/null || true
    git clone --branch "$BRANCH" "$REPO" "$APP_DIR"
  elif [[ -n "$(ls -A "$APP_DIR" 2>/dev/null)" ]]; then
    # Folder sudah ada (mis. berisi .dbpass dari langkah database) — lengkapi dengan git init.
    warn "$APP_DIR tidak kosong, memakai git init + fetch alih-alih git clone."
    cd "$APP_DIR"
    git init -q
    git remote add origin "$REPO" 2>/dev/null || git remote set-url origin "$REPO"
    git fetch -q origin "$BRANCH"
    git checkout -q -B "$BRANCH" FETCH_HEAD
  else
    git clone --branch "$BRANCH" "$REPO" "$APP_DIR"
  fi
  if [[ -n "$SUDO" ]]; then $SUDO chown -R "$(id -u):$(id -g)" "$APP_DIR"; fi
fi
cd "$APP_DIR"
log "Menyinkronkan kode"
git fetch --all --prune -q
# Hanya perubahan pada berkas ter-commit yang menghalangi update otomatis;
# berkas tak terlacak (.env, .dbpass, hasil build) diabaikan.
if [[ -n "$(git status --porcelain --untracked-files=no)" ]]; then
  warn "Ada perubahan pada berkas ter-commit di $APP_DIR — pull dilewati agar tidak hilang."
  warn "Simpan dulu: git stash, lalu jalankan ulang naskah ini."
else
  git checkout -q "$BRANCH" && git merge --ff-only -q "origin/$BRANCH" || warn "Branch $BRANCH tidak bisa fast-forward; cek manual."
fi
ok "Commit aktif: $(git log -1 --oneline)"

# ---------------------------------------------------------------- .env
ENV_FILE="$APP_DIR/.env"
if [[ ! -f "$ENV_FILE" ]]; then
  if [[ -f "$APP_DIR/.env.production.example" ]]; then
    log "Membuat $ENV_FILE dari .env.production.example"
    cp "$APP_DIR/.env.production.example" "$ENV_FILE"
  else
    log "Template .env.production.example tidak ditemukan — membuat $ENV_FILE dari nol"
    : > "$ENV_FILE"
  fi
fi
# Ganti (atau tambahkan) satu kunci di .env tanpa memakai sed, karena
# connection string mengandung "&" yang akan disalahartikan sed.
set_env_value() {
  local key="$1" val="$2" tmp
  tmp="$(mktemp)"
  grep -v "^${key}=" "$ENV_FILE" > "$tmp" || true
  printf '%s="%s"\n' "$key" "$val" >> "$tmp"
  cat "$tmp" > "$ENV_FILE"
  rm -f "$tmp"
}

# Nilai sebuah kunci di .env (tanpa tanda kutip).
env_value() { sed -n "s/^$1=\"\\(.*\\)\"\$/\\1/p" "$ENV_FILE" | head -1; }
# Nilai dianggap belum diisi bila kosong atau masih contoh template.
is_placeholder() {
  case "$1" in
    "" | *GANTI* | *ISI_DISINI* | *changeme*) return 0 ;;
    *) return 1 ;;
  esac
}

DB_VALUE="$(env_value DATABASE_URL)"
if [[ "$DB_VALUE" == postgres* ]] && ! is_placeholder "$DB_VALUE"; then DB_READY=1; else DB_READY=0; fi

if [[ -n "${DATABASE_URL:-}" ]] && [[ $DB_READY -eq 0 || $FORCE_DB_URL -eq 1 ]]; then
  if [[ $DB_READY -eq 1 ]]; then
    log "Mengganti DATABASE_URL lama dengan basis data PostgreSQL lokal (--reset-db-url)"
  else
    log "Menuliskan DATABASE_URL basis data lokal ke $ENV_FILE"
  fi
  set_env_value DATABASE_URL "$DATABASE_URL"
  DB_URL_CHANGED=1
else
  DB_URL_CHANGED=0
fi

if [[ $DB_URL_CHANGED -eq 1 ]]; then
  DB_IN_USE="$(printf '%s' "$DATABASE_URL" | sed -E 's#.*@([^/]+/[^?"]*).*#\1#')"
else
  DB_IN_USE="$(printf '%s' "$DB_VALUE" | sed -E 's#.*@([^/]+/[^?"]*).*#\1#')"
fi
ok "Basis data yang akan dipakai aplikasi: ${DB_IN_USE:-BELUM ADA}"
if [[ $WITH_DB -eq 1 && $DB_URL_CHANGED -eq 0 ]]; then
  warn "DATABASE_URL di .env sudah terisi, jadi basis data lokal '$DB_NAME' tidak dipakai."
  warn "Untuk memaksa pakai PostgreSQL lokal: bash scripts/deploy-vps.sh --reset-db-url"
fi
if is_placeholder "$(env_value AUTH_SECRET)"; then
  log "Menghasilkan AUTH_SECRET baru"
  set_env_value AUTH_SECRET "$(openssl rand -base64 32)"
fi
for pair in "AUTH_URL=https://${DOMAIN}" "NEXT_PUBLIC_APP_URL=https://${DOMAIN}" "AUTH_TRUST_HOST=true"; do
  set_env_value "${pair%%=*}" "${pair#*=}"
done
umask 077
chmod 600 "$ENV_FILE" 2>/dev/null || true
umask 022
ok "Konfigurasi env siap (DATABASE_URL, AUTH_URL=https://${DOMAIN}, AUTH_SECRET)"
if is_placeholder "$(env_value DEEPSEEK_API_KEY)"; then
  warn "DEEPSEEK_API_KEY masih kosong — fitur AI memakai perhitungan aturan."
fi

# ---------------------------------------------------------------- pasang & build
if [[ $SKIP_BUILD -eq 0 ]]; then
  log "Menginstal dependensi sesuai lockfile (npm ci)"
  npm ci --no-audit --no-fund
  log "Membangun Prisma Client"
  npx prisma generate --schema=prisma/schema.prisma
  log "Menyelaraskan skema database (prisma db push)"
  # Prisma dan Next.js membaca file .env di direktori aplikasi sendiri.
  npx prisma db push --schema=prisma/schema.prisma
  if [[ $DO_SEED -eq 1 ]]; then
    log "Mengisi data demo"
    npm run db:seed
  fi
  log "Membangun versi produksi (next build)"
  npm run build
fi

# ---------------------------------------------------------------- PM2
if ! command -v pm2 >/dev/null 2>&1; then
  log "Memasang PM2"
  $SUDO npm install -g pm2 >/dev/null
fi
$SUDO mkdir -p /var/log/kolabora
$SUDO chown -R "$(id -u):$(id -g)" /var/log/kolabora 2>/dev/null || true
log "Menjalankan aplikasi dengan PM2"
APP_PORT="$PORT" pm2 startOrReload ecosystem.config.js --update-env
pm2 save
ok "Proses kolabora status: $(pm2 jlist 2>/dev/null | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{try{const a=JSON.parse(d);const p=a.find(x=>x.name==="kolabora");console.log(p?p.pm2_env.status:"tidak ditemukan")}catch{console.log("?")}})')"

# ---------------------------------------------------------------- Caddy site
if [[ $WITH_CADDY -eq 1 ]]; then
  log "Menulis /etc/caddy/Caddyfile untuk ${DOMAIN}"
  TMP="$(mktemp)"
  sed -e "s|admin@kolabora.tech|${TLS_EMAIL}|" -e "s|kolabora.tech www.kolabora.tech|${DOMAIN} www.${DOMAIN}|" -e "s|127.0.0.1:3000|127.0.0.1:${PORT}|" deploy/Caddyfile > "$TMP"
  $SUDO cp "$TMP" /etc/caddy/Caddyfile
  rm -f "$TMP"
  $SUDO caddy validate --config /etc/caddy/Caddyfile >/dev/null
  $SUDO systemctl enable caddy >/dev/null 2>&1 || true
  $SUDO systemctl reload caddy 2>/dev/null || $SUDO systemctl restart caddy
  ok "Caddy dimuat (HTTPS otomatis saat DNS mengarah ke IP ini)"
fi

# ---------------------------------------------------------------- firewall
if command -v ufw >/dev/null 2>&1; then
  $SUDO ufw allow OpenSSH >/dev/null 2>&1 || true
  $SUDO ufw allow 80/tcp >/dev/null 2>&1 || true
  $SUDO ufw allow 443/tcp >/dev/null 2>&1 || true
  $SUDO ufw status | head -1 || true
fi

# ---------------------------------------------------------------- verifikasi
log "Memeriksa http://127.0.0.1:${PORT}/api/health"
HEALTH=""
for i in $(seq 1 20); do
  if HEALTH="$(curl -fsS "http://127.0.0.1:${PORT}/api/health" 2>/dev/null)"; then break; fi
  sleep 2
done
if [[ -n "$HEALTH" ]]; then
  printf '%s\n' "$HEALTH" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{const j=JSON.parse(d);console.log("  ok        :",j.ok);console.log("  database  :",j.database);console.log("  ai        :",j.ai.configured?j.ai.model:"belum aktif");console.log("  versi     :",j.version)})'
else
  warn "Endpoint kesehatan belum merespons. Cek: pm2 logs kolabora --lines 50"
fi

if [[ $RUN_TESTS -eq 1 ]]; then
  log "Menjalankan uji end-to-end"
  BASE_URL="https://${DOMAIN}" node scripts/smoke-test.mjs || warn "Sebagian uji gagal — lihat daftar di atas."
fi

cat <<RINGKASAN

============================================================================
 Selesai. Ringkasan:
   Direktori  : $APP_DIR (branch $(git rev-parse --abbrev-ref HEAD))
   URL        : https://${DOMAIN}
   Proses     : pm2 status kolabora | pm2 logs kolabora
   Database   : $( [[ $WITH_DB -eq 1 ]] && echo "PostgreSQL lokal ($DB_NAME)" || echo "luar (lihat DATABASE_URL di .env)" )
   Log        : /var/log/kolabora/out.log, /var/log/kolabora/error.log
 Update nanti : bash scripts/deploy-vps.sh --domain ${DOMAIN} [--test]
 Backup data  : bash scripts/backup-db.sh
============================================================================
RINGKASAN
