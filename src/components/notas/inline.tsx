"use client"

import { Fragment, type ReactNode } from "react"
import { Matematica } from "./matematica"

function dividirMatematica(texto: string): { tipo: "texto" | "math"; valor: string }[] {
  const segmentos: { tipo: "texto" | "math"; valor: string }[] = []
  let buffer = ""
  let i = 0
  while (i < texto.length) {
    const c = texto[i]
    if (c === "$") {
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
    if (valor.startsWith("\\textbf{", i)) {
      const arg = argumentoBalanceado(valor, i + 7)
      if (arg) {
        push(<strong>{renderizarInline(arg.conteudo, `${chaveBase}-b${contador}`)}</strong>)
        i = arg.fim + 1
        continue
      }
    }
    if (valor.startsWith("\\textit{", i)) {
      const arg = argumentoBalanceado(valor, i + 7)
      if (arg) {
        push(<em>{renderizarInline(arg.conteudo, `${chaveBase}-i${contador}`)}</em>)
        i = arg.fim + 1
        continue
      }
    }
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
    if (valor[i] === "*" && valor[i + 1] !== "*") {
      const fim = valor.indexOf("*", i + 1)
      if (fim !== -1 && valor[fim + 1] !== "*") {
        push(<em>{renderizarInline(valor.slice(i + 1, fim), `${chaveBase}-I${contador}`)}</em>)
        i = fim + 1
        continue
      }
    }
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
    buffer += valor[i]
    i++
  }
  if (buffer) nos.push(<Fragment key={`${chaveBase}-fim`}>{buffer}</Fragment>)
  return nos
}

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

export function Inline({ texto }: { texto: string }) {
  return <>{renderizarInline(texto)}</>
}
