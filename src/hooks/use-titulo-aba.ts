"use client";

// Ajusta o título da aba do navegador para a tela atual.

import { useEffect } from "react";

const SUFIXO = "Caderno Aberto";

export function useTituloAba(titulo?: string | null) {
  useEffect(() => {
    document.title = titulo ? `${titulo} · ${SUFIXO}` : SUFIXO;
  }, [titulo]);
}
