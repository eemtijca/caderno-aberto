// Gerador de .tex autocontido. Reproduz o visual da versão web (caixas
// coloridas, A4 em duas colunas) usando apenas pacotes padrão de
// Overleaf/TeX Live — sem depender de notaaula.cls nem de arquivos externos.

import {
  AparenciaNota,
  Bloco,
  BlocoFilho,
  ENTRELINHAS_NOTA,
  NotaDados,
  ROTULOS_FIXOS,
  textoRotulo,
} from "./tipos"
import { escaparLatex, inlineParaLatex, prepararMatematicaTex } from "./latex"
import { MESES_CAP } from "./texto"

function nomeArquivoImagem(url: string): { arquivo: string | null; comentario: string } {
  // imagens do app: /api/imagens?path=<uid>/<arquivo>
  if (url.startsWith("/api/imagens?path=")) {
    const caminho = decodeURIComponent(url.slice("/api/imagens?path=".length))
    const nome = caminho.split("/").pop() ?? "imagem"
    const ext = (nome.split(".").pop() ?? "").toLowerCase()
    // pdfLaTeX aceita png/jpg; pedimos webp convertido no download
    const base = ext ? nome.slice(0, -(ext.length + 1)) : nome
    const saida = ext === "png" || ext === "jpg" || ext === "jpeg" ? nome : `${base}.png`
    return {
      arquivo: `imagens/${saida}`,
      comentario: `imagem enviada ao app. Baixe em ${url}${ext === "webp" || ext === "svg" ? "&png=1" : ""} e salve como imagens/${saida}`,
    }
  }
  return { arquivo: null, comentario: `imagem externa (não embutida): ${url}` }
}

function filhoParaLatex(f: BlocoFilho): string {
  switch (f.tipo) {
    case "paragrafo": {
      const rotulo = f.rotulo
      let prefixo = ""
      if (rotulo) {
        if (rotulo.tipo === "livre") prefixo = `\\rotulo{${inlineParaLatex(rotulo.texto ?? "")}} `
        else {
          const nome = ROTULOS_FIXOS.find((r) => r.tipo === rotulo.tipo)?.tipo ?? "rotulo"
          prefixo = `\\${nome} `
        }
      }
      return `${prefixo}${inlineParaLatex(f.texto)}\n\n`
    }
    case "formula":
      return `\\[\n  ${prepararMatematicaTex(f.latex)}\n\\]\n\n`
    case "lista":
      return `\\begin{itens}\n${f.itens
        .map((i) => `\\item ${inlineParaLatex(i)};`)
        .join("\n")}\n\\end{itens}\n\n`
    case "tabela": {
      const nCol = Math.max(1, ...f.linhas.map((l) => l.length))
      const spec = Array.from({ length: nCol }, (_, i) => (i === 0 ? "l" : "c")).join("")
      const linhas = f.linhas
        .map((linha) => linha.map((c) => inlineParaLatex(c)).join(" & "))
        .join(" \\\\\n")
      const corpo = f.comCabecalho ? linhas.replace(" \\\\\n", " \\\\\n\\midrule\n") : linhas
      // a última linha também precisa de \\ antes do \bottomrule
      return `\\begin{center}\\footnotesize\n\\begin{tabular}{${spec}}\n\\toprule\n${corpo} \\\\\n\\bottomrule\n\\end{tabular}\n\\end{center}\n\n`
    }
    case "chamada": {
      const cmd =
        f.estilo === "atencao" ? "atencao" : f.estilo === "diaadia" ? "diaadia" : "simbolos"
      return `\\${cmd}{${inlineParaLatex(f.texto)}}\n\n`
    }
  }
}

function garantirTikz(codigo: string): string {
  const c = codigo.trim()
  if (!c) return ""
  if (c.includes("\\begin{tikzpicture}") || c.includes("\\begin{axis}")) return c
  return `\\begin{tikzpicture}\n${c}\n\\end{tikzpicture}`
}

