"use client"

// Redirecionamento client-side de /l/<token> para a vista hash (#/l/<token>)
// mantendo o histórico limpo. A página real do aluno é o SPA por hash.

import { useEffect } from "react"

export function RedirecionarVista({ token }: { token: string }) {
  useEffect(() => {
    window.location.replace(`/#/l/${encodeURIComponent(token)}`)
  }, [token])

  return null
}
