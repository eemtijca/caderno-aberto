"use client";

// Seletor de tema com três opções (sistema, claro e escuro).

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const OPCOES = [
  { valor: "system", rotulo: "Sistema", Icone: Monitor },
  { valor: "light", rotulo: "Claro", Icone: Sun },
  { valor: "dark", rotulo: "Escuro", Icone: Moon },
] as const;

type Variante = "outline" | "ghost";

export function SeletorTema({
  className,
  variant = "outline",
}: {
  className?: string;
  variant?: Variante;
}) {
  const { theme, setTheme } = useTheme();
  // O tema só é conhecido no cliente; evita divergência de hidratação.
  const [montado, setMontado] = useState(false);
  useEffect(() => setMontado(true), []);

  const atual = OPCOES.find((o) => o.valor === theme) ?? OPCOES[0];
  const IconeAtual = atual.Icone;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size="icon"
          className={className}
          aria-label={montado ? `Tema: ${atual.rotulo}. Alterar tema` : "Alterar tema"}
        >
          {montado ? (
            <IconeAtual className="h-[1.1rem] w-[1.1rem]" aria-hidden />
          ) : (
            <Monitor className="h-[1.1rem] w-[1.1rem]" aria-hidden />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuRadioGroup value={montado ? theme : "system"} onValueChange={setTheme}>
          {OPCOES.map(({ valor, rotulo, Icone }) => (
            <DropdownMenuRadioItem key={valor} value={valor} className="gap-2">
              <Icone className="h-4 w-4" aria-hidden />
              {rotulo}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
