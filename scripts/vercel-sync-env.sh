#!/usr/bin/env bash
# Tambahkan variabel env produksi ke Vercel tanpa menampilkan nilainya.
set -euo pipefail
cd "$(dirname "$0")/.."

read_env() {
  local key="$1"
  sed -nE "s/^${key}=\"?([^\")]*)\"?[[:space:]]*\$/\1/p" .env | head -1
}

add_var() {
  local key="$1"
  local value
  value="$(read_env "$key")"
  if [[ -z "$value" ]]; then
    echo "! $key kosong di .env, dilewati"
    return
  fi
  if vercel env ls production 2>/dev/null | grep -qE "^ *$key "; then
    echo "= $key sudah ada di Production, tidak diubah"
    return
  fi
  printf '%s' "$value" | vercel env add "$key" production >/dev/null 2>&1 \
    && echo "+ $key ditambahkan (${#value} karakter)" \
    || echo "GAGAL menambahkan $key"
}

add_var DEEPSEEK_API_KEY
add_var BLOB_READ_WRITE_TOKEN
