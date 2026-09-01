// Utilitários LaTeX. Compatibilidade com o pipeline original (notaaula.cls) e preparação para KaTeX.

/**
 * Encontra o argumento `{...}` balanceado que começa em `abre`
 * (índice do `{`). Retorna { fim, conteudo }. Considera `\{`, `\}`
 * e comandos (`\alpha`) ao contar chaves.
 */
export function varrerChaves(s: string, abre: number): { fim: number; conteudo: string } | null {
  if (s[abre] !== "{") return null
  let profundidade = 0
  for (let i = abre; i < s.length; i++) {
    const c = s[i]
    if (c === "\\") {
      i++ // pula o caractere escapado/comando
      continue
    }
    if (c === "{") profundidade++
    else if (c === "}") {
      profundidade--
      if (profundidade === 0) {
        return { fim: i, conteudo: s.slice(abre + 1, i) }
      }
    }
  }
  return null
}

/** Substitui todas as ocorrências de `\cmd{...}` (chaves balanceadas). */
export function substituirComando(
  latex: string,
  cmd: string,
  fn: (conteudo: string) => string,
): string {
  const alvo = `\\${cmd}{`
  let saida = ""
  let i = 0
  while (i < latex.length) {
    const idx = latex.indexOf(alvo, i)
    if (idx === -1) {
      saida += latex.slice(i)
      break
    }
    // evita casar \xcmd{ (ex.: \destilo{ ao procurar \dest{)
    const antes = latex[idx - 1]
    if (antes && /[a-zA-Z]/.test(antes)) {
      saida += latex.slice(i, idx + alvo.length)
      i = idx + alvo.length
      continue
    }
    const varredura = varrerChaves(latex, idx + alvo.length - 1)
    if (!varredura) {
      saida += latex.slice(i, idx + alvo.length)
      i = idx + alvo.length
      continue
    }
    saida += latex.slice(i, idx) + fn(varredura.conteudo)
    i = varredura.fim + 1
  }
  return saida
}

/** Divide "4,0" em "4{,}0" . Vírgula decimal sem espaço espúrio. */
function decParaKatex(conteudo: string): string {
  const i = conteudo.indexOf(",")
  if (i === -1) return conteudo
  return `${conteudo.slice(0, i)}{,}${conteudo.slice(i + 1)}`
}

/** Prepara um trecho LaTeX matemático para o KaTeX: \dec{4,0} vira 4{,}0, \un{m/s^2} vira \,\mathrm{m/s^2}, \resultado{X} vira \htmlClass{na-resultado}{X} (coral) e \dest{X} vira \textbf{X}. */
export function preprocessarLatex(latex: string): string {
  let r = latex
  r = substituirComando(r, "dec", decParaKatex)
  r = substituirComando(r, "un", (c) => `\\,\\mathrm{${c}}`)
  r = substituirComando(r, "resultado", (c) => `\\htmlClass{na-resultado}{${c}}`)
  r = substituirComando(r, "dest", (c) => `\\textbf{${c}}`)
  return r
}

/**
 * Expande os comandos pt-BR para LaTeX puro no .tex gerado
 * (pdfLaTeX não conhece \dec/\un/\resultado, então traduzimos
 * para construções de amsmath/xcolor definidas no preâmbulo).
 */
export function prepararMatematicaTex(latex: string): string {
  let r = latex
  r = substituirComando(r, "dec", (c) => c.replace(/,/g, "{,}"))
  r = substituirComando(r, "un", (c) => `\\,\\mathrm{${c}}`)
  r = substituirComando(r, "resultado", (c) => `\\textcolor{caresultado}{${c}}`)
  return r
}

/** Macros pt-BR passadas ao KaTeX (sen, tg, cotg, cossec). */
export const MACROS_KATEX: Record<string, string> = {
  "\\sen": "\\operatorname{sen}",
  "\\tg": "\\operatorname{tg}",
  "\\cotg": "\\operatorname{cotg}",
  "\\cossec": "\\operatorname{cossec}",
}

// Escapamento para gerar.tex

/** Escapa caracteres especiais do LaTeX em texto corrido. */
export function escaparLatex(texto: string): string {
  return texto
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/&/g, "\\&")
    .replace(/%/g, "\\%")
    .replace(/#/g, "\\#")
    .replace(/_/g, "\\_")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}")
}

/**
 * Converte texto-inline (com $matemática$, **negrito**, *itálico*,
 * `código`, \resultado{...}, \dest{...}) para LaTeX corrido.
 * Comandos e matemática passam direto (notaaula.cls os entende).
 */
