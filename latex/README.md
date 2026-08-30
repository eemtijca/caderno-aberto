# Pasta `latex/` — compilação dos arquivos `.tex` exportados

O app gera arquivos `.tex` **compatíveis com a classe `notaaula.cls`** (a mesma
do pipeline original). Guarde aqui os `.tex` exportados e compile-os com
`pdflatex`.

## Estrutura

```
latex/
├── notaaula.cls   a classe: paleta, layout, todos os blocos
├── Makefile       compila todos os .tex desta pasta
└── notas/         (você cria) guarde aqui os arquivos exportados
```

## Como usar

```bash
cd latex
make               # compila todos os .tex de notas/ (tema escuro) -> pdf/
make claro         # versão clara (para impressão)   -> pdf/claro/
make limpar        # remove auxiliares
```

Um arquivo exportado pelo app:

```bash
mkdir -p notas
# exporte "potencia-e-consumo.tex" pelo app e salve em latex/notas/
make pdf/potencia-e-consumo.pdf
```

## Requisitos

TeX Live com `pdflatex` e os pacotes:

```
texlive-latex-base texlive-latex-recommended texlive-latex-extra
texlive-pictures texlive-fonts-recommended texlive-fonts-extra
texlive-science texlive-lang-portuguese lmodern
```

As fontes são **Nunito** (texto) e **STIX Two Math** (matemática), ambas vindas
do TeX Live.

## Observações

- **Figuras**: quando a nota tem imagens enviadas ao app, o `.tex` gerado
  inclui um comentário com o endereço para baixá-las
  (`/api/imagens/<id>`). Baixe-as para `latex/imagens/` antes de compilar.
- O tema **escuro** é o padrão (leitura em tela); o **claro** serve para
  impressão.
- Todos os blocos do app têm equivalente na classe: caixas `COPIAR`,
  `exemplo`, `dica`, `exercícios` com três níveis e gabarito, chamadas
  `atencao`/`diaadia`/`simbolos` e os rótulos `definicao`, `formulas`,
  `resolucao` etc.
