"use client";

// Roteador SPA por hash. Funciona em qualquer hospedagem e permite links públicos diretos (#/l/<token> para alunos).

import { useCallback, useEffect, useState } from "react";

export type SecaoConfig =
  "visao" | "perfil" | "seguranca" | "disciplinas" | "turmas" | "dados" | "exclusao";

export const SECOES_CONFIG: SecaoConfig[] = [
  "visao",
  "perfil",
  "seguranca",
  "disciplinas",
  "turmas",
  "dados",
  "exclusao",
];

export const ROTULOS_CONFIG: Record<SecaoConfig, string> = {
  visao: "Configurações",
  perfil: "Perfil",
  seguranca: "Segurança",
  disciplinas: "Disciplinas",
  turmas: "Turmas",
  dados: "Dados",
  exclusao: "Exclusão",
};

export type Rota =
  | { vista: "inicio" }
  | { vista: "notas" }
  | { vista: "organizacao" }
  | { vista: "links" }
  | { vista: "lixeira" }
  | { vista: "editor"; id: string }
  | { vista: "leitura"; id: string }
  | { vista: "publica"; token: string }
  | { vista: "configuracoes"; secao: SecaoConfig }
  | { vista: "recuperacao" }
  | { vista: "entrar" }
  | { vista: "codigo" }
  | { vista: "solicitar" }
  | { vista: "admin" };

function analisarConfig(partes: string[]): Rota {
  const secao = partes[1] as SecaoConfig | undefined;
  // "conta" é alias histórico de Configurações.
  if (partes[0] === "conta") return { vista: "configuracoes", secao: "visao" };
  return {
    vista: "configuracoes",
    secao: secao && SECOES_CONFIG.includes(secao) ? secao : "visao",
  };
}

export function analisarHash(hash: string): Rota {
  // Descarta "#/", a query e segmentos vazios antes de rotear.
  const limpo = hash.replace(/^#\/?/, "").split("?")[0];
  const partes = limpo.split("/").filter(Boolean);
  if (partes.length === 0) return { vista: "inicio" };
  switch (partes[0]) {
    case "notas":
      return { vista: "notas" };
    case "organizacao":
      return { vista: "organizacao" };
    case "links":
      return { vista: "links" };
    case "lixeira":
      return { vista: "lixeira" };
    case "editor":
      return partes[1] ? { vista: "editor", id: partes[1] } : { vista: "notas" };
    case "nota":
      return partes[1] ? { vista: "leitura", id: partes[1] } : { vista: "notas" };
    case "l":
      return partes[1] ? { vista: "publica", token: partes[1] } : { vista: "inicio" };
    case "conta":
    case "configuracoes":
      return analisarConfig(partes);
    case "recuperacao":
      return { vista: "recuperacao" };
    case "entrar":
      return { vista: "entrar" };
    case "codigo":
      return { vista: "codigo" };
    case "solicitar":
      return { vista: "solicitar" };
    case "admin":
      return { vista: "admin" };
    default:
      return { vista: "inicio" };
  }
}

export function useRota(): {
  rota: Rota;
  navegar: (para: string) => void;
} {
  const [rota, setRota] = useState<Rota>(() =>
    typeof window === "undefined" ? { vista: "inicio" } : analisarHash(window.location.hash),
  );

  useEffect(() => {
    const aoMudar = () => {
      // Ao trocar de vista, volta ao topo da página.
      setRota(analisarHash(window.location.hash));
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", aoMudar);
    return () => window.removeEventListener("hashchange", aoMudar);
  }, []);

  const navegar = useCallback((para: string) => {
    // Normaliza para "#/..." e força re-render quando o hash não muda.
    const alvo = para.startsWith("#") ? para : `#${para.startsWith("/") ? para : `/${para}`}`;
    if (window.location.hash === alvo) {
      setRota(analisarHash(alvo));
      window.scrollTo({ top: 0 });
    } else {
      window.location.hash = alvo;
    }
  }, []);

  return { rota, navegar };
}
