# Contribuindo

Guia de desenvolvimento do Caderno Aberto: como preparar o ambiente, abrir issues, propor mudanças, escrever código, testar e documentar. Dúvidas e propostas podem ser abertas como issue; o detalhamento técnico está em [docs/](docs/README.md). Para vulnerabilidades, siga [SECURITY.md](SECURITY.md), e para a convivência, o [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Antes de começar

- Abra uma issue antes de trabalhar em funcionalidades, mudanças estruturais e correções grandes. Ajustes pequenos e evidentes podem seguir direto para um pull request.
- Procure issues abertas e fechadas antes de criar uma nova. Havendo uma equivalente, comente para assumir a tarefa e evitar trabalho duplicado.
- Aplique as etiquetas de tipo e de área em toda issue e todo pull request, conforme a seção [Etiquetas](#etiquetas).
- Descreva o contexto com clareza: passos de reprodução, comportamento observado, comportamento esperado e versão ou commit afetado.
- Mantenha a conversa pública nas issues e nos pull requests. Canais privados ficam reservados para vulnerabilidades e assuntos de conduta.
- Nunca inclua segredos, credenciais, dados reais de professores ou alunos em issues, comandos, commits, capturas ou logs.
- Vulnerabilidades seguem [SECURITY.md](SECURITY.md), nunca uma issue pública.

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

O Compose sobe o PostgreSQL 17 e o aplicativo em `http://localhost:3000`, aplica as migrações na partida e serve o build de produção.

Comandos úteis na raiz:

| Comando                     | Efeito                                                                        |
| --------------------------- | ----------------------------------------------------------------------------- |
| `npm run dev`               | Servidor de desenvolvimento em `http://localhost:3000`.                       |
| `docker compose up --build` | Sobe o banco e o aplicativo via Docker Compose.                               |
| `docker compose down`       | Derruba o ambiente.                                                           |
| `npm run criar-admin`       | Cria o administrador inicial de forma idempotente.                            |
| `npm run test:destrutivas`  | Roda a suíte de ações destrutivas e lixeira.                                  |
| `npm run format`            | Corrige a formatação com o Prettier.                                          |
| `npm run format:check`      | Confere a formatação sem alterar arquivos.                                    |
| `npm run etiquetas:sync`    | Sincroniza as etiquetas do GitHub com o catálogo.                             |
| `npm run vercel-build`      | Build da Vercel, com `prisma generate` e `next build`.                        |
| `npx prisma generate`       | Regenera o cliente Prisma (o `postinstall` também executa e copia o TikZJax). |
| `npx prisma migrate deploy` | Aplica as migrações pendentes.                                                |

## Fluxo de contribuição e pull requests

### GitHub CLI

Opere issues, pull requests, execuções de workflow e releases pelo GitHub CLI (`gh`), não pela interface web. Antes de operar, confirme a sessão com `gh auth status` (ou `gh status`) e, se não houver conexão, autentique com `gh auth login`.

Comandos do dia a dia:

- `gh issue create`, `gh issue list` e `gh issue view` para issues.
- `gh pr create`, `gh pr view` e `gh pr checks --watch` para pull requests.
- `gh pr edit <número> --add-label <etiqueta>` para corrigir etiquetas.
- `gh run list`, `gh run watch` e `gh run view --log-failed` para workflows.
- `gh release create` e `gh release view` para releases.

Nunca inclua segredos, credenciais ou dados de alunos e professores em comandos, títulos, corpos ou comentários.

### Issues

Abra uma issue quando:

- encontrar um comportamento incorreto que não consegue corrigir;
- propor uma funcionalidade ou melhoria de escopo;
- discutir uma decisão estrutural ou de arquitetura;
- apontar falha ou lacuna de documentação.

Antes de abrir, procure issues abertas e fechadas com termos relacionados. Os modelos disponíveis são Bug, Melhoria, Tarefa e os contatos para segurança, documentação e contribuição; escolha o mais adequado e preencha os campos obrigatórios.

Uma boa issue contém:

- o problema e o resultado esperado;
- passos de reprodução numerados, com o menor exemplo possível;
- ambiente envolvido (navegador, dispositivo, versão ou commit);
- contexto adicional, sem dados reais nem segredos.

As etiquetas de tipo, área, prioridade e triagem estão descritas na seção [Etiquetas](#etiquetas).

A triagem acontece em até 7 dias. Uma issue pode ser fechada sem correção quando estiver fora do escopo, duplicada ou sem informação; nesse caso o motivo é explicado e a porta fica aberta para uma proposta mais precisa. Se a issue aberta for resolvida por conta própria, comente o desfecho e feche.

Relacione a issue ao pull request com `Closes #123` quando a mudança encerrar o assunto, ou `Refs #123` quando apenas caminhar na direção dele. A ligação com `Closes` só funciona no pull request que aponta para a branch padrão.

### Etiquetas

Toda issue e todo pull request recebe ao menos uma etiqueta de tipo e uma de área. A prioridade é definida na triagem, e a etiqueta `triagem` sai quando o tipo, a área e a prioridade estiverem confirmados. Pull requests do Dependabot recebem `dependencies` automaticamente e dispensam as demais.

| Grupo      | Etiquetas                                                                                     | Uso                                                |
| ---------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Tipo       | `bug`, `enhancement`, `documentation`, `refactor`, `testes`, `ci`, `desempenho`, `manutencao` | Natureza da mudança.                               |
| Área       | `area: notas`, `area: editor`, `area: links`, `area: admin`, `area: infra`                    | Parte do sistema afetada.                          |
| Prioridade | `prioridade: alta`, `prioridade: media`, `prioridade: baixa`                                  | Urgência definida na triagem.                      |
| Triagem    | `triagem`                                                                                     | Aguardando confirmação de tipo, área e prioridade. |

O catálogo fica em [.github/labels.json](../.github/labels.json) e é aplicado com `npm run etiquetas:sync`, que cria ou atualiza as etiquetas pelo GitHub CLI. O workflow `etiquetas.yml` aplica `area:` pelos caminhos alterados e o tipo pelo prefixo do título, e o check `validar` reprova pull requests sem etiqueta obrigatória ou com título fora do padrão Conventional Commits. Pull requests do tipo `docs` dispensam etiqueta de área.

Antes de criar uma etiqueta nova, confirme que ela tem público, dono e regra automatizada no mesmo pull request, seja pelo catálogo, pelo mapeamento de caminhos ou pelo título. Etiqueta sem automação tende a não ser aplicada.

Para aplicar:

```bash
gh issue create --label "bug" --label "area: notas"
gh pr create --label "refactor" --label "area: infra"
gh pr edit 123 --add-label "prioridade: alta"
gh pr view 123 --json labels
```

### Branches

Parta da `main` atualizada e use `tipo/descricao-curta`, em minúsculas, com hífens e sem acento, com o tipo alinhado ao commit principal:

- `feat/` para funcionalidades novas.
- `fix/` para correções.
- `hotfix/` para correções urgentes em produção.
- `docs/`, `test/`, `refactor/`, `perf/`, `chore/` e `ci/` para os demais casos.
- `release/` para linhas de manutenção, como `release/1.x`, criadas apenas quando houver uma linha antiga a suportar.

Exemplos presentes no histórico: `feat/experiencia-de-notas-e-acessibilidade` e `feat/seguranca-robustez`.

Branches criadas por agentes de IA seguem esta mesma convenção de tipo, conforme a [Conventional Branch](https://conventional-branch.github.io/). A autoria assistida fica registrada no rodapé `Assisted-by` do commit e no corpo do pull request.

### Commits

Siga o [Conventional Commits](https://www.conventionalcommits.org/pt-br/v1.0.0/), em português, no imperativo e descrevendo o efeito da mudança, com escopo entre parênteses quando ajudar a localizar a área.

```text
<tipo>(<escopo opcional>): <descrição>

[corpo opcional]

[rodapé opcional]
```

Tipos usados:

| Tipo       | Uso                                        |
| ---------- | ------------------------------------------ |
| `feat`     | Funcionalidade nova.                       |
| `fix`      | Correção de comportamento.                 |
| `docs`     | Documentação.                              |
| `test`     | Testes.                                    |
| `refactor` | Mudança interna sem alterar comportamento. |
| `perf`     | Desempenho.                                |
| `chore`    | Manutenção e dependências.                 |
| `ci`       | Workflows e automação.                     |
| `build`    | Build e empacotamento.                     |
| `revert`   | Reversão de commit anterior.               |

Escopos comuns: `admin`, `auth`, `notas`, `editor`, `links`, `api`, `docs`, `test`, `e2e`, `ci`, `infra`.

Regras:

- Cada commit é atômico: contém uma única mudança lógica, completa e autossuficiente. O código compila e as verificações passam em cada commit.
- Não misture contextos no mesmo commit, como formatação, refatoração e mudança de comportamento. Se o commit cabe em mais de um tipo, divida.
- O histórico exposto não contém trabalho em andamento nem correção de revisão. Durante o desenvolvimento, use `git commit --fixup <commit>` e limpe a branch com `git rebase -i --autosquash` antes de publicar.
- Todos os commits do mesmo assunto ficam em uma única branch e um único pull request.
- Prefira mudanças pequenas e revisáveis, na linha do [Google Engineering Practices](https://google.github.io/eng-practices/review/developer/small-cls.html): cerca de 100 linhas é um tamanho razoável e 1000 é grande demais. Se o assunto não fechar em um pull request único, combine a divisão antes de começar.
- Use o corpo para explicar o porquê quando a descrição não bastar.
- Use rodapé para referências: `Closes #123`, `Refs #123`.
- Mudança incompatível usa `!` depois do tipo ou escopo, ou o rodapé `BREAKING CHANGE:`.
- Commits com geração relevante por ferramenta de IA levam o rodapé `Assisted-by: ferramenta:modelo`. A responsabilidade pela mudança é de quem envia.
- Evite commits de trabalho em andamento na `main`; o histórico da `main` vem de pull requests.

Exemplos:

```text
feat(admin): pagina as listas no servidor
fix(links): corrige a contagem de acessos em link expirado
docs: sincroniza a documentação com o estado atual do código
test(e2e): cobre o menu de ajuda na tela de login
```

### Pull requests

Um pull request resolve um assunto e reúne todos os commits dele. Se a mudança misturar refatoração e comportamento, separe em pull requests menores. Refatorações grandes andam em pull request próprio, sem misturar com correção ou funcionalidade. Se o trabalho virar dois assuntos independentes, combine a divisão e abra pull requests separados.

Abra o pull request somente quando o trabalho estiver finalizado: verificações locais passando, título em Conventional Commits, documentação e CHANGELOG atualizados, etiquetas definidas e revisão do próprio diff feita. Não use `gh pr create --fill`, porque o corpo deve vir do template.

Se o CI falhar ou surgir algo novo depois da abertura, converta o pull request para rascunho com `gh pr ready --undo`, faça os commits atômicos e rode as verificações de novo. Marque como pronto com `gh pr ready` somente com tudo verde. Enquanto o pull request estiver em rascunho, não peça revisão. Depois que a revisão começar, prefira commits novos que respondem ao feedback; se precisar reescrever a história, use `git push --force-with-lease` e explique o motivo na conversa.

A descrição deve conter:

- o problema e o resultado esperado;
- o que mudou e por quê;
- as etiquetas aplicadas;
- como validar: comandos executados e, quando aplicável, capturas ou passos de interface;
- riscos, migrações ou variáveis de ambiente novas;
- a issue relacionada, com `Closes #123` quando aplicável.

Quando a mudança tocar dependências, autenticação, permissões, workflows ou dados sensíveis, descreva o risco e como ele foi tratado.

Antes de abrir, rode as verificações locais:

```bash
npm run format:check
npm run lint
npm run tsc
npm run test:unit     # unidade, guarda editorial e bibliotecas puras
npm test              # com o aplicativo no ar e o banco migrado
npm run test:e2e:docker   # Playwright na imagem oficial, com o aplicativo no ar
```

Preencha o checklist do template de pull request. Ao alterar comportamento, atualize a documentação correspondente e os testes.

### Revisão e integração contínua

Toda mudança passa por revisão e pelos workflows do GitHub Actions. O CI roda apenas em pull requests; o CD roda no push, pelo deploy da Vercel e pela Action de migrações.

| Workflow        | Etapas                                                                                                           |
| --------------- | ---------------------------------------------------------------------------------------------------------------- |
| `qualidade.yml` | `format:check`, `lint`, `tsc` e `test:unit` em pull requests.                                                    |
| `etiquetas.yml` | Aplica etiquetas de área e de tipo e valida o título e as etiquetas em pull requests fora de rascunho.           |
| `build.yml`     | `next build` com `DATABASE_URL` e `AUTH_SECRET` fictícios em pull requests.                                      |
| `testes.yml`    | Sobe o Compose, aplica o RLS de teste e roda isolamento, contratos, códigos, admin, segurança e e2e no Chromium. |
| `migracoes.yml` | Aplica `prisma migrate deploy` em produção no push para `main` com alteração em `prisma/migrations/**`.          |

A `main` é protegida por rulesets: pull request obrigatório, checks verdes, conversas resolvidas e merge commit como único método. A autoaprovação não existe no GitHub; donos da organização podem mesclar os próprios pull requests com o bypass da regra de revisão, mas continuam sujeitos aos checks de qualidade.

Corrija as falhas antes de pedir nova revisão. Pull requests sem CI verde não são mesclados. O check `validar` volta a rodar quando o título ou as etiquetas mudam; se faltar etiqueta, aplique com `gh pr edit --add-label`. Evite force-push depois que a revisão começar; se precisar reescrever a história, explique o motivo na conversa.

### Estratégia de merge

Mescle por merge commit, preservando os commits da branch e o contexto da revisão. Apague a branch após o merge. Não faça force-push em `main` nem reescreva o histórico já mesclado.

## Padrões de código

- Código e comentários em português, curtos e diretos.
- Domínio em português (`notas`, `turmas`, `links`); infraestrutura em inglês (`backup`, `token`, nomes de pacotes).
- Rotas: sessão via `sessaoProfessor`, filtro pelo dono no banco e respostas via `json` ou `erroApi`, sem detalhes internos.
- Datas do banco trafegam como `Date` no servidor e ISO no JSON.
- Segredos apenas via ambiente. Ver [docs/ambiente.md](docs/ambiente.md).
- Ao alterar comportamento, atualize a documentação correspondente em [docs/](docs/README.md) e os testes.

### Banco e migrações

Crie migrações com `npx prisma migrate dev --name ajuste`. Nunca edite uma migração aplicada; qualquer ajuste entra como migração nova. O schema é a fonte da verdade em `prisma/schema.prisma`, e os comandos do dia a dia estão em [docs/banco.md](docs/banco.md). As regras que não cabem no schema (CHECKs, funções, gatilhos, RLS e índices funcionais) vivem no SQL das migrações e são preservadas.

### Formatação e análise estática

O Prettier cuida do estilo, com `prettier-plugin-tailwindcss` para ordenar as classes, e o ESLint cobre as regras do Next e do projeto. Rode `npm run format` e `npm run lint` antes de commitar. Não desative regras sem justificativa no código.

### Comentários no código

- Cada arquivo próprio começa com um cabeçalho curto, de uma a duas linhas, descrevendo seu papel.
- Comente apenas trechos não óbvios, como decisões de segurança, contornos, cálculos e formatos de interoperabilidade.
- Não comente o óbvio nem repita o nome da função no comentário.

### Contribuições assistidas por IA

Ferramentas de IA são bem-vindas como apoio, mas a responsabilidade pela mudança é de quem envia, e a autoria dos commits é humana. Revise o resultado linha a linha, garanta que ele segue as convenções do repositório, rode as verificações locais e nunca cole segredos, credenciais ou dados reais em ferramentas externas, issues ou commits. Commits com geração relevante levam o rodapé `Assisted-by: ferramenta:modelo`, e o template de pull request tem a seção "Uso de IA". Agentes seguem o [AGENTS.md](AGENTS.md), com as mesmas obrigações de etiquetas, commits atômicos, um único pull request e ciclo de rascunho.

## Testes e qualidade

As suítes combinam unidade, integração da API, isolamento no banco, ações destrutivas e testes de ponta a ponta. Os comandos e pré-requisitos estão em [tests/README.md](tests/README.md); a convenção e a cobertura, em [docs/testes.md](docs/testes.md).

| Suíte              | Requisito                         | Comando                                         |
| ------------------ | --------------------------------- | ----------------------------------------------- |
| Unidade            | Nenhum                            | `npm run test:unit`                             |
| Guarda editorial   | Nenhum (roda com a unidade)       | `npm run test:unit`                             |
| Isolamento (RLS)   | Banco migrado e papel `app_teste` | `npm run test:api`                              |
| Contratos          | Aplicativo no ar                  | `npm run test:contratos`                        |
| Códigos e admin    | Aplicativo no ar e banco          | `npm run test:codigos`                          |
| Segurança e sessão | Aplicativo no ar e banco          | `npm run test:seguranca`                        |
| Destrutivas        | Aplicativo no ar e banco          | `npm run test:destrutivas`                      |
| E2E (Playwright)   | Aplicativo no ar                  | `npm run test:e2e:docker` ou `npm run test:e2e` |
| Capturas do README | Aplicativo no ar e banco migrado  | `npm run capturas:readme`                       |

Regras:

- Cada arquivo cria e limpa a própria massa com `beforeAll` e `afterAll`, usando e-mails datados no domínio `@exemplo.br`. Nunca dependa de dados reais.
- Nenhum teste depende de ordem de execução.
- Ao corrigir um bug, adicione um teste que falharia antes da correção.
- O teste `tests/unit/texto-ui.test.ts` barra travessão, meia-risca, reticências tipográficas, aspas curvas, setas, aspas angulares, entidades de aspas, segunda pessoa e pluralização com parênteses nos arquivos de `src`.

O Playwright roda primariamente na imagem oficial da Microsoft, sem instalar navegadores no host, com o aplicativo no ar:

```bash
npm run test:e2e:docker            # todos os projetos
npm run test:e2e:docker:chromium   # apenas o Chromium
```

A variável `TEST_BASE_URL` aponta para o aplicativo (padrão `http://localhost:3000`), e `tests/playwright-container.sh` aceita `PLAYWRIGHT_IMAGE`, `PLAYWRIGHT_DOCKER_NETWORK` e `PLAYWRIGHT_DOCKER_USER`. Mantenha a versão da imagem igual à do `@playwright/test` em `package.json`. Use `localhost`, e não `127.0.0.1`, porque o Playwright só trata esse host como local para enviar o cookie de sessão `Secure`.

As capturas do README são geradas por `e2e/imagens.spec.ts` e gravadas em `docs/imagens/`, com o aplicativo no ar e o banco migrado. Regenera pelo comando `npm run capturas:readme` (ou `npm run capturas:readme:docker`, na imagem oficial). Os PNGs são versionados e não devem ser editados à mão; mudanças de interface pedem uma nova geração e revisão do diff.

A instalação local de navegadores fica como alternativa para Firefox e WebKit:

```bash
npm run test:e2e:install
npm run test:e2e
```

## Documentação e ADRs

Mudanças estruturais ganham uma nota curta em [docs/adr/](docs/adr/), com estado, contexto, decisão, alternativas e consequências. Novas notas seguem a numeração sequencial e o formato dos ADRs existentes. O índice fica em [docs/README.md](docs/README.md).

### Padrão da documentação

Toda a documentação usa português brasileiro com acentuação e cedilha corretas, em tom técnico e impessoal. Evite primeira pessoa, exclamações e frases de preenchimento.

Restrições de formatação:

- Não use travessão, meia-risca, reticências tipográficas, aspas curvas, setas ou símbolos decorativos. Use dois-pontos, vírgula, parênteses, `...` e aspas retas.
- Exceção: o ponto médio `·` é o separador aceito entre metadados na interface (por exemplo, `Março/2026 · 3A · Prof. Ana`). O resto do texto segue as regras acima.
- Evite segunda pessoa explícita e pluralização com parênteses.
- Siga a sintaxe Markdown do GitHub: um único título de nível 1 por arquivo, hierarquia de títulos sem saltos, listas com `-`, cercas de código com linguagem e texto alternativo em imagens.
- Use links relativos para arquivos do repositório e mantenha o texto do link em uma única linha.
- Use alertas (`> [!NOTE]`, `> [!WARNING]`) com parcimônia, no máximo um ou dois por documento.
- Valide com `npm run format` antes de enviar.

### Padrão da interface

Os tokens visuais ficam em `src/app/globals.css`, sobre Tailwind CSS v4, e os componentes base em `src/components/ui/` (shadcn/ui). A tipografia usa Sora nos títulos, Plus Jakarta Sans no corpo e JetBrains Mono em código e fórmulas. A paleta parte do verde institucional `#008241`. Detalhes do design system em [docs/interface.md](docs/interface.md).

## Releases e changelog

As mudanças relevantes são registradas em [CHANGELOG.md](CHANGELOG.md), no formato [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/), com versionamento semântico. Mova as entradas da seção Não publicado para a versão correspondente ao publicar.

Enquanto a primeira versão pública não é lançada, a versão do projeto permanece fixada em `0.1.0` e as mudanças ficam na seção Não publicado. A primeira release será a `v1.0.0`; a partir dela, o versionamento semântico passa a reger as versões.

Crie releases pelo GitHub CLI:

```bash
gh release create vX.Y.Z --generate-notes
```

O build de produção da Vercel é disparado pelo push na `main`, e o workflow `migracoes.yml` aplica as migrações de banco.

## Suporte e dúvidas

Use as issues para dúvidas, sugestões e problemas. A triagem acontece em até 7 dias. Para vulnerabilidades, siga [SECURITY.md](SECURITY.md); para conduta, o [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
