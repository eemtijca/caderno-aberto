import { NextRequest } from "next/server"
import { banco } from "@/lib/banco"
import { erroApi, json } from "@/lib/api/sessao"
import { LIMITE_EMAIL, cabeNoLimite, chavePorIp } from "@/lib/api/limite"
import { gerarTokenEmail } from "@/lib/auth/sessao"
import { normalizarEmail, origemApp } from "@/lib/auth/validacao"
import { enviarEmail } from "@/lib/email"
import { emailVerificacao } from "@/lib/email/modelos"

export const dynamic = "force-dynamic"

// POST /api/auth/reenviar {email}. Responde sempre 200, sem distinguir contas existentes.
export async function POST(req: NextRequest) {
  const limite = cabeNoLimite(chavePorIp(req, "reenviar"), LIMITE_EMAIL)
  if (!limite.permitido)
    return erroApi("Muitos e-mails enviados em pouco tempo. Tente de novo em alguns minutos.", 429)

  const corpo = await req.json().catch(() => null)
  const email = normalizarEmail(corpo?.email)
  if (!email) return json({ ok: true })

  const db = await banco()
  const usuario = await db.orm.public.Usuarios.where({ email }).first()
  if (!usuario || usuario.emailVerificadoEm) return json({ ok: true })

  const perfil = await db.orm.public.Profiles.where({ id: usuario.id }).first()
  const { token, hash } = gerarTokenEmail()
  await db.orm.public.TokensVerificacao.create({
    usuarioId: usuario.id,
    tipo: "verificacao",
    tokenHash: hash,
    expiraEm: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  })

  try {
    const modelo = emailVerificacao(
      perfil?.nome ?? usuario.email.split("@")[0],
      `${origemApp(req)}/api/auth/verificar?token=${token}`,
    )
    await enviarEmail({
      para: [email],
      assunto: modelo.assunto,
      html: modelo.html,
      chaveIdempotencia: `verificacao/${usuario.id}/${Date.now()}`,
      etiquetas: [{ nome: "categoria", valor: "verificacao" }],
    })
  } catch (erro) {
    console.error("[reenviar] Falha no e-mail:", (erro as Error).message)
  }

  return json({ ok: true })
}
