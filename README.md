# Notas de aula — Física

Sistema para gerar notas de aula em PDF a partir de arquivos LaTeX enxutos.
O desenho (duas colunas em A4, tema escuro, caixas "COPIAR", exercícios em três
níveis e gabarito) fica todo na classe `notaaula.cls` — cada nota contém
apenas o conteúdo.

## Como usar

```bash
./nova-nota.sh 2026-09-ondas "Ondas mecânicas"   # cria notas/2026-09-ondas.tex
make pdf/2026-09-ondas.pdf                       # compila essa nota
make                                             # compila todas -> pdf/
make claro                                       # versão clara -> pdf/claro/
make lista                                       # lista as notas
make limpar                                      # apaga os auxiliares
```

O tema claro tem fundo branco e serve para impressão; o escuro é o padrão,
para leitura em tela.

## Estrutura

```
notaaula.cls     a classe: paleta, layout, todos os blocos
modelo.tex       esqueleto comentado de uma nota nova
nova-nota.sh     cria uma nota a partir do modelo
notas/*.tex      uma nota por arquivo (só conteúdo)
pdf/             PDFs gerados
```

## Blocos disponíveis

### Estrutura da nota

| Comando | O que faz |
|---|---|
| `\titulonota{...}` / `\creditos{...}` | preenchem o cabeçalho |
| `\cabecalho` | desenha o cabeçalho (logo após `\begin{document}`) |
| `\section{...}` | seção numerada, com filetes acima e abaixo |
| `sobre` | caixa de abertura "Sobre esta nota", sem preenchimento |

### Caixas

| Ambiente | Aparência |
|---|---|
| `\begin{copiar}{Tema}` | caixa cinza rotulada `COPIAR — Tema`: o que vai para o caderno |
| `\begin{exemplo}` | caixa verde "Exemplo resolvido" |
| `\begin{dica}` | caixa âmbar "Dica / erro comum" |
| `\begin{exercicios}` | caixa da lista de exercícios |
| `\begin{figuranota}{legenda}` | figura centralizada com legenda em cinza |

Todas as caixas quebram entre colunas e páginas; a parte continuada recebe o
rótulo com "(cont.)" automaticamente. O rótulo aceita um argumento opcional
para trocar o título: `\begin{exemplo}[Exemplo 2]`.

### Destaques de texto

| Comando | Cor | Uso |
|---|---|---|
| `\definicao` `\formulas` `\relacoes` `\modelo` `\resolucao` | azul | rótulo de abertura de parágrafo |
| `\rotulo{Texto.}` | azul | rótulo com texto livre |
| `\atencao{...}` | âmbar | alerta |
| `\diaadia{...}` | verde | ligação com o cotidiano |
| `\simbolos{...}` | lilás | lista de símbolos e unidades |
| `\resultado{...}` | coral | resposta em destaque |
| `\dest{...}` | negrito | palavra-chave |

### Exercícios

| Comando | O que faz |
|---|---|
| `\nivel{1}{Conceitos}` | cabeçalho do nível (1 azul, 2 âmbar, 3 coral) |
| `questoes` | lista numerada; **a numeração continua** entre os níveis |
| `alternativas` | lista (a) (b) (c) (d) |
| `itens` | lista com marcadores |
| `\gabarito{...}` | bloco final em corpo menor |

### Matemática

`\sen`, `\tg`, `\cotg` e `\cossec` já vêm definidos em português.

| Comando | Resultado |
|---|---|
| `\dec{4,0}` | `4,0` com a vírgula sem espaço espúrio |
| `\un{m/s^2}` | unidade em romano, com espaço fino antes |

Exemplo: `$i_0 = \dec{4,0}\un{A}$` → *i₀ = 4,0 A*.

## Paleta

As cores são as do modelo de agosto/2026 e estão disponíveis como cores do
`xcolor` dentro das figuras (`naAzul`, `naCoral`, …).

| Cor | Escuro | Claro | Uso |
|---|---|---|---|
| `naFundo` | `#2B2B2B` | `#FFFFFF` | fundo da página |
| `naCaixa` | `#3A3A38` | `#F1EFE9` | fundo das caixas |
| `naTexto` | `#F8F6F0` | `#1C1C1C` | texto |
| `naSuave` | `#A8A49A` | `#6B6864` | legendas e rótulos |
| `naAzul` | `#82C8FF` | `#1B5FA8` | definições, nível 1 |
| `naAmbar` | `#FFC46E` | `#8A5D0A` | atenção, nível 2 |
| `naCoral` | `#FF9682` | `#B83D26` | resultados, nível 3 |
| `naVerde` | `#82E6A0` | `#1B6B3C` | "no dia a dia" |
| `naLilas` | `#D6B0FF` | `#63389A` | símbolos |

## Ajustes finos

`\natabsep` (padrão `10.5pt`) controla a distância entre o filete e o corpo de
cada caixa — é também a altura da faixa do rótulo. Para mudar em uma nota:

```latex
\setlength{\natabsep}{12pt}
```

## Requisitos

TeX Live com `pdflatex` e os pacotes:

```
texlive-latex-base texlive-latex-recommended texlive-latex-extra
texlive-pictures texlive-fonts-recommended texlive-fonts-extra
texlive-science texlive-lang-portuguese lmodern
```

No Ubuntu/Debian:

```bash
sudo apt install texlive-latex-base texlive-latex-recommended \
  texlive-latex-extra texlive-pictures texlive-fonts-recommended \
  texlive-fonts-extra texlive-science texlive-lang-portuguese lmodern
```

As fontes são **Nunito** (texto) e **STIX Two Math** (matemática), ambas
vindas do TeX Live — não é preciso instalar nada no sistema.
