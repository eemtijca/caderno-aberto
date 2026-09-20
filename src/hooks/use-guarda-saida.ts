"use client";

// Registro de alterações não salvas: o roteador consulta antes de navegar e o
// navegador avisa ao fechar ou recarregar a aba.

import { useEffect, useRef } from "react";

const bloqueios = new Set<() => boolean>();
let ignorarProxima = false;

/** Libera a próxima navegação, usada depois de salvar ou excluir com sucesso. */
export function ignorarProximaGuarda(): void {
  ignorarProxima = true;
}

/** True quando pode sair; pergunta antes quando existe alteração pendente. */
export function confirmarSaidaSePreciso(): boolean {
  if (typeof window === "undefined") return true;
  if (ignorarProxima) {
    ignorarProxima = false;
    return true;
  }
  const pendente = Array.from(bloqueios).some((fn) => fn());
  if (!pendente) return true;
  return window.confirm("Há alterações não salvas que serão perdidas. Sair mesmo assim?");
}

/** Mantém a vista bloqueando a navegação enquanto `ativo` for verdadeiro. */
export function useGuardaSaida(ativo: boolean): void {
  const ativoRef = useRef(ativo);

  useEffect(() => {
    ativoRef.current = ativo;
  }, [ativo]);

  useEffect(() => {
    const consulta = () => ativoRef.current;
    bloqueios.add(consulta);
    return () => {
      bloqueios.delete(consulta);
    };
  }, []);

  useEffect(() => {
    if (!ativo) return;
    const aoSair = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", aoSair);
    return () => window.removeEventListener("beforeunload", aoSair);
  }, [ativo]);
}
