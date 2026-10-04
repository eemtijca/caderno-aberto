# Changelog

Todas as mudanças relevantes deste projeto são registradas neste arquivo.

O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o projeto adota [Versionamento Semântico](https://semver.org/lang/pt-BR/).

Enquanto a primeira versão pública não é lançada, a versão do projeto permanece fixada em `0.1.0`. A primeira release será a `v1.0.0`.

## [Não publicado]

### Adicionado

- Implantação em AWS, Azure e GCP com Terraform em `infra/terraform/<nuvem>`, com modo local nos emuladores do Floci e modo de produção com serviços gerenciados, testada por `npm run infra:floci` e pelo workflow `infra.yml`.
- Driver `azure-blob` para armazenamento de imagens no Azure Blob Storage, com chave compartilhada ou identidade gerenciada.
- Guia [docs/implantacao-nuvem.md](docs/implantacao-nuvem.md) e decisão registrada no [ADR-011](docs/adr/011-implantacao-multinuvem.md).
- Workflow `expurgo.yml` que dispara a limpeza de contas e da lixeira diária com `CRON_SECRET`.
- AGENTS.md com orientações para agentes de IA.
- Guia de contribuição ampliado com fluxo de issues, convenções de commit e pull request, política de revisão, releases e contribuições assistidas por IA.
- README reestruturado no padrão de repositórios de referência, com selos, sumário, demonstração, arquitetura, deploy, FAQ, suporte e créditos.
- Spec `e2e/imagens.spec.ts` e comandos `capturas:readme` para gerar as capturas versionadas em `docs/imagens/`.
- Catálogo de etiquetas em `.github/labels.json` e script `npm run etiquetas:sync` para sincronizá-las pelo GitHub CLI.
- Workflow `etiquetas.yml`, que aplica etiquetas de área pelos caminhos e de tipo pelo título e valida título e etiquetas em pull requests.
- Templates de issue ampliados (Bug, Melhoria e Tarefa) e template de pull request com etiquetas, commits atômicos, ciclo de rascunho e uso de IA.
- Script de execução do Playwright em contêiner e scripts npm correspondentes.
- Script `test:destrutivas` para a suíte de ações destrutivas e lixeira.
- CHANGELOG.md e seção de releases no guia de contribuição.
- GitHub CLI no devcontainer.

### Modificado

- Guia de contribuição e AGENTS.md passam a exigir etiquetas em issues e pull requests, commits atômicos organizados em um único pull request e abertura somente com o trabalho finalizado.
- Workflows renomeados para `qualidade.yml`, `testes.yml` e `migracoes.yml`, com o padrão de nomes em português.
- Referências de documentação corrigidas no deploy, nos testes e nas configurações de Git.
