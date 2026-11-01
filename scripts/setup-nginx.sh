#!/usr/bin/env bash
# ============================================================================
# Kolabora — pasang aplikasi di belakang NGINX yang sudah berjalan.
# Dipakai bila VPS sudah punya nginx di port 80/443 (Caddy tidak bisa dipakai).
#
# Usage:
#   bash scripts/setup-nginx.sh --domain kolabora.tech --port 3050 \
#        --email admin@kolabora.tech
#
# Flag:
#   --domain <d>    domain produksi              (default: kolabora.tech)
#   --port <p>      port Node di 127.0.0.1       (default: 3000)
#   --email <e>     email Let's Encrypt          (default: admin@<domain>)
#   --site <nama>   nama berkas situs nginx      (default: kolabora)
#   --no-www        jangan ikut-sertakan www.<domain>
#   --no-tls        lewati certbot (hanya HTTP)
#   --force         tulis ulang walau sudah ada sertifikat
#
# Aman dijalankan ulang: bila konfigurasi di server sudah memuat
# "listen 443 ssl" (artinya certbot sudah bekerja), file tidak ditimpa,
# kecuali --force. Konfigurasi lama selalu dicadangkan dan dipulihkan
# bila `nginx -t` gagal.
# ============================================================================
set -Eeuo pipefail

DOMAIN="${DOMAIN:-kolabora.tech}"
PORT="${PORT:-3000}"
TLS_EMAIL="${TLS_EMAIL:-}"
SITE="${SITE:-kolabora}"
WITH_WWW=1
WITH_TLS=1
FORCE=0

log()  { printf '\033[1;36m==>\033[0m %s\n' "$*"; }
ok()   { printf '\033[1;32m  ✓\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m  !\033[0m %s\n' "$*"; }
die()  { printf '\033[1;31mGAGAL:\033[0m %s\n' "$*" >&2; exit 1; }

while [[ $# -gt 0 ]]; do
  case "$1" in
    --domain) DOMAIN="$2"; shift 2 ;;
    --port)   PORT="$2"; shift 2 ;;
    --email)  TLS_EMAIL="$2"; shift 2 ;;
    --site)   SITE="$2"; shift 2 ;;
    --no-www) WITH_WWW=0; shift ;;
    --no-tls) WITH_TLS=0; shift ;;
    --force)  FORCE=1; shift ;;
    -h|--help) sed -n '2,24p' "$0"; exit 0 ;;
    *) die "Argumen tidak dikenal: $1" ;;
  esac
done

if [[ -z "$TLS_EMAIL" ]]; then TLS_EMAIL="admin@${DOMAIN}"; fi

if [[ $EUID -eq 0 ]]; then
  SUDO=""
elif command -v sudo >/dev/null 2>&1; then
  SUDO="sudo"
else
  die "Perlu root atau sudo."
fi
$SUDO true

if ! command -v nginx >/dev/null 2>&1; then
  die "nginx tidak terpasang — naskah ini untuk server yang sudah punya nginx (kalau belum, pakai deploy-vps.sh tanpa --no-caddy)."
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEMPLATE="$ROOT_DIR/deploy/nginx/kolabora.conf"
if [[ ! -f "$TEMPLATE" ]]; then die "Template tidak ditemukan: $TEMPLATE"; fi

AVAIL="/etc/nginx/sites-available/${SITE}"
ENABLED="/etc/nginx/sites-enabled/${SITE}"
STAMP="$(date +%Y%m%d-%H%M%S)"

NAMES="$DOMAIN"
if [[ $WITH_WWW -eq 1 ]]; then NAMES="$DOMAIN www.$DOMAIN"; fi

if [[ ! -d /etc/nginx/sites-available ]]; then
  warn "/etc/nginx/sites-available tidak ada (distribusi non-Debian?) — jalankan manual: lihat deploy/nginx/kolabora.conf"
  die "Struktur konfigurasi nginx tidak dikenali."
fi

# ---------------------------------------------------------------- tulis konfigurasi
HAS_TLS=0
if [[ -f "$AVAIL" ]] && grep -q "listen 443" "$AVAIL" 2>/dev/null; then HAS_TLS=1; fi

if [[ $HAS_TLS -eq 1 && $FORCE -eq 0 ]]; then
  ok "Konfigurasi $AVAIL sudah berisi blok HTTPS — tidak diubah (pakai --force untuk menulis ulang)."
