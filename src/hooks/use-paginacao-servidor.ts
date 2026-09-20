"use client";

// Paginação no servidor para listas longas: mantém a página atual, busca os
// itens e o total, e volta à primeira página quando o filtro muda.

import { useCallback, useEffect, useRef, useState } from "react";
import type { ResultadoPaginacao } from "./use-paginacao";

export interface RespostaPagina<T> {
  itens: T[];
  total: number;
}

export interface PaginacaoServidor<T> extends ResultadoPaginacao<T> {
  carregando: boolean;
  recarregar: () => Promise<void>;
}

/** Busca página a página e expõe o formato aceito pelo componente Paginacao. */
export function usePaginacaoServidor<T>({
  porPagina = 20,
  chave = "",
  buscar,
  aoErro,
}: {
  porPagina?: number;
  /** Muda quando busca ou filtros mudam: volta para a primeira página. */
  chave?: string;
  buscar: (pagina: number, porPagina: number) => Promise<RespostaPagina<T>>;
  aoErro?: (erro: Error) => void;
}): PaginacaoServidor<T> {
  const [pagina, setPagina] = useState(1);
  const [itens, setItens] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [carregando, setCarregando] = useState(true);

  // Refs guardam os callbacks atuais sem refazer o efeito a cada render.
  const buscarRef = useRef(buscar);
  const erroRef = useRef(aoErro);
  const carregarRef = useRef<(alvo: number) => Promise<void>>(async () => undefined);
  // Descarta respostas atrasadas de outra página.
  const versao = useRef(0);

  useEffect(() => {
    buscarRef.current = buscar;
    erroRef.current = aoErro;
  });

  const carregar = useCallback(
    async (alvo: number) => {
      const atual = ++versao.current;
      setCarregando(true);
      try {
        const r = await buscarRef.current(alvo, porPagina);
        if (atual !== versao.current) return;
        const ultima = Math.max(1, Math.ceil(r.total / porPagina));
        // Página esvaziou após remoção: recua para a última existente.
        if (alvo > ultima && r.total > 0) {
          void carregarRef.current(ultima);
          return;
        }
        setItens(r.itens);
        setTotal(r.total);
        setPagina(Math.min(alvo, ultima));
      } catch (e) {
        if (atual !== versao.current) return;
        erroRef.current?.(e instanceof Error ? e : new Error("Falha ao carregar."));
      } finally {
        if (atual === versao.current) setCarregando(false);
      }
    },
    [porPagina],
  );

  useEffect(() => {
    carregarRef.current = carregar;
  }, [carregar]);

  // Mudou a chave (filtro): recomeça da primeira página.
  useEffect(() => {
    void carregar(1);
  }, [chave, carregar]);

  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));
  const paginaAtual = Math.min(pagina, totalPaginas);

  const irPara = useCallback(
    (alvo: number) => {
      const destino = Math.min(Math.max(1, alvo), totalPaginas);
      if (destino === paginaAtual) return;
      void carregar(destino);
    },
    [carregar, paginaAtual, totalPaginas],
  );

  const recarregar = useCallback(() => carregar(paginaAtual), [carregar, paginaAtual]);

  return {
    itens,
    pagina: paginaAtual,
    totalPaginas,
    total,
    inicio: total === 0 ? 0 : (paginaAtual - 1) * porPagina + 1,
    fim: Math.min(paginaAtual * porPagina, total),
    irPara,
    carregando,
    recarregar,
  };
}
