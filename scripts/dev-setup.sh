#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.dev.yml}"
COMPOSE="docker compose -f $COMPOSE_FILE"
g() { $COMPOSE exec -T garage /garage "$@"; }

# Compose needs .env to exist
[ -f .env ] || { cp .env.example .env; echo "Created .env from .env.example"; }
set -a; source .env; set +a

BUCKET="${S3_BUCKET}"
KEY_NAME="dev-key"
NEW_KEY=0

echo "Starting Garage..."
$COMPOSE up -d garage
until g status >/dev/null 2>&1; do sleep 1; done

# Layout (only if the node has no role yet)
if g status | grep -q "NO ROLE ASSIGNED"; then
  NODE_ID=$(g node id -q | cut -d@ -f1)
  g layout assign -z dc1 -c 1G "$NODE_ID"
  g layout apply --version 1
fi

# Bucket
g bucket info "$BUCKET" >/dev/null 2>&1 || g bucket create "$BUCKET"

# Key
if [ -n "${S3_ACCESS_KEY_ID:-}" ] && [ -n "${S3_SECRET_ACCESS_KEY:-}" ]; then
  # Credentials already in .env (CI, or a dev who has them): import that exact key
  KEY_REF="$S3_ACCESS_KEY_ID"
  g key info "$KEY_REF" >/dev/null 2>&1 \
    || g key import --yes -n "$KEY_NAME" "$S3_ACCESS_KEY_ID" "$S3_SECRET_ACCESS_KEY"
else
  # No credentials: create a key and print it for the dev to paste
  KEY_REF="$KEY_NAME"
  if ! g key info "$KEY_REF" >/dev/null 2>&1; then
    g key create "$KEY_NAME"
    NEW_KEY=1
  fi
fi

# Permissions (safe to repeat)
g bucket allow --read --write --owner "$BUCKET" --key "$KEY_NAME"

echo
if [ "$NEW_KEY" = 1 ]; then
  echo "Garage is ready. Add the Key ID and Secret key printed above to .env:"
  echo "  S3_ACCESS_KEY_ID=<Key ID>"
  echo "  S3_SECRET_ACCESS_KEY=<Secret key>"
  echo "Then run: npm run dev"
else
  echo "Garage is ready (key '$KEY_NAME' already exists)."
  echo "If .env has no credentials, get them with:"
  echo "  docker compose -f docker-compose.dev.yml exec garage /garage key info $KEY_NAME --show-secret"
  echo "Then run: npm run dev"
fi
