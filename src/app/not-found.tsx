"use client";

// Página 404 para rotas reais desconhecidas.

import { useRouter } from "next/navigation";
import { TelaEstado } from "@/components/tela-estado";
import { useTituloAba } from "@/hooks/use-titulo-aba";

export default function NaoEncontrado() {
  const router = useRouter();
  useTituloAba("Página não encontrada");
  return (
    <TelaEstado
      variante="nao_encontrado"
      acao={{ rotulo: "Ir para o início", onClick: () => router.push("/") }}
    />
  );
}
