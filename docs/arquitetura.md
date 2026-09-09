# Arquitetura

Next.js 16 (App Router) + PostgreSQL 15+ via Prisma Client v7.

## Camadas

- `src/app/api/`: rotas HTTP. Cada rota resolve a sessão
  (`sessaoProfessor`), filtra pelo dono no banco e responde JSON.
  Páginas: só `src/app/page.tsx` (shell `#/...`) e `src/app/l/[token]`.
- `src/lib/auth/`: scrypt (N=131072), JWT de acesso (1h) + refresh
  opaco com rotação (30d) em cookies HttpOnly.
- `src/lib/banco.ts`: singleton do PrismaClient (`banco()`).
  `src/lib/banco/tipos.ts` espelha o schema para o servidor.
- `src/lib/armazenamento/`: interface única (`disk` local ou `s3`
  S3-compatível). O caminho relativo é a chave.
- `src/lib/email/`: interface única (`log`, `smtp`, `resend`) com
  outbox em memória só nos testes.
- `src/lib/notas/`: AST de blocos, LaTeX, Markdown, busca e tipos.
- `src/components/`: editor, vistas e `ui/` (shadcn).

## Isolamento entre professores

Toda consulta carrega `professorId`/`usuario.id` no `where` do banco.
As políticas RLS (`app.usuario_atual`) são segunda barreira, provadas
em `tests/api/isolamento.test.ts`; o isolamento real é o filtro da API,
coberto em `tests/api/contratos.test.ts`.
