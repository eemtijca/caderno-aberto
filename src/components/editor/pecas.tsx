"use client"

// Peças básicas do editor: textarea auto-dimensionável e barra de inserção de marcação inline.

import { useEffect, useRef } from "react"
import { Bold, Italic, Percent, Sigma, Highlighter } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export function TextareaAuto({
  valor,
  onChange,
  placeholder,
  className,
  mono,
  onFocus,
  rowsMin = 1,
  ariaLabel,
}: {
  valor: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
  mono?: boolean
  onFocus?: () => void
  rowsMin?: number
  ariaLabel?: string
}) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${el.scrollHeight}px`
  }, [valor])

  return (
    <textarea
      ref={ref}
      value={valor}
      onChange={(e) => onChange(e.target.value)}
      onFocus={onFocus}
      placeholder={placeholder}
      aria-label={ariaLabel}
      rows={rowsMin}
      className={`placeholder:text-muted-foreground/70 hover:border-border/70 focus:border-border focus:bg-card w-full resize-none rounded-lg border border-transparent bg-transparent px-2 py-1.5 leading-relaxed transition-colors outline-none ${
        mono ? "font-mono text-[0.88rem]" : ""
      } ${className ?? ""}`}
    />
  )
}

/** Insere texto na posição do cursor de um textarea. */
export function inserirNoTextarea(
  el: HTMLTextAreaElement | null,
  antes: string,
  depois: string = antes,
  placeholder = "",
): { valor: string; pos: number } | null {
  if (!el) return null
  const inicio = el.selectionStart ?? el.value.length
  const fim = el.selectionEnd ?? inicio
  const selecionado = el.value.slice(inicio, fim)
  const texto = selecionado || placeholder
  const novo = el.value.slice(0, inicio) + antes + texto + depois + el.value.slice(fim)
  const pos = inicio + antes.length + texto.length
  return { valor: novo, pos }
}

/** Barra de botões que inserem marcação inline no textarea alvo. */
export function BarraInline({
  alvo,
  onAplicar,
}: {
  alvo: React.RefObject<HTMLTextAreaElement | null>
  onAplicar: (valor: string, pos: number) => void
}) {
  const aplicar = (antes: string, depois: string, placeholder: string) => {
    const el = alvo.current
    if (!el) return
    const r = inserirNoTextarea(el, antes, depois, placeholder)
    if (r) {
      onAplicar(r.valor, r.pos)
      requestAnimationFrame(() => {
        el.focus()
        if (r.pos >= 0) el.setSelectionRange(r.pos, r.pos)
      })
    }
  }

  const itens = [
    { icone: Bold, rotulo: "Negrito", antes: "**", depois: "**", placeholder: "palavra-chave" },
    { icone: Italic, rotulo: "Itálico", antes: "*", depois: "*", placeholder: "texto" },
    {
      icone: Sigma,
      rotulo: "Fórmula no texto",
      antes: "$",
      depois: "$",
      placeholder: "x^2",
    },
    {
      icone: Highlighter,
      rotulo: "Resposta em destaque",
      antes: "\\resultado{",
      depois: "}",
      placeholder: "resposta",
    },
    {
      icone: Percent,
      rotulo: "Fórmula química",
      antes: "$\\ce{",
      depois: "}$",
      placeholder: "H2O",
    },
  ]

  return (
    <div className="flex items-center gap-0.5" role="toolbar" aria-label="Formatação inline">
      {itens.map((item) => (
        <Tooltip key={item.rotulo}>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => aplicar(item.antes, item.depois, item.placeholder)}
              className="text-muted-foreground hover:bg-accent hover:text-foreground flex h-7 w-7 items-center justify-center rounded-md transition-colors"
              aria-label={item.rotulo}
            >
              <item.icone className="h-3.5 w-3.5" aria-hidden />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            {item.rotulo}
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  )
}
