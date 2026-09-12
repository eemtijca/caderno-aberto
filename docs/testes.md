# Testes

Comandos e pré-requisitos estão em [../tests/README.md](../tests/README.md). Esta página descreve a convenção e a integração contínua.

## Convenção

- Vitest em `tests/**/*.test.ts` (`vitest.config.ts`, alias `@`, ambiente node).
- `describe` por arquivo ou área, `it` por comportamento, com mensagens em português.
- Testes de API e de contratos exigem banco migrado. Contratos e e2e exigem o app no ar com `ALLOW_TEST_OUTBOX=1`, que nunca deve ser usado em produção.
- A massa de teste usa `@exemplo.br` e limpeza ao final (`afterAll` ou exclusões). Nada de dados reais.

## Estrutura das suítes

| Suíte      | Arquivo                        | Dependências                       | Cobertura                                                              |
| ---------- | ------------------------------ | ---------------------------------- | ---------------------------------------------------------------------- |
| Unit       | `tests/unit/notas.test.ts`     | Nenhuma                            | LaTeX e Markdown, autocontenção, round-trip e aparência                |
| Isolamento | `tests/api/isolamento.test.ts` | `DATABASE_URL` e papel `app_teste` | Políticas RLS sem e com contexto, escrita cruzada entre professores    |
| Contratos  | `tests/api/contratos.test.ts`  | App no ar e outbox habilitada      | Rotas HTTP de conta, CRUD, links públicos, imagens e backup            |
| E2E        | `e2e/*.spec.ts`                | App no ar e Playwright             | Autenticação, notas, links, conta, navegação, pública e casos extremos |

## Boas práticas

- Cada teste cria os próprios dados e não depende de ordem de execução.
- Prefira asserções sobre comportamento observável a detalhes de implementação.
- Para novos comportamentos, adicione o caso ao arquivo de suíte correspondente.
- Ao alterar contratos da API, atualize `tests/api/contratos.test.ts`.

## CI

- `quality`: formato, lint, tipos e testes unitários.
- `build`: compilação com valores fictícios de ambiente.
- `test-db`: sobe o Compose, aplica as migrações com o papel `app_teste` e roda isolamento e contratos.
- Os testes e2e rodam localmente com `npm run test:e2e` e não fazem parte do CI.

Detalhes de deploy em [deploy.md](deploy.md).
