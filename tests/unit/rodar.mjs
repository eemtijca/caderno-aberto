// Roda os testes unitários das bibliotecas puras (sem banco e sem React):
// LaTeX, Markdown, inline e normalização de aparência.
// Compila src/lib/notas/*.ts para CJS com tsc e carrega com createRequire.

import { execSync } from "node:child_process"
import { createRequire } from "node:module"
import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const aqui = dirname(fileURLToPath(import.meta.url))
const raiz = join(aqui, "..", "..")

execSync("npx tsc -p tests/unit/tsconfig.json", { cwd: raiz, stdio: "inherit" })

const req = createRequire(import.meta.url)
const { gerarTex, montarCreditos } = req("./build/lib/notas/render-latex.js")
const { gerarMarkdown, analisarMarkdown } = req("./build/lib/notas/render-markdown.js")
const { inlineParaLatex, prepararMatematicaTex, preprocessarLatex } = req(
  "./build/lib/notas/latex.js",
)
const { normalizarAparencia, variaveisAparencia } = req("./build/lib/notas/tipos.js")
const { DEMO_NOTA } = req("./build/lib/notas/demo.js")
const { notaModelo } = req("./build/lib/notas/modelo.js")

let falhas = 0
let total = 0

function t(nome, cond) {
  total++
  if (cond) {
    console.log(`  ok  ${nome}`)
  } else {
    falhas++
    console.error(`FALHA  ${nome}`)
  }
}

console.log("\n== gerarTex: documento autocontido ==")
const texDemo = gerarTex(DEMO_NOTA, "Prof. Maria da Silva")
t("não depende de notaaula.cls", !texDemo.includes("\\documentclass{notaaula}"))
t("usa article autocontido", texDemo.includes("\\documentclass[10pt,a4paper,twocolumn]{article}"))
t("cabeçalho com título", texDemo.includes("\\titulonota{Movimento Uniforme — da régua ao GPS}"))
t("créditos montados", montarCreditos(DEMO_NOTA, "Prof. Maria").includes("Física"))
t(
  "comandos pt-BR definidos no preâmbulo",
  [
    "\\DeclareMathOperator{\\sen}",
    "\\DeclareMathOperator{\\tg}",
    "\\newcommand{\\dec}",
    "\\newcommand{\\resultado}",
  ].every((c) => texDemo.includes(c)),
)
t(
  "ambientes definidos no preâmbulo",
  [
    "\\newtcolorbox{sobre}",
    "\\newtcolorbox{copiar}",
    "\\newtcolorbox{exemplo}",
    "\\newtcolorbox{dica}",
    "\\newenvironment{questoes}",
    "\\newenvironment{alternativas}",
    "\\newenvironment{figuranota}",
    "\\newenvironment{itens}",
    "\\newcommand{\\gabarito}",
    "\\newcommand{\\atencao}",
  ].every((c) => texDemo.includes(c)),
)
t("tikz da demo preservado", texDemo.includes("\\begin{tikzpicture}"))
t("demo não usa pgfplots (sem \\begin{axis})", !texDemo.includes("\\usepackage{pgfplots}"))

// begin/end balanceados para ambientes principais
for (const env of [
  "tikzpicture",
  "sobre",
  "copiar",
  "exemplo",
  "dica",
  "questoes",
  "alternativas",
  "itens",
  "exercicios",
  "figuranota",
  "tcolorbox",
  "center",
  "tabular",
  "document",
]) {
  const abre = texDemo.split(`\\begin{${env}}`).length - 1
  const fecha = texDemo.split(`\\end{${env}}`).length - 1
  t(`\\begin{${env}} balanceado (${abre}/${fecha})`, abre === fecha)
}
t(
  "chaves balanceadas (contagem simples)",
  texDemo.replace(/\\[{}]/g, "").split("{").length ===
    texDemo.replace(/\\[{}]/g, "").split("}").length,
)

console.log("\n== gerarTex: matemática pt-BR expandida ==")
const notaMat = {
  ...DEMO_NOTA,
  blocos: [
    { id: "m1", tipo: "formula", latex: "P = U\\,i = \\dec{5,5}\\un{kW}" },
    {
      id: "m2",
      tipo: "paragrafo",
      texto: "A potência $P = \\dec{4,0}\\un{kW}$ com $\\resultado{v = 6{,}67\\,\\text{m/s}}$.",
      rotulo: null,
    },
  ],
}
const texMat = gerarTex(notaMat, "")
t("\\dec expandido no display", texMat.includes("5{,}5"))
t("\\un expandido", texMat.includes("5{,}5\\,\\mathrm{kW}"))
t("\\dec expandido inline", texMat.includes("$P = 4{,}0\\,\\mathrm{kW}$"))
t(
  "\\resultado em math vira \\textcolor",
  texMat.includes("$\\textcolor{caresultado}{v = 6{,}67\\,\\text{m/s}}$"),
)

