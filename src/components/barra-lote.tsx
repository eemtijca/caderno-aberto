"use client";

// Barra flutuante das ações em lote, acima da navegação inferior no mobile.

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BarraLote({
  quantidade,
  acoes,
  aoCancelar,
  ocupada = false,
}: {
  quantidade: number;
  acoes: React.ReactNode;
  aoCancelar: () => void;
  ocupada?: boolean;
}) {
  return (
    <div
      role="region"
      aria-label="Ações em lote"
      className="na-imprime-esconder border-border bg-card/95 fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-50 mx-auto flex w-[calc(100%-1.5rem)] max-w-2xl flex-wrap items-center gap-2 rounded-2xl border px-3 py-2.5 shadow-lg backdrop-blur lg:bottom-6"
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
    </div>
  );
}
