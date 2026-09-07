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
  if (novoEmail === sessao.usuario.email) return erroApi("O novo e-mail é igual ao atual.")

  const db = await banco()
  const ocupado = await db.orm.public.Usuarios.where({ email: novoEmail }).first()
  if (ocupado) return erroApi("Já existe uma conta com este e-mail.")

  const usuario = await db.orm.public.Usuarios.where({ id: sessao.usuario.id }).first()
  if (!usuario) return naoAutenticado()

  const { token, hash } = gerarTokenEmail()
  await db.orm.public.TokensVerificacao.create({
    usuarioId: usuario.id,
    tipo: "troca_email",
    tokenHash: hash,
    novoEmail,
    expiraEm: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
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
      chaveIdempotencia: `troca-email/${usuario.id}/${Date.now()}`,
      etiquetas: [{ nome: "categoria", valor: "troca_email" }],
    })
  } catch (erro) {
    console.error("[trocar-email] Falha no e-mail:", (erro as Error).message)
  }

  return json({ ok: true })
}