function blocoParaLatex(b: Bloco): string {
  switch (b.tipo) {
    case "secao":
      return `\\section{${inlineParaLatex(b.titulo)}}\n\n`
    case "paragrafo":
    case "formula":
    case "lista":
    case "tabela":
    case "chamada":
      return filhoParaLatex(b)
    case "figura": {
      if (!b.url) return ""
      const { arquivo, comentario } = nomeArquivoImagem(b.url)
      if (arquivo) {
        return `% ${comentario}\n\\begin{figuranota}{${inlineParaLatex(b.legenda)}}\n\\IfFileExists{${escaparLatex(
          arquivo,
        )}}{\\includegraphics[width=0.85\\linewidth]{${escaparLatex(arquivo)}}}{\\imagemfaltando{${escaparLatex(
          b.url,
        )}}}\n\\end{figuranota}\n\n`
      }
      // URL externa: fica o aviso com o endereço (pdfLaTeX não baixa arquivos)
      return `% ${comentario}\n\\begin{figuranota}{${inlineParaLatex(b.legenda)}}\n\\imagemexterna{${escaparLatex(
        b.url,
      )}}\n\\end{figuranota}\n\n`
    }
    case "tikz": {
      const raw = b.codigo.trim()
      if (!raw) return ""
      const corpo = garantirTikz(raw)
      if (b.legenda.trim()) {
        return `\\begin{figuranota}{${inlineParaLatex(b.legenda)}}\n\\begin{center}\n${corpo}\n\\end{center}\n\\end{figuranota}\n\n`
      }
      return `\\begin{center}\n${corpo}\n\\end{center}\n\n`
    }
    case "copiar":
      return `\\begin{copiar}{${inlineParaLatex(b.rotulo || "Bloco")}}\n${b.filhos
        .map(filhoParaLatex)
        .join("")}\\end{copiar}\n\n`
    case "exemplo":
      return `\\begin{exemplo}${b.rotulo && b.rotulo !== "Exemplo resolvido" ? `[${inlineParaLatex(b.rotulo)}]` : ""}\n${b.filhos
        .map(filhoParaLatex)
        .join("")}\\end{exemplo}\n\n`
    case "dica":
      return `\\begin{dica}${b.rotulo && b.rotulo !== "Dica / erro comum" ? `[${inlineParaLatex(b.rotulo)}]` : ""}\n${b.filhos
        .map(filhoParaLatex)
        .join("")}\\end{dica}\n\n`
    case "exercicios": {
      let corpo = ""
      let aberto = false
      for (const nivel of b.niveis) {
        if (nivel.questoes.length === 0) continue
        if (!aberto) {
          corpo += `\\begin{questoes}\n`
          aberto = true
        }
        corpo += `\\nivel{${nivel.numero}}{${inlineParaLatex(nivel.titulo)}}\n`
        for (const q of nivel.questoes) {
          corpo += `\\item ${inlineParaLatex(q.enunciado)}\n`
          if (q.alternativas.length > 0) {
            corpo += `  \\begin{alternativas}\n${q.alternativas
              .map((a) => `  \\item ${inlineParaLatex(a)};`)
              .join("\n")}\n  \\end{alternativas}\n`
          }
        }
      }
      if (aberto) corpo += `\\end{questoes}\n`
      const gab = montarGabarito(b)
      if (gab) corpo += `\\gabarito{${gab}}\n`
      return `\\begin{exercicios}${b.rotulo && b.rotulo !== "Exercícios propostos" ? `[${inlineParaLatex(b.rotulo)}]` : ""}\n${corpo}\\end{exercicios}\n\n`
    }
  }
}

function montarGabarito(b: Extract<Bloco, { tipo: "exercicios" }>): string {
  const itens: string[] = []
  let numero = 0
  for (const nivel of b.niveis) {
    for (const q of nivel.questoes) {
      numero++
      if (q.alternativas.length > 0 && q.correta !== null) {
        itens.push(`${numero}${"abcd"[q.correta] ?? ""}`)
      }
    }
  }
  const partes: string[] = []
  if (itens.length > 0) partes.push(itens.join(" \u00b7 "))
  if (b.gabarito.trim()) partes.push(inlineParaLatex(b.gabarito.trim()))
  return partes.join(" \u00b7 ")
}

/** Linha de créditos igual à do sistema original. */
export function montarCreditos(nota: NotaDados, professor: string): string {
  const partes: string[] = []
  if (nota.turmas.length === 1) partes.push(`Turma ${nota.turmas[0]?.nome ?? ""}`)
  else if (nota.turmas.length > 1)
    partes.push(`Turmas ${nota.turmas.map((t) => t.nome).join(" e ")}`)
  partes.push(nota.disciplina?.nome ?? "")
  partes.push(`${MESES_CAP[nota.mes - 1] ?? ""}/${nota.anoLetivo}`)
  if (professor.trim()) partes.push(professor.trim())
  return partes.filter(Boolean).join(" \u00b7 ")
}

