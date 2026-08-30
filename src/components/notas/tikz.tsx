"use client"

import { useEffect, useRef, useState } from "react"

export function Tikz({ codigo }: { codigo: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    if (!ref.current) return
    setCarregando(true)
    const container = ref.current
    container.innerHTML = ""
    const script = document.createElement("script")
    script.type = "text/tikz"
    script.setAttribute("data-tikz-libraries", "arrows.meta,positioning,calc,decorations.markings")
    const c = codigo.trim()
    script.textContent =
      c.includes("\\begin{tikzpicture}") || c.includes("\\begin{axis}")
        ? c
        : `\\begin{tikzpicture}\n${c}\n\\end{tikzpicture}`
    const obs = new MutationObserver(() => {
      if (container.querySelector("svg")) {
        setCarregando(false)
        obs.disconnect()
      }
    })
    obs.observe(container, { childList: true, subtree: true })
    const onFinish = () => {
      setCarregando(false)
      obs.disconnect()
    }
    container.addEventListener("tikzjax-load-finished" as any, onFinish)
    container.appendChild(script)
    const t = setTimeout(() => {
      setCarregando(false)
      obs.disconnect()
    }, 32000)
    return () => {
      clearTimeout(t)
      obs.disconnect()
      container.removeEventListener("tikzjax-load-finished" as any, onFinish)
    }
  }, [codigo])

  return (
    <div className="relative min-h-[120px]">
      <div ref={ref} className="tikzjax-wrapper" />
      {carregando && (
        <div className="bg-background/60 absolute inset-0 flex items-center justify-center">
          <span
            className="border-muted-foreground h-5 w-5 animate-spin rounded-full border-2 border-t-transparent"
            aria-label="Carregando diagrama"
          />
          <span className="text-muted-foreground ml-2 text-sm">Renderizando diagrama</span>
        </div>
      )}
    </div>
  )
}