console.log("\n== gerarTex: aparência mapeada ==")
const texG = gerarTex({ ...DEMO_NOTA, aparencia: { escala: "g", entrelinha: "ampla" } }, "")
t("escala grande => 11pt", texG.includes("\\documentclass[11pt,a4paper,twocolumn]{article}"))
t("entrelinha ampla => linespread maior", texG.includes("\\linespread{1.54}"))
const texP = gerarTex({ ...DEMO_NOTA, aparencia: { escala: "p" } }, "")
t("escala pequena => 9pt", texP.includes("\\documentclass[9pt,a4paper,twocolumn]{article}"))

console.log("\n== gerarTex: imagens com fallback ==")
const notaImg = {
  ...DEMO_NOTA,
  blocos: [
    { id: "i1", tipo: "figura", url: "/api/imagens?path=uid%2Ffoto.webp", legenda: "Figura" },
    { id: "i2", tipo: "figura", url: "https://exemplo.com/foto.png", legenda: "Externa" },
  ],
}
const texImg = gerarTex(notaImg, "")
t("imagem do app vira arquivo local", texImg.includes("\\IfFileExists{imagens/foto.png}"))
t("comenta o download (webp => png=1)", texImg.includes("&png=1"))
t("imagem externa avisa endereço", texImg.includes("\\imagemexterna{https://exemplo.com/foto.png}"))

console.log("\n== gerarTex: nota do modelo compila também ==")
const texModelo = gerarTex({ ...DEMO_NOTA, blocos: notaModelo("Aula de teste") }, "Prof")
t("modelo gera conteúdo", texModelo.includes("\\begin{document}"))
t("modelo contém caixa COPIAR", texModelo.includes("\\begin{copiar}{Nome curto do bloco}"))

console.log("\n== inlineParaLatex / prepararMatematicaTex ==")
t("escapa & % # _", inlineParaLatex("a & b % c # d _ e").includes("a \\& b \\% c \\# d \\_ e"))
t("negrito ** vira textbf", inlineParaLatex("oi **negrito** tchau").includes("\\textbf{negrito}"))
t("código ` vira texttt", inlineParaLatex("use `x` aqui").includes("\\texttt{x}"))
t(
  "\\resultado passa direto em texto",
  inlineParaLatex("veja \\resultado{12} m").includes("\\resultado{12}"),
)
t("\\dec → {,} (KaTeX)", preprocessarLatex("\\dec{4,0}").includes("4{,}0"))
t("\\dec → {,} (pdfLaTeX)", prepararMatematicaTex("\\dec{4,0}").includes("4{,}0"))
t("\\un expandida", prepararMatematicaTex("\\un{m/s^2}").includes("\\,\\mathrm{m/s^2}"))
t(
  "\\resultado → textcolor",
  prepararMatematicaTex("\\resultado{X}").includes("\\textcolor{caresultado}{X}"),
)
t(
  "substituirComando não casa \\destilo{",
  !prepararMatematicaTex("\\destilo{X}").includes("textcolor"),
)