export function inlineParaLatex(texto: string): string {
  if (!texto) return ""
  let saida = ""
  let i = 0
  const n = texto.length
  while (i < n) {
    // matemática inline $...$ (comandos pt-BR expandidos para pdfLaTeX)
    if (texto[i] === "$") {
      const fim = acharFimMatematica(texto, i)
      if (fim === -1) {
        saida += escaparLatex(texto.slice(i))
        break
      }
      saida += `$${prepararMatematicaTex(texto.slice(i + 1, fim))}$`
      i = fim + 1
      continue
    }
    // comandos que passam direto com argumento
    const mCmd = /^\\(resultado|dest|textbf|textit|texttt|text|mathrm|mathbf|ce|pu)\b/.exec(
      texto.slice(i),
    )
    if (mCmd) {
      const inicioArg = i + mCmd[0].length
      // pula espaços
      let j = inicioArg
      while (j < n && texto[j] === " ") j++
      if (texto[j] === "{") {
        const v = varrerChaves(texto, j)
        if (v) {
          saida += texto.slice(i, v.fim + 1)
          i = v.fim + 1
          continue
        }
      }
      // sem argumento: passa o comando
      saida += mCmd[0]
      i = inicioArg
      continue
    }
    // \ce sem chaves? (raro) . Outros comandos soltos em texto são escapados
    // **negrito**
    if (texto.startsWith("**", i)) {
      const fim = texto.indexOf("**", i + 2)
      if (fim !== -1) {
        saida += `\\textbf{${inlineParaLatex(texto.slice(i + 2, fim))}}`
        i = fim + 2
        continue
      }
    }
    // *itálico*
    if (texto[i] === "*") {
      const fim = texto.indexOf("*", i + 1)
      if (fim !== -1 && texto[fim + 1] !== "*") {
        saida += `\\textit{${inlineParaLatex(texto.slice(i + 1, fim))}}`
        i = fim + 1
        continue
      }
    }
    // ~~riscado~~
    if (texto.startsWith("~~", i)) {
      const fim = texto.indexOf("~~", i + 2)
      if (fim !== -1) {
        saida += `\\sout{${inlineParaLatex(texto.slice(i + 2, fim))}}`
        i = fim + 2
        continue
      }
    }
    // [texto](url) . Link (hyperref)
    if (texto[i] === "[") {
      const fimColchete = texto.indexOf("]", i + 1)
      if (fimColchete !== -1 && texto[fimColchete + 1] === "(") {
        const fimParen = texto.indexOf(")", fimColchete + 2)
        if (fimParen !== -1) {
          const url = texto.slice(fimColchete + 2, fimParen)
          saida += `\\href{${escaparUrl(url)}}{${inlineParaLatex(texto.slice(i + 1, fimColchete))}}`
          i = fimParen + 1
          continue
        }
      }
    }
    // \n — quebra de linha dentro do bloco (Shift+Enter no editor)
    if (texto[i] === "\n") {
      saida += "\\\\\n"
      i++
      continue
    }
    // `código`
    if (texto[i] === "`") {
      const fim = texto.indexOf("`", i + 1)
      if (fim !== -1) {
        saida += `\\texttt{${escaparLatex(texto.slice(i + 1, fim))}}`
        i = fim + 1
        continue
      }
    }
    // texto comum: acumula até o próximo caractere especial
    let j = i
    while (
      j < n &&
      texto[j] !== "$" &&
      texto[j] !== "*" &&
      texto[j] !== "`" &&
      texto[j] !== "\\" &&
      texto[j] !== "[" &&
      texto[j] !== "\n" &&
      texto[j] !== "~"
    ) {
      j++
    }
    if (j === i) j++ // garante progresso
    saida += escaparLatex(texto.slice(i, j))
    i = j
  }
  return saida
}

/** Índice do `$` que fecha a matemática iniciada em `ini` (-1 se não fechar). */
function acharFimMatematica(texto: string, ini: number): number {
  const n = texto.length
  let i = ini + 1
  while (i < n) {
    if (texto[i] === "\\") {
      i += 2
      continue
    }
    if (texto[i] === "$") return i
    i++
  }
  return -1
}

/** Escapa texto para uso dentro de \url / caminho de arquivo. */
export function escaparCaminhoLatex(texto: string): string {
  return texto.replace(/[\\{}$&#^_~%]/g, "")
}

/** Escapa URL para uso em \href{...} (sem caracteres que quebram LaTeX). */
function escaparUrl(texto: string): string {
  return escaparLatex(texto)
}
