#!/usr/bin/env bash
set -euo pipefail

URL="${HEALTH_URL:-http://localhost:5000/api/health}"
TRIES="${TRIES:-12}"
DELAY="${DELAY:-5}"

for i in $(seq 1 "$TRIES"); do
  if body=$(curl -fsS "$URL"); then
    echo "$body"
    echo "staging sain (tentative $i/$TRIES)"
    exit 0
  fi
  echo "[ATTENTE] tentative $i/$TRIES : pas encore sain" >&2
  sleep "$DELAY"
done

echo "staging non sain apres $TRIES tentatives" >&2
exit 1
