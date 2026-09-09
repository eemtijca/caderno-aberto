// Modelos transacionais de e-mail.
import { EMAIL_FROM } from "@/lib/ambiente"

/** Escapa texto para HTML dos e-mails. */
function escapar(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function base(titulo: string, corpo: string): string {
  return `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
<h1 style="font-size:20px">${titulo}</h1>
${corpo}
<p style="color:#666;font-size:13px">Caderno Aberto — se você não pediu este e-mail, ignore-o.</p>
</div>`
}

export function emailVerificacao(nome: string, url: string) {
  return {
    de: EMAIL_FROM,
    assunto: "Confirme seu e-mail no Caderno Aberto",
    html: base(
      `Olá, ${escapar(nome)}!`,
      `<p>Para concluir o cadastro, confirme seu e-mail:</p>
<p><a href="${escapar(url)}">Confirmar e-mail</a></p>
<p style="color:#666;font-size:13px">O link expira em 24 horas.</p>`,
    ),
  }
}

export function emailRecuperacao(nome: string, url: string) {
  return {
    de: EMAIL_FROM,
    assunto: "Redefina sua senha no Caderno Aberto",
    html: base(
      `Olá, ${escapar(nome)}!`,
      `<p>Recebemos um pedido de redefinição de senha. Escolha uma nova:</p>
<p><a href="${escapar(url)}">Redefinir senha</a></p>
<p style="color:#666;font-size:13px">O link expira em 1 hora.</p>`,
    ),
  }
}

export function emailTrocaEmail(nome: string, url: string, novoEmail: string) {
  return {
    de: EMAIL_FROM,
    assunto: "Confirme seu novo e-mail no Caderno Aberto",
    html: base(
      `Olá, ${escapar(nome)}!`,
      `<p>Você pediu para usar <strong>${escapar(novoEmail)}</strong> como e-mail da conta. Confirme:</p>
<p><a href="${escapar(url)}">Confirmar novo e-mail</a></p>
<p style="color:#666;font-size:13px">O link expira em 24 horas.</p>`,
    ),
  }
}
