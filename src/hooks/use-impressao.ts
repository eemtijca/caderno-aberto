"use client";

// Impressão em tema claro: o papel não deve herdar o modo escuro. O tema é
// suspenso durante a impressão e restaurado ao final.

import { useEffect } from "react";

function suspenderTemaEscuro(): () => void {
  const raiz = document.documentElement;
  const eraEscuro = raiz.classList.contains("dark");
  if (eraEscuro) raiz.classList.remove("dark");
  let restaurado = false;
  return () => {
    if (restaurado) return;
    restaurado = true;
    if (eraEscuro && !raiz.classList.contains("dark")) raiz.classList.add("dark");
  };
}

/** Abre a caixa de impressão com o tema claro aplicado. */
export function imprimir(): void {
  const restaurar = suspenderTemaEscuro();
  window.addEventListener("afterprint", restaurar, { once: true });
  window.print();
  // Navegadores sem afterprint confiável restauram pelo temporizador.
  setTimeout(restaurar, 3000);
}

/** Cobre a impressão disparada pelo navegador (Ctrl+P e menu). */
export function useTemaClaroNaImpressao(): void {
  useEffect(() => {
    let restaurar: (() => void) | null = null;
    const antes = () => {
      restaurar ??= suspenderTemaEscuro();
    };
    const depois = () => {
      restaurar?.();
      restaurar = null;
    };
    window.addEventListener("beforeprint", antes);
    window.addEventListener("afterprint", depois);
    return () => {
      window.removeEventListener("beforeprint", antes);
      window.removeEventListener("afterprint", depois);
      restaurar?.();
    };
  }, []);
}
