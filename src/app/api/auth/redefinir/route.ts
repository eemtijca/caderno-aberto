import { NextRequest } from "next/server"
import { banco } from "@/lib/banco"
import { erroApi, json } from "@/lib/api/sessao"
import { LIMITE_EMAIL, cabeNoLimite, chavePorIp } from "@/lib/api/limite"
import { gerarTokenEmail } from "@/lib/auth/sessao"
import { normalizarEmail, origemApp } from "@/lib/auth/validacao"
import { enviarEmail } from "@/lib/email"
import { emailRecuperacao } from "@/lib/email/modelos"

export const dynamic = "force-dynamic"

// POST /api/auth/redefinir {email}. Responde sempre 200, sem distinguir contas existentes.
export async function POST(req: NextRequest) {
  const limite = cabeNoLimite(chavePorIp(req, "redefinir"), LIMITE_EMAIL)
  if (!limite.permitido)
    return erroApi("Muitos e-mails enviados em pouco tempo. Tente de novo em alguns minutos.", 429)

  const corpo = await req.json().catch(() => null)
  const email = normalizarEmail(corpo?.email)
  if (!email) return json({ ok: true })

  const db = await banco()
  const usuario = await db.orm.public.Usuarios.where({ email }).first()
  if (!usuario) return json({ ok: true })

  const perfil = await db.orm.public.Profiles.where({ id: usuario.id }).first()
  const { token, hash } = gerarTokenEmail()
  await db.orm.public.TokensVerificacao.create({
    usuarioId: usuario.id,
    tipo: "recuperacao",
    tokenHash: hash,
    expiraEm: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  })

  try {
    const modelo = emailRecuperacao(
      perfil?.nome ?? usuario.email.split("@")[0],
      `${origemApp(req)}/#/redefinir?token=${token}`,
    )
    await enviarEmail({
      para: [email],
      assunto: modelo.assunto,
      html: modelo.html,
      chaveIdempotencia: `recuperacao/${usuario.id}/${Date.now()}`,
      etiquetas: [{ nome: "categoria", valor: "recuperacao" }],
    })
  } catch (erro) {
    console.error("[redefinir] Falha no e-mail:", (erro as Error).message)
  }

  return json({ ok: true })
}

// GET /api/auth/redefinir. Indica se o token segue válido.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? ""
  if (!/^[0-9a-f]{64}$/.test(token)) return json({ valido: false })
  const { createHash } = await import("crypto")
  const db = await banco()
  const registro = await db.orm.public.TokensVerificacao.where({
    tokenHash: createHash("sha256").update(token).digest("hex"),
  }).first()
  const valido =
    Boolean(registro) &&
    registro!.tipo === "recuperacao" &&
    !registro!.usadoEm &&
    new Date(registro!.expiraEm) >= new Date()
  return json({ valido })
}
