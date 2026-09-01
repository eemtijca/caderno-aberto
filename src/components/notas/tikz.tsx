"use client"

// Diagrama TikZ renderizado pelo TikzJax. Mostra carregamento próprio,
// detecta falha (código inválido/timeout) e evita salto de layout.

import { useEffect, useRef, useState } from "react"

const BIBLIOTECAS = "arrows.meta,positioning,calc,decorations.markings"

export function Tikz({ codigo }: { codigo: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [carregando, setCarregando] = useState(true)
  const [falhou, setFalhou] = useState(false)

  useEffect(() => {
    if (!ref.current) return
    const container = ref.current
    setCarregando(true)
    setFalhou(false)
    container.innerHTML = ""

    const script = document.createElement("script")
    script.type = "text/tikz"
    script.setAttribute("data-tikz-libraries", BIBLIOTECAS)
    const c = codigo.trim()
    script.textContent =
      c.includes("\\begin{tikzpicture}") || c.includes("\\begin{axis}")
        ? c
        : `\\begin{tikzpicture}\n${c}\n\\end{tikzpicture}`

    const obs = new MutationObserver(() => {
      if (container.querySelector("svg")) {
        setCarregando(false)
        setFalhou(false)
        obs.disconnect()
      }
    })
    obs.observe(container, { childList: true, subtree: true })

    const onFinish = () => {
      setCarregando(false)
      obs.disconnect()
    }
    container.addEventListener("tikzjax-load-finished", onFinish)
    container.appendChild(script)

    // timeout: sem svg e sem evento => diagrama com erro
    const t = setTimeout(() => {
      if (!container.querySelector("svg")) setFalhou(true)
      setCarregando(false)
      obs.disconnect()
    }, 32000)

    return () => {
      clearTimeout(t)
      obs.disconnect()
      container.removeEventListener("tikzjax-load-finished", onFinish)
    }
  }, [codigo])

  if (falhou) {
    return (
      <div
        className="rounded-xl border border-dashed border-rose-200 bg-rose-50/60 px-4 py-3 text-center text-[0.85rem] text-rose-700 dark:border-rose-800 dark:bg-rose-950/20 dark:text-rose-300"
        role="alert"
      >
        Não foi possível renderizar este diagrama. Verifique o código TikZ — chaves, parênteses e
        comandos precisam estar balanceados.
      </div>
    )
  }

  return (
    <div className="relative min-h-[120px]">
      <div ref={ref} className="tikzjax-wrapper" />
      {carregando ? (
        <div
          className="bg-background/60 absolute inset-0 flex items-center justify-center gap-2.5"
          role="status"
          aria-live="polite"
        >
          <span className="border-muted-foreground h-5 w-5 animate-spin rounded-full border-2 border-t-transparent" />
          <span className="text-muted-foreground text-sm">Renderizando diagrama…</span>
        </div>
      ) : null}
    </div>
  )
}
