"use client";

// Barra flutuante das ações em lote, acima da navegação inferior no mobile.
// Sobe ao entrar no modo de seleção e desce ao sair, com transição suave.

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DURACAO_SAIDA = 200;

export function BarraLote({
  aberto = true,
  quantidade,
  acoes,
  aoCancelar,
  ocupada = false,
}: {
  aberto?: boolean;
  quantidade: number;
  acoes: React.ReactNode;
  aoCancelar: () => void;
  ocupada?: boolean;
}) {
  // Mantém o elemento montado durante a animação de saída.
  const [montado, setMontado] = useState(aberto);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    if (aberto) {
      setMontado(true);
      // Um quadro após montar dispara a transição de subida.
      const quadro = requestAnimationFrame(() => setVisivel(true));
      return () => cancelAnimationFrame(quadro);
    }
    setVisivel(false);
    const timer = setTimeout(() => setMontado(false), DURACAO_SAIDA);
    return () => clearTimeout(timer);
  }, [aberto]);

  // O portal no body evita que ancestrais com transform (as vistas usam
  // `.na-entra`) virem containing block e prendam a barra ao fim do conteúdo.
  if (!montado || typeof document === "undefined") return null;

  return createPortal(
    <div
      role="region"
      aria-label="Ações em lote"
      data-estado={visivel ? "aberto" : "fechado"}
      className={cn(
        "na-imprime-esconder border-border bg-card/95 fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-50 mx-auto flex w-[calc(100%-1.5rem)] max-w-2xl flex-wrap items-center gap-2 rounded-2xl border px-3 py-2.5 shadow-lg backdrop-blur transition-[transform,opacity] duration-200 ease-out lg:bottom-6",
        visivel ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-[140%] opacity-0",
      )}
    >
      <span className="text-sm font-semibold" aria-live="polite">
        {quantidade} {quantidade === 1 ? "selecionado" : "selecionados"}
      </span>
      <div className="ml-auto flex flex-wrap items-center gap-1.5">{acoes}</div>
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 rounded-lg"
        onClick={aoCancelar}
        disabled={ocupada}
      >
        <X className="h-3.5 w-3.5" aria-hidden /> Cancelar
      </Button>
    </div>,
    document.body,
  );
}
