"use client";

// Paginador de listas: resumo do intervalo e botões numerados com elipses.

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ResultadoPaginacao } from "@/hooks/use-paginacao";

function paginasVisiveis(pagina: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const paginas: (number | "...")[] = [1];
  const inicio = Math.max(2, pagina - 1);
  const fim = Math.min(total - 1, pagina + 1);
  if (inicio > 2) paginas.push("...");
  for (let p = inicio; p <= fim; p++) paginas.push(p);
  if (fim < total - 1) paginas.push("...");
  paginas.push(total);
  return paginas;
}

export function Paginacao<T>({
  paginacao,
  rotulo = "itens",
  className,
}: {
  paginacao: ResultadoPaginacao<T>;
  rotulo?: string;
  className?: string;
}) {
  const { pagina, totalPaginas, total, inicio, fim, irPara } = paginacao;
  if (totalPaginas <= 1) return null;

  const trocar = (alvo: number) => {
    if (alvo === pagina) return;
    irPara(alvo);
    const reduzirMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduzirMovimento ? "auto" : "smooth" });
  };

  return (
    <nav
      aria-label="Paginação"
      className={`flex flex-wrap items-center justify-between gap-2 ${className ?? ""}`}
    >
      <p className="text-muted-foreground text-[0.78rem]" aria-live="polite">
        {inicio}-{fim} de {total} {total === 1 ? rotulo.replace(/s$/, "") : rotulo}
      </p>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-lg"
          disabled={pagina === 1}
          onClick={() => trocar(pagina - 1)}
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </Button>

        {/* No mobile o resumo compacto evita uma fileira longa de números. */}
        <span className="px-1 text-sm font-semibold sm:hidden">
          {pagina} / {totalPaginas}
        </span>

        <div className="hidden items-center gap-1 sm:flex">
          {paginasVisiveis(pagina, totalPaginas).map((p, i) =>
            p === "..." ? (
              <span key={`e${i}`} className="text-muted-foreground px-1 text-sm" aria-hidden>
                ...
              </span>
            ) : (
              <Button
                key={p}
                variant={p === pagina ? "default" : "ghost"}
                size="icon"
                className="h-8 w-8 rounded-lg text-xs"
                onClick={() => trocar(p)}
                aria-label={`Página ${p}`}
                aria-current={p === pagina ? "page" : undefined}
              >
                {p}
              </Button>
            ),
          )}
        </div>

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-lg"
          disabled={pagina === totalPaginas}
          onClick={() => trocar(pagina + 1)}
          aria-label="Próxima página"
        >
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </nav>
  );
}
