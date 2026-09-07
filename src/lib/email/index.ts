// Seleção do provedor de e-mail por configuração.
import { EMAIL_DRIVER } from "@/lib/ambiente"
import { provedorLog } from "./provedor-log"
import { provedorResend } from "./provedor-resend"
import { provedorSmtp } from "./provedor-smtp"
import type { PedidoEmail, ProvedorEmail } from "./tipos"

let provedor: ProvedorEmail | null = null

export function obterProvedorEmail(): ProvedorEmail {
  if (!provedor) {
    provedor =
      EMAIL_DRIVER === "resend"
        ? provedorResend()
        : EMAIL_DRIVER === "smtp"
          ? provedorSmtp()
          : provedorLog()
  }
  return provedor
}

/** Envia pelo provedor configurado. Lança erro em falha de envio. */
export async function enviarEmail(pedido: PedidoEmail): Promise<{ id: string }> {
  return obterProvedorEmail().enviar(pedido)
}
