#!/usr/bin/env bash
# ============================================================================
# Kolabora — cadangan (backup) basis data PostgreSQL
#
# Dipakai di VPS:   bash scripts/backup-db.sh
# Cron harian:      15 3 * * * cd /var/www/kolabora && bash scripts/backup-db.sh >> /var/log/kolabora/backup.log 2>&1
#
# Flag:
#   --out <dir>    folder tujuan        (default: /var/backups/kolabora)
#   --keep <hari>  simpan berapa hari   (default: 14)
#   --plain        hasil .sql teks (bisa ditempel ke Supabase SQL Editor); default: .dump (pg_restore)
#   --with-env     ikut menyalin .env (kata sandi & kunci API) ke folder backup
#   --dsn <url>    pakai connection string tertentu, bukan isi .env
#
# Cara memulihkan:
#   pg_restore -d "$DATABASE_URL" --no-owner --clean --if-exists backup.dump
#   psql -d "<dsn tanpa ?schema=public>" -f backup.sql          # untuk --plain
#
# Catatan: parameter khas Prisma (schema, pgbouncer, connection_limit,
# pool_timeout) otomatis dilepas karena pg_dump/libpq tidak mengenalnya.
# ============================================================================
set -Eeuo pipefail

OUT_DIR="/var/backups/kolabora"
KEEP_DAYS=14
FORMAT="custom"
WITH_ENV=0
DSN="${DATABASE_URL:-}"
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

log() { printf '\033[1;36m==> \033[0m%s\n' "$*"; }
die() { printf '\033[1;31mGAGAL:\033[0m %s\n' "$*" >&2; exit 1; }

while [[ $# -gt 0 ]]; do
  case "$1" in
    --out) OUT_DIR="$2"; shift 2 ;;
    --keep) KEEP_DAYS="$2"; shift 2 ;;
    --plain) FORMAT="plain"; shift ;;
    --with-env) WITH_ENV=1; shift ;;
    --dsn) DSN="$2"; shift 2 ;;
    -h|--help) sed -n '2,22p' "$0"; exit 0 ;;
    *) die "Argumen tidak dikenal: $1" ;;
  esac
done

# Buang parameter yang hanya dimengerti Prisma agar pg_dump bisa terhubung.
clean_dsn() {
  local url="$1" base="${1%%\?*}" query="" kept="" pair key
  if [[ "$url" == *\?* ]]; then query="${url#*\?}"; fi
  local oldIFS="$IFS"
  IFS='&'
  for pair in $query; do
    key="${pair%%=*}"
    case "$key" in
      schema | pgbouncer | connection_limit | pool_timeout | max_idle | max_lifetime | pool) continue ;;
    esac
    kept="${kept:+$kept&}$pair"
  done
  IFS="$oldIFS"
  if [[ -n "$kept" ]]; then printf '%s?%s' "$base" "$kept"; else printf '%s' "$base"; fi
}

command -v pg_dump >/dev/null 2>&1 || die "pg_dump tidak ditemukan. Pasang: apt-get install -y postgresql-client"

if [[ -z "$DSN" && -f "$APP_DIR/.env" ]]; then
  DSN="$(sed -n 's/^DATABASE_URL="\(.*\)"/\1/p' "$APP_DIR/.env" | head -1)"
fi
[[ -n "$DSN" ]] || die "DATABASE_URL tidak ditemukan (isi .env atau pakai --dsn)."

TARGET_DSN="$(clean_dsn "$DSN")"
mkdir -p "$OUT_DIR"
chmod 700 "$OUT_DIR" 2>/dev/null || true

STAMP="$(date +%Y%m%d-%H%M%S)"
HOST_LABEL="$(printf '%s' "$TARGET_DSN" | sed -E 's#.*@([^/:]+).*#\1#' | tr -c 'A-Za-z0-9_.-' '-')"
DB_LABEL="$(printf '%s' "$TARGET_DSN" | sed -E 's#.*/([^/?]+)(\?.*)?$#\1#')"
log "Sumber: basis data '$DB_LABEL' di $HOST_LABEL"

if [[ "$FORMAT" == "plain" ]]; then
  FILE="$OUT_DIR/kolabora-$STAMP.sql"
  log "Mencadangkan ke $FILE (teks SQL, bisa ditempel ke Supabase SQL Editor)"
  pg_dump --dbname="$TARGET_DSN" --no-owner --no-privileges --clean --if-exists --format=plain > "$FILE"
else
  FILE="$OUT_DIR/kolabora-$STAMP.dump"
  log "Mencadangkan ke $FILE (format pg_restore, terkompresi)"
  pg_dump --dbname="$TARGET_DSN" --no-owner --format=custom --compress=6 --file="$FILE"
fi
chmod 600 "$FILE"

BYTES="$(wc -c < "$FILE" | tr -d ' ')"
log "Selesai: $FILE ($BYTES byte)"
if [[ "$BYTES" -lt 2048 ]]; then
  printf '\033[1;33m  ! \033[0mBerkas cadangan sangat kecil. Kemungkinan basis data masih kosong.\n'
fi

if [[ $WITH_ENV -eq 1 ]]; then
  if [[ -f "$APP_DIR/.env" ]]; then
    cp "$APP_DIR/.env" "$OUT_DIR/env-$STAMP"
    chmod 600 "$OUT_DIR/env-$STAMP" 2>/dev/null || true
    log "Salinan .env ikut disimpan (berisi rahasia — jaga aksesnya)"
  fi
  if [[ -f "$APP_DIR/.dbpass" ]]; then
    cp "$APP_DIR/.dbpass" "$OUT_DIR/dbpass-$STAMP"
    chmod 600 "$OUT_DIR/dbpass-$STAMP" 2>/dev/null || true
  fi
fi

DELETED="$(find "$OUT_DIR" -maxdepth 1 -type f \( -name 'kolabora-*.dump' -o -name 'kolabora-*.sql' -o -name 'env-*' -o -name 'dbpass-*' \) -mtime +"$KEEP_DAYS" -print -delete 2>/dev/null | wc -l | tr -d ' ')"
log "Pembersihan: $DELETED berkas lebih dari ${KEEP_DAYS} hari dihapus"

cat <<RINGKASAN

Berkas: $FILE
Kirim keluar VPS (pilih salah satu):
  rsync -av "$OUT_DIR/" kamu@mesin-lain:/backup/kolabora/
  rclone copy "$OUT_DIR" gdrive:kolabora-backup
Pulihkan:
  pg_restore -d "\$(grep DATABASE_URL $APP_DIR/.env | cut -d'"'"' -f2)" --no-owner --clean --if-exists "$FILE"
RINGKASAN
