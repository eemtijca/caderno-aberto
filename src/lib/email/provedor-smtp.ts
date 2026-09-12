// Provedor SMTP genérico via SMTP_URL.
import nodemailer, { type Transporter } from "nodemailer"
import { EMAIL_FROM, SMTP_URL } from "@/lib/ambiente"
import { registrarEmail } from "./outbox"
import type { PedidoEmail, ProvedorEmail } from "./tipos"

let transporte: Transporter | null = null

function obterTransporte(): Transporter {
  if (!transporte) {
    const url = new URL(SMTP_URL)
    transporte = nodemailer.createTransport({
      host: url.hostname,
      // Porta ausente assume 587; smtps: implica TLS direto.
      port: Number(url.port) || 587,
      secure: url.protocol === "smtps:",
      auth:
        url.username || url.password
          ? { user: decodeURIComponent(url.username), pass: decodeURIComponent(url.password) }
          : undefined,
    })
  }
  return transporte
}

export function provedorSmtp(): ProvedorEmail {
  return {
    nome: "smtp",
    async enviar(pedido: PedidoEmail) {
      const info = await obterTransporte().sendMail({
        from: EMAIL_FROM,
        to: pedido.para.join(", "),
        subject: pedido.assunto,
        html: pedido.html,
        text: pedido.texto,
        headers: pedido.chaveIdempotencia
          ? { "X-Idempotencia": pedido.chaveIdempotencia }
          : undefined,
      })
      registrarEmail(EMAIL_FROM, pedido)
      return { id: String(info.messageId ?? `smtp-${Date.now().toString(36)}`) }
    },
  }
}
