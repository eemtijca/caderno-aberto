// Paginação das listas administrativas: lê `pagina` e `porPagina` da URL.

import type { NextRequest } from "next/server";

export const POR_PAGINA_ADMIN = 20;
const MAX_POR_PAGINA = 100;

export interface ParametrosPagina {
  pagina: number;
  porPagina: number;
  skip: number;
  take: number;
}

/** Normaliza os parâmetros de paginação dentro dos limites aceitos. */
export function parametrosPagina(
  req: NextRequest,
  padrao: number = POR_PAGINA_ADMIN,
): ParametrosPagina {
  const sp = req.nextUrl.searchParams;
  const pagina = Math.max(1, Math.floor(Number(sp.get("pagina")) || 1));
  const pedido = Math.floor(Number(sp.get("porPagina")) || padrao);
  const porPagina = Math.min(MAX_POR_PAGINA, Math.max(1, pedido));
  return { pagina, porPagina, skip: (pagina - 1) * porPagina, take: porPagina };
}
