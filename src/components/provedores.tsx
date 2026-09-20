"use client";

// Provedores globais: TanStack Query + sessão do professor.
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { ProvedorSessao } from "@/hooks/use-sessao";
import { AvisoOffline } from "@/components/aviso-offline";

export function Provedores({ children }: { children: React.ReactNode }) {
  // Cliente único por sessão, criado uma vez via inicializador preguiçoso.
  const [cliente] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Dados velhos são refeitos quando a tela monta de novo.
            staleTime: 0,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={cliente}>
      <ProvedorSessao>
        <AvisoOffline />
        {children}
      </ProvedorSessao>
    </QueryClientProvider>
  );
}
