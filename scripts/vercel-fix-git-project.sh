#!/usr/bin/env bash
# Selamatkan proyek Vercel yang terhubung GitHub: DB-nya menunjuk host
# Supabase yang tidak bisa dijangkau dari Vercel, dan kunci AI belum diisi.
set -euo pipefail
cd "$(dirname "$0")/.."

POOL_URL=$(sed -n 's/^DATABASE_URL="\(.*\)"/\1/p' .env.vercel.production | head -1)
KEY=$(sed -n 's/^DEEPSEEK_API_KEY="\(.*\)"/\1/p' .env | head -1)
GIT_URL="https://kolabora-ai-platform-matching-umkm.vercel.app"

[[ "$POOL_URL" == *"pooler.supabase.com"* ]] || { echo "GAGAL: URL pooler tidak dikenali"; exit 1; }
[[ "$KEY" == sk-* ]] || { echo "GAGAL: DEEPSEEK_API_KEY tidak ada di .env"; exit 1; }
echo "URL DB  : $(echo "$POOL_URL" | sed -E 's#(postgres(ql)?://[^:]*):[^@]*@#\1:****@#')"
echo "Kunci AI: ${#KEY} karakter"

put() { # put <NAME> <env> <value>
  local name="$1" env="$2" val="$3"
  vercel env rm "$name" "$env" --yes >/dev/null 2>&1 || true
  printf '%s' "$val" | vercel env add "$name" "$env" >/dev/null 2>&1 \
    && echo "+ $name ($env)" || echo "GAGAL $name ($env)"
}

put DATABASE_URL production "$POOL_URL"
put DATABASE_URL preview "$POOL_URL"
put DEEPSEEK_API_KEY production "$KEY"
put NEXT_PUBLIC_APP_URL production "$GIT_URL"
put AUTH_URL production "$GIT_URL"
