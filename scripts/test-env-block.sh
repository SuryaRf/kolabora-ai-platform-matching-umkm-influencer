#!/usr/bin/env bash
# Uji mandiri untuk blok .env pada scripts/deploy-vps.sh.
# Blok diuji adalah potongan ASLI dari naskah (diekstrak saat runtime),
# bukan salinan yang ditulis ulang.
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEPLOY="$ROOT/scripts/deploy-vps.sh"
TPL="$ROOT/.env.production.example"
WORK="$(mktemp -d)"
PASS=0; FAIL=0

check() { # nama, kondisi(0/1), detail
  if [[ "$2" -eq 0 ]]; then PASS=$((PASS+1)); printf 'PASS  %s\n' "$1";
  else FAIL=$((FAIL+1)); printf 'FAIL  %s — %s\n' "$1" "$3"; fi
}

# Ekstrak: definisi fungsi log/ok/warn + fungsi set_env_value + seluruh
# pemrosesan .env sampai peringatan DEEPSEEK_API_KEY.
BLOCK_START=$(grep -n '^# Ganti (atau tambahkan) satu kunci' "$DEPLOY" | cut -d: -f1)
WARN_LINE=$(grep -n "DEEPSEEK_API_KEY masih kosong" "$DEPLOY" | cut -d: -f1)
[[ -n "$BLOCK_START" && -n "$WARN_LINE" ]] || { echo "GAGAL: blok .env tidak ditemukan di $DEPLOY"; exit 1; }
# Ambil sampai baris "fi" penutup blok itu, supaya jumlah pesan peringatan boleh berubah.
BLOCK_END=$(awk -v dari="$WARN_LINE" 'NR >= dari { print NR; if ($0 ~ /^[[:space:]]*fi[[:space:]]*$/) exit }' "$DEPLOY" | tail -1)
sed -n "${BLOCK_START},${BLOCK_END}p" "$DEPLOY" > "$WORK/block.sh"
[[ "$(tail -1 "$WORK/block.sh" | tr -d '[:space:]')" == "fi" ]] || { echo "GAGAL: potongan blok tidak lengkap"; tail -3 "$WORK/block.sh"; exit 1; }
bash -n "$WORK/block.sh" || { echo "GAGAL: potongan blok tidak valid sebagai bash"; exit 1; }

PRELUDE='log(){ printf "log: %s\n" "$*"; }; ok(){ printf "ok: %s\n" "$*"; }; warn(){ printf "warn: %s\n" "$*"; };'

run_block() { # $1=path .env  $2=DOMAIN  $3=DATABASE_URL  $4=FORCE_DB_URL  $5=WITH_DB
  ( set -eo pipefail
    eval "$PRELUDE"
    ENV_FILE="$1"; DOMAIN="$2"; DATABASE_URL="$3"; FORCE_DB_URL="$4"; WITH_DB="$5"; DB_NAME="kolabora"
    source "$WORK/block.sh" ) 2>&1
}

