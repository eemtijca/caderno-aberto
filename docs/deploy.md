# Deploy

## Vercel (recomendado para o app)

1. Banco: qualquer PostgreSQL 15+ com conexão direta.
2. Variáveis do `.env.example`: `DATABASE_URL` (pooler de transação
   com `?pgbouncer=true` e `?sslmode=require`), `DIRECT_URL` (pooler
   de sessão `:5432` para o `migrate deploy` do build), `AUTH_SECRET`,
   `APP_URL`, `EMAIL_DRIVER=resend`
   - `RESEND_API_KEY` e domínio verificado, `STORAGE_DRIVER=s3` + 5
     `STORAGE_S3_*`, `CRON_SECRET`. Nunca `ALLOW_TEST_OUTBOX=1`, nunca
     `STORAGE_DRIVER=disk` (disco efêmero).
3. Build (`vercel.json` executa `npm run vercel-build`): `prisma generate &&
prisma migrate deploy && next build`.
   O Cron diário chama `GET /api/conta/restaurar` com o segredo.
4. Previews apontam para staging, nunca produção.

## Compose (self-hosted)

```bash
cp .env.example .env
# Preencha AUTH_SECRET e CRON_SECRET no .env
docker compose up --build
```

Sobe PostgreSQL 17 + app em `http://localhost:3000`. O entrypoint
migra e serve; imagens no volume `uploads`. Alternar para S3 exige
as 5 `STORAGE_S3_*` no ambiente do serviço `app`.

## Sem Docker

```bash
npm install
cp .env.example .env  # preencha DATABASE_URL e segredos
npx prisma migrate deploy
npm run dev
```
