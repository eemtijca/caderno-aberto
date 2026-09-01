"use client"

// Peça básica do editor: textarea auto-dimensionável.

import { useEffect, useRef } from "react"

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
