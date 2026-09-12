// Solicita a troca de e-mail, que será confirmada no endereço novo.

import { NextRequest, NextResponse } from "next/server"
import { createHash } from "crypto"
import { banco } from "@/lib/banco"
import { erroApi, json, naoAutenticado, sessaoProfessor } from "@/lib/api/sessao"
import { gerarTokenEmail } from "@/lib/auth/sessao"
import { normalizarEmail, origemApp } from "@/lib/auth/validacao"
import { enviarEmail } from "@/lib/email"
import { emailTrocaEmail } from "@/lib/email/modelos"

export const dynamic = "force-dynamic"

// POST /api/auth/trocar-email {novoEmail}. Solicita a troca com confirmação no novo endereço.
export async function POST(req: NextRequest) {
  const sessao = await sessaoProfessor(req)
  if (!sessao) return naoAutenticado()

  const corpo = await req.json().catch(() => null)
  const novoEmail = normalizarEmail(corpo?.novoEmail)
  if (!novoEmail) return erroApi("E-mail inválido. Confira o endereço digitado.")
  // Rejeita troca para o mesmo endereço.
  if (novoEmail === sessao.usuario.email) return erroApi("O novo e-mail é igual ao atual.")

  const db = await banco()
  const ocupado = await db.usuarios.findFirst({ where: { email: novoEmail } })
  // Endereço já em uso recebe resposta genérica.
  if (ocupado) return erroApi("Não foi possível usar este e-mail.")

  const usuario = await db.usuarios.findFirst({ where: { id: sessao.usuario.id } })
  if (!usuario) return naoAutenticado()

  const { token, hash } = gerarTokenEmail()
  // Tokens anteriores do mesmo tipo perdem a validade.
  await db.tokensVerificacao.deleteMany({ where: { usuarioId: usuario.id, tipo: "troca_email" } })
  await db.tokensVerificacao.create({
    data: {
      usuarioId: usuario.id,
      tipo: "troca_email",
      tokenHash: hash,
      novoEmail,
      expiraEm: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    },
  })

  const origem = origemApp(req)
  try {
    const modelo = emailTrocaEmail(
      sessao.perfil?.nome ?? usuario.email,
      `${origem}/api/auth/confirmar-troca?token=${token}`,
      novoEmail,
    )
    await enviarEmail({
      para: [novoEmail],
      assunto: modelo.assunto,
      html: modelo.html,
      chaveIdempotencia: `troca-email/${usuario.id}/${hash}`,
      etiquetas: [{ nome: "categoria", valor: "troca_email" }],
    })
  } catch (erro) {
    console.error("[trocar-email] Falha no e-mail:", (erro as Error).message)
  }

  return json({ ok: true })
}
