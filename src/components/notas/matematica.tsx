"use client";

// Renderiza LaTeX com KaTeX e mhchem. A saída é HTML confiável, restrito a
// comandos seguros e com fallback em texto quando a fórmula falha.

import { useMemo } from "react";
import katex from "katex";
import "katex/contrib/mhchem";
import { MACROS_KATEX, preprocessarLatex } from "@/lib/notas/latex";

interface PropsMatematica {
  latex: string;
  bloco?: boolean;
  className?: string;
}

export function Matematica({ latex, bloco = false, className }: PropsMatematica) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(preprocessarLatex(latex), {
        displayMode: bloco,
        throwOnError: false,
        strict: false,
        // Só \htmlClass (destaque de resultado); links e HTML vetados.
        trust: (ctx) => ctx.command === "\\htmlClass",
        macros: MACROS_KATEX,
        output: "htmlAndMathml",
      });
    } catch {
      // Exibe o LaTeX original escapado em vez de quebrar a renderização.
      return `<span class="text-rose-600 dark:text-rose-400">${latex
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")}</span>`;
    }
  }, [latex, bloco]);

  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