else
  log "Menulis $AVAIL (domain: $NAMES → 127.0.0.1:$PORT)"
  TMP="$(mktemp)"
  sed -e "s|__DOMAIN__|${DOMAIN}|g" -e "s|__PORT__|${PORT}|g" "$TEMPLATE" > "$TMP"

  if [[ -f "$AVAIL" ]]; then
    $SUDO cp -a "$AVAIL" "${AVAIL}.bak-${STAMP}"
    ok "Konfigurasi lama dicadangkan ke ${AVAIL}.bak-${STAMP}"
  fi
  $SUDO cp "$TMP" "$AVAIL"
  rm -f "$TMP"

  if [[ -e "$ENABLED" && ! -L "$ENABLED" ]]; then
    warn "$ENABLED sudah ada dan bukan symlink — dipindah ke ${ENABLED}.off-${STAMP}"
    $SUDO mv "$ENABLED" "${ENABLED}.off-${STAMP}"
  fi
  if [[ ! -L "$ENABLED" ]]; then
    $SUDO ln -sf "$AVAIL" "$ENABLED"
  fi
  ok "Tautan aktif: $ENABLED"

  # webroot untuk tantangan HTTP-01
  $SUDO mkdir -p /var/www/certbot

  if ! $SUDO nginx -t >/dev/null 2>&1; then
    warn "nginx -t gagal — memulihkan konfigurasi sebelumnya:"
    $SUDO nginx -t 2>&1 | sed 's/^/    /' || true
    if [[ -f "${AVAIL}.bak-${STAMP}" ]]; then
      $SUDO cp -a "${AVAIL}.bak-${STAMP}" "$AVAIL"
    else
      $SUDO rm -f "$AVAIL" "$ENABLED"
    fi
    $SUDO nginx -t >/dev/null 2>&1 && $SUDO systemctl reload nginx || true
    die "Tidak ada perubahan yang tersisa di server."
  fi
  $SUDO systemctl reload nginx 2>/dev/null || $SUDO nginx -s reload
  ok "nginx dimuat ulang"
fi

# ---------------------------------------------------------------- sertifikat TLS
if [[ $WITH_TLS -eq 1 ]]; then
  if ! command -v certbot >/dev/null 2>&1; then
    warn "certbot tidak ditemukan. Pasang lalu jalankan ulang naskah ini:"
    warn "  apt-get install -y certbot python3-certbot-nginx"
  elif certbot certificates 2>/dev/null | grep -qE "Name: *${DOMAIN}\$"; then
    ok "Sertifikat ${DOMAIN} sudah ada — memastikan pembaruan otomatis terjadwal."
    $SUDO certbot renew --quiet --deploy-hook "systemctl reload nginx" || true
  else
    ARGS=(--nginx --non-interactive --agree-tos -m "$TLS_EMAIL" --redirect)
    REQ=(-d "$DOMAIN")
    if [[ $WITH_WWW -eq 1 ]]; then REQ+=(-d "www.$DOMAIN"); fi
    log "Meminta sertifikat Let's Encrypt untuk $NAMES"
    if $SUDO certbot "${ARGS[@]}" "${REQ[@]}"; then
      ok "HTTPS aktif (request HTTP dialihkan ke HTTPS)"
    else
      warn "Certbot gagal. Cek email/DNS, lalu ulangi: sudo certbot --nginx -d ${DOMAIN}"
    fi
  fi
else
  warn "--no-tls dipakai: situs hanya melayani HTTP."
fi

# ---------------------------------------------------------------- verifikasi
log "Aplikasi langsung (port $PORT)"
if HEALTH="$(curl -fsS -m 20 "http://127.0.0.1:${PORT}/api/health" 2>/dev/null)"; then
  ok "$(printf '%s' "$HEALTH" | head -c 160)"
else
  warn "Tidak merespons. Cek: pm2 logs ${SITE} --lines 50"
fi

log "Lewat nginx (HTTP :80)"
if PROXIED="$(curl -fsS -m 20 -H "Host: ${DOMAIN}" http://127.0.0.1/api/health 2>/dev/null)"; then
  ok "$(printf '%s' "$PROXIED" | head -c 160)"
else
  warn "Belum diteruskan (normal bila nginx sudah memaksa HTTPS)."
fi

cat <<SELESAI

============================================================================
 Situs   : ${SITE} → ${NAMES}
 Proxy   : 127.0.0.1:${PORT}
 Berkas  : ${AVAIL}  (template: deploy/nginx/kolabora.conf)
 Uji     : curl -s https://${DOMAIN}/api/health
 Update  : bash scripts/setup-nginx.sh --domain ${DOMAIN} --port ${PORT}
============================================================================
SELESAI
