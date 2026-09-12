# Deploy

A aplicação é um único processo Node. O banco é um PostgreSQL 15 ou superior, local no Compose ou gerenciado, como o Supabase.

## Vercel (recomendado para o aplicativo)

1. Banco: qualquer PostgreSQL 15 ou superior. No Supabase, o runtime usa o pooler de transação `:6543` com `?pgbouncer=true` e `?sslmode=require`; o CLI de migrações usa `DIRECT_URL` no pooler de sessão `:5432`.
2. Variáveis conforme [.env.example](../.env.example): `DATABASE_URL`, `AUTH_SECRET`, `APP_URL`, `EMAIL_DRIVER=resend` com `RESEND_API_KEY` e domínio verificado, `STORAGE_DRIVER=s3` com as cinco `STORAGE_S3_*` e `CRON_SECRET`. Nunca usar `ALLOW_TEST_OUTBOX=1` e nunca usar `STORAGE_DRIVER=disk`, pois o disco é efêmero. A Vercel não usa `DIRECT_URL`.
3. Build: `vercel.json` executa `npm run vercel-build`, que roda `prisma generate && next build`. Previews estão desativados (`git.deploymentEnabled` publica apenas `main`).
4. Migrações: a Action `db-migrate` roda no push em `main` quando há alteração em `prisma/migrations/**`, usando `DIRECT_URL_PROD` (pooler de sessão `:5432`) no environment `production`, com revisor obrigatório. Deploy e migração disparam juntos, portanto o aplicativo novo pode entrar no ar antes de a migração terminar.
5. Agendador: o `vercel.json` registra o Cron diário em `GET /api/conta/restaurar`. A Vercel envia `CRON_SECRET` automaticamente no cabeçalho `Authorization`.
6. Produção: use um papel dono do schema na `DATABASE_URL`. As políticas RLS funcionam como segunda barreira, e o isolamento real é aplicado pela API.

## Compose (auto-hospedado)

```bash
cp .env.example .env
# Preencha AUTH_SECRET e CRON_SECRET no .env
docker compose up --build
```

Sobe o PostgreSQL 17 e o aplicativo em http://localhost:3000. O entrypoint migra e serve; as imagens ficam no volume `uploads`. Para usar S3, informe as cinco `STORAGE_S3_*` no serviço `app`.

## Sem Docker

```bash
npm install
cp .env.example .env  # preencha DATABASE_URL e os segredos
npx prisma migrate deploy
npm run dev
```

## CI (GitHub Actions)

Quatro workflows em `.github/workflows/`, todos com Node 24 e Ubuntu:

| Workflow     | Gatilho                                                | Etapas                                                                                         |
| ------------ | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| `quality`    | Push em `main` e pull request                          | `format:check`, `lint`, `tsc` e `test:unit`                                                    |
| `build`      | Push em `main` e pull request                          | `next build` com `DATABASE_URL` e `AUTH_SECRET` fictícios e `EMAIL_DRIVER=log`                 |
| `test-db`    | Push em `main` e pull request                          | Sobe o Compose, aplica a migration com o papel `app_teste`, roda `test:api` e `test:contratos` |
| `db-migrate` | Push em `main` com alteração em `prisma/migrations/**` | `prisma migrate deploy` no Supabase de produção com `DIRECT_URL_PROD`                          |

Os testes de ponta a ponta (Playwright) não fazem parte do CI e devem ser executados localmente com o aplicativo no ar.

## Rollback e ordem de implantação

O deploy da Vercel e a migração disparam no mesmo push. Como o aplicativo pode entrar no ar antes de a migração terminar, mudanças de schema devem ser compatíveis com a versão anterior (adicionar colunas com padrão, evitar remoções imediatas). Para reverter:

1. Reverta o commit de código na Vercel.
2. Para uma migração já aplicada, crie uma nova migração corretiva. Nunca edite nem remova a migração aplicada.

## Verificação pós-deploy

- `GET /api` responde com `{ app, versao }`.
- Login, criação de nota e abertura do link público funcionam.
- `npx prisma migrate status` com `DIRECT_URL` de produção não indica pendências.
