#!/bin/sh
# Ponto de entrada do contêiner da aplicação.
# Aguarda o banco, aplica as migrações e inicia o servidor.
set -eu

echo "[entrada] Aguardando o banco..."
# O endereço é mascarado para não expor a senha nos logs.
mascarado=$(echo "$DATABASE_URL" | sed -E 's#(://[^:]+:)[^@]+@#\1***@#')
echo "[entrada] Destino: $mascarado"
# Até 120 s de espera (60 tentativas de 2 s).
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

# Cria ou atualiza o admin inicial quando as variáveis estiverem definidas.
if [ -n "${ADMIN_EMAIL:-}" ] && [ -n "${ADMIN_SENHA:-}" ]; then
  echo "[entrada] Configurando administrador..."
  node ./scripts/criar-admin.mjs || echo "[entrada] Aviso: falha ao configurar o admin."
fi

exec node server.js
