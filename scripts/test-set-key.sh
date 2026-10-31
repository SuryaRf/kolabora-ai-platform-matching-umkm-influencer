#!/usr/bin/env bash
#
# Uji otomatis scripts/set-key.sh — naskah pengisi kunci AI ke file .env.
#
# Pemakaian: bash scripts/test-set-key.sh   (atau: npm run test:keys)
#
# Semua pengujian memakai salinan .env.example di direktori sementara dan kunci
# palsu, jadi kunci asli serta konfigurasi pengembang tidak pernah tersentuh.
#
set -uo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SET_KEY="$REPO/scripts/set-key.sh"
WORK="$(mktemp -d "${TMPDIR:-/tmp}/kolabora-setkey-test.XXXXXX")"
trap 'rm -rf "$WORK"' EXIT

PASS=0
FAIL=0

check() { # nama, kondisi(0/1), detail
  if [[ "$2" -eq 0 ]]; then PASS=$((PASS + 1)); printf 'PASS  %s\n' "$1"
  else FAIL=$((FAIL + 1)); printf 'FAIL  %s — %s\n' "$1" "$3"; fi
}

bool() { # $1=ekspresi uji -> 0/1
  if eval "$1"; then echo 0; else echo 1; fi
}

# Nilai sebuah variabel di file .env (luar kutip); baris terakhir yang dipakai.
value_of() { # $1=file $2=nama
  grep -E "^$2=" "$1" | tail -1 | sed -e 's/^[^=]*=//' -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'\$//"
}

count_key_lines() { grep -c '^DEEPSEEK_API_KEY=' "$1"; }

izin() { stat -f '%Sp' "$1" 2>/dev/null || stat -c '%A' "$1"; }

bash -n "$SET_KEY"
check "set-key.sh valid sebagai bash" $? "sintaks salah"

fresh() {
  rm -f "$WORK/.env"
  cp "$REPO/.env.example" "$WORK/.env"
  chmod 644 "$WORK/.env"
}

jalan() { # $1=nilai (lewat stdin), sisanya argumen
  local nilai="$1"; shift
  printf '%s\n' "$nilai" | (cd "$WORK" && bash "$SET_KEY" "$@" 2>&1)
}

# ------------------------------------------------------------------ 1. menulis
fresh
out=$(jalan 'sk-FAKE1234567890abcdef')
check "menulis kunci dari stdin" $? "out=$out"
check "melaporkan berhasil" "$(bool '[[ "$out" == *"OK: DEEPSEEK_API_KEY tersimpan"* ]]')" "out=$out"
check "nilai tersimpan persis" "$(bool '[[ "$(value_of "$WORK/.env" DEEPSEEK_API_KEY)" == "sk-FAKE1234567890abcdef" ]]')" "nilai=$(value_of "$WORK/.env" DEEPSEEK_API_KEY)"
check "baris target tetap satu" "$(bool '[[ "$(count_key_lines "$WORK/.env")" -eq 1 ]]')" "jumlah=$(count_key_lines "$WORK/.env")"
check "izin file diketatkan jadi 0600" "$(bool '[[ "$(izin "$WORK/.env")" == "-rw-------" ]]')" "izin=$(izin "$WORK/.env")"
diff <(grep -v '^DEEPSEEK_API_KEY=' "$REPO/.env.example") <(grep -v '^DEEPSEEK_API_KEY=' "$WORK/.env") >/dev/null
check "baris lain tidak berubah" $? "diff menemukan perbedaan"

# ------------------------------------------------------------------ 2. --check
out=$( (cd "$WORK" && bash "$SET_KEY" --check 2>&1) )
check "--check lapor TERISI" "$(bool '[[ "$out" == *"TERISI"* ]]')" "out=$out"
check "--check tidak membocorkan nilai" "$(bool '[[ "$out" != *FAKE1234567890abcdef* ]]')" "out=$out"

fresh
out=$( (cd "$WORK" && bash "$SET_KEY" --check 2>&1); echo "rc=$?")
check "--check nilai kosong -> kode 1 & pesan KOSONG" "$(bool '[[ "$out" == *"KOSONG"* && "$out" == *"rc=1"* ]]')" "out=$out"

out=$( (cd "$WORK" && bash "$SET_KEY" --check --name TIDAK_ADA_VAR 2>&1); echo "rc=$?")
check "--check variabel yang belum ada -> BELUM ADA" "$(bool '[[ "$out" == *"BELUM ADA"* && "$out" == *"rc=1"* ]]')" "out=$out"

# --------------------------------------------------------------- 3. penolakan
fresh
jalan 'sk-FAKE1234567890abcdef' >/dev/null
lama="$(value_of "$WORK/.env" DEEPSEEK_API_KEY)"

out=$(jalan 'bukan-kunci-tanpa-prefiks')
check "kunci tanpa awalan 'sk-' ditolak" "$(bool '[[ "$out" == *"biasanya diawali"* ]]')" "out=$out"
out=$(jalan 'sk-abc')
check "kunci terlalu pendek ditolak" "$(bool '[[ "$out" == *"terlalu pendek"* ]]')" "out=$out"
check "nilai lama utuh setelah penolakan" "$(bool '[[ "$(value_of "$WORK/.env" DEEPSEEK_API_KEY)" == "$lama" ]]')" "nilai=$(value_of "$WORK/.env" DEEPSEEK_API_KEY)"

