#!/usr/bin/env bash
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

errors=0
required=(
  README.md
  .gitignore
  .gitattributes
  .github/workflows/ci.yml
  server/package.json
  server/.env.example
  server/.dockerignore
  client/package.json
  client/.dockerignore
)

echo "[CHECK] StockPro"

for file in "${required[@]}"; do
  if [[ -f "$file" ]]; then
    echo "[OK] $file"
  else
    echo "[ERREUR] fichier absent: $file" >&2
    errors=$((errors + 1))
  fi
done

tracked_env=$(git ls-files | grep -E '(^|/)\.env(\.[^/]+)?$' | grep -Ev '\.env\.example$' || true)
if [[ -n "$tracked_env" ]]; then
  echo "[ERREUR] fichier(s) d'environnement suivi(s) par Git:" >&2
  echo "$tracked_env" >&2
  errors=$((errors + 1))
else
  echo "[OK] aucun .env suivi"
fi

if [[ "${CHECK_ALLOW_DIRTY:-0}" == "1" ]]; then
  echo "[INFO] controle des modifications locales ignore (CHECK_ALLOW_DIRTY=1)"
elif [[ -n "$(git status --porcelain)" ]]; then
  echo "[ERREUR] modifications locales non validees:" >&2
  git status --short >&2
  errors=$((errors + 1))
else
  echo "[OK] depot propre"
fi

if [[ $errors -gt 0 ]]; then
  echo "[ECHEC] $errors erreur(s)" >&2
  exit 1
fi

echo "[SUCCES] controles valides"
exit 0
