# Testes

Três suítes Vitest e uma suíte Playwright. A convenção geral está em [docs/testes.md](../docs/testes.md).

## Pré-requisitos

```bash
# Banco local com a migration aplicada.
export DATABASE_URL=postgresql://caderno:caderno@localhost:5432/caderno
npx prisma migrate deploy
```

## Suítes

```bash
npm test               # tudo (unit, api e contratos)
npm run test:unit      # bibliotecas puras (LaTeX, Markdown, aparência)
npm run test:api       # isolamento RLS com o papel app_teste
npm run test:contratos # API de ponta a ponta (exige o app no ar)
npm run test:e2e       # interface (exige o app no ar)
```

- `test:unit` (`tests/unit/notas.test.ts`): sem banco e sem rede. Também grava `.tex` de exemplo em `tests/tex/` para compilação manual com `tectonic`.
- `test:api` (`tests/api/isolamento.test.ts`): prova as políticas RLS com massa fixa e limpeza ao final. O próprio comando aplica antes `prisma/scripts/rls-teste.sql`, que cria o papel `app_teste`, presente apenas em local e CI e ausente no Supabase. Exige `DATABASE_URL` com a migration aplicada.
- `test:contratos` (`tests/api/contratos.test.ts`): verificações HTTP contra `TEST_BASE_URL` (padrão `http://127.0.0.1:3000`). Lê os e-mails em `/api/teste/outbox`, portanto o app precisa rodar com `ALLOW_TEST_OUTBOX=1`.
- `test:e2e` (`e2e/`): Playwright em 3 navegadores. Sobe `npm run dev` sozinho e usa a mesma outbox. Fora do CI, execute localmente.

## Limites de tentativas

A suíte usa `AUTH_LIMITE_TENTATIVAS=1000` e `AUTH_LIMITE_EMAIL=1000` (ver `playwright.config.ts`). Em produção valem 30 e 10.

## Massa de teste

Os dados de teste usam o domínio `@exemplo.br` e são removidos ao final de cada suíte (`afterAll` ou exclusões explícitas). Nunca use dados reais.
