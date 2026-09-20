"use client";

// Paginação local de listas: recorta o array e mantém a página dentro dos limites.

import { useCallback, useEffect, useMemo, useState } from "react";

export interface ResultadoPaginacao<T> {
  itens: T[];
  pagina: number;
  totalPaginas: number;
  total: number;
  inicio: number;
  fim: number;
  irPara: (pagina: number) => void;
}

export function usePaginacao<T>(
  itens: T[],
  porPagina: number,
  /** Muda quando busca ou filtros mudam: volta para a primeira página. */
  chave: string | number = "",
): ResultadoPaginacao<T> {
  const [pagina, setPagina] = useState(1);
  const totalPaginas = Math.max(1, Math.ceil(itens.length / porPagina));
  const paginaAtual = Math.min(pagina, totalPaginas);

  useEffect(() => {
    setPagina(1);
  }, [chave]);

  // Quando a lista encolhe, a página atual não pode ficar além do fim.
  useEffect(() => {
    if (pagina > totalPaginas) setPagina(totalPaginas);
  }, [pagina, totalPaginas]);

  const recorte = useMemo(
    () => itens.slice((paginaAtual - 1) * porPagina, paginaAtual * porPagina),
    [itens, paginaAtual, porPagina],
  );

  const irPara = useCallback(
    (alvo: number) => setPagina(Math.min(Math.max(1, alvo), totalPaginas)),
    [totalPaginas],
  );

  return {
    itens: recorte,
    pagina: paginaAtual,
    totalPaginas,
    total: itens.length,
    inicio: itens.length === 0 ? 0 : (paginaAtual - 1) * porPagina + 1,
    fim: Math.min(paginaAtual * porPagina, itens.length),
    irPara,
  };
}
