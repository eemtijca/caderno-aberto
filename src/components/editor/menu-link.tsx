"use client"

// Popover de link da barra de formatação. Substitui o window.prompt (que
// falha no mobile e é inacessível): campo de URL, aplicação com validação
// e remoção do link existente, tudo com rótulos e foco visível.

import { useEffect, useRef, useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Link2, Unlink } from "lucide-react"
import type { LexicalEditor } from "lexical"
import { TOGGLE_LINK_COMMAND, $isLinkNode } from "@lexical/link"
import { $getSelection, $isRangeSelection } from "lexical"

// normaliza a URL digitada (aceita sem esquema e mailto)
function normalizarUrl(bruto: string): string {
  const valor = bruto.trim()
  if (valor === "") return ""
  if (/^(https?:\/\/|mailto:|\/|#)/i.test(valor)) return valor
  return `https://${valor}`
}

// lê a URL do link na seleção atual (para pré-preencher o campo)
export function urlDoLinkAtual(editor: LexicalEditor): string | null {
  return editor.getEditorState().read(() => {
    const sel = $getSelection()
    if (!$isRangeSelection(sel)) return null
    const no = sel.anchor.getNode()
    const pai = no.getParent()
    if (pai !== null && $isLinkNode(pai)) return pai.getURL()
    if ($isLinkNode(no)) return no.getURL()
    return null
  })
}

export function MenuLink({ editor }: { editor: LexicalEditor }) {
  const [aberto, setAberto] = useState(false)
  const [valor, setValor] = useState("")
  const campoRef = useRef<HTMLInputElement>(null)

  // foca o campo assim que o popover abre (a URL entra pelo onOpenChange)
  useEffect(() => {
    if (!aberto) return
    const foco = setTimeout(() => campoRef.current?.focus(), 50)
    return () => clearTimeout(foco)
  }, [aberto])

  const aplicar = (): void => {
    const url = normalizarUrl(valor)
    if (url !== "") {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, url)
      setAberto(false)
    }
  }

  const remover = (): void => {
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, null)
    setAberto(false)
  }

  return (
    <Popover
      open={aberto}
      onOpenChange={(abrir) => {
        if (abrir) setValor(urlDoLinkAtual(editor) ?? "")
        setAberto(abrir)
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Inserir ou editar link"
          className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2"
          onMouseDown={(e) => e.preventDefault()}
        >
          <Link2 className="h-[1.15rem] w-[1.15rem]" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent align="center" side="top" className="w-72 p-3">
        <div className="grid gap-2">
          <label htmlFor="campo-url-link" className="text-xs font-semibold">
            Endereço do link
          </label>
          <Input
            id="campo-url-link"
            ref={campoRef}
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                aplicar()
              }
              if (e.key === "Escape") setAberto(false)
            }}
            placeholder="exemplo.com ou https://…"
            inputMode="url"
            className="h-10 rounded-lg"
          />
          <div className="flex items-center justify-between gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 gap-1.5 rounded-lg text-xs text-destructive hover:text-destructive"
              onClick={remover}
              disabled={urlDoLinkAtual(editor) === null && valor.trim() === ""}
            >
              <Unlink className="h-3.5 w-3.5" aria-hidden /> Remover link
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-9 rounded-lg text-xs"
              onClick={aplicar}
              disabled={valor.trim() === ""}
            >
              Aplicar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
