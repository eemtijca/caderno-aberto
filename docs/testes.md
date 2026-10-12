# Testes

Comandos e pré-requisitos estão em [../tests/README.md](../tests/README.md). Esta página descreve a convenção e a integração contínua.

## Convenção

- Vitest em `tests/**/*.test.ts` (`vitest.config.ts`, alias `@`, ambiente node).
- `describe` por arquivo ou área, `it` por comportamento, com mensagens em português.
- Testes de API e de contratos exigem banco migrado e o app no ar para os contratos.
- A massa de teste usa `@exemplo.br` e limpeza ao final (`afterAll` ou exclusões). Nada de dados reais.

## Estrutura das suítes

| Suíte              | Arquivo                         | Dependências                       | Cobertura                                                                                   |
| ------------------ | ------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------- |
| Unit               | `tests/unit/*.test.ts`          | Nenhuma                            | LaTeX e Markdown, código de acesso, HMAC, limites e guarda editorial                        |
| Isolamento         | `tests/api/isolamento.test.ts`  | `DATABASE_URL` e papel `app_teste` | Políticas RLS sem e com contexto, escrita cruzada e tabelas novas                           |
| Contratos          | `tests/api/contratos.test.ts`   | App no ar                          | Rotas HTTP de conta, CRUD, links públicos, imagens e backup                                 |
| Códigos            | `tests/api/codigos.test.ts`     | App no ar e `DATABASE_URL`         | Solicitar, atender, usar, expirar, reuso e bloqueio                                         |
| Admin              | `tests/api/admin.test.ts`       | App no ar e `DATABASE_URL`         | Guarda de papel e CRUD de contas                                                            |
| Segurança          | `tests/api/seguranca.test.ts`   | App no ar                          | CSRF, cabeçalhos, cron e não enumeração                                                     |
| Sessão             | `tests/api/sessao.test.ts`      | App no ar e `DATABASE_URL`         | Rotação e reuso de refresh, logout e troca de senha                                         |
| Destrutivas        | `tests/api/destrutivas.test.ts` | App no ar e `DATABASE_URL`         | Suspensão com step-up, lixeira e dry-run do backup                                          |
| E2E                | `e2e/*.spec.ts`                 | App no ar e Playwright             | Autenticação, código, admin, notas, links, conta e casos extremos                           |
| Capturas do README | `e2e/imagens.spec.ts`           | App no ar, banco migrado e semente | PNGs de `docs/imagens/` em 1440x900 e 390x844, nos temas claro e escuro, com massa realista |

## Boas práticas

- Cada teste cria os próprios dados e não depende de ordem de execução.
- Prefira asserções sobre comportamento observável a detalhes de implementação.
- Para novos comportamentos, adicione o caso ao arquivo de suíte correspondente.
- Ao alterar contratos da API, atualize `tests/api/contratos.test.ts`.

## Capturas do README

As imagens do README são geradas por `e2e/imagens.spec.ts` e gravadas em `docs/imagens/`, com o aplicativo no ar e a semente de desenvolvimento aplicada. O spec não cria conta nem nota: ele entra com o professor semeado (`helena.duarte@exemplo.br`, definido em `scripts/seed.mjs`), abre a nota `Leis de Newton` no editor e a vista pública `/l/semente-nota-leis-de-newton`. Sem a massa, o spec falha com a orientação de rodar `pnpm run seed`.

Capturas em 1440x900 (lista de Notas, lista de Links e editor, claro e escuro) e 390x844 (vista do aluno, claro e escuro):

| Arquivo                     | Tela                                      |
| --------------------------- | ----------------------------------------- |
| `notas-desktop-claro.png`   | Lista de Notas no desktop.                |
| `links-desktop-claro.png`   | Lista de Links no desktop.                |
| `editor-desktop-claro.png`  | Editor de blocos no desktop, tema claro.  |
| `editor-desktop-escuro.png` | Editor de blocos no desktop, tema escuro. |
| `aluno-mobile-claro.png`    | Vista do aluno no celular, tema claro.    |
| `aluno-mobile-escuro.png`   | Vista do aluno no celular, tema escuro.   |

Para regenerar, com o banco migrado e o aplicativo no ar:

```bash
pnpm run seed                    # cria a massa realista da semente
pnpm run capturas:readme         # Playwright local
pnpm run capturas:readme:docker  # imagem oficial da Microsoft
```

No Compose, a semente roda dentro do contêiner com `docker compose exec app node scripts/seed.mjs`, para compartilhar o volume `uploads`. O volume, os parâmetros (`SEED_PERFIL`, `SEED_SEMENTE` e `SEED_LIMPAR`) e a limpeza estão em [ambiente.md](ambiente.md#semente-de-desenvolvimento). Os PNGs versionados em `docs/imagens/` não são editados à mão. Quando a interface mudar, regenere as capturas e confira o diff das imagens no pull request.

## CI

- `qualidade.yml`: formato, lint, tipos e testes unitários.
- `build.yml`: compilação com valores fictícios de ambiente.
- `testes.yml`: sobe o Compose, aplica o RLS de teste e roda isolamento, contratos, códigos, admin, segurança, sessão e os testes e2e no Chromium.
- A suíte destrutivas não roda no CI; execute `pnpm run test:destrutivas` antes de abrir o pull request.
- Os testes e2e completos (Firefox e WebKit) e a suíte de PWA podem ser executados localmente; o fluxo principal é `pnpm run test:e2e:docker`, com o aplicativo no ar.

Detalhes de deploy em [deploy.md](deploy.md).
