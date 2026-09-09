# Banco

PostgreSQL 15+ com Prisma Client v7. Schema em `prisma/schema.prisma`,
histórico em `prisma/migrations/`, config em `prisma.config.ts`.

## Comandos

```bash
npx prisma validate          # confere o schema
npx prisma generate          # regenera o cliente (pós-instalação roda sozinho)
npx prisma migrate status    # compara histórico com o banco
npx prisma migrate deploy    # aplica pendentes (CI, Vercel, Compose)
npx prisma migrate dev --name ajuste  # nova migração em desenvolvimento
npx prisma studio            # navega os dados
```

## Migrador do contêiner

`docker/app/entrypoint.sh` aguarda o banco e roda
`docker/app/migrar.mjs`, que aplica `prisma/migrations/*/migration.sql`
em ordem e regista em `_prisma_migrations` (mesma soma do
`migrate deploy`, interoperáveis). Na Vercel, o build roda
`prisma migrate deploy` antes do `next build` (ver `vercel.json`).

## Reposição local

```bash
DATABASE_URL=postgresql://... node docker/postgres/repor.mjs
```

Apaga tabelas, funções e o registo de migrações. Nunca em produção:
o workflow `db-reset.yml` trava o destino e só vale sem usuários reais.

## RLS

As políticas `isolamento_*` exigem `app.usuario_atual`; sem contexto,
zero linhas. O papel `app_teste` (sem bypass) prova as políticas em
`npm run test:api`. A aplicação conecta com o dono do schema e filtra
pelo dono em cada consulta (ver `docs/arquitetura.md`).
