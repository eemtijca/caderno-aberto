# Testes

Suítes Vitest de unidade e de API e uma suíte Playwright. A convenção geral está em [docs/testes.md](../docs/testes.md).

## Pré-requisitos

```bash
# Banco local com a migration aplicada.
export DATABASE_URL=postgresql://caderno:caderno@localhost:5432/caderno
npx prisma migrate deploy
```

## Suítes

```bash
npm test                    # tudo (unit, api, contratos, códigos, segurança e destrutivas)
npm run test:unit           # bibliotecas puras e guarda editorial
npm run test:api            # isolamento RLS com o papel app_teste
npm run test:contratos      # API de ponta a ponta (exige o app no ar)
npm run test:codigos        # códigos de acesso e console admin
npm run test:seguranca      # CSRF, cabeçalhos, cron, sessão e não enumeração
npm run test:destrutivas    # lixeira, step-up e dry-run do backup
npm run test:e2e:docker     # interface na imagem oficial, com o app no ar
npm run test:e2e            # alternativa local, sobe o app sozinho
npm run capturas:readme     # capturas do README em docs/imagens
```

- `test:unit` (`tests/unit/`): sem banco e sem rede. Inclui a guarda editorial `texto-ui.test.ts` e grava `.tex` de exemplo em `tests/tex/` para compilação manual com `tectonic`.
- `test:api` (`tests/api/isolamento.test.ts`): prova as políticas RLS com massa fixa e limpeza ao final. O próprio comando aplica antes `prisma/scripts/rls-teste.sql`, que cria o papel `app_teste`, presente apenas em local e CI e ausente no Supabase. Exige `DATABASE_URL` com a migration aplicada.
- `test:contratos` (`tests/api/contratos.test.ts`): verificações HTTP contra `TEST_BASE_URL` (padrão `http://127.0.0.1:3000`). A massa cria um admin no banco via `DATABASE_URL`, portanto ambas as variáveis são necessárias.
- `test:codigos` e `test:seguranca` cobrem o fluxo de código, o console admin, CSRF, cabeçalhos, cron e sessão contra o app no ar. `test:destrutivas` cobre suspensão com step-up, lixeira e dry-run do backup e não roda no CI.
- `test:e2e:docker` roda o Playwright na imagem oficial da Microsoft com o aplicativo no ar; `test:e2e` é a alternativa local, sobe `npm run dev` sozinho e prepara o admin fixo no `globalSetup`. Usa `http://localhost:3000` como base, host que o Playwright trata como local para enviar o cookie de sessão `Secure` em `page.request`.

## Capturas do README

As imagens do README ficam em `docs/imagens/` e são geradas por `e2e/imagens.spec.ts`, com o aplicativo no ar e o banco migrado:

```bash
npm run capturas:readme         # Playwright local
npm run capturas:readme:docker  # imagem oficial, com o aplicativo no ar
```

O spec cria a própria conta e a nota de exemplo, captura o editor em 1440x900 e a vista pública `/l/demo-landing` em 390x844, nos temas claro e escuro, sempre com massa sintética. Não edite os PNGs à mão: regenere pelo comando e revise o diff.

## Limites de tentativas

A suíte usa `AUTH_LIMITE_TENTATIVAS=1000` e `AUTH_LIMITE_CODIGO=1000` no Playwright (ver `playwright.config.ts`). Em produção valem 30 e 5.

## Massa de teste

Os dados de teste usam o domínio `@exemplo.br` e são removidos ao final de cada suíte (`afterAll` ou exclusões explícitas). Nunca use dados reais.
