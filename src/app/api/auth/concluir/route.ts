import { NextRequest } from "next/server"
import { createHash } from "crypto"
import { banco } from "@/lib/banco"
import { erroApi, json } from "@/lib/api/sessao"
import { cabeNoLimite, chavePorIp } from "@/lib/api/limite"
import { hashSenha, senhaValida } from "@/lib/auth/senha"
import { iniciarSessao } from "@/lib/auth/sessao"

export const dynamic = "force-dynamic"

// POST /api/auth/concluir {token, novaSenha}. Troca a senha e invalida as sessões.
export async function POST(req: NextRequest) {
  const limite = cabeNoLimite(chavePorIp(req, "concluir"))
  if (!limite.permitido)
    return erroApi("Muitas tentativas. Aguarde um momento e tente novamente.", 429)

  const corpo = await req.json().catch(() => null)
  const token = typeof corpo?.token === "string" ? corpo.token : ""
  const novaSenha = typeof corpo?.novaSenha === "string" ? corpo.novaSenha : ""
  if (!/^[0-9a-f]{64}$/.test(token)) return erroApi("Link inválido ou expirado.", 400)
  if (!senhaValida(novaSenha)) return erroApi("A senha deve ter pelo menos 6 caracteres.")

  const db = await banco()
  const registro = await db.orm.public.TokensVerificacao.where({
    tokenHash: createHash("sha256").update(token).digest("hex"),
  }).first()
  if (
    !registro ||
    registro.tipo !== "recuperacao" ||
    registro.usadoEm ||
    new Date(registro.expiraEm) < new Date()
  ) {
    return erroApi("Link inválido ou expirado.", 400)
  }

  const agora = new Date().toISOString()
  await db.transaction(async (tx: any) => {
    await tx.orm.public.TokensVerificacao.where({ id: registro.id }).update({ usadoEm: agora })
    await tx.orm.public.Usuarios.where({ id: registro.usuarioId }).update({
      senhaHash: await hashSenha(novaSenha),
    })
    await tx.orm.public.Sessoes.where({ usuarioId: registro.usuarioId }).deleteAll()
  })

  // A sessão nova segue no cookie.
  await iniciarSessao(registro.usuarioId, req)

  return json({ ok: true })
}
