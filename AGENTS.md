# AGENTS.md

Caderno Aberto: plataforma web gratuita, multiusuário e mobile-first para professores do ensino médio elaborarem notas de aula e as entregarem aos alunos por links únicos e gerenciáveis. Aplicação Next.js 16 (App Router, saída `standalone`), PostgreSQL 17 com Prisma 7 e adaptador `pg`, autenticação própria com JWT curto e refresh rotativo, códigos de acesso geridos pela administração, editor de blocos com cinco saídas (web com KaTeX, PDF A4 pela impressão, `.tex`, `.md` e `.json`) e armazenamento em disco ou S3. Código, comentários, documentação, testes e commits são em português.

## Diretrizes do repositório

- Leia o `CONTRIBUTING.md` antes de qualquer mudança: ele reúne o fluxo de issues, etiquetas, branches, commits, pull requests, padrões de código, banco, formatação e testes.
- `tests/unit/texto-ui.test.ts` varre todos os `.ts` e `.tsx` de `src` e reprova travessão, meia-risca, reticências tipográficas, aspas curvas, setas, aspas angulares, entidades HTML de aspas, segunda pessoa e plural escrito com parênteses. Rode `npx vitest run tests/unit/texto-ui.test.ts` depois de escrever texto de interface.
- Commits seguem Conventional Commits em português, no imperativo, com escopo opcional: `fix(admin): corrige ...`. Branches usam `tipo/descricao-curta`; branches de agentes usam o prefixo do agente (`ai/`, `claude/`, `codex/`, `copilot/` ou `cursor/`).
- TypeScript é estrito. O ESLint segue as regras do Next com alguns ajustes do projeto; não desative regras novas sem justificativa. O gerenciador é npm, com `package-lock.json`; não use bun, yarn nem pnpm.
- Cada arquivo próprio começa com um cabeçalho curto, de uma a duas linhas, descrevendo seu papel.
- Nomes de domínio em português (`notas`, `turmas`, `links`), termos de infraestrutura em inglês quando consagrados (`backup`, `token`). As regras de banco (CHECKs, funções, gatilhos e RLS) vivem nas migrações SQL e não no schema Prisma; nunca edite uma migração aplicada.

## Padrões de código

- As rotas ficam em `src/app/api/**` e seguem sessão por `sessaoProfessor`, filtro pelo dono no banco e resposta por `json` ou `erroApi`, sem detalhes internos. O erro usa `{ erro, codigo? , detalhe? }` em português e `Cache-Control: private, no-store`.
- O aplicativo é uma SPA por hash em `/`, com rotas reais apenas em `/l/[token]` e `/api/**`. A definição das rotas está em `src/lib/rota.ts`.
- `src/lib/notas/` concentra o modelo de blocos e os renderizadores (LaTeX, Markdown e texto); `src/lib/api/` concentra sessão, erros, limites, paginação e serialização; `src/components/` concentra a interface.
- Arquivos e componentes usam kebab-case (`editor-nota.tsx`, `use-paginacao.ts`). Reutilize os primitivos de `src/components/ui/` (shadcn/ui) antes de criar outro.
- Datas trafegam como `Date` no servidor e ISO 8601 no JSON. O banco usa camelCase com `@map` para snake_case e `@@map` para o nome da tabela; ids UUID com `gen_random_uuid()` e `criadoEm` e `atualizadoEm` com gatilho de atualização.
- Segredos apenas via ambiente, validados na partida em `src/lib/ambiente.ts` com zod.

## Comandos

Pré-requisitos: Node 24 e Docker com Compose, ou um PostgreSQL 15 ou superior, conforme [docs/ambiente.md](docs/ambiente.md).

- Ambiente local: `npm install`; `cp .env.example .env` com `AUTH_SECRET` e `CRON_SECRET`; `npx prisma migrate deploy`; `npm run criar-admin`; `npm run dev`.
- Docker (recomendado): `docker compose up --build` sobe o PostgreSQL 17 e o aplicativo em `http://localhost:3000`, aplicando as migrações na partida.
- Ordem de verificação antes do pull request: `npm run format:check`, `npm run lint`, `npm run tsc` e `npm run test:unit`.
- `npm test` roda todas as suítes Vitest e exige o aplicativo no ar e o banco migrado para contratos, códigos, admin, segurança e sessão; o isolamento de RLS exige o papel `app_teste`, criado por `npm run test:api`.
- Ponta a ponta: `npm run test:e2e:docker` (imagem oficial, aplicativo no ar) ou `npm run test:e2e` como alternativa local; Firefox e WebKit são de execução local.
- Banco: `npm run criar-admin` para o administrador inicial e `npx prisma migrate deploy` para aplicar migrações. O build da Vercel não migra.
- Guarda editorial: `npx vitest run tests/unit/texto-ui.test.ts`.
- Capturas do README: `npm run capturas:readme` ou `npm run capturas:readme:docker`, com o aplicativo no ar e o banco migrado. Os PNGs ficam em `docs/imagens/` e não são editados à mão.
- Etiquetas: `npm run etiquetas:sync` cria ou atualiza as etiquetas do GitHub conforme `.github/labels.json`.

