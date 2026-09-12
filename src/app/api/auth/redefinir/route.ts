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
  const limite = await cabeNoLimite(chavePorIp(req, "redefinir"), LIMITE_EMAIL)
  if (!limite.permitido)
    return erroApi("Muitos e-mails enviados em pouco tempo. Tente de novo em alguns minutos.", 429)

  const corpo = await req.json().catch(() => null)
  const email = normalizarEmail(corpo?.email)
  if (!email) return json({ ok: true })

  const db = await banco()
  const usuario = await db.usuarios.findFirst({ where: { email } })
  if (!usuario) return json({ ok: true })

  const perfil = await db.profiles.findFirst({ where: { id: usuario.id } })
  const { token, hash } = gerarTokenEmail()
  // Tokens anteriores do mesmo tipo perdem a validade.
  await db.tokensVerificacao.deleteMany({ where: { usuarioId: usuario.id, tipo: "recuperacao" } })
  await db.tokensVerificacao.create({
    data: {
      usuarioId: usuario.id,
      tipo: "recuperacao",
      tokenHash: hash,
      expiraEm: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    },
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
      chaveIdempotencia: `recuperacao/${usuario.id}/${hash}`,
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
  const registro = await db.tokensVerificacao.findFirst({
    where: {
      tokenHash: createHash("sha256").update(token).digest("hex"),
    },
  })
  const valido =
    Boolean(registro) &&
    registro!.tipo === "recuperacao" &&
    !registro!.usadoEm &&
    registro!.expiraEm >= new Date()
  return json({ valido })
}
