import type { NotaDados } from "./tipos"

export const DEMO_NOTA: NotaDados = {
  id: "demo-landing",
  slug: "movimento-uniforme-demo",
  titulo: "Movimento Uniforme — da régua ao GPS",
  disciplinaId: "demo-fisica",
  disciplina: { id: "demo-fisica", nome: "Física", cor: "ciano", icone: "Atom", ordem: 1 },
  anoLetivo: 2026,
  mes: 4,
  sobre: "Definição de velocidade média, conversão de unidades e dois problemas contextualizados.",
  habilidades: "EM13CNT101, EM13CNT302",
  status: "publicada",
  criadoEm: new Date().toISOString(),
  atualizadoEm: new Date().toISOString(),
  turmas: [{ id: "demo-1ano", nome: "1º Ano A", serie: "1º ano", anoLetivo: 2026 }],
  blocos: [
    { id: "demo-b1", tipo: "secao", titulo: "Velocidade média" },
    {
      id: "demo-b2",
      tipo: "copiar",
      rotulo: "Conceito-chave",
      filhos: [
        {
          id: "demo-f1",
          tipo: "paragrafo",
          texto: "A **velocidade média** é a razão entre **deslocamento** e intervalo de tempo.",
          rotulo: { tipo: "definicao" },
        },
        { id: "demo-f2", tipo: "formula", latex: "v_{m}=\\frac{\\Delta s}{\\Delta t}" },
        {
          id: "demo-f3",
          tipo: "chamada",
          estilo: "simbolos",
          texto: "$v_m$ (m/s); $\\Delta s$ (m); $\\Delta t$ (s).",
        },
        {
          id: "demo-f4",
          tipo: "chamada",
          estilo: "diaadia",
          texto: "No aplicativo de corrida, o GPS faz exatamente $v_m$ a cada trecho.",
        },
      ],
    },
    {
      id: "demo-b3",
      tipo: "exemplo",
      rotulo: "Exemplo resolvido",
      filhos: [
        {
          id: "demo-f5",
          tipo: "paragrafo",
          texto: "Um ciclista percorre 12 km em 30 min. Qual $v_m$ em m/s?",
        },
        {
          id: "demo-f6",
          tipo: "paragrafo",
          texto:
            "$30\\,\\text{min}=1800\\,\\text{s}$ e $12\\,\\text{km}=12000\\,\\text{m}$. \\resultado{$v_m=6{,}67\\,\\text{m/s}$}",
          rotulo: { tipo: "resolucao" },
        },
      ],
    },
    {
      id: "demo-b4",
      tipo: "tikz",
      codigo:
        "\\begin{tikzpicture}[>=Stealth,scale=0.92, every node/.style={font=\\footnotesize}]\n  \\draw[->,line width=0.6pt] (0,0) -- (6.2,0) node[below right] {$t\\,\\mathrm{s}$};\n  \\draw[->,line width=0.6pt] (0,0) -- (0,4.4) node[above left] {$s\\,\\mathrm{m}$};\n  \\draw[help lines,color=gray!30,step=0.5] (0,0) grid (6,4);\n  \\coordinate (A) at (0,0.8); \\coordinate (B) at (5.5,3.45);\n  \\draw[blue,line width=1.15pt,postaction={decorate,decoration={markings,mark=at position 0.68 with {\\arrow{Stealth[scale=1.15]}}}}] (A) -- (B) node[above right,blue] {$s(t)=s_0+v\\,t$};\n  \\coordinate (P) at (3.0,2.24);\n  \\fill[red] (P) circle (1.7pt);\n  \\draw[dashed,gray] (P) -- ($(P |- 0,0)$) node[below,gray] {$t_1$};\n  \\draw[dashed,gray] (P) -- ($(0,0 |- P)$) node[left,gray] {$s_1$};\n  \\node[above=3mm of P,fill=white,rounded corners=2pt,inner sep=2.5pt,draw=gray!30] {$v = \\dfrac{\\Delta s}{\\Delta t}= \\operatorname{tg}\\alpha$};\n\\end{tikzpicture}",
      legenda: "Gráfico $s\\times t$ do movimento uniforme. O declive indica a velocidade.",
    },
    {
      id: "demo-b5",
      tipo: "exercicios",
      rotulo: "Exercícios propostos",
      niveis: [
        {
          numero: 1,
          titulo: "Conceitos",
          questoes: [
            {
              id: "demo-q1",
              enunciado: "Converta $36\\,\\text{km/h}$ para m/s.",
              alternativas: ["$10\\,\\text{m/s}$", "$36\\,\\text{m/s}$", "$3{,}6\\,\\text{m/s}$"],
              correta: 0,
            },
            {
              id: "demo-q2",
              enunciado: "Explique com suas palavras o que significa velocidade constante.",
              alternativas: [],
              correta: null,
            },
          ],
        },
        { numero: 2, titulo: "Aplicação", questoes: [] },
        { numero: 3, titulo: "Síntese", questoes: [] },
      ],
      gabarito: "Questão 2: resposta discursiva.",
    },
  ],
}

export const DEMO_TOKEN = "demo-landing"
