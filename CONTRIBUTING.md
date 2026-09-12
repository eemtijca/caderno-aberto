# Contribuindo

## Rotina

```bash
npm install
cp .env.example .env  # preencha DATABASE_URL, AUTH_SECRET, CRON_SECRET
npx prisma migrate deploy
npm run dev
```

Verificações antes de abrir PR: `npm run format:check`,
`npm run lint`, `npm run tsc`, `npm test`.

## Convenções

- Código e comentários em pt-BR, curtos e diretos.
- Domínio em português (`notas`, `turmas`); infra em inglês
  (`backup`, `token`, nomes de pacotes).
- Rotas: sessão via `sessaoProfessor`, filtro pelo dono no banco,
  respostas via `json`/`erroApi` (sem detalhes internos).
- Datas do banco trafegam como `Date` no servidor e ISO no JSON.
- Migrações: `npx prisma migrate dev --name ajuste`; nunca edite
  migração aplicada — crie outra.
- Testes Vitest seguem `tests/README.md`; massa com `@exemplo.br`.
- Segredos só via ambiente (ver `docs/ambiente.md`).

## Decisões (ADRs)

Mudanças estruturais ganham nota curta em `docs/adr/`:
contexto, decisão e consequências.
