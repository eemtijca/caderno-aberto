# Testes

Comandos e pré-requisitos estão em [../tests/README.md](../tests/README.md). Esta página descreve a convenção e a integração contínua.

## Convenção

- Vitest em `tests/**/*.test.ts` (`vitest.config.ts`, alias `@`, ambiente node).
- `describe` por arquivo ou área, `it` por comportamento, com mensagens em português.
- Testes de API e de contratos exigem banco migrado e o app no ar para os contratos.
- A massa de teste usa `@exemplo.br` e limpeza ao final (`afterAll` ou exclusões). Nada de dados reais.

## Estrutura das suítes

| Suíte      | Arquivo                        | Dependências                       | Cobertura                                                         |
| ---------- | ------------------------------ | ---------------------------------- | ----------------------------------------------------------------- |
| Unit       | `tests/unit/*.test.ts`         | Nenhuma                            | LaTeX e Markdown, código de acesso, HMAC e limites                |
| Isolamento | `tests/api/isolamento.test.ts` | `DATABASE_URL` e papel `app_teste` | Políticas RLS sem e com contexto, escrita cruzada e tabelas novas |
| Contratos  | `tests/api/contratos.test.ts`  | App no ar                          | Rotas HTTP de conta, CRUD, links públicos, imagens e backup       |
| Códigos    | `tests/api/codigos.test.ts`    | App no ar e `DATABASE_URL`         | Solicitar, atender, usar, expirar, reuso e bloqueio               |
| Admin      | `tests/api/admin.test.ts`      | App no ar e `DATABASE_URL`         | Guarda de papel e CRUD de contas                                  |
| Segurança  | `tests/api/seguranca.test.ts`  | App no ar                          | CSRF, cabeçalhos, cron e não enumeração                           |
| Sessão     | `tests/api/sessao.test.ts`     | App no ar e `DATABASE_URL`         | Rotação e reuso de refresh, logout e troca de senha               |
| E2E        | `e2e/*.spec.ts`                | App no ar e Playwright             | Autenticação, código, admin, notas, links, conta e casos extremos |

## Boas práticas

- Cada teste cria os próprios dados e não depende de ordem de execução.
- Prefira asserções sobre comportamento observável a detalhes de implementação.
- Para novos comportamentos, adicione o caso ao arquivo de suíte correspondente.
- Ao alterar contratos da API, atualize `tests/api/contratos.test.ts`.

## CI

- `quality`: formato, lint, tipos e testes unitários.
- `build`: compilação com valores fictícios de ambiente.
- `test-db`: sobe o Compose, aplica o RLS de teste e roda isolamento, contratos, códigos, admin, segurança, sessão e os testes e2e no Chromium.
- Os testes e2e completos (Firefox e WebKit) podem ser executados localmente com `npm run test:e2e`.

Detalhes de deploy em [deploy.md](deploy.md).
