// Caixa em memória dos e-mails enviados.
import type { PedidoEmail } from "./tipos"

export interface EmailRegistrado extends PedidoEmail {
  de: string
  enviadoEm: string
}

const caixa: EmailRegistrado[] = []
// Capacidade dimensionada para suítes paralelas.
const MAXIMO = 500

export function registrarEmail(de: string, pedido: PedidoEmail): void {
  caixa.push({ ...pedido, de, enviadoEm: new Date().toISOString() })
  if (caixa.length > MAXIMO) caixa.splice(0, caixa.length - MAXIMO)
}

export function listarOutbox(): EmailRegistrado[] {
  return [...caixa]
}

export function limparOutbox(): void {
  caixa.length = 0
}
