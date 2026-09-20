# ADR-007: impressão em portal no body

- Estado: aceita.
- Data: 2026.

## Contexto

A impressão usava `visibility: hidden` para ocultar a interface e um posicionamento absoluto para a área da nota. O conteúdo oculto continuava ocupando espaço no layout, e as alturas mínimas de tela e os paddings do shell somavam uma página em branco ao final. O tema escuro também era forçado a texto e fundo fixos, apagando as cores das caixas e dos chips no papel.

## Decisão

Renderizar o documento de impressão em um portal para o `document.body`, por meio de `AreaImpressao` e `DocumentoImpresso` (`src/components/notas/area-impressao.tsx`), oculto na tela e visível apenas em `@media print`. A regra de impressão passa a esconder por `display` os filhos diretos do body que não sejam a área de impressão, de modo que o aplicativo não ocupa espaço no papel. O tema escuro é suspenso durante a impressão (`src/hooks/use-impressao.ts`), preservando as cores dos elementos no tema claro.

O layout segue em A4 e duas colunas, com cabeçalho próprio (disciplina, período, turmas, título, professor, resumo e habilidades) e rodapé discreto.

## Consequências

- A página em branco ao final deixa de existir e o PDF mantém as cores das caixas.
- A impressão disparada pelo navegador (Ctrl+P e menu) cobre o mesmo documento.
- O conteúdo da nota é renderizado duas vezes no cliente (tela e portal). O custo é aceitável e garante que a versão impressa já esteja montada no momento do snapshot.
- A exportação em `.tex` continua sendo a alternativa para impressão em LaTeX.

Referências: [interface.md](../interface.md), [editor.md](../editor.md), [globals.css](../../src/app/globals.css).
