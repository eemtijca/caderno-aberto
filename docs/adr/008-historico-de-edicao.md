# ADR-008: histórico de edição estrutural dos blocos

- Estado: aceita.
- Data: 2026.

## Contexto

Excluir, mover, duplicar, inserir e reorganizar blocos no editor não tinha desfazer. Uma remoção acidental só podia ser recuperada fechando a aba antes do autosave ou restaurando um backup. Dentro dos campos de texto, o desfazer nativo já funciona, mas não cobre as operações estruturais.

## Decisão

Manter um histórico local de snapshots da lista de blocos em `src/components/editor/editor-nota.tsx`:

- Apenas operações estruturais entram no histórico: inserir, remover, mover, duplicar, reordenar e alterações em itens, linhas, questões e alternativas.
- O limite é de 40 estados; uma nova operação descarta o ramo de refazer.
- `Ctrl` ou `Cmd` mais `Z` desfaz e com `Shift` refaz. Quando o foco está em um campo de texto, o atalho é ignorado para valer o desfazer nativo do navegador.
- A remoção de bloco mostra um aviso com a ação Desfazer.
- Os botões de desfazer e refazer ficam na barra de ações do editor, desabilitados quando não há histórico.

O histórico é apenas da sessão de edição e não é persistido; o autosave continua gravando o estado atual.

## Consequências

- Remoções e reordenações acidentais deixam de ser definitivas.
- A lista de blocos passa a ser atualizada por uma função única, que decide quando registrar o estado anterior.
- Edições de texto continuam fora do histórico estrutural, sem competir com o desfazer nativo.

Referências: [editor.md](../editor.md), [interface.md](../interface.md).
