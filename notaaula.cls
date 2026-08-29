%% ============================================================
%%  notaaula.cls — classe para notas de aula de Física
%%  Prof. Josué Cavalcante
%%
%%  Uso:  \documentclass{notaaula}          (tema escuro, padrão)
%%        \documentclass[claro]{notaaula}   (tema claro, p/ impressão)
%%
%%  Compilar com pdflatex (2 passadas).
%% ============================================================
\NeedsTeXFormat{LaTeX2e}
\ProvidesClass{notaaula}[2026/08/29 v1.0 Notas de aula de Fisica]

%% ---------- opções de tema ----------------------------------
\newif\ifna@claro \na@clarofalse
\DeclareOption{claro}{\na@clarotrue}
\DeclareOption{escuro}{\na@clarofalse}
\DeclareOption*{\PassOptionsToClass{\CurrentOption}{article}}
\ExecuteOptions{escuro}
\ProcessOptions\relax

\LoadClass[a4paper,12pt,twocolumn]{article}

%% ---------- pacotes -----------------------------------------
\RequirePackage[T1]{fontenc}
\RequirePackage[utf8]{inputenc}
\RequirePackage[brazil]{babel}
\RequirePackage{amsmath,amssymb}
\RequirePackage[notext]{stix2}          % matemática STIX Two
\RequirePackage[lining,mainfont]{nunito}% texto Nunito
\RequirePackage{xcolor}
\RequirePackage[most]{tcolorbox}
\RequirePackage{enumitem}
\RequirePackage{tikz}
\RequirePackage{pgfplots}
\pgfplotsset{compat=1.18}
\RequirePackage{graphicx}
\RequirePackage{booktabs,array}
\RequirePackage{titlesec}
\RequirePackage{fancyhdr}
\RequirePackage{microtype}
\RequirePackage[hidelinks]{hyperref}
\usetikzlibrary{arrows.meta,positioning,calc,decorations.markings}

\RequirePackage[a4paper,left=1.15cm,right=1.15cm,top=1.15cm,bottom=1.35cm,
                columnsep=0.55cm,footskip=0.75cm]{geometry}

%% ---------- paleta ------------------------------------------
\ifna@claro
  \definecolor{naFundo}  {HTML}{FFFFFF}
  \definecolor{naCaixa}  {HTML}{F1EFE9}
  \definecolor{naTexto}  {HTML}{1C1C1C}
  \definecolor{naSuave}  {HTML}{6B6864}
  \definecolor{naFilete} {HTML}{B9B5AD}
  \definecolor{naAzul}   {HTML}{1B5FA8}
  \definecolor{naAmbar}  {HTML}{8A5D0A}
  \definecolor{naCoral}  {HTML}{B83D26}
  \definecolor{naVerde}  {HTML}{1B6B3C}
  \definecolor{naLilas}  {HTML}{63389A}
  \definecolor{naExemplo}{HTML}{E9F2EA}
  \definecolor{naDica}   {HTML}{F8F0DF}
\else
  \definecolor{naFundo}  {HTML}{2B2B2B}
  \definecolor{naCaixa}  {HTML}{3A3A38}
  \definecolor{naTexto}  {HTML}{F8F6F0}
  \definecolor{naSuave}  {HTML}{A8A49A}
  \definecolor{naFilete} {HTML}{8A8781}
  \definecolor{naAzul}   {HTML}{82C8FF}
  \definecolor{naAmbar}  {HTML}{FFC46E}
  \definecolor{naCoral}  {HTML}{FF9682}
  \definecolor{naVerde}  {HTML}{82E6A0}
  \definecolor{naLilas}  {HTML}{D6B0FF}
  \definecolor{naExemplo}{HTML}{303E32}
  \definecolor{naDica}   {HTML}{40362A}
\fi

\AtBeginDocument{%
  \pagecolor{naFundo}%
  \color{naTexto}%
}

%% ---------- ajustes tipográficos ----------------------------
\setlength{\parindent}{0pt}
\setlength{\parskip}{0pt}
\linespread{1.04}
\frenchspacing
% colunas estreitas: tolera mais espaçamento antes de estourar a linha
\tolerance=1800
\emergencystretch=2.5em
\hyphenpenalty=150
\raggedbottom
\clubpenalty=10000 \widowpenalty=10000

% operadores em português
\DeclareMathOperator{\sen}{sen}
\DeclareMathOperator{\tg}{tg}
\DeclareMathOperator{\cotg}{cotg}
\DeclareMathOperator{\cossec}{cossec}

