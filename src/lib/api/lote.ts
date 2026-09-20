// Validação compartilhada das ações em lote: ids úteis, sem repetição e com teto.

import { ehUuid } from "@/lib/identificador";

export const MAX_IDS_LOTE = 100;

export interface IdsLote {
  validos: string[];
  invalidos: string[];
}

/**
 * Separa UUIDs válidos dos demais, sem repetição.
 * Devolve null quando a entrada não é uma lista ou passa do teto.
 */
export function separarIds(entrada: unknown): IdsLote | null {
  if (!Array.isArray(entrada)) return null;
  const vistos = new Set<string>();
  const validos: string[] = [];
  const invalidos: string[] = [];
  for (const valor of entrada) {
    if (typeof valor !== "string" || vistos.has(valor)) continue;
    vistos.add(valor);
    if (ehUuid(valor)) validos.push(valor);
    else invalidos.push(valor);
  }
  if (validos.length > MAX_IDS_LOTE) return null;
  return { validos, invalidos };
}
