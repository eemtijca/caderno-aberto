"use client";

// Seleção múltipla de listas: modo dedicado, conjunto de ids e limpeza por filtro.

import { useCallback, useEffect, useState } from "react";

export function useSelecao(chave?: string) {
  const [ativo, setAtivo] = useState(false);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());

  // Mudar busca ou filtro zera a seleção, que deixaria de corresponder à lista.
  useEffect(() => {
    setSelecionados(new Set());
  }, [chave]);

  const alternar = useCallback((id: string) => {
    setSelecionados((atual) => {
      const novo = new Set(atual);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  }, []);

  const definir = useCallback((ids: string[]) => setSelecionados(new Set(ids)), []);

  const desativar = useCallback(() => {
    setAtivo(false);
    setSelecionados(new Set());
  }, []);

  const alternarModo = useCallback(() => {
    setAtivo((v) => {
      if (v) setSelecionados(new Set());
      return !v;
    });
  }, []);

  // Esc sai do modo, mas só quando não há diálogo aberto por cima.
  useEffect(() => {
    if (!ativo) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (document.querySelector('[role="dialog"], [role="alertdialog"]')) return;
      desativar();
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [ativo, desativar]);

  return {
    ativo,
    selecionados,
    quantidade: selecionados.size,
    alternar,
    definir,
    desativar,
    alternarModo,
  };
}
