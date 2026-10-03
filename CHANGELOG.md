# Changelog

Todas as mudanças relevantes deste projeto são registradas neste arquivo.

O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o projeto adota [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [Não publicado]

### Adicionado

- AGENTS.md com orientações para agentes de IA.
- Guia de contribuição ampliado com fluxo de issues, convenções de commit e pull request, política de revisão, releases e contribuições assistidas por IA.
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
