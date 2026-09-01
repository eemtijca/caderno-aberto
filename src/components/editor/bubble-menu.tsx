"use client"

// Bubble menu: barra de formatação flutuante que aparece sobre a seleção
// de texto (negrito, itálico, riscado, link, código, fórmula, resultado).
// No mobile fica fixo acima do teclado; no desktop segue a seleção.

import { useEffect, useRef, useState } from "react"
import { $getSelection, $isRangeSelection, createCommand, type LexicalCommand } from "lexical"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { BarraLexical } from "./barra-lexical"

export const MOSTRAR_BUBBLE_COMMAND: LexicalCommand<undefined> =
  createCommand("MOSTRAR_BUBBLE_COMMAND")

export function BubbleMenu() {
  const [editor] = useLexicalComposerContext()
  const [visivel, setVisivel] = useState(false)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  // mostra/esconde conforme a seleção muda (seleção rica não-colapsada)
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      const info = editorState.read(() => {
        const sel = $getSelection()
        if (!$isRangeSelection(sel) || sel.isCollapsed()) return { visivel: false, rect: null }
        // só formata se a seleção estiver dentro de texto editável
        const no = sel.anchor.getNode()
        const top = no.getTopLevelElement()
        if (!top) return { visivel: false, rect: null }
        const tipo = top.getType()
        // não mostra dentro de blocos especiais (figura, tikz, exercícios)
        if (tipo === "figura" || tipo === "tikz" || tipo === "exercicios") {
          return { visivel: false, rect: null }
        }
        return { visivel: true, rect: null }
      })
      setVisivel(info.visivel)
      if (!info.visivel) setPos(null)
    })
  }, [editor])

  // posiciona sobre a seleção usando o DOM
  useEffect(() => {
    if (!visivel) return
    const calcular = () => {
      const sel = window.getSelection()
      if (!sel || sel.rangeCount === 0) return
      const rect = sel.getRangeAt(0).getBoundingClientRect()
      setPos({ x: rect.left + rect.width / 2, y: rect.top })
    }
    calcular()
    const t = setTimeout(calcular, 50)
    return () => clearTimeout(t)
  }, [visivel])

  if (!visivel || !pos) return null

  return (
    <div
      ref={ref}
      className="border-border bg-popover fixed z-50 -translate-x-1/2 rounded-xl border px-1.5 py-1 shadow-lg"
      style={{ top: Math.max(pos.y - 46, 8), left: pos.x }}
      role="toolbar"
      aria-label="Formatação da seleção"
    >
      <BarraLexical />
    </div>
  )
}
