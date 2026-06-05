#!/bin/sh
set -eu

cd /app

LOCK_HASH_FILE="node_modules/.package-lock.hash"
CURRENT_HASH="$(sha256sum package-lock.json | awk '{print $1}')"
STORED_HASH=""

if [ -f "$LOCK_HASH_FILE" ]; then
  STORED_HASH="$(cat "$LOCK_HASH_FILE")"
fi

if [ ! -d node_modules ] || [ "$CURRENT_HASH" != "$STORED_HASH" ]; then
  echo "Syncing backend dependencies with package-lock.json..."
  npm ci
  mkdir -p node_modules
  printf '%s' "$CURRENT_HASH" > "$LOCK_HASH_FILE"
fi

exec "$@"
