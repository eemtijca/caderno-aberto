# ADR-009: ações em lote por recurso

- Estado: aceita.
- Data: 2026.

## Contexto

As listas de notas, links e lixeira não permitiam selecionar vários itens. Executar as ações item a item no cliente multiplicaria requisições, dificultaria o resumo de falhas parciais e repetiria regras de negócio, como levar os links junto ao excluir uma nota e recalcular o índice de busca ao trocar a disciplina.

## Decisão

Criar rotas de lote por recurso, com validação e isolamento no servidor:

- `POST /api/notas/lote` com as ações `publicar`, `rascunho`, `lixeira` e `disciplina`.
- `POST /api/links/lote` com as ações `pausar`, `reativar` e `excluir`.
- `POST /api/lixeira/lote` com a ação `restaurar`, aceitando notas e links.

Regras comuns: de 1 a 100 identificadores por chamada, UUIDs sem repetição, consultas filtradas pelo professor dono e resposta com a contagem de atualizados e a lista de ausentes. Ids inexistentes ou de outro professor não falham o lote. A lixeira mantém a semântica do excluir individual e leva os links das notas junto; a restauração de uma nota reativa os links que foram com ela. A troca de disciplina recalcula os campos denormalizados e o índice de busca de cada nota.

O cliente divide seleções maiores em lotes de 100 e agrega o resultado.

## Consequências

- As ações em lote ficam consistentes com as operações individuais e isoladas no servidor.
- Falhas parciais são visíveis: os ausentes voltam selecionados para nova tentativa.
- A busca textual acompanha a troca de disciplina sem depender de nova edição da nota.

Referências: [api.md](../api.md), [interface.md](../interface.md).
