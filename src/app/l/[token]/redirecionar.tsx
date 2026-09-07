"use client"

import { useEffect } from "react"

export function RedirecionarVista({ token }: { token: string }) {
  useEffect(() => {
    window.location.replace(`/#/l/${encodeURIComponent(token)}`)
  }, [token])

  return null
}