// ---------- preâmbulo autocontido ----------

/** Mapeia a aparência da nota (escala/entrelinha) para opções do documento. */
function opcoesDocumento(aparencia: AparenciaNota | null | undefined): {
  pt: string
  spread: string
} {
  const escala = aparencia?.escala ?? "m"
  const entrelinha = aparencia?.entrelinha ?? "normal"
  const pt = { p: "9pt", m: "10pt", g: "11pt", gg: "12pt" }[escala] ?? "10pt"
  const altura = ENTRELINHAS_NOTA.find((e) => e.chave === entrelinha)?.altura ?? 1.65
  // LaTeX base ~1.2: 1.65/1.2 ≈ 1.38, etc.
  const spread = (altura / 1.2).toFixed(2)
  return { pt, spread }
}

/** A nota usa \\begin{axis}? (pgfplots só entra no preâmbulo se necessário) */
function usaPgfplots(blocos: Bloco[]): boolean {
  return blocos.some((b) => b.tipo === "tikz" && b.codigo.includes("\\begin{axis}"))
}

export const PREAMBULO_TEX = String.raw`% ============================================================
%  Preâmbulo autocontido do Caderno Aberto
%  Compila com pdfLaTeX (Overleaf, TeX Live, MiKTeX). Nenhum
%  arquivo .cls/.sty externo é necessário.
% ============================================================
\documentclass[__PT__,a4paper,twocolumn]{article}
\usepackage[T1]{fontenc}
\usepackage[utf8]{inputenc}
\usepackage[brazil]{babel}
\usepackage{lmodern}
\usepackage[left=12mm,right=12mm,top=14mm,bottom=16mm,columnsep=7mm]{geometry}
\usepackage{amsmath,amssymb}
\usepackage{xcolor}
\usepackage{graphicx}
\usepackage{booktabs}
\usepackage{enumitem}
\usepackage[version=4]{mhchem}
\usepackage{setspace}
\usepackage{tikz}
\usetikzlibrary{arrows.meta,positioning,calc,decorations.markings,babel}
__PGFPLOTS__
\usepackage[most]{tcolorbox}
\usepackage{titlesec}
\usepackage{url}
\usepackage[normalem]{ulem}
\usepackage[hidelinks]{hyperref}

% ---------- Cores (identidade Caderno Aberto) ----------
\definecolor{cabrand}{HTML}{008241}
\definecolor{cacinza}{HTML}{F4F4F1}
\definecolor{caresultado}{HTML}{B3402E}
\definecolor{caatencao}{HTML}{92400E}
\definecolor{caatencaof}{HTML}{FEF3C7}
\definecolor{cadia}{HTML}{065F46}
\definecolor{cadiaf}{HTML}{D1FAE5}
\definecolor{casimb}{HTML}{5B21B6}
\definecolor{casimbf}{HTML}{EDE9FE}
\definecolor{cacopiar}{HTML}{57534E}
\definecolor{caexemplo}{HTML}{059669}
\definecolor{caexemplof}{HTML}{ECFDF5}
\definecolor{cadica}{HTML}{B45309}
\definecolor{cadicaf}{HTML}{FFFBEB}
\definecolor{canivelum}{HTML}{0369A1}
\definecolor{caniveldois}{HTML}{B45309}
\definecolor{caniveltres}{HTML}{BE123C}

\linespread{__SPREAD__}

% ---------- Comandos pt-BR (compatíveis com o app) ----------
\DeclareMathOperator{\sen}{sen}
\DeclareMathOperator{\tg}{tg}
\DeclareMathOperator{\cotg}{cotg}
\DeclareMathOperator{\cossec}{cossec}
\newcommand{\dec}[1]{#1}                    % expandido na geração; fallback
\newcommand{\un}[1]{\,\mathrm{#1}}          % expandido na geração; fallback
\newcommand{\resultado}[1]{\textcolor{caresultado}{#1}}
\newcommand{\dest}[1]{\textbf{#1}}

% ---------- Rótulos azuis de parágrafo ----------
\newcommand{\rotulofixo}[1]{{\bfseries\color{canivelum}#1}}
\newcommand{\rotulo}[1]{\rotulofixo{#1.} }
\newcommand{\definicao}{\rotulofixo{Definição.} }
\newcommand{\formulas}{\rotulofixo{Fórmulas.} }
\newcommand{\relacoes}{\rotulofixo{Relações.} }
\newcommand{\modelo}{\rotulofixo{Modelo básico.} }
\newcommand{\resolucao}{\rotulofixo{Resolução.} }

% ---------- Cabeçalho da nota ----------
\makeatletter
\newcommand{\titulonota}[1]{\def\ca@titulo{#1}}
\newcommand{\creditos}[1]{\def\ca@creditos{#1}}
\def\ca@titulo{Sem título}
\def\ca@creditos{}
\newcommand{\cabecalho}{%
  \begin{center}
    {\footnotesize\bfseries\color{cabrand}CADERNO ABERTO\par}
    \vspace{1.5pt}
    {\Large\bfseries\ca@titulo\par}
    \vspace{2.5pt}
    {\small\color{black!55}\ca@creditos\par}
  \end{center}
  \vspace{2mm}
}
\makeatother

% ---------- Seções numeradas (chip preto, como na web) ----------
\titleformat{\section}[block]
  {\normalfont\large\bfseries}
  {\colorbox{black}{\color{white}\footnotesize\thesection}}
  {6pt}{}
\titlespacing*{\section}{0pt}{8pt}{3pt}

% ---------- Caixa "Sobre esta nota" ----------
\newtcolorbox{sobre}{%
  enhanced, breakable, colback=cacinza, boxrule=0pt,
  borderline west={2.5pt}{0pt}{black!35},
  left=8pt, right=8pt, top=6pt, bottom=6pt,
  before skip=6pt, after skip=8pt}

% ---------- Caixa COPIAR (borda tracejada) ----------
\newcommand{\caetiqueta}[1]{{\scriptsize\bfseries\color{white}\colorbox{black}{\hspace{2.5pt}#1\hspace{2.5pt}}}}
\newtcolorbox{copiar}[1]{%
  enhanced, breakable, colback=white, colframe=cacopiar,
  boxrule=1.1pt, frame style={dash pattern=on 3.5pt off 2.2pt},
  left=8pt, right=8pt, top=6pt, bottom=7pt,
  before skip=8pt, after skip=10pt,
  before upper={\caetiqueta{COPIAR}\hspace{5pt}{\bfseries\footnotesize\color{cacopiar}\MakeUppercase{#1}}\par\vspace{3pt}}}

% ---------- Exemplo resolvido / Dica ----------
\newtcolorbox{exemplo}[1][]{%
  enhanced, breakable, colback=caexemplof, boxrule=0pt,
  borderline west={3pt}{0pt}{caexemplo},
  left=8pt, right=8pt, top=6pt, bottom=7pt,
  before skip=8pt, after skip=10pt,
  before upper={{\bfseries\footnotesize\color{caexemplo}\MakeUppercase{#1}}\par\vspace{3pt}}}
\newtcolorbox{dica}[1][]{%
  enhanced, breakable, colback=cadicaf, boxrule=0pt,
  borderline west={3pt}{0pt}{cadica},
  left=8pt, right=8pt, top=6pt, bottom=7pt,
  before skip=8pt, after skip=10pt,
  before upper={{\bfseries\footnotesize\color{cadica}\MakeUppercase{#1}}\par\vspace{3pt}}}

% ---------- Chamadas (atenção / dia a dia / símbolos) ----------
\newcommand{\cachamada}[4]{%
  \begin{tcolorbox}[enhanced, breakable, colback=#2, boxrule=0pt,
    borderline west={3pt}{0pt}{#1},
    left=7pt, right=7pt, top=4pt, bottom=4pt,
    before skip=6pt, after skip=8pt]
  {\bfseries\itshape\color{#1}#3:} #4
  \end{tcolorbox}}
\newcommand{\atencao}[1]{\cachamada{caatencao}{caatencaof}{Atenção}{#1}}
\newcommand{\diaadia}[1]{\cachamada{cadia}{cadiaf}{No dia a dia}{#1}}
\newcommand{\simbolos}[1]{\cachamada{casimb}{casimbf}{Símbolos}{#1}}

% ---------- Listas ----------
\newenvironment{itens}{\begin{itemize}[leftmargin=1.2em,itemsep=2pt,topsep=2pt,parsep=0pt]}{\end{itemize}}

% ---------- Exercícios com níveis e gabarito ----------
\newtcolorbox{exercicios}[1][]{%
  enhanced, breakable, colback=black!2, boxrule=0.6pt, colframe=black!25,
  left=8pt, right=8pt, top=6pt, bottom=7pt,
  before skip=8pt, after skip=10pt,
  before upper={{\bfseries\footnotesize\color{black!55}\MakeUppercase{#1}}\par\vspace{3pt}}}
\newenvironment{questoes}{\begin{enumerate}[leftmargin=1.55em,itemsep=4pt,topsep=3pt,parsep=0pt]}{\end{enumerate}}
\newenvironment{alternativas}{\begin{enumerate}[label=\textup{(\alph*)},leftmargin=2.1em,itemsep=1pt,topsep=2pt,parsep=0pt]}{\end{enumerate}}
\newcommand{\nivel}[2]{\par\vspace{3pt}\hbox{{\small\bfseries\color{black!75}NÍVEL #1 {\color{black!35}\textperiodcentered} \MakeUppercase{#2}}}\vspace{1pt}}
\newcommand{\gabarito}[1]{%
  \begin{tcolorbox}[enhanced, breakable, colback=white, colframe=black!25,
    boxrule=0.6pt, left=8pt, right=8pt, top=5pt, bottom=5pt,
    before skip=6pt, after skip=8pt]
  {\scriptsize\bfseries\color{black!60}GABARITO\par\vspace{1pt}#1}
  \end{tcolorbox}}

% ---------- Figuras com legenda ----------
\makeatletter
\newenvironment{figuranota}[1]{%
  \def\figanota@leg{#1}%
  \par\vspace{5pt}\begin{center}}%
 {\par{\footnotesize\color{black!60}\figanota@leg}\end{center}\vspace{5pt}}
\makeatother
\newcommand{\imagemfaltando}[1]{%
  \begin{tcolorbox}[colback=black!3, boxrule=0.6pt, colframe=black!30,
    left=6pt, right=6pt, top=5pt, bottom=5pt]
  \centering\footnotesize\itshape Imagem não encontrada junto ao arquivo .tex.\\
  Baixe em \path{#1} e salve na pasta \texttt{imagens/}.
  \end{tcolorbox}}
\newcommand{\imagemexterna}[1]{%
  \begin{tcolorbox}[colback=black!3, boxrule=0.6pt, colframe=black!30,
    left=6pt, right=6pt, top=5pt, bottom=5pt]
  \centering\footnotesize\itshape Imagem externa (não é baixada automaticamente):\\
  \path{#1}
  \end{tcolorbox}}

\setlength{\parindent}{0pt}
\setlength{\parskip}{4pt}
`

