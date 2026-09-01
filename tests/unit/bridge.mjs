// Teste da ponte Lexical (bridge). Compila src/lib/notas/lexical-bridge.ts
// para CJS e valida o round-trip texto, estado e texto de volta.

import { execSync } from "node:child_process"
import { createRequire } from "node:module"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const aqui = dirname(fileURLToPath(import.meta.url))
const raiz = join(aqui, "..", "..")

execSync("npx tsc -p tests/unit/tsconfig.bridge.json", { cwd: raiz, stdio: "inherit" })

const req = createRequire(import.meta.url)
const { textoParaEstado, estadoParaTexto, formulaParaEstado, estadoParaFormula } = req(
  "./build/lib/notas/lexical-bridge.js",
)
const { blocosParaEstado, estadoParaBlocos } = req("./build/lib/notas/lexical-documento.js")

let falhas = 0
let total = 0
function t(nome, cond) {
  total++
  if (cond) console.log(`  ok  ${nome}`)
  else {
    falhas++
    console.error(`FALHA  ${nome}`)
  }
}

function rt(texto) {
  const estado = textoParaEstado(texto)
  return estadoParaTexto(estado)
}

console.log("\n== ponte texto ↔ Lexical ==")
t("texto simples", rt("Olá mundo") === "Olá mundo")
t("negrito", rt("um **negrito** aqui") === "um **negrito** aqui")
t("itálico", rt("*itálico*") === "*itálico*")
t("código", rt("use `x` aqui") === "use `x` aqui")
t("fórmula inline", rt("P = $U \\cdot i$") === "P = $U \\cdot i$")
t("fórmula display", rt("$$E = mc^2$$") === "$$E = mc^2$$")
t("resultado", rt("veja \\resultado{12} m") === "veja \\resultado{12} m")
t("dest", rt("\\dest{chave}") === "\\dest{chave}")
t("riscado", rt("~~antigo~~") === "~~antigo~~")
t("link", rt("[site](https://exemplo.com)") === "[site](https://exemplo.com)")
// equação dentro de negrito: a equação não pode ficar em negrito no
// Lexical; a forma estável (após a 1ª edição) separa os marcadores
t("negrito com fórmula por dentro (estável)", rt("**a **$x$** b**") === "**a **$x$** b**")
t("quebra de linha", rt("linha 1\nlinha 2") === "linha 1\nlinha 2")
t("resultado com fórmula por dentro", rt("\\resultado{$v_0$}") === "\\resultado{$v_0$}")
t(
  "misto",
  rt("**negrito**, *itálico*, $x^2$, `código` e ~~riscado~~") ===
    "**negrito**, *itálico*, $x^2$, `código` e ~~riscado~~",
)

// fórmula display
const estadoF = formulaParaEstado("v = \\frac{\\Delta s}{\\Delta t}")
t("fórmula display extrai latex", estadoParaFormula(estadoF) === "v = \\frac{\\Delta s}{\\Delta t}")

console.log("\n== ponte documento (blocos ↔ Lexical) ==")

function igual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b)
}

const notaDoc = {
  blocos: [
    { id: "b1", tipo: "secao", titulo: "Introdução" },
    {
      id: "b2",
      tipo: "paragrafo",
      texto: "Texto com **negrito** e $x^2$ e \\resultado{3,0} m.",
      rotulo: { tipo: "definicao" },
    },
    { id: "b3", tipo: "formula", latex: "v = \\frac{\\Delta s}{\\Delta t}" },
    { id: "b4", tipo: "lista", itens: ["um **item**", "dois"] },
    {
      id: "b5",
      tipo: "tabela",
      comCabecalho: true,
      linhas: [
        ["A", "B"],
        ["1", "2"],
      ],
    },
    { id: "b6", tipo: "chamada", estilo: "atencao", texto: "Cuidado!" },
    { id: "b7", tipo: "figura", url: "https://exemplo.com/a.png", legenda: "legenda" },
    { id: "b8", tipo: "tikz", codigo: "\\draw (0,0) -- (1,1);", legenda: "desenho" },
    {
      id: "b9",
      tipo: "copiar",
      rotulo: "Conceito",
      filhos: [{ id: "b9a", tipo: "paragrafo", texto: "levar", rotulo: null }],
    },
    {
      id: "b10",
      tipo: "exercicios",
      rotulo: "Exercícios propostos",
      niveis: [
        {
          numero: 1,
          titulo: "Conceitos",
          questoes: [{ id: "q1", enunciado: "quanto é?", alternativas: ["1", "2"], correta: 1 }],
        },
        { numero: 2, titulo: "Aplicação", questoes: [] },
        { numero: 3, titulo: "Síntese", questoes: [] },
      ],
      gabarito: "2) discursiva",
    },
  ],
}

const estadoDoc = blocosParaEstado(notaDoc.blocos)
const voltaDoc = estadoParaBlocos(estadoDoc)
t("documento preserva todos os blocos", voltaDoc.length === notaDoc.blocos.length)
t("secao preservada", igual(voltaDoc[0], notaDoc.blocos[0]))
t("paragrafo preservado (rotulo + texto)", igual(voltaDoc[1], notaDoc.blocos[1]))
t("formula preservada", igual(voltaDoc[2], notaDoc.blocos[2]))
t("lista preservada", igual(voltaDoc[3], notaDoc.blocos[3]))
t("tabela preservada", igual(voltaDoc[4], notaDoc.blocos[4]))
t("chamada preservada", igual(voltaDoc[5], notaDoc.blocos[5]))
t("figura preservada", igual(voltaDoc[6], notaDoc.blocos[6]))
t("tikz preservado", igual(voltaDoc[7], notaDoc.blocos[7]))
t("caixa preservada", igual(voltaDoc[8], notaDoc.blocos[8]))
t("exercicios preservado", igual(voltaDoc[9], notaDoc.blocos[9]))
t(
  "ids preservados",
  igual(
    voltaDoc.map((b) => b.id),
    notaDoc.blocos.map((b) => b.id),
  ),
)

console.log(`\n${total - falhas}/${total} testes passaram`)
process.exit(falhas ? 1 : 0)