echo "== Kasus A: .env baru dari template (VPS pertama kali) =="
cp "$TPL" "$WORK/a.env"
OUT_A="$(run_block "$WORK/a.env" kolabora.tech 'postgresql://kolabora:RAHASIA123@127.0.0.1:5432/kolabora?schema=public&connection_limit=10' 0 1)"
echo "$OUT_A" | sed 's/^/    /'
DB="$(sed -n 's/^DATABASE_URL="\(.*\)"$/\1/p' "$WORK/a.env" | head -1)"
[[ "$DB" == "postgresql://kolabora:RAHASIA123@127.0.0.1:5432/kolabora?schema=public&connection_limit=10" ]]
check "DATABASE_URL contoh diganti nilai lokal" $? "terbaca: $DB"
[[ "$(grep -c 'GANTI' "$WORK/a.env")" -eq 0 ]]
check "tidak ada placeholder GANTI yang tersisa" $? "$(grep -c 'GANTI' "$WORK/a.env") baris masih contoh"
[[ "$(sed -n 's/^AUTH_SECRET="\(.\{20\}\).*"/\1/p' "$WORK/a.env" | wc -c)" -gt 0 ]]
check "AUTH_SECRET terisi acak" $? "kosong"
grep -q '^AUTH_URL="https://kolabora.tech"' "$WORK/a.env"; check "AUTH_URL = https://kolabora.tech" $? "tidak cocok"
grep -q '^NEXT_PUBLIC_APP_URL="https://kolabora.tech"' "$WORK/a.env"; check "NEXT_PUBLIC_APP_URL mengikuti domain" $? "tidak cocok"
grep -q '^AUTH_TRUST_HOST="true"' "$WORK/a.env"; check "AUTH_TRUST_HOST=true" $? "tidak ada"
[[ "$(grep -c '^DATABASE_URL=' "$WORK/a.env")" -eq 1 ]]; check "DATABASE_URL tidak ditulis ganda" $? "$(grep -c '^DATABASE_URL=' "$WORK/a.env") baris"
perms="$(stat -f '%OLp' "$WORK/a.env" 2>/dev/null || stat -c '%a' "$WORK/a.env")"
[[ "$perms" == "600" || "$perms" == "640" ]]; check "hanya pemilik yang bisa baca .env" $? "nilainya $perms"
echo "$OUT_A" | grep -q "127.0.0.1:5432/kolabora"; check "ringkasan menyebut host DB lokal" $? "tidak muncul"

echo; echo "== Kasus B: .env sudah berisi DATABASE_URL asli (Supabase) =="
printf 'DATABASE_URL="postgresql://postgres.ref:pw@aws-0-ap.pooler.supabase.com:6543/postgres?schema=public"\nAUTH_SECRET="sudahada"\n' > "$WORK/b.env"
OUT_B="$(run_block "$WORK/b.env" kolabora.tech 'postgresql://kolabora:LOKAL@127.0.0.1:5432/kolabora?schema=public' 0 1)"
echo "$OUT_B" | sed 's/^/    /'
grep -q 'supabase' "$WORK/b.env"; check "DATABASE_URL lama tidak ditimpa" $? "terlanjur diganti"
grep -q '^AUTH_SECRET="sudahada"' "$WORK/b.env"; check "AUTH_SECRET yang ada dipertahankan" $? "tertulis ulang"
echo "$OUT_B" | grep -q -- "--reset-db-url"; check "naskah memberi tahu cara memaksa lokal" $? "tanpa petunjuk"

echo; echo "== Kasus C: sama seperti B tapi dengan --reset-db-url =="
OUT_C="$(run_block "$WORK/b.env" kolabora.tech 'postgresql://kolabora:BARU@127.0.0.1:5432/kolabora?schema=public' 1 1)"
echo "$OUT_C" | sed 's/^/    /'
grep -q '^DATABASE_URL="postgresql://kolabora:BARU@127.0.0.1' "$WORK/b.env"; check "--reset-db-url mengganti ke lokal" $? "masih lama"
[[ "$(grep -c '^DATABASE_URL=' "$WORK/b.env")" -eq 1 ]]; check "hasil tetap satu baris DATABASE_URL" $? "$(grep -c '^DATABASE_URL=' "$WORK/b.env") baris"

echo; echo "== Kasus D: --no-db, .env belum punya DATABASE_URL =="
: > "$WORK/d.env"
OUT_D="$(run_block "$WORK/d.env" kolabora.tech '' 0 0)"
echo "$OUT_D" | sed 's/^/    /'
grep -q '^DATABASE_URL=' "$WORK/d.env"; check "tidak menulis DATABASE_URL kosong" "$((1-$?))" "tertulis padahal tidak ada DB"
grep -q '^AUTH_URL="https://kolabora.tech"' "$WORK/d.env"; check "AUTH_URL tetap ditulis saat --no-db" $? "kosong"

rm -rf "$WORK"
echo; echo "Hasil: $PASS lulus, $FAIL gagal."
[[ $FAIL -eq 0 ]]
