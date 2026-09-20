"use client";

// Boundary de erro de runtime (500) do segmento raiz.

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { TelaEstado } from "@/components/tela-estado";
import { useTituloAba } from "@/hooks/use-titulo-aba";

export default function Erro({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  useTituloAba("Erro");
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <TelaEstado
      variante="erro_interno"
      acao={{ rotulo: "Tentar novamente", onClick: reset }}
      acaoSecundaria={{ rotulo: "Ir para o início", onClick: () => router.push("/") }}
    />
  );
}
