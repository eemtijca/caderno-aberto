"use client"

// Grip de arrastar por bloco (desktop). Usa o DraggableBlockPlugin do
// Lexical: um puxador aparece ao lado do bloco em foco e permite arrastar
// para reordenar. No mobile o reordenamento continua via ações de toque
// (C5), já que o drag com mouse não se traduz bem para touch.

import { useEffect, useRef, useState } from "react"
import { DraggableBlockPlugin_EXPERIMENTAL } from "@lexical/react/LexicalDraggableBlockPlugin"
import { GripVertical } from "lucide-react"

export function GripPlugin() {
  const menuRef = useRef<HTMLElement>(null)
  const targetLineRef = useRef<HTMLElement>(null)
  const [ancora, setAncora] = useState<HTMLElement>()

  useEffect(() => {
    // âncora: o contêiner do editor (para posicionar o grip)
    const el = document.querySelector('[contenteditable="true"][data-lexical-editor="true"]')
    const alvo = (el?.closest(".editor-lexical") as HTMLElement | null) ?? document.body
    setAncora(alvo)
  }, [])

  return (
    <DraggableBlockPlugin_EXPERIMENTAL
      anchorElem={ancora}
      menuRef={menuRef}
      targetLineRef={targetLineRef}
      menuComponent={
        <div className="hover:bg-accent hidden items-center justify-center rounded-md sm:flex">
          <GripVertical className="text-muted-foreground h-4 w-4" aria-hidden />
        </div>
      }
      targetLineComponent={
        <div className="bg-primary pointer-events-none absolute h-0.5 w-full rounded-full" />
      }
      isOnMenu={(element) => Boolean(menuRef.current?.contains(element))}
    />
  )
}
