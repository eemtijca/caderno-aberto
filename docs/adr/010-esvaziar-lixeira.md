# ADR-010: esvaziar a lixeira

- Estado: aceita.
- Data: 2026.

## Contexto

A lixeira permitia restaurar itens de forma individual ou em lote, mas não havia como liberar espaço removendo tudo em definitivo antes do prazo de retenção. A remoção antecipada dependia apenas da purga agendada.

## Decisão

Adicionar `DELETE /api/lixeira`, que esvazia a lixeira do professor em uma transação: apaga as notas e os links com `excluidoEm` preenchido, e os links das notas saem por cascade. A resposta traz a contagem de `notas` e `links` removidos. A interface adiciona o botão Limpar lixeira, que abre `ConfirmacaoDestrutiva` e só habilita o botão de confirmar depois de digitar `LIMPAR`.

## Consequências

- A ação é irreversível e restrita ao professor dono, pelas mesmas regras de isolamento das demais rotas.
- A purga agendada (`GET` e `DELETE /api/conta/restaurar`) continua removendo os itens vencidos de todos os professores.
- O aviso informa quantos itens foram removidos em definitivo.

Referências: [api.md](../api.md), [interface.md](../interface.md), [ADR-006](006-salvaguardas-destrutivas.md).
