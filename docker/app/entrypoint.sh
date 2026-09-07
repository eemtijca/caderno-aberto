#!/bin/sh
# Ponto de entrada do contêiner da aplicação.
# Aguarda o banco, aplica as migrações e inicia o servidor.
set -eu

echo "[entrada] Aguardando o banco em $DATABASE_URL..."
for i in $(seq 1 60); do
  if node ./docker/app/migrar.mjs; then
    break
  fi
  if [ "$i" -eq 60 ]; then
    echo "[entrada] Banco indisponível após 60 tentativas."
    exit 1
  fi
  sleep 2
done

echo "[entrada] Iniciando o servidor..."
exec node server.js
