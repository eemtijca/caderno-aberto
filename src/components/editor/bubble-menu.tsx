"use client"

// Bubble menu (desktop): barra de formatação flutuante que segue a seleção
// de texto. Encaixada na viewport (nunca fica fora da tela), reposiciona ao
// rolar e fecha quando a seleção colapsa ou sai do editor. No mobile a
// formatação fica na barra única fixa acima do teclado (BarraAtivaMobile).

import { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { $getSelection, $isRangeSelection } from "lexical"
import type { RefObject } from "react"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { ConteudoBarra } from "./barra-formatar"
import { limitarCentroHorizontal, useMediaQuery } from "@/lib/editor/posicao"

// verifica se a seleção do DOM está dentro do editor dado
function selecaoDentroDoEditor(editor: ReturnType<typeof useLexicalComposerContext>[0]): boolean {
  const raiz = editor.getRootElement()
  const sel = window.getSelection()
  return raiz !== null && sel !== null && sel.anchorNode !== null && raiz.contains(sel.anchorNode)
}

const ALTURA_BUBBLE = 52

export function BubbleMenu({ ancoraRef }: { ancoraRef: RefObject<HTMLDivElement | null> }) {
  const [editor] = useLexicalComposerContext()
  const desktop = useMediaQuery("(pointer: fine)")
  const [visivel, setVisivel] = useState(false)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const posRef = useRef<{ x: number; y: number } | null>(null)
  const animandoRef = useRef(false)

  // mede a seleção atual do DOM e posiciona o bubble encaixado na viewport
  const recalcular = useCallback(() => {
    const raiz = editor.getRootElement()
    if (raiz === null) return
    const sel = window.getSelection()
    if (sel === null || sel.rangeCount === 0 || !sel.toString().trim()) {
      setVisivel(false)
      setPos(null)
      posRef.current = null
      return
    }
    const retangulo = sel.getRangeAt(0).getBoundingClientRect()
    if (retangulo.width === 0 && retangulo.height === 0) return
    const x = limitarCentroHorizontal(retangulo.left + retangulo.width / 2, 360)
    const y = Math.max(retangulo.top - ALTURA_BUBBLE - 6, 8)
    posRef.current = { x, y }
    setPos({ x, y })
    setVisivel(true)
  }, [editor])

  // abre/fecha conforme a seleção muda dentro deste editor
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      const info = editorState.read(() => {
        const sel = $getSelection()
        if (!$isRangeSelection(sel) || sel.isCollapsed()) return false
        const tipo = sel.anchor.getNode().getTopLevelElement()?.getType()
        // não mostra dentro de blocos especiais (figura, tikz, exercícios)
        return tipo !== "figura" && tipo !== "tikz" && tipo !== "exercicios"
      })
      if (info) {
        // aguarda o DOM refletir o novo estado antes de medir
        requestAnimationFrame(() => recalcular())
      } else {
        setVisivel(false)
        setPos(null)
        posRef.current = null
      }
    })
  }, [editor, recalcular])

  // reposiciona ao rolar a página (posição fixa seguiria desatualizada)
  useEffect(() => {
    if (!visivel) return
    const aoRolar = (): void => {
      if (animandoRef.current) return
      animandoRef.current = true
      requestAnimationFrame(() => {
        animandoRef.current = false
        recalcular()
      })
    }
    window.addEventListener("scroll", aoRolar, { passive: true, capture: true })
    window.addEventListener("resize", aoRolar)
    return () => {
      window.removeEventListener("scroll", aoRolar, { capture: true } as EventListenerOptions)
      window.removeEventListener("resize", aoRolar)
    }
  }, [visivel, recalcular])

  // fecha quando o editor perde o foco para fora da área de edição
  useEffect(() => {
    if (!visivel) return
    const aoSair = (): void => {
      requestAnimationFrame(() => {
        if (!selecaoDentroDoEditor(editor)) {
          setVisivel(false)
          setPos(null)
          posRef.current = null
        }
      })
    }
    document.addEventListener("selectionchange", aoSair)
    return () => document.removeEventListener("selectionchange", aoSair)
  }, [visivel, editor])

  void ancoraRef
  if (!desktop || !visivel || pos === null) return null

  // portal para o body: a animação de entrada do contêiner retém um
  // transform que viraria containing block do position: fixed
  return createPortal(
    <div
      className="fixed z-50"
      style={{ top: pos.y, left: pos.x, transform: "translateX(-50%)" }}
      role="toolbar"
      aria-label="Formatação da seleção"
    >
      <ConteudoBarra editor={editor} />
    </div>,
    document.body,
  )
}