console.log("\n== Markdown: round-trip ==")
const notaCompleta = {
  ...DEMO_NOTA,
  aparencia: { fonte: "serifada", escala: "g", entrelinha: "ampla" },
  blocos: [
    { id: "r0", tipo: "secao", titulo: "Introdução" },
    {
      id: "r1",
      tipo: "paragrafo",
      texto: "Texto com **negrito** e $x^2$ e \\resultado{3,0} m.",
      rotulo: { tipo: "definicao" },
    },
    { id: "r2", tipo: "formula", latex: "v = \\frac{\\Delta s}{\\Delta t}" },
    { id: "r3", tipo: "lista", itens: ["um", "dois"] },
    {
      id: "r4",
      tipo: "tabela",
      comCabecalho: true,
      linhas: [
        ["A", "B"],
        ["1", "2"],
      ],
    },
    { id: "r5", tipo: "chamada", estilo: "atencao", texto: "Cuidado!" },
    { id: "r6", tipo: "figura", url: "https://exemplo.com/a.png", legenda: "legenda" },
    { id: "r7", tipo: "tikz", codigo: "\\draw (0,0) -- (1,1);", legenda: "desenho" },
    {
      id: "r8",
      tipo: "copiar",
      rotulo: "Conceito",
      filhos: [{ id: "r8a", tipo: "paragrafo", texto: "levar", rotulo: null }],
    },
    {
      id: "r9",
      tipo: "exercicios",
      rotulo: "Exercícios propostos",
      niveis: [
        {
          numero: 1,
          titulo: "Conceitos",
          questoes: [
            { id: "q1", enunciado: "quanto é?", alternativas: ["1", "2"], correta: 1 },
            { id: "q2", enunciado: "explique", alternativas: [], correta: null },
          ],
        },
        { numero: 2, titulo: "Aplicação", questoes: [] },
        { numero: 3, titulo: "Síntese", questoes: [] },
      ],
      gabarito: "2) discursiva",
    },
  ],
}
const md = gerarMarkdown(notaCompleta)
t("front-matter com fonte", md.includes("fonte: serifada"))
t("front-matter com escala", md.includes("escala: g"))
t("front-matter com entrelinha", md.includes("entrelinha: ampla"))
t("nível usa separador ·", md.includes("### Nível 1 · Conceitos"))
const volta = analisarMarkdown(md)
t("título preservado", volta.titulo === notaCompleta.titulo)
t("sobre preservado", volta.sobre === notaCompleta.sobre)
t("aparencia preservada (fonte)", volta.aparencia?.fonte === "serifada")
t("aparencia preservada (escala)", volta.aparencia?.escala === "g")
t("aparencia preservada (entrelinha)", volta.aparencia?.entrelinha === "ampla")
t(
  "nível 1 título sem lixo",
  volta.blocos.some((b) => b.tipo === "exercicios" && b.niveis[0]?.titulo === "Conceitos"),
)
t(
  "questão 1 com 2 alternativas",
  volta.blocos.some(
    (b) => b.tipo === "exercicios" && b.niveis[0]?.questoes[0]?.alternativas.length === 2,
  ),
)
t(
  "seção preservada",
  volta.blocos.some((b) => b.tipo === "secao" && b.titulo === "Introdução"),
)
t(
  "fórmula preservada",
  volta.blocos.some((b) => b.tipo === "formula" && b.latex.includes("\\Delta s")),
)
t(
  "tikz preservado",
  volta.blocos.some((b) => b.tipo === "tikz" && b.codigo.includes("\\draw")),
)
t(
  "copiar preservado",
  volta.blocos.some((b) => b.tipo === "copiar" && b.rotulo === "Conceito"),
)
t(
  "chamada preservada",
  volta.blocos.some((b) => b.tipo === "chamada" && b.estilo === "atencao"),
)
t(
  "tabela preservada",
  volta.blocos.some((b) => b.tipo === "tabela" && b.linhas.length === 2),
)

// tolerância ao formato antigo ("Nível 1 . Conceitos")
const mdAntigo = gerarMarkdown(notaCompleta).replace(
  "### Nível 1 · Conceitos",
  "### Nível 1 . Conceitos",
)
const voltaAntiga = analisarMarkdown(mdAntigo)
t(
  "formato antigo ' . ' ainda importa (título limpo)",
  voltaAntiga.blocos.some((b) => b.tipo === "exercicios" && b.niveis[0]?.titulo === "Conceitos"),
)
t(
  "formato antigo: questões não se perdem",
  voltaAntiga.blocos.some(
    (b) => b.tipo === "exercicios" && (b.niveis[0]?.questoes.length ?? 0) === 2,
  ),
)

console.log("\n== normalizarAparencia ==")
t("vazio para vazio", Object.keys(normalizarAparencia(undefined)).length === 0)
t(
  "valor inválido descartado",
  normalizarAparencia({ fonte: "comic-sans", escala: "xx" }).fonte === undefined,
)
t(
  "valores válidos mantidos",
  JSON.stringify(normalizarAparencia({ fonte: "lexend", escala: "gg", entrelinha: "compacta" })) ===
    JSON.stringify({ fonte: "lexend", escala: "gg", entrelinha: "compacta" }),
)
const vars = variaveisAparencia({ fonte: "serifada", escala: "g", entrelinha: "ampla" })
t("variável de fonte", vars["--na-fonte"] === "var(--font-serifada)")
t("variável de escala", vars["--na-escala"] === "1.08")
t("variável de entrelinha", vars["--na-entrelinha"] === "1.85")

// grava o .tex para o teste de compilação com Tectonic (tests/tex)
try {
  const dirSaida = join(raiz, "tests", "tex")
  mkdirSync(dirSaida, { recursive: true })
  writeFileSync(join(dirSaida, "demo.tex"), texDemo)
  writeFileSync(
    join(dirSaida, "completa.tex"),
    gerarTex({ ...notaCompleta, titulo: "Nota Completa — Teste" }, "Prof. Teste"),
  )
  console.log("\n.tex gravados em tests/tex/ para compilação com Tectonic")
} catch (e) {
  console.error("Falha ao gravar .tex de teste:", e)
  falhas++
}

console.log(`\n${total - falhas}/${total} testes passaram`)
process.exit(falhas > 0 ? 1 : 0)
