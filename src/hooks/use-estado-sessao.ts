"use client";

// Estado persistido em sessionStorage para sobreviver à troca de vista.

import { useCallback, useEffect, useState } from "react";

export function useEstadoSessao<T>(
  chave: string,
  inicial: T,
): [T, (valor: T | ((anterior: T) => T)) => void] {
  const [valor, setValor] = useState<T>(inicial);

  // Lê depois de montar para o HTML do servidor e o primeiro render coincidirem.
  useEffect(() => {
    try {
      const salvo = sessionStorage.getItem(chave);
      if (salvo !== null) setValor(JSON.parse(salvo) as T);
    } catch {
      // Session storage indisponível: segue com o valor inicial.
    }
  }, [chave]);

  const definir = useCallback(
    (v: T | ((anterior: T) => T)) => {
      setValor((anterior) => {
        const novo = typeof v === "function" ? (v as (p: T) => T)(anterior) : v;
        try {
          sessionStorage.setItem(chave, JSON.stringify(novo));
        } catch {
          // Ignora falha de persistência.
        }
        return novo;
      });
    },
    [chave],
  );

  return [valor, definir];
}