% vírgula decimal sem espaço espúrio:  $4{,}0$  ->  \dec{4,0}
\newcommand{\dec}[1]{\ensuremath{\na@dec#1\relax}}
\def\na@dec#1,#2\relax{#1{,}#2}
% unidade com espaço fino:  \un{A}, \un{m/s^2}
\newcommand{\un}[1]{\ensuremath{\,\mathrm{#1}}}

%% ---------- cabeçalho e rodapé ------------------------------
\pagestyle{fancy}
\fancyhf{}
\renewcommand{\headrulewidth}{0pt}
\renewcommand{\footrulewidth}{0pt}
\fancyfoot[R]{%
  \tikz[baseline=-0.6ex]{%
    \node[circle,draw=naSuave,line width=0.4pt,inner sep=2.4pt,
          text=naTexto,font=\footnotesize]{\thepage};}}
\fancypagestyle{plain}{\fancyhf{}%
  \renewcommand{\headrulewidth}{0pt}%
  \fancyfoot[R]{\tikz[baseline=-0.6ex]{%
    \node[circle,draw=naSuave,line width=0.4pt,inner sep=2.4pt,
          text=naTexto,font=\footnotesize]{\thepage};}}}

%% ---------- seções ------------------------------------------
\titleformat{\section}[block]
  {\normalfont\normalsize\bfseries\color{naTexto}\raggedright%
   \titleline{\color{naFilete}\titlerule[0.3pt]}\vspace{2.5pt}}
  {\thesection.}{0.35em}{}
  [\vspace{1.5pt}{\color{naFilete}\titlerule[0.3pt]}]
\titlespacing*{\section}{0pt}{7pt plus 2pt minus 1pt}{3.5pt}

\titleformat{\subsection}[runin]
  {\normalfont\bfseries\color{naAzul}}{}{0pt}{}[\;]
\titlespacing*{\subsection}{0pt}{3pt}{0.4em}

\setcounter{secnumdepth}{1}

%% ---------- cabeçalho da nota (ocupa as duas colunas) --------
\newcommand{\na@titulo}{Sem título}
\newcommand{\na@creditos}{}
\newcommand{\titulonota}[1]{\renewcommand{\na@titulo}{#1}}
\newcommand{\creditos}[1]{\renewcommand{\na@creditos}{#1}}

\newcommand{\cabecalho}{%
  \twocolumn[{%
    \begin{center}
      {\bfseries\Huge\color{naTexto}\na@titulo}\par\vspace{5pt}
      {\large\color{naSuave}\na@creditos}\par\vspace{7pt}
      {\color{naFilete}\rule{0.30\textwidth}{0.4pt}}
    \end{center}
    \vspace{7pt}
  }]%
}

%% ---------- estilo-base dos blocos --------------------------
%% \natabsep = distância entre o filete e o topo do corpo do bloco
%% (é também a altura da faixa onde o rótulo é composto).
\newlength{\natabsep}\setlength{\natabsep}{10.5pt}
\newlength{\na@tabhalf}
\AtBeginDocument{\setlength{\na@tabhalf}{0.5\natabsep}}

%% Cada bloco é: filete + rótulo pequeno + corpo.
%% O rótulo fica acima da moldura; ao quebrar de coluna,
%% a continuação recebe o rótulo definido em "title after break".
\tcbset{
  nabloco/.style={
    enhanced, breakable, sharp corners, boxrule=0pt,
    colframe=naCaixa, colback=naCaixa, coltext=naTexto,
    left=5pt, right=5pt, top=4.5pt, bottom=4.5pt,
    boxsep=0pt, parbox=false,
    before skip=6pt plus 2pt, after skip=6pt plus 2pt,
    enlarge left by=-1.5pt, enlarge right by=-1.5pt, width=\linewidth+3pt,
    fonttitle=\scriptsize\normalfont,
    coltitle=naSuave,
    % a faixa do rótulo tem altura fixa (\natabsep), então o filete
    % desenhado em \tcboxedtitleheight fica sempre à mesma distância do corpo
    attach boxed title to top left={},
    boxed title style={empty, boxrule=0pt, sharp corners, valign=center,
                       height=\natabsep,
                       left=1.5pt, right=0pt, top=0pt, bottom=0pt},
    boxed title size=title,
    overlay unbroken and first={%
      \draw[naFilete,line width=0.3pt]
        ([yshift=\tcboxedtitleheight]frame.north west) --
        ([yshift=\tcboxedtitleheight]frame.north east);},
    overlay middle and last={%
      \draw[naFilete,line width=0.3pt]
        ([yshift=\tcboxedtitleheight]frame.north west) --
        ([yshift=\tcboxedtitleheight]frame.north east);},
  },
  % variante sem preenchimento (só filete + rótulo + texto)
  nalimpo/.style={nabloco, colback=naFundo, colframe=naFundo,
                   left=1.5pt, right=1.5pt},
}

%% ---------- blocos semânticos -------------------------------
% Resumo de abertura
\newenvironment{sobre}
  {\begin{tcolorbox}[nalimpo, title={Sobre esta nota},
                     title after break={Sobre esta nota (cont.)}]}
  {\end{tcolorbox}}

% Bloco que o aluno copia no caderno
\newenvironment{copiar}[1]
  {\begin{tcolorbox}[nabloco, title={COPIAR — #1},
                     title after break={COPIAR — #1 (cont.)}]}
  {\end{tcolorbox}}

% Exemplo resolvido
\newenvironment{exemplo}[1][Exemplo resolvido]
  {\begin{tcolorbox}[nabloco, colback=naExemplo, colframe=naExemplo,
                     title={#1}, title after break={#1 (cont.)}]}
  {\end{tcolorbox}}

% Dica / erro comum
\newenvironment{dica}[1][Dica / erro comum]
  {\begin{tcolorbox}[nabloco, colback=naDica, colframe=naDica,
                     title={#1}, title after break={#1 (cont.)}]}
  {\end{tcolorbox}}

% Lista de exercícios
\newenvironment{exercicios}[1][Exercícios propostos]
  {\begin{tcolorbox}[nabloco, title={#1},
                     title after break={Exercícios (continuação)}]}
  {\end{tcolorbox}}

%% ---------- chamadas de destaque ----------------------------
\newcommand{\rotulo}[1]{{\color{naAzul}\bfseries #1}\ \ignorespaces}
\newcommand{\definicao}{\rotulo{Definição.}}
\newcommand{\formulas}{\rotulo{Fórmulas.}}
\newcommand{\relacoes}{\rotulo{Relações.}}
\newcommand{\modelo}{\rotulo{Modelo básico.}}
\newcommand{\resolucao}{\rotulo{Resolução.}}

\newcommand{\simbolos}[1]{\par{\color{naLilas}\textbf{Símbolos:} #1}\par}
\newcommand{\atencao}[1]{\par{\color{naAmbar}\textbf{Atenção:} #1}\par}
\newcommand{\diaadia}[1]{\par{\color{naVerde}\textit{No dia a dia:} #1}\par}
\newcommand{\resultado}[1]{{\color{naCoral}#1}}
\newcommand{\dest}[1]{\textbf{#1}}

% legenda de figura
\newcommand{\legenda}[1]{\par{\footnotesize\color{naSuave}#1}\par}
\newenvironment{figuranota}[1]
  {\def\na@leg{#1}\par\vspace{4pt}\begin{center}}
  {\end{center}\vspace{-3pt}\legenda{\na@leg}\vspace{4pt}}

%% ---------- exercícios: níveis, questões, alternativas ------
\newcommand{\nivel}[2]{%
  \par\vspace{5pt}%
  {\bfseries\color{\ifnum#1=1 naAzul\else\ifnum#1=2 naAmbar\else naCoral\fi\fi}%
   Nível #1 — #2}\par\vspace{2pt}}

\newlist{questoes}{enumerate}{1}
\setlist[questoes]{resume, label=\arabic*., ref=\arabic*,
  leftmargin=1.55em, labelsep=0.4em, labelwidth=1.15em, align=right,
  topsep=2pt, itemsep=2.5pt, parsep=0pt}

\newlist{alternativas}{enumerate}{1}
\setlist[alternativas]{label=(\alph*), leftmargin=1.9em, labelsep=0.4em,
  topsep=1.5pt, itemsep=1pt, parsep=0pt}

\newlist{itens}{itemize}{2}
\setlist[itens]{label=\textbullet, leftmargin=1.2em, labelsep=0.4em,
  topsep=2pt, itemsep=2pt, parsep=0pt}

\newcommand{\gabarito}[1]{%
  \par\vspace{5pt}%
  {\footnotesize\textbf{Gabarito:} #1\par}}

\endinput
