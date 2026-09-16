"use client";

// Grade de ícones de disciplina, sem rótulos visíveis (nome acessível via aria-label).

import { ICONES_DISCIPLINA, MAPA_ICONES, ROTULOS_ICONES } from "@/lib/notas/cores";
import { cn } from "@/lib/utils";

export function SeletorIcone({
  valor,
  onChange,
  className,
}: {
  valor: string;
  onChange: (nome: string) => void;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Ícone da disciplina"
      className={cn(
        "grid grid-cols-[repeat(8,2rem)] gap-1 sm:grid-cols-[repeat(8,2.25rem)]",
        className,
      )}
    >
      {ICONES_DISCIPLINA.map((nome) => {
        const Icone = MAPA_ICONES[nome] ?? MAPA_ICONES.BookOpen;
        const ativo = valor === nome;
        const rotulo = ROTULOS_ICONES[nome] ?? nome;
        return (
          <button
            key={nome}
            type="button"
            role="radio"
            aria-checked={ativo}
            aria-label={rotulo}
            title={rotulo}
            onClick={() => onChange(nome)}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg border transition-colors sm:h-9 sm:w-9",
              ativo
                ? "border-primary bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground border-transparent",
            )}
          >
            <Icone className="h-4 w-4" aria-hidden />
          </button>
        );
      })}
    </div>
  );
}
