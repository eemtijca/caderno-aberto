"use client"

// Roteador SPA por hash. Funciona em qualquer hospedagem e permite links públicos diretos (#/l/<token> para alunos).

import { useCallback, useEffect, useState } from "react"

export type Rota =
  | { vista: "inicio" }
  | { vista: "notas" }
  | { vista: "organizacao" }
  | { vista: "links" }
  | { vista: "editor"; id: string }
  | { vista: "leitura"; id: string }
  | { vista: "publica"; token: string }
  | { vista: "conta" }
  | { vista: "entrar" }
  | { vista: "cadastro" }
  | { vista: "redefinir" }

export function analisarHash(hash: string): Rota {
  const limpo = hash.replace(/^#\/?/, "").split("?")[0] ?? ""
  const partes = limpo.split("/").filter(Boolean)
  if (partes.length === 0) return { vista: "inicio" }
  switch (partes[0]) {
    case "notas":
      return { vista: "notas" }
    case "organizacao":
      return { vista: "organizacao" }
    case "links":
      return { vista: "links" }
    case "editor":
      return partes[1] ? { vista: "editor", id: partes[1] } : { vista: "notas" }
    case "nota":
      return partes[1] ? { vista: "leitura", id: partes[1] } : { vista: "notas" }
    case "l":
      return partes[1] ? { vista: "publica", token: partes[1] } : { vista: "inicio" }
    case "conta":
      return { vista: "conta" }
    case "entrar":
      return { vista: "entrar" }
    case "cadastro":
      return { vista: "cadastro" }
    case "redefinir":
      return { vista: "redefinir" }
    default:
      return { vista: "inicio" }
  }
}

export function useRota(): {
  rota: Rota
  navegar: (para: string) => void
} {
  const [rota, setRota] = useState<Rota>(() =>
    typeof window === "undefined" ? { vista: "inicio" } : analisarHash(window.location.hash),
  )

  useEffect(() => {
    const aoMudar = () => {
      setRota(analisarHash(window.location.hash))
      window.scrollTo({ top: 0 })
    }
    window.addEventListener("hashchange", aoMudar)
    return () => window.removeEventListener("hashchange", aoMudar)
  }, [])

  const navegar = useCallback((para: string) => {
    const alvo = para.startsWith("#") ? para : `#${para.startsWith("/") ? para : `/${para}`}`
    if (window.location.hash === alvo) {
      setRota(analisarHash(alvo))
      window.scrollTo({ top: 0 })
    } else {
      window.location.hash = alvo
    }
  }, [])

  return { rota, navegar }
}
