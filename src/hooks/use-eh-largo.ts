"use client";

// Indica se a tela usa o layout largo (mesmo ponto de quebra `lg` do Tailwind).

import { useEffect, useState } from "react";

const CONSULTA = "(min-width: 1024px)";

export function useEhLargo(): boolean {
  const [largo, setLargo] = useState(
    () => typeof window !== "undefined" && window.matchMedia(CONSULTA).matches,
  );

  useEffect(() => {
    const mql = window.matchMedia(CONSULTA);
    const atualizar = () => setLargo(mql.matches);
    atualizar();
    mql.addEventListener("change", atualizar);
    return () => mql.removeEventListener("change", atualizar);
  }, []);

  return largo;
}
