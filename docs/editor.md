# Editor

O editor monta a nota a partir de um AST de blocos (`src/lib/notas/tipos.ts`) armazenado como JSON. A mesma fonte gera a prévia, a vista do aluno, a impressão, o Markdown e o LaTeX. A edição acontece em `src/components/editor/**`.

## Tipos de bloco

| Tipo técnico | Rótulo na interface | Campos principais               |
| ------------ | ------------------- | ------------------------------- |
| `secao`      | Seção               | `titulo`                        |
| `paragrafo`  | Parágrafo           | `texto` e `rotulo` opcional     |
| `formula`    | Fórmula             | `latex`                         |
| `lista`      | Lista               | `itens`                         |
| `tabela`     | Tabela              | `comCabecalho` e `linhas`       |
| `chamada`    | Atenção             | `estilo` e `texto`              |
| `figura`     | Figura              | `url` e `legenda`               |
| `tikz`       | Diagrama            | `codigo` e `legenda`            |
| `copiar`     | COPIAR              | `rotulo` e `filhos`             |
| `exemplo`    | Exemplo             | `rotulo` e `filhos`             |
| `dica`       | Dica                | `rotulo` e `filhos`             |
| `exercicios` | Exercícios          | `rotulo`, `niveis` e `gabarito` |

Cada bloco tem um identificador gerado. Blocos de tipo desconhecido são descartados na normalização, o que permite importar conteúdo produzido por versões diferentes sem falhar.

### Rótulos de parágrafo

`Definição`, `Fórmulas`, `Relações`, `Modelo básico` e `Resolução` são rótulos fixos. A opção livre permite um texto próprio. O rótulo fixo é gravado como tipo (`definicao`, `formulas`, `relacoes`, `modelo` ou `resolucao`); o livre guarda o texto.

### Estilos de chamada

`Atenção`, `No dia a dia` e `Símbolos e unidades`. O editor grava a chave do estilo (`atencao`, `diaadia` ou `simbolos`).

### Caixas e filhos

As caixas COPIAR, exemplo e dica aceitam os seguintes tipos de filho: parágrafo, fórmula, lista, tabela e chamada. Seção, figura, diagrama, outras caixas e exercícios não podem ser aninhados. Cada filho pode ser movido para cima ou para baixo e removido.

### Exercícios

- Três níveis renomeáveis, por padrão `Conceitos`, `Aplicação` e `Síntese`.
- Questões abertas ou de múltipla escolha, com até 5 alternativas.
- A alternativa correta é marcada no editor. O botão de virar questão aberta zera as alternativas.
- O gabarito automático percorre as questões de múltipla escolha em ordem contínua, atravessando níveis, e gera itens como `1a` e `3c`, unidos por um ponto médio. O campo de gabarito manual cobre questões abertas. A exibição final concatena automático e manual.
- O gabarito é oculto por padrão e pode ser revelado na leitura.
- Na leitura, as alternativas viram um quiz com correção instantânea; na impressão, viram texto simples.

## Formatação inline

Aplicável a parágrafos, itens de lista, chamadas, células de tabela, legendas e gabarito.

| Marcação          | Resultado                         |
| ----------------- | --------------------------------- |
| `**texto**`       | Negrito                           |
| `*texto*`         | Itálico                           |
| `` `texto` ``     | Código inline                     |
| `$...$`           | Fórmula com KaTeX                 |
| `$\ce{...}$`      | Fórmula química com mhchem        |
| `\resultado{...}` | Resposta em destaque, em vermelho |
| `\dest{...}`      | Negrito                           |
| `\textbf{...}`    | Negrito                           |
| `\textit{...}`    | Itálico                           |

Macros adicionais: `\dec{a,b}` gera `a{,}b` e `\un{x}` gera uma unidade em romano. As funções trigonométricas `\sen`, `\tg`, `\cotg` e `\cossec` são reconhecidas. O KaTeX é configurado sem lançar erro de sintaxe e com `\htmlClass` como único recurso confiável, o que veta links e HTML.

A barra de formato do editor insere negrito, itálico, fórmula, resposta em destaque e fórmula química.

## Aparência

| Fonte             | Chave      |
| ----------------- | ---------- |
| Padrão            | `corpo`    |
| Serifada          | `serifada` |
| Alta legibilidade | `legivel`  |
| Leitura fluida    | `lexend`   |
| Monoespaçada      | `mono`     |

Tamanhos: `p` (0.94), `m` (1), `g` (1.08) e `gg` (1.16). Entrelinhas: `compacta` (1.45), `normal` (1.65) e `ampla` (1.85).

A aparência é gravada por nota e aplicada como variáveis CSS ao contêiner de leitura, valendo na prévia, na vista do aluno e na impressão. No LaTeX, o tamanho vira `pt` e a entrelinha vira `\linespread`; a fonte escolhida não é reproduzida no `.tex`.

## Metadados

Disciplina, ano letivo, mês, turmas, resumo `Sobre`, habilidades BNCC/ENEM, status e aparência. A seção de metadados fica recolhida no editor. O título, a disciplina, o ano, o mês e as turmas definem a classificação exibida nas vistas de organização e nos links.

## Edição e atalhos

- Reordenação por arrastar e soltar, com suporte a mouse e teclado.
- Botões por bloco: arrastar, inserir abaixo, duplicar, mover para cima, mover para baixo e excluir.
- Paleta de inserção contextual e botão de adicionar bloco ao final.
- `Ctrl` ou `Cmd` mais `K` abre a busca global.
- Salvamento automático com atraso de 900 ms e indicador de estado (`salvando`, `salvo` ou erro). Não há botão manual de salvar.
- Ações da nota: ler, exportar, compartilhar, duplicar (a cópia abre como rascunho) e alternar entre rascunho e publicada.
- Em telas pequenas, abas Editar e Prévia; em telas grandes, duas colunas com prévia fixa.

## Exportação e importação

### Markdown

O `.md` traz frontmatter com título, disciplina, ano, mês, turmas, habilidades, status, slug e, quando diferente do padrão, a aparência. O corpo usa seções, citações para o resumo, blocos `::` para caixas e exercícios, fórmulas `$$...$$`, tabelas, figuras e diagramas.

O round-trip reconstrói blocos, rótulos, tabelas, diagramas, exercícios e aparência. A resposta em destaque é exportada como `==texto==` e revertida na importação; o negrito nativo do Markdown permanece negrito.

### LaTeX

Documento autocontido com classe `article`, opção de duas colunas e apenas pacotes padrão, sem `.cls` externo. Define cores, macros e ambientes para as caixas. Imagens locais são referenciadas como arquivos e imagens externas são sinalizadas. A exportação é de mão única: não há importação de `.tex`.

### JSON

Envelope com a nota completa, incluindo blocos, aparência, turmas e timestamps. É fiel no round-trip e serve para backup e migração. Ver [api.md](api.md) para as rotas de exportação, importação e backup.

## Diálogo de nova nota

Coleta título (mínimo de 2 caracteres), disciplina (seleção ou criação inline com cor e ícone), ano letivo (2000 a 2100), mês, turmas opcionais e o interruptor Começar do modelo. O modelo cria uma seção inicial com o título da nota, uma caixa COPIAR com definição e fórmula, um exemplo resolvido, uma dica e exercícios nos três níveis. Com o interruptor desligado, a nota começa com a seção de título e um parágrafo vazio. Ao confirmar, a nota é criada como rascunho e aberta no editor.
