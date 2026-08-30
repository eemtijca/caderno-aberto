"use client"

// Provedores globais: TanStack Query + sessão do professor.
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"
import { ProvedorSessao } from "@/hooks/use-sessao"

export function Provedores({ children }: { children: React.ReactNode }) {
  const [cliente] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 15_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={cliente}>
      <ProvedorSessao>{children}</ProvedorSessao>
    </QueryClientProvider>
  )
}
