// Provedor da API Resend via SDK oficial.
import { Resend } from "resend"
import { EMAIL_FROM, RESEND_API_KEY } from "@/lib/ambiente"
import { registrarEmail } from "./outbox"
import type { PedidoEmail, ProvedorEmail } from "./tipos"

let cliente: Resend | null = null

function obterCliente(): Resend {
  if (!cliente) cliente = new Resend(RESEND_API_KEY)
  return cliente
}

export function provedorResend(): ProvedorEmail {
  return {
    nome: "resend",
    async enviar(pedido: PedidoEmail) {
      const { data, error } = await obterCliente().emails.send(
        {
          from: EMAIL_FROM,
          to: pedido.para,
          subject: pedido.assunto,
          html: pedido.html,
          text: pedido.texto,
          // Etiquetas viram tags no painel do Resend.
          tags: pedido.etiquetas?.map((e) => ({ name: e.nome, value: e.valor })),
        },
        pedido.chaveIdempotencia ? { idempotencyKey: pedido.chaveIdempotencia } : undefined,
      )
      if (error || !data) throw new Error(`Falha no envio: ${error?.message ?? "desconhecida"}`)
      registrarEmail(EMAIL_FROM, pedido)
      return { id: data.id }
    },
  }
}
