# Testes

Três suítes Vitest mais o Playwright para a interface.

## Pré-requisitos

```bash
# Banco local com as migrações aplicadas.
export DATABASE_URL=postgresql://caderno:caderno@localhost:5432/caderno
npx prisma migrate deploy
```

## Suítes

```bash
npm test              # tudo (unit + api + contratos)
npm run test:unit     # bibliotecas puras (LaTeX, Markdown, aparência)
npm run test:api      # isolamento RLS com o papel app_teste
npm run test:contratos # API de ponta a ponta (exige o app no ar)
npm run test:e2e      # interface (exige o app no ar)
```

- `test:unit` (`tests/unit/notas.test.ts`): sem banco, sem rede. Também
  grava `.tex` de exemplo em `tests/tex/` para compilação manual.
- `test:api` (`tests/api/isolamento.test.ts`): prova as políticas RLS com
  massa fixa e limpeza ao final. Exige `DATABASE_URL` com migrações.
- `test:contratos` (`tests/api/contratos.test.ts`): 40 verificações HTTP
  contra `TEST_BASE_URL` (padrão `http://127.0.0.1:3000`). Lê os e-mails
  em `/api/teste/outbox`, então o app precisa rodar com
  `ALLOW_TEST_OUTBOX=1`.
- `test:e2e` (`e2e/`): Playwright em 3 navegadores. Sobe `npm run dev`
  sozinho e usa a mesma outbox. Fora do CI; rode localmente.

## Limites de tentativas nos testes

A suíte usa `AUTH_LIMITE_TENTATIVAS=1000 AUTH_LIMITE_EMAIL=1000`
(ver `playwright.config.ts`); em produção valem 30 e 10.
