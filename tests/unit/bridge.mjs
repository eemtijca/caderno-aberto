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

console.log(`\n${total - falhas}/${total} testes passaram`)
process.exit(falhas ? 1 : 0)
