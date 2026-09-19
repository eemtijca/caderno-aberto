"use client";

// Menu suspenso de ícones de disciplina, com ícone e rótulo em cada opção.

import { ICONES_DISCIPLINA, MAPA_ICONES, ROTULOS_ICONES } from "@/lib/notas/cores";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function SeletorIcone({
  valor,
  onChange,
  className,
  id,
}: {
  valor: string;
  onChange: (nome: string) => void;
  className?: string;
  id?: string;
}) {
  const IconeAtual = MAPA_ICONES[valor] ?? MAPA_ICONES.BookOpen;
  return (
    <Select value={valor} onValueChange={onChange}>
      <SelectTrigger
        id={id}
        aria-label="Ícone da disciplina"
        className={cn("w-full rounded-lg", className)}
      >
        <SelectValue>
          <span className="flex items-center gap-2">
            <IconeAtual className="h-4 w-4" aria-hidden />
            {ROTULOS_ICONES[valor] ?? valor}
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {ICONES_DISCIPLINA.map((nome) => {
          const Icone = MAPA_ICONES[nome] ?? MAPA_ICONES.BookOpen;
          return (
            <SelectItem key={nome} value={nome}>
              <span className="flex items-center gap-2">
                <Icone className="h-4 w-4" aria-hidden />
                {ROTULOS_ICONES[nome] ?? nome}
              </span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
