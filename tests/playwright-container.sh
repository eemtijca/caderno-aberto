#!/bin/bash
# Roda o Playwright na imagem oficial da Microsoft com o aplicativo já no ar.

set -euo pipefail

RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
IMAGEM="${PLAYWRIGHT_IMAGE:-mcr.microsoft.com/playwright:v1.63.0-noble}"
REDE="${PLAYWRIGHT_DOCKER_NETWORK:-host}"
USUARIO="${PLAYWRIGHT_DOCKER_USER:-$(id -u):$(id -g)}"
BASE_URL="${TEST_BASE_URL:-http://localhost:3000}"
BANCO="${DATABASE_URL:-postgresql://caderno:caderno@localhost:5432/caderno}"
SEGREDO="${AUTH_SECRET:-segredo-dummy-de-32-bytes-para-testes-00}"

exec docker run --rm --init --ipc=host --network "$REDE" \
  --user "$USUARIO" \
  -e HOME=/tmp \
  -v "$RAIZ":/work \
  -w /work \
  -e TEST_BASE_URL="$BASE_URL" \
  -e PLAYWRIGHT_SKIP_WEBSERVER=1 \
  -e DATABASE_URL="$BANCO" \
  -e AUTH_SECRET="$SEGREDO" \
  "$IMAGEM" \
  npx playwright test "$@"