/** Gera o documento .tex completo (autocontido) de uma nota. */
export function gerarTex(nota: NotaDados, professor: string): string {
  const creditos = montarCreditos(nota, professor)
  const { pt, spread } = opcoesDocumento(nota.aparencia)
  const habilidades = nota.habilidades.trim()
    ? ` Habilidades em foco: ${escaparLatex(nota.habilidades.trim())}.`
    : ""
  const sobre = nota.sobre.trim()
    ? `\\begin{sobre}\n${inlineParaLatex(nota.sobre.trim())}${habilidades}\n\\end{sobre}\n\n`
    : ""
  const corpo = nota.blocos.map(blocoParaLatex).join("").trimEnd()

  const preambulo = PREAMBULO_TEX.replace("__PT__", pt)
    .replace("__SPREAD__", spread)
    .replace(
      "__PGFPLOTS__",
      usaPgfplots(nota.blocos) ? String.raw`\usepackage{pgfplots}\pgfplotsset{compat=1.18}` : "",
    )

  return `${preambulo}\\titulonota{${inlineParaLatex(
    nota.titulo,
  )}}\n\\creditos{${inlineParaLatex(creditos)}}\n\n\\begin{document}\n\\twocolumn[{\\cabecalho}]\n\n${sobre}${corpo}\n\n\\end{document}\n`
}

export { textoRotulo }
