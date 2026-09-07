// Provedor de log: console e outbox em memória.
import { EMAIL_FROM } from "@/lib/ambiente"
import { limparOutbox, listarOutbox, registrarEmail } from "./outbox"
import type { PedidoEmail, ProvedorEmail } from "./tipos"

export function provedorLog(): ProvedorEmail & {
  outbox: typeof listarOutbox
  limpar: typeof limparOutbox
} {
  return {
    nome: "log",
    async enviar(pedido: PedidoEmail) {
      registrarEmail(EMAIL_FROM, pedido)
      console.log(`[email/log] para=${pedido.para.join(",")} assunto=${pedido.assunto}`)
      return { id: `log-${Date.now().toString(36)}` }
    },
    outbox: listarOutbox,
    limpar: limparOutbox,
  }
}