out=$(jalan '')
check "input kosong membatalkan (bukan error)" "$(bool '[[ "$out" == *"Dibatalkan"* ]]')" "out=$out"
check "input kosong tidak mengubah file" "$(bool '[[ "$(value_of "$WORK/.env" DEEPSEEK_API_KEY)" == "$lama" ]]')" "nilai=$(value_of "$WORK/.env" DEEPSEEK_API_KEY)"

# ------------------------------------------------------------ 4. karakter khusus
fresh
khsus=$'sk-A$&B"C\'D\tE-long-spasi\tlagi-banget'
out=$(jalan "$khsus")
nilai=$(value_of "$WORK/.env" DEEPSEEK_API_KEY)
check "kutip/spasi/tab dibuang, \$ & tetap aman" "$(bool '[[ "$nilai" == "sk-A\$&BCDE-long-spasilagi-banget" ]]')" "out=$out nilai=$nilai"

fresh
jalan '  sk-SPASI-TEPI-1234567890  ' >/dev/null
check "spasi di ujung ikut dibersihkan" "$(bool '[[ "$(value_of "$WORK/.env" DEEPSEEK_API_KEY)" == "sk-SPASI-TEPI-1234567890" ]]')" "nilai=$(value_of "$WORK/.env" DEEPSEEK_API_KEY)"

jalan 'sk-TANPA-SPASI-BERSIH' >/dev/null
check "penulisan ulang menimpa, bukan menambah baris" "$(bool '[[ "$(count_key_lines "$WORK/.env")" -eq 1 && "$(value_of "$WORK/.env" DEEPSEEK_API_KEY)" == "sk-TANPA-SPASI-BERSIH" ]]')" "jumlah=$(count_key_lines "$WORK/.env") nilai=$(value_of "$WORK/.env" DEEPSEEK_API_KEY)"

# ------------------------------------------------------------- 5. baris baru
fresh
sebelum=$(wc -l < "$WORK/.env")
out=$(jalan 'nilai-yang-benar-panjang-1' --name NYAWAR_UJI)
sesudah=$(wc -l < "$WORK/.env")
nilai=$(value_of "$WORK/.env" NYAWAR_UJI)
check "variabel yang belum ada ditambahkan di akhir" "$(bool '[[ "$nilai" == "nilai-yang-benar-panjang-1" && "$sesudah" -gt "$sebelum" && "$out" == *"ditambahkan di akhir file"* ]]')" "out=$out sebelum=$sebelum sesudah=$sesudah nilai=$nilai"

printf 'DATABASE_URL="x"\nAUTH_SECRET="y"\t' > "$WORK/notail.env"
jalan 'sk-NONEWLINE1234567890ab' --env notail.env >/dev/null
baris=$(wc -l < "$WORK/notail.env")
nilai=$(value_of "$WORK/notail.env" DEEPSEEK_API_KEY)
check "file tanpa newline akhir tidak menyatu barisnya" "$(bool '[[ "$nilai" == "sk-NONEWLINE1234567890ab" && "$baris" -ge 3 ]]')" "baris=$baris nilai=$nilai isi=$(tr '\t' 'T' < "$WORK/notail.env" | tr '\n' '|')"

# --------------------------------------------------------------- 6. argumen
out=$( (cd "$WORK" && bash "$SET_KEY" --env .env.tiada 2>&1); echo "rc=$?")
check "file .env tidak ada -> kode 1" "$(bool '[[ "$out" == *"tidak ada"* && "$out" == *"rc=1"* ]]')" "out=$out"

out=$( (cd "$WORK" && bash "$SET_KEY" --noi 2>&1); echo "rc=$?")
check "argumen tak dikenal -> kode 2" "$(bool '[[ "$out" == *"tidak dikenal"* && "$out" == *"rc=2"* ]]')" "out=$out"

out=$( (cd "$WORK" && bash "$SET_KEY" --env 2>&1); echo "rc=$?")
check "--env tanpa nilai -> kode 2" "$(bool '[[ "$out" == *"--env butuh"* && "$out" == *"rc=2"* ]]')" "out=$out"

out=$(jalan 'sk-NAMA-SALAH1234567890' --name '2BAD-NAME')
check "nama variabel tidak valid ditolak" "$(bool '[[ "$out" == *"tidak valid"* ]]')" "out=$out"

out=$( (cd "$WORK" && bash "$SET_KEY" --help 2>&1); echo "rc=$?")
check "--help mencetak pemakaian" "$(bool '[[ "$out" == *"Pemakaian"* && "$out" == *"rc=0"* ]]')" "out=$out"

# ------------------------------------------------------------ 7. tanpa bocoran
fresh
out=$(jalan 'sk-JANGAN-TAMPIL-123456789')
check "nilai kunci tidak dicetak ke keluaran" "$(bool '[[ "$out" != *JANGAN-TAMPIL-123456789* && "$out" == *"sk-JAN"* ]]')" "out=$out"

echo
echo "Hasil: $PASS lulus, $FAIL gagal."
[[ $FAIL -eq 0 ]] || exit 1