## Ferramentas externas

- GitHub: opere issues, pull requests, execuções de workflow e releases pelo GitHub CLI (`gh`), não pela interface web. Confirme a sessão com `gh auth status` e, se necessário, autentique com `gh auth login`. Exemplos: `gh issue create`, `gh pr create`, `gh pr checks --watch`, `gh run watch` e `gh release create`. Nunca inclua segredos ou dados de alunos e professores.
- Playwright: rode a suíte na imagem oficial da Microsoft, com o aplicativo no ar, usando `npm run test:e2e:docker` ou `npm run test:e2e:docker:chromium`. O script `tests/playwright-container.sh` aceita `PLAYWRIGHT_IMAGE`, `PLAYWRIGHT_DOCKER_NETWORK` e `PLAYWRIGHT_DOCKER_USER`. Mantenha a versão da imagem igual à do `@playwright/test`. Use `localhost`, e não `127.0.0.1`, porque o Playwright só trata esse host como local para enviar o cookie `Secure`. A instalação local (`npm run test:e2e:install`) é alternativa.

## Fluxo de issues e pull requests

- Aplique etiquetas em toda issue e todo pull request: uma de tipo e, fora do tipo `docs`, uma de área. Use `gh issue create --label "bug" --label "area: notas"` e `gh pr edit <número> --add-label "area: editor"`. O catálogo fica em `.github/labels.json` e é sincronizado com `npm run etiquetas:sync`. Pull requests do Dependabot recebem `dependencies` e dispensam as demais.
- Faça apenas commits atômicos: uma mudança lógica completa por commit, sem trabalho em andamento nem correção de revisão. Use `git commit --fixup` durante o desenvolvimento e `git rebase -i --autosquash` antes de publicar.
- Organize todos os commits do assunto em uma única branch e um único pull request. Abra o pull request somente quando estiver finalizado, com título em Conventional Commits, verificações locais, documentação e CHANGELOG prontos. Não use `gh pr create --fill`.
- Se o CI falhar ou surgir algo novo depois de aberto, converta para rascunho com `gh pr ready --undo`, faça os commits e só marque como pronto com `gh pr ready` quando tudo estiver verde.
- Nunca peça revisão com o pull request em rascunho nem abra pull request incompleto.
- Commits com geração relevante por IA levam o rodapé `Assisted-by: ferramenta:modelo`; a autoria e a responsabilidade são humanas.

## Arquitetura

- Rotas reais: `/` (SPA por hash), `/l/[token]` (página pública da nota, com cache por requisição) e `/api/**`. O aplicativo inteiro vive em `/`, sem landing page; a raiz anônima é o login.
- `src/proxy.ts` concentra o bloqueio de mutações cross-site, o CSP por nonce e o modo manutenção; não existe `middleware.ts`.
- A sessão combina JWT curto em cookie `sessao` e refresh opaco revogável em `sessao_refresh`, com rotação e trava de concorrência. Senhas usam scrypt e códigos de acesso usam HMAC com uso único.
- O limite de tentativas é persistido em `tentativas_limite`; a leitura de administração reconfere o papel no banco a cada requisição.
- Cópias de segurança substituem todos os dados do professor e criam um snapshot antes da restauração; a lixeira e o ciclo de vida da conta seguem os ADRs em [docs/adr/](docs/adr/).
- A impressão do PDF usa um portal no `body` com CSS de impressão e cores forçadas; sem isso a página sai em branco (ADR-007).

## Armadilhas

- Na Vercel, nunca use `STORAGE_DRIVER=disk`, porque o disco é efêmero. O runtime usa o pooler de transação `:6543` com `?pgbouncer=true`, e o CLI de migrações usa `DIRECT_URL` na porta `:5432`.
- Deploy e migração disparam no mesmo push; o aplicativo novo pode entrar no ar antes de a migração terminar, então mudanças de schema precisam ser compatíveis com a versão anterior.
- O `postinstall` copia os assets do TikZJax para `public/vendor` e gera o cliente Prisma; sem eles os diagramas e o build falham.
- `CRON_SECRET` é obrigatório em produção; sem ele a aplicação não inicia e a rota de restauração responde 503.
- A RLS é a segunda barreira: o isolamento efetivo é o filtro por dono na API, e o papel `app_teste` existe apenas em local e CI.
- O KaTeX aceita apenas `\htmlClass` como recurso confiável; links e HTML são vetados. As imagens não são embutidas no `.tex`, que referencia `imagens/nome.png`.
- A guarda editorial cobre `src`, não `docs`, `tests` nem `e2e`; mantenha a convenção manualmente nesses diretórios.
- Nenhum teste usa dados reais. A massa usa o domínio `@exemplo.br` e cada suíte cria e limpa a própria massa; os E2E dependem do Compose descartável.
