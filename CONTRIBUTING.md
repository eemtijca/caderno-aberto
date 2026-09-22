# Contribuindo

Guia de desenvolvimento do Caderno Aberto: como preparar o ambiente, propor mudanças, escrever código, testar e documentar. Dúvidas e propostas podem ser abertas como issue; o detalhamento técnico está em [docs/](docs/README.md). Para vulnerabilidades, siga [SECURITY.md](SECURITY.md) e nunca abra issue pública com dados sensíveis.

## Ambiente de desenvolvimento

Pré-requisitos: Node 24 e Docker com Compose no modo recomendado, ou um PostgreSQL 15 ou superior próprio, conforme [docs/ambiente.md](docs/ambiente.md).

```bash
npm install
cp .env.example .env  # preencha AUTH_SECRET e CRON_SECRET
npx prisma migrate deploy
npm run dev
```

Com Docker Compose, o banco e o aplicativo sobem juntos:

```bash
cp .env.example .env
# Gere os segredos com openssl rand -base64 32 e cole em AUTH_SECRET e CRON_SECRET
docker compose up --build
```

O Compose sobe o PostgreSQL 17 e o aplicativo em `http://localhost:3000`, aplica as migrações na partida e serve o build de produção. Comandos úteis na raiz:

| Comando                     | Efeito                                                      |
| --------------------------- | ----------------------------------------------------------- |
| `npm run dev`               | Servidor de desenvolvimento em `http://localhost:3000`.     |
| `docker compose up --build` | Sobe o banco e o aplicativo via Docker Compose.             |
| `docker compose down`       | Derruba o ambiente.                                         |
| `npm run criar-admin`       | Cria o administrador inicial de forma idempotente.          |
| `npx prisma generate`       | Regenera o cliente Prisma (o `postinstall` também executa). |
| `npx prisma migrate deploy` | Aplica as migrações pendentes.                              |
| `npm run format`            | Roda o Prettier.                                            |

## Fluxo de contribuição e pull requests

### Issues e discussão

Descreva o problema ou a proposta antes de codificar quando a mudança for estrutural. Para bugs, inclua passos de reprodução, comportamento observado, comportamento esperado e o commit afetado. Nunca anexe dados reais de professores ou alunos.

### Branches

Parta da `main` atualizada e use o padrão `tipo/descricao-curta`, com o tipo alinhado ao commit principal:

- `feat/` para funcionalidades novas.
- `fix/` para correções.
- `docs/`, `test/`, `refactor/`, `perf/`, `chore/` e `ci/` para os demais casos.

Exemplos presentes no histórico: `feat/experiencia-de-notas-e-acessibilidade` e `feat/seguranca-robustez`.

### Commits

Siga o padrão Conventional Commits, em português, no imperativo e descrevendo o efeito da mudança. Use escopo entre parênteses quando ajudar a localizar a área:

- Tipos: `feat`, `fix`, `docs`, `test`, `refactor`, `perf`, `chore`, `ci`, `build`.
- Escopos comuns: `admin`, `auth`, `notas`, `editor`, `links`, `api`, `docs`, `test`, `e2e`, `ci`, `infra`.

```text
feat(admin): pagina as listas no servidor
fix(links): corrige a contagem de acessos em link expirado
docs: sincroniza a documentação com o estado atual do código
test(e2e): cobre o menu de ajuda na tela de login
```

Mantenha cada commit coerente e reversível de forma isolada. Evite commits de trabalho em andamento na `main`; o histórico da `main` vem de pull requests.

### Pull requests

Um pull request resolve um assunto. Se a mudança misturar refatoração e comportamento, separe em pull requests menores.

A descrição deve conter:

- O problema e o resultado esperado.
- O que mudou e por quê.
- Como validar: comandos executados e, quando aplicável, capturas ou passos de interface.
- Riscos, migrações ou variáveis de ambiente novas.
- A issue relacionada, quando houver.

Antes de abrir, rode as verificações locais:

```bash
npm run format:check
npm run lint
npm run tsc
npm test              # unidade, isolamento, contratos, códigos, admin e segurança
npm run test:e2e      # com o aplicativo no ar
```

Preencha o checklist do template de pull request. Ao alterar comportamento, atualize a documentação correspondente e os testes.

### Revisão e integração contínua

Toda mudança passa por revisão e pelos workflows do GitHub Actions. O CI roda apenas em pull requests; o CD roda no push, pelo deploy da Vercel e pela Action `db-migrate`.

| Workflow         | Etapas                                                                                                           |
| ---------------- | ---------------------------------------------------------------------------------------------------------------- |
| `quality.yml`    | `format:check`, `lint`, `tsc` e `test:unit` em pull requests.                                                    |
| `build.yml`      | `next build` com `DATABASE_URL` e `AUTH_SECRET` fictícios em pull requests.                                      |
| `test-db.yml`    | Sobe o Compose, aplica o RLS de teste e roda isolamento, contratos, códigos, admin, segurança e e2e no Chromium. |
| `db-migrate.yml` | Aplica `prisma migrate deploy` em produção no push para `main` com alteração em `prisma/migrations/**`.          |

