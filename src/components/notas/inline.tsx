"use client"

// Renderizador de texto inline: $matemática$, **negrito**, *itálico*,
// `código`, ~~riscado~~, [link](url), \resultado{...} (coral),
// \dest{...} e quebras de linha (\n vira <br>). Deve corresponder ao
// que o editor WYSIWYG produz (lexical-bridge) para não haver
// discrepância entre escrita e leitura.

import { Fragment, type ReactNode } from "react"
import { Matematica } from "./matematica"

/** Divide o texto em segmentos de matemática ($...$) e texto. */
function dividirMatematica(texto: string): { tipo: "texto" | "math"; valor: string }[] {
  const segmentos: { tipo: "texto" | "math"; valor: string }[] = []
  let buffer = ""
  let i = 0
  while (i < texto.length) {
    const c = texto[i]
    if (c === "$") {
      // procura o $ de fechamento
      let j = i + 1
      while (j < texto.length && texto[j] !== "$") {
        if (texto[j] === "\\") j++
        j++
      }
      if (j < texto.length) {
        if (buffer) segmentos.push({ tipo: "texto", valor: buffer })
        segmentos.push({ tipo: "math", valor: texto.slice(i + 1, j) })
        buffer = ""
        i = j + 1
        continue
      }
    }
    buffer += c
    i++
  }
  if (buffer) segmentos.push({ tipo: "texto", valor: buffer })
  return segmentos
}

/** Extrai o argumento {balanceado} que começa em idx (posição do '{'). */
function argumentoBalanceado(s: string, idx: number): { fim: number; conteudo: string } | null {
  let profundidade = 0
  for (let i = idx; i < s.length; i++) {
    if (s[i] === "\\") {
      i++
      continue
    }
    if (s[i] === "{") profundidade++
    else if (s[i] === "}") {
      profundidade--
      if (profundidade === 0) return { fim: i, conteudo: s.slice(idx + 1, i) }
    }
  }
  return null
}

/** Renderiza um segmento de texto puro com marcações inline. */
function renderizarTexto(valor: string, chaveBase: string): ReactNode[] {
  const nos: ReactNode[] = []
  let buffer = ""
  let i = 0
  let contador = 0

  const push = (no: ReactNode) => {
    if (buffer) {
      nos.push(<Fragment key={`${chaveBase}-t${contador++}`}>{buffer}</Fragment>)
      buffer = ""
    }
    nos.push(<Fragment key={`${chaveBase}-n${contador++}`}>{no}</Fragment>)
  }

  while (i < valor.length) {
    // \resultado{...} . Destaque coral (pode conter $math$)
    if (valor.startsWith("\\resultado{", i)) {
      const arg = argumentoBalanceado(valor, i + 10)
      if (arg) {
        push(
          <span className="font-semibold text-rose-700 dark:text-rose-300">
            {renderizarInline(arg.conteudo, `${chaveBase}-r${contador}`)}
          </span>,
        )
        i = arg.fim + 1
        continue
      }
    }
    // \dest{...} . Palavra-chave em negrito
    if (valor.startsWith("\\dest{", i)) {
      const arg = argumentoBalanceado(valor, i + 5)
      if (arg) {
        push(
          <strong className="font-bold">
            {renderizarInline(arg.conteudo, `${chaveBase}-d${contador}`)}
          </strong>,
        )
        i = arg.fim + 1
        continue
      }
    }
    // \textbf{...}
    if (valor.startsWith("\\textbf{", i)) {
      const arg = argumentoBalanceado(valor, i + 7)
      if (arg) {
        push(<strong>{renderizarInline(arg.conteudo, `${chaveBase}-b${contador}`)}</strong>)
        i = arg.fim + 1
        continue
      }
    }
    // \textit{...}
    if (valor.startsWith("\\textit{", i)) {
      const arg = argumentoBalanceado(valor, i + 7)
      if (arg) {
        push(<em>{renderizarInline(arg.conteudo, `${chaveBase}-i${contador}`)}</em>)
        i = arg.fim + 1
        continue
      }
    }
    // [texto](url) . Link
    if (valor[i] === "[") {
      const fimColchete = valor.indexOf("]", i + 1)
      if (fimColchete !== -1 && valor[fimColchete + 1] === "(") {
        const fimParen = valor.indexOf(")", fimColchete + 2)
        if (fimParen !== -1) {
          const url = valor.slice(fimColchete + 2, fimParen)
          push(
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-700 decoration-brand-700/40 hover:decoration-brand-700 dark:text-brand-300 dark:decoration-brand-300/40 dark:hover:decoration-brand-300 underline"
            >
              {renderizarInline(valor.slice(i + 1, fimColchete), `${chaveBase}-L${contador}`)}
            </a>,
          )
          i = fimParen + 1
          continue
        }
      }
    }
    // **negrito**
    if (valor.startsWith("**", i)) {
      const fim = valor.indexOf("**", i + 2)
      if (fim !== -1) {
        push(
          <strong>{renderizarInline(valor.slice(i + 2, fim), `${chaveBase}-B${contador}`)}</strong>,
        )
        i = fim + 2
        continue
      }
    }
    // *itálico*
    if (valor[i] === "*" && valor[i + 1] !== "*") {
      const fim = valor.indexOf("*", i + 1)
      if (fim !== -1 && valor[fim + 1] !== "*") {
        push(<em>{renderizarInline(valor.slice(i + 1, fim), `${chaveBase}-I${contador}`)}</em>)
        i = fim + 1
        continue
      }
    }
    // ~~riscado~~
    if (valor.startsWith("~~", i)) {
      const fim = valor.indexOf("~~", i + 2)
      if (fim !== -1) {
        push(<del>{renderizarInline(valor.slice(i + 2, fim), `${chaveBase}-S${contador}`)}</del>)
        i = fim + 2
        continue
      }
    }
    // `código`
    if (valor[i] === "`") {
      const fim = valor.indexOf("`", i + 1)
      if (fim !== -1) {
        push(
          <code className="rounded bg-stone-200 px-1 py-0.5 font-mono text-[0.9em] dark:bg-stone-800">
            {valor.slice(i + 1, fim)}
          </code>,
        )
        i = fim + 1
        continue
      }
    }
    // \n — quebra de linha dentro do bloco (Shift+Enter no editor)
    if (valor[i] === "\n") {
      push(<br />)
      i++
      continue
    }
    buffer += valor[i]
    i++
  }
  if (buffer) nos.push(<Fragment key={`${chaveBase}-fim`}>{buffer}</Fragment>)
  return nos
}

/** Renderiza texto inline completo (math + marcações). */
export function renderizarInline(texto: string, chave = "in"): ReactNode[] {
  if (!texto) return []
  return dividirMatematica(texto).map((seg, idx) =>
    seg.tipo === "math" ? (
      <Matematica key={`${chave}-m${idx}`} latex={seg.valor} />
    ) : (
      <Fragment key={`${chave}-s${idx}`}>{renderizarTexto(seg.valor, `${chave}-s${idx}`)}</Fragment>
    ),
  )
}

/** Componente de conveniência para parágrafos inline. */
export function Inline({ texto }: { texto: string }) {
  return <>{renderizarInline(texto)}</>
}
