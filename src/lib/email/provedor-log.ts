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
      // Em produção, o destino não vai para os logs.
      const destino = process.env.NODE_ENV === "production" ? "(oculto)" : pedido.para.join(",")
      console.log(`[email/log] para=${destino} assunto=${pedido.assunto}`)
      return { id: `log-${Date.now().toString(36)}` }
    },
    outbox: listarOutbox,
    limpar: limparOutbox,
  }
}
