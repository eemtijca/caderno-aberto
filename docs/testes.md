# Testes

Ver `tests/README.md` para comandos e pré-requisitos.

## Convenção

- Vitest em `tests/**/*.test.ts` (`vitest.config.ts`, alias `@`, node).
- `describe` por arquivo/área, `it` por comportamento, mensagens em pt-BR.
- API e contratos exigem banco migrado; contratos e e2e exigem o app
  com `ALLOW_TEST_OUTBOX=1` (nunca em produção).
- Massa de teste usa `@exemplo.br` e limpeza ao final (`afterAll` ou
  deletes). Nada de dados reais.

## CI

- `quality`: formato, lint, tipos e unit.
- `build`: compilação com valores fictícios.
- `test-db`: sobe Compose, aplica migrações e roda isolamento +
  contratos. E2E roda local (`npm run test:e2e`).
