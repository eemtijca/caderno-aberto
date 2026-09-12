// Conclui a recuperação de senha e invalida as sessões existentes.

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
  // Limita tentativas de conclusão por IP.
  const limite = await cabeNoLimite(chavePorIp(req, "concluir"))
  if (!limite.permitido)
    return erroApi("Muitas tentativas. Aguarde um momento e tente novamente.", 429)

  const corpo = await req.json().catch(() => null)
  const token = typeof corpo?.token === "string" ? corpo.token : ""
  const novaSenha = typeof corpo?.novaSenha === "string" ? corpo.novaSenha : ""
  // Exige o token no formato hexadecimal emitido.
  if (!/^[0-9a-f]{64}$/.test(token)) return erroApi("Link inválido ou expirado.", 400)
  if (!senhaValida(novaSenha)) return erroApi("A senha deve ter pelo menos 8 caracteres.")

  const db = await banco()
  const registro = await db.tokensVerificacao.findFirst({
    where: {
      tokenHash: createHash("sha256").update(token).digest("hex"),
    },
  })
  if (
    !registro ||
    registro.tipo !== "recuperacao" ||
    registro.usadoEm ||
    registro.expiraEm < new Date()
  ) {
    return erroApi("Link inválido ou expirado.", 400)
  }

  // Marca o token como usado, troca a senha e derruba as sessões antigas.
  const agora = new Date().toISOString()
  await db.$transaction(async (tx) => {
    await tx.tokensVerificacao.update({ where: { id: registro.id }, data: { usadoEm: agora } })
    await tx.usuarios.update({
      where: { id: registro.usuarioId },
      data: {
        senhaHash: await hashSenha(novaSenha),
      },
    })
    await tx.sessoes.deleteMany({ where: { usuarioId: registro.usuarioId } })
  })

  // A sessão nova segue no cookie.
  await iniciarSessao(registro.usuarioId, req)

  return json({ ok: true })
}
