# Banco

PostgreSQL 15 ou superior com Prisma Client v7. O schema fica em `prisma/schema.prisma`, a migration única em `prisma/migrations/` e a configuração do CLI em `prisma.config.ts`. O CLI usa `DIRECT_URL` com fallback para `DATABASE_URL`; o runtime usa `DATABASE_URL` via `PrismaPg` em `src/lib/banco.ts`.

A descrição das entidades e do vocabulário do domínio está em [modelo-de-dados.md](modelo-de-dados.md).

## Comandos

```bash
npx prisma validate                      # confere o schema
npx prisma generate                      # regenera o cliente (o postinstall também executa)
npx prisma migrate status                # compara o histórico com o banco
npx prisma migrate deploy                # aplica pendentes (CI, Vercel, Compose)
npx prisma migrate dev --name ajuste     # cria nova migração em desenvolvimento
npx prisma studio                        # navega os dados
```

Com `DIRECT_URL` definida, `migrate status` e `migrate deploy` conectam por ela (no Supabase, pooler de sessão `:5432`). Sem ela, usam `DATABASE_URL`.

Nunca edite uma migração já aplicada. Crie uma nova com `prisma migrate dev`.

## Migrador do contêiner

`docker/app/entrypoint.sh` aguarda o banco e executa `docker/app/migrar.mjs`, que aplica `prisma/migrations/*/migration.sql` em ordem. O migrador prefere `DIRECT_URL` e cai em `DATABASE_URL`, registra em `_prisma_migrations` com o mesmo checksum do `migrate deploy` e aborta se detectar divergência de checksum. O papel `app_teste` não é criado pelo contêiner: ele é aplicado por `npm run test:api` e no CI, apenas em local e CI.

O build da Vercel não migra (executa apenas `prisma generate && next build`). O Supabase de produção é migrado pela Action `db-migrate` no push em `main`. Ver [deploy.md](deploy.md).

## Reposição local

```bash
DATABASE_URL=postgresql://... node docker/postgres/repor.mjs
```

O script apaga as tabelas do aplicativo, o registro de migrações e as funções de sincronização. Não remove extensões nem o papel `app_teste`. Nunca execute em produção. Depois da reposição, derrube e suba o Compose (`docker compose down -v` e `docker compose up --build`) para reaplicar a migration do zero.

## RLS

As políticas `isolamento_*` exigem `app.usuario_atual`; sem contexto, nenhuma linha é visível. O papel `app_teste`, sem bypass e criado apenas em local e CI por `prisma/scripts/rls-teste.sql`, prova as políticas em `npm run test:api`. No Supabase o papel não existe, pois o usuário `postgres` já tem `BYPASSRLS`; as políticas seguem valendo para os demais papéis.

A aplicação conecta com o dono do schema e filtra pelo dono em cada consulta. A RLS é a segunda barreira, enquanto o filtro da API é o isolamento efetivo. Ver [arquitetura.md](arquitetura.md) e [ADR-003](adr/003-isolamento.md).

## Purga de contas

`GET` e `DELETE /api/conta/restaurar` removem, em lotes de 100, os perfis com `exclusaoSolicitadaEm` preenchido e `expiraEm` vencido. A remoção do usuário cascateia para perfil, sessões, códigos, disciplinas, turmas, notas e links. A rota exige `Authorization: Bearer <CRON_SECRET>` e é agendada pelo Cron da Vercel. Detalhes em [operacao.md](operacao.md).

## Índices

O schema define índices para os acessos mais frequentes:

- `notas`: `(professorId, anoLetivo, mes)`, `(professorId, atualizadoEm)`, `(professorId, disciplinaId)` e `(professorId, status)`.
- `disciplinas`: `(professorId)` com unicidade `(professorId, nome)`.
- `turmas`: `(professorId, anoLetivo)` com unicidade `(professorId, nome, anoLetivo)`.
- `links`: `(professorId)`, `(notaId)`, `(turmaId)`, `(disciplinaId)` e `(token)`.
- `sessoes`: índices por usuário e por expiração.
- `codigos_acesso`: índice por `lower(email)`, por `expira_em` e unicidade parcial de `(lower(email), tipo)` entre códigos não usados.
- `solicitacoes_acesso`: índice por `(status, criado_em)` e unicidade parcial de `(lower(email), tipo)` entre pendentes.
- `eventos_seguranca`: índices por `criado_em` e por `lower(email)`.
- `tentativas_limite`: chave primária composta `(chave, feitaEm)` e índice por `feitaEm`.

## Campos denormalizados

A tabela `notas` guarda cópias de dados de disciplina e turma (`disciplina_nome`, `disciplina_cor`, `turmas_ids`, `turmas_nomes`) e a coluna `busca`, com o texto normalizado usado na busca textual. Essas cópias evitam joins na listagem e são recalculadas nas rotas de criação, edição, duplicação e importação. A relação opcional com `disciplinas` usa `onDelete: SetNull`: excluir a disciplina preserva as notas e apenas desvincula.
