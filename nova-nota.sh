#!/usr/bin/env bash
# Cria uma nota de aula nova a partir de modelo.tex.
#
#   ./nova-nota.sh <nome-do-arquivo> "<Título>" ["<linha de créditos>"]
#
# Exemplo:
#   ./nova-nota.sh 2026-09-ondas "Ondas mecânicas"
set -euo pipefail

cd "$(dirname "$0")"

if [ $# -lt 2 ]; then
  echo 'uso: ./nova-nota.sh <nome-do-arquivo> "<Título>" ["<créditos>"]' >&2
  echo 'ex.: ./nova-nota.sh 2026-09-ondas "Ondas mecânicas"'          >&2
  exit 1
fi

NOME="${1%.tex}"
TITULO="$2"

# créditos padrão: "3º ano · Física · <Mês>/<Ano> · Prof. Josué Cavalcante"
MESES=(janeiro Janeiro Fevereiro Março Abril Maio Junho Julho Agosto \
       Setembro Outubro Novembro Dezembro)
MES="${MESES[$(date +%-m)]}"
PADRAO="3º ano · Física · ${MES}/$(date +%Y) · Prof. Josué Cavalcante"
CREDITOS="${3:-$PADRAO}"

DESTINO="notas/${NOME}.tex"
if [ -e "$DESTINO" ]; then
  echo "ERRO: $DESTINO já existe. Escolha outro nome." >&2
  exit 1
fi

mkdir -p notas
# substitui título e créditos preservando o resto do modelo
NOME_ESC=$(printf '%s' "$TITULO"   | sed -e 's/[&|\\]/\\&/g')
CRED_ESC=$(printf '%s' "$CREDITOS" | sed -e 's/[&|\\]/\\&/g')
sed -e "s|^\\\\titulonota{.*}$|\\\\titulonota{${NOME_ESC}}|" \
    -e "s|^\\\\creditos{.*}$|\\\\creditos{${CRED_ESC}}|" \
    modelo.tex > "$DESTINO"

echo "criada: $DESTINO"
echo "  título:   $TITULO"
echo "  créditos: $CREDITOS"
echo
echo "compile com:  make pdf/${NOME}.pdf"
