"use client";

import { toast } from "sonner";

/** Abre o arquivo de exportação e avisa quando o pop-up é bloqueado. */
export function abrirExportacao(url: string): boolean {
  const janela = window.open(url, "_blank");
  if (!janela) {
    toast.error("O navegador bloqueou a abertura do arquivo", {
      description: "Permita pop-ups neste site para exportar.",
    });
    return false;
  }
  return true;
}
