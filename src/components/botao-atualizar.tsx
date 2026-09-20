"use client";

// Botão padrão de atualização: ícone girando enquanto a busca acontece.

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function BotaoAtualizar({
  aoAtualizar,
  carregando = false,
  rotulo,
  titulo = "Atualizar",
  className,
}: {
  aoAtualizar: () => void | Promise<unknown>;
  carregando?: boolean;
  /** Rótulo visível opcional; sem ele o botão fica só com o ícone. */
  rotulo?: string;
  /** Texto acessível e dica; use quando a ação tiver outro sentido. */
  titulo?: string;
  className?: string;
}) {
  return (
    <Button
      variant="outline"
      size={rotulo ? "sm" : "icon"}
      className={cn("rounded-lg", rotulo && "gap-2", className)}
      disabled={carregando}
      onClick={() => void aoAtualizar()}
      aria-label={titulo}
      title={titulo}
    >
      <RefreshCw className={cn("h-4 w-4", carregando && "animate-spin")} aria-hidden />
      {rotulo}
    </Button>
  );
}