Corrija as falhas antes de pedir nova revisão. Pull requests sem CI verde não são mesclados.

### Estratégia de merge

Mescle por merge commit, preservando os commits da branch e o contexto da revisão. Apague a branch após o merge. Não faça force-push em `main` nem reescreva o histórico já mesclado.

## Padrões de código

- Código e comentários em português, curtos e diretos.
- Domínio em português (`notas`, `turmas`); infraestrutura em inglês (`backup`, `token`, nomes de pacotes).
- Rotas: sessão via `sessaoProfessor`, filtro pelo dono no banco e respostas via `json` ou `erroApi`, sem detalhes internos.
- Datas do banco trafegam como `Date` no servidor e ISO no JSON.
- Segredos apenas via ambiente. Ver [docs/ambiente.md](docs/ambiente.md).
- Ao alterar comportamento, atualize a documentação correspondente em [docs/](docs/README.md) e os testes.

### Banco e migrações

Crie migrações com `npx prisma migrate dev --name ajuste`. Nunca edite uma migração aplicada; qualquer ajuste entra como migração nova. O schema é a fonte da verdade em `prisma/schema.prisma`, e os comandos do dia a dia estão em [docs/banco.md](docs/banco.md).

### Formatação e análise estática

O Prettier cuida do estilo, com `prettier-plugin-tailwindcss` para ordenar as classes, e o ESLint cobre as regras do Next e do projeto. Rode `npm run format` e `npm run lint` antes de commitar. Não desative regras sem justificativa no código.

### Comentários no código

- Cada arquivo próprio começa com um cabeçalho curto, de uma a duas linhas, descrevendo seu papel.
- Comente apenas trechos não óbvios, como decisões de segurança, contornos, cálculos e formatos de interoperabilidade.
- Não comente o óbvio nem repita o nome da função no comentário.

## Testes e qualidade

As suítes combinam unidade, integração da API, isolamento no banco e testes de ponta a ponta. Os comandos e pré-requisitos estão em [tests/README.md](tests/README.md); a convenção e a cobertura, em [docs/testes.md](docs/testes.md).

| Suíte              | Requisito                         | Comando                  |
| ------------------ | --------------------------------- | ------------------------ |
| Unidade            | Nenhum                            | `npm run test:unit`      |
| Isolamento (RLS)   | Banco migrado e papel `app_teste` | `npm run test:api`       |
| Contratos          | Aplicativo no ar                  | `npm run test:contratos` |
| Códigos e admin    | Aplicativo no ar e banco          | `npm run test:codigos`   |
| Segurança e sessão | Aplicativo no ar e banco          | `npm run test:seguranca` |
| E2E (Playwright)   | Aplicativo no ar                  | `npm run test:e2e`       |

Regras:

- Cada arquivo cria e limpa a própria massa com `beforeAll` e `afterAll`, usando e-mails datados no domínio `@exemplo.br`. Nunca dependa de dados reais.
- Nenhum teste depende de ordem de execução.
- Ao corrigir um bug, adicione um teste que falharia antes da correção.
- O teste `tests/unit/texto-ui.test.ts` barra travessão, aspas curvas, segunda pessoa explícita e pluralização com parênteses nos textos de interface.

Os testes de ponta a ponta completos (Firefox e WebKit) são de execução local; o CI cobre o Chromium dentro do `test-db`.

## Documentação e ADRs

Mudanças estruturais ganham uma nota curta em [docs/adr/](docs/adr/), com estado, contexto, decisão, alternativas e consequências. Novas notas seguem a numeração sequencial e o formato dos ADRs existentes. O índice fica em [docs/README.md](docs/README.md).

### Padrão da documentação

Toda a documentação usa português brasileiro com acentuação e cedilha corretas, em tom técnico e impessoal. Evite primeira pessoa, exclamações e frases de preenchimento.

Restrições de formatação:

- Não use travessão, meia-risca, reticências tipográficas, aspas curvas, setas ou símbolos decorativos. Use dois-pontos, vírgula, parênteses, `...` e aspas retas.
- Exceção: o ponto médio `·` é o separador aceito entre metadados na interface (por exemplo, `Março/2026 · 3A · Prof. Ana`). O resto do texto segue as regras acima.
- Evite segunda pessoa explícita (`você`) e pluralização com parênteses (`nota(s)`).
- Siga a sintaxe Markdown do GitHub: um único título de nível 1 por arquivo, hierarquia de títulos sem saltos, listas com `-`, cercas de código com linguagem e texto alternativo em imagens.
- Use links relativos para arquivos do repositório e mantenha o texto do link em uma única linha.
- Use alertas (`> [!NOTE]`, `> [!WARNING]`) com parcimônia, no máximo um ou dois por documento.
- Valide com `npm run format` antes de enviar.

### Padrão da interface

Os tokens visuais ficam em `src/app/globals.css`, sobre Tailwind CSS v4, e os componentes base em `src/components/ui/` (shadcn/ui). A tipografia usa Sora nos títulos, Plus Jakarta Sans no corpo e JetBrains Mono em código e fórmulas. A paleta parte do verde institucional `#008241`. Detalhes do design system em [docs/interface.md](docs/interface.md).
