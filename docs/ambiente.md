# Ambiente

Todas as variáveis passam por `src/lib/ambiente.ts` (zod, falha cedo).
Espelho para copiar: `.env.example`.

## Obrigatórias

- `DATABASE_URL`: PostgreSQL direto `:5432` (nunca pooler de
  transação `:6543`, incompatível com instruções preparadas). No
  Supabase + Vercel serverless, é o pooler de transação `:6543` com
  `?pgbouncer=true` (runtime via `PrismaPg`).
- `AUTH_SECRET`: 32+ bytes aleatórios (`openssl rand -base64 32`).
- `CRON_SECRET`: segredo da purga, obrigatório em produção. A Vercel
  envia sozinha como `Authorization` no Cron.

## Conexão de migrações

- `DIRECT_URL` (opcional em local/CI, cai em `DATABASE_URL`):
  conexão do CLI Prisma (`migrate deploy/status`): pooler de sessão
  `:5432` ou direta `db.[projeto].supabase.co:5432`. Obrigatória onde
  o runtime usa o pooler de transação `:6543` (Supabase). O endpoint
  direto é IPv6 (ou IPv4 com o add-on); na dúvida, prefira o pooler
  de sessão `:5432`. Configurada em `prisma.config.ts`
  (`datasource.url`); em Prisma 7 a conexão do CLI não vive no
  `schema.prisma`.

## Opcionais

- `APP_URL`: origem canônica (`https://app.exemplo.br`). Obrigatória
  em produção; sem ela, links de e-mail usam o host do pedido.
- `EMAIL_DRIVER=log|smtp|resend` (padrão `log`), `EMAIL_FROM`,
  `SMTP_URL`, `RESEND_API_KEY`.
- `STORAGE_DRIVER=disk|s3` (padrão `disk`), `UPLOAD_DIR`,
  `STORAGE_S3_*` (5, exigidas com `s3`).
- `AUTH_LIMITE_TENTATIVAS=30`, `AUTH_LIMITE_EMAIL=10` (janela de 5 min).
- `ALLOW_TEST_OUTBOX=0`: caixa de teste. `1` só com `TESTES_CI=1`;
  recusado em produção.
- `NEXT_PUBLIC_APP_VERSION`: carimbo exibido na interface.

## Regras

- Nunca `ALLOW_TEST_OUTBOX=1` fora de dev/CI (expõe tokens).
- Nunca reutilize segredos de dev (`caderno`, dummies do CI) em prod.
- Com Docker Compose, defina `AUTH_SECRET` e `CRON_SECRET` no `.env`;
  o resto segue o padrão do `compose.yml`.
