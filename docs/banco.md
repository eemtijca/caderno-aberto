# Banco

PostgreSQL 15+ com Prisma Client v7. Schema em `prisma/schema.prisma`,
migration única em `prisma/migrations/`, config em `prisma.config.ts`
(CLI usa `DIRECT_URL` com fallback para `DATABASE_URL`; runtime usa
`DATABASE_URL` via `PrismaPg` em `src/lib/banco.ts`).

## Comandos

```bash
npx prisma validate          # confere o schema
npx prisma generate          # regenera o cliente (pós-instalação roda sozinho)
npx prisma migrate status    # compara histórico com o banco
npx prisma migrate deploy    # aplica pendentes (CI, Vercel, Compose)
npx prisma migrate dev --name ajuste  # nova migração em desenvolvimento
npx prisma studio            # navega os dados
```

Com `DIRECT_URL` definida, `migrate status/deploy` conectam por ela
(Supabase: pooler de sessão `:5432`); sem ela, usam `DATABASE_URL`
(local/CI).

## Migrador do contêiner

`docker/app/entrypoint.sh` aguarda o banco e roda
`docker/app/migrar.mjs`, que aplica `prisma/migrations/*/migration.sql`
em ordem (prefere `DIRECT_URL`, cai em `DATABASE_URL`) e regista em
`_prisma_migrations` (mesma soma do `migrate deploy`,
interoperáveis). Em seguida aplica `prisma/scripts/rls-teste.sql`
(papel `app_teste`, só local/CI). O build da Vercel não migra (só
`prisma generate && next build`); o Supabase de produção é migrado
pela Action `db-migrate` no push em `main` (ver `docs/deploy.md`).

## Reposição local

```bash
DATABASE_URL=postgresql://... node docker/postgres/repor.mjs
```

Apaga tabelas, funções e o registo de migrações. Nunca em produção.
Após `repor.mjs`, derrube e suba o Compose (`down -v` + `up --build`)
para reaplicar a migration única do zero.

## RLS

As políticas `isolamento_*` exigem `app.usuario_atual`; sem contexto,
zero linhas. O papel `app_teste` (sem bypass, criado só em local/CI
por `prisma/scripts/rls-teste.sql`) prova as políticas em
`npm run test:api`. No Supabase o papel não existe (o `postgres` já
tem `BYPASSRLS`); as policies seguem valendo para os demais papéis.
A aplicação conecta com o dono do schema e filtra
pelo dono em cada consulta (ver `docs/arquitetura.md`).
