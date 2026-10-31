#!/usr/bin/env bash
#
# Mengisi DEEPSEEK_API_KEY (atau variabel rahasia lain) ke file .env
# tanpa pernah menuliskan nilainya di percakapan, log, atau riwayat shell.
#
# Pemakaian:
#   bash scripts/set-key.sh                       # isi DEEPSEEK_API_KEY di ./.env
#   bash scripts/set-key.sh --env .env.production
#   bash scripts/set-key.sh --name BLOB_READ_WRITE_TOKEN
#   bash scripts/set-key.sh --check               # periksa tanpa mengubah
#
# Sifat:
#   - input dibaca tersembunyi; kalau tidak ada terminal, dibaca dari stdin
#     (hindari menempel kunci lewat argumen perintah — itu masuk riwayat shell)
#   - baris lama ditimpa, baris lain tidak disentuh; bila belum ada, ditambahkan
#   - file hasil selalu ber-izin 0600
#   - tidak memakai sed, sehingga karakter khusus pada nilai tetap aman
#
set -euo pipefail

ENV_FILE=".env"
KEY_NAME="DEEPSEEK_API_KEY"
CHECK_ONLY=0

while [ $# -gt 0 ]; do
  case "$1" in
    --env)
      if [ $# -lt 2 ]; then echo "ERROR: --env butuh path file."; exit 2; fi
      ENV_FILE="$2"; shift 2 ;;
    --name)
      if [ $# -lt 2 ]; then echo "ERROR: --name butuh nama variabel."; exit 2; fi
      KEY_NAME="$2"; shift 2 ;;
    --check)
      CHECK_ONLY=1; shift ;;
    -h|--help)
      sed -n '2,20p' "$0"; exit 0 ;;
    *)
      echo "ERROR: argumen tidak dikenal: $1"; exit 2 ;;
  esac
done

if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: $ENV_FILE tidak ada. Salin template dulu:"
  echo "  cp .env.example $ENV_FILE"
  exit 1
fi

if ! printf '%s' "$KEY_NAME" | grep -Eq '^[A-Za-z_][A-Za-z0-9_]*$'; then
  echo "ERROR: nama variabel tidak valid: $KEY_NAME"
  exit 2
fi

# ---- mode periksa: tidak menulis apa pun ----------------------------------
if [ "$CHECK_ONLY" -eq 1 ]; then
  BARIS="$(grep -E "^${KEY_NAME}=" "$ENV_FILE" | tail -1 || true)"
  if [ -z "$BARIS" ]; then
    echo "BELUM ADA: $KEY_NAME tidak ada di $ENV_FILE."
    exit 1
  fi
  NILAI="$(printf '%s' "${BARIS#*=}" | tr -d '\r' | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'\$//")"
  if [ -z "$NILAI" ]; then
    echo "KOSONG: $KEY_NAME ada di $ENV_FILE tetapi nilainya kosong — fitur AI memakai perhitungan aturan."
    exit 1
  fi
  echo "TERISI: $KEY_NAME di $ENV_FILE (${NILAI:0:6}..., ${#NILAI} karakter, izin $(ls -l "$ENV_FILE" | cut -c2-10))."
  exit 0
fi

echo "Mengisi $KEY_NAME pada $ENV_FILE"
echo "(nilai tidak ditampilkan; kosong + Enter untuk membatalkan)"

# Kalau stdin adalah terminal (dijalankan langsung), input dibaca tersembunyi.
# Kalau stdin berupa pipa/redirect, dibaca biasa — berguna untuk otomasi.
SECRET=""
if [ -t 0 ]; then
  printf 'Tempel kunci lalu Enter: '
  IFS= read -rs SECRET || SECRET=""
  printf '\n'
else
  printf 'Membaca nilai dari stdin... '
  IFS= read -r SECRET || SECRET=""
  printf 'selesai\n'
fi

# Bersihkan spasi, tab, CR, LF, dan kutip yang sering ikut tersaat saat menempel.
SECRET="$(printf '%s' "$SECRET" | tr -d ' \t\r\n"'"'"'')"

if [ -z "$SECRET" ]; then
  echo "Dibatalkan — $ENV_FILE tidak diubah."
  exit 0
fi

case "$KEY_NAME" in
  DEEPSEEK_API_KEY)
    case "$SECRET" in
      sk-*) : ;;
      *)
        echo "ERROR: kunci DeepSeek biasanya diawali 'sk-'. Tidak ada yang diubah."
        exit 1 ;;
    esac
    if [ ${#SECRET} -lt 20 ]; then
      echo "ERROR: kunci terlalu pendek (${#SECRET} karakter), kemungkinan tertempel tidak lengkap."
      exit 1
    fi
    ;;
esac

TMP="$(mktemp "${TMPDIR:-/tmp}/kolabora-env.XXXXXX")"
umask 077

if grep -Eq "^${KEY_NAME}=" "$ENV_FILE"; then
  awk -v nama="$KEY_NAME" -v nilai="$SECRET" '
    $0 ~ "^" nama "=" { print nama "=\"" nilai "\""; next }
    { print }
  ' "$ENV_FILE" > "$TMP"
else
  cp "$ENV_FILE" "$TMP"
  # Kalau file asal tidak diakhiri newline, tambahkan dulu supaya baris baru tidak menyatu.
  if [ -n "$(tail -c 1 "$ENV_FILE")" ]; then
    printf '\n' >> "$TMP"
  fi
  printf '%s="%s"\n' "$KEY_NAME" "$SECRET" >> "$TMP"
  echo "(baris $KEY_NAME belum ada, ditambahkan di akhir file)"
fi

if [ ! -s "$TMP" ]; then
  echo "ERROR: hasil tulis kosong — file asal tidak disentuh."
  rm -f "$TMP"
  exit 1
fi

mv "$TMP" "$ENV_FILE"
chmod 600 "$ENV_FILE"
unset SECRET

PANJANG=""
AWAL=""
BARIS_AKHIR="$(grep -E "^${KEY_NAME}=" "$ENV_FILE" | tail -1 || true)"
if [ -n "$BARIS_AKHIR" ]; then
  NILAI_AKHIR="$(printf '%s' "${BARIS_AKHIR#*=}" | tr -d '\r"')"
  PANJANG=${#NILAI_AKHIR}
  AWAL="${NILAI_AKHIR:0:6}"
fi

if [ -n "$AWAL" ]; then
  echo "OK: $KEY_NAME tersimpan di $ENV_FILE (${AWAL}..., ${PANJANG} karakter, izin 0600)."
else
  echo "ERROR: nilai tidak terbaca kembali di $ENV_FILE."
  exit 1
fi

echo
echo "Langkah selanjutnya:"
echo "  1) Mulai ulang agar variabel baru dibaca:"
echo "       dev  : hentikan npm run dev, jalankan lagi"
echo "       VPS  : pm2 reload kolabora --update-env"
echo "  2) Uji koneksi AI:"
echo "       curl -s \"http://localhost:3000/api/ai/status?test=1\""
echo "  3) Uji menyeluruh:"
echo "       npm run smoke"
