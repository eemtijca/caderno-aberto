// Efetiva a troca de e-mail a partir do token enviado ao novo endereço.

import { NextRequest, NextResponse } from "next/server"
import { createHash } from "crypto"
import { banco } from "@/lib/banco"
import { origemApp } from "@/lib/auth/validacao"

export const dynamic = "force-dynamic"

// GET /api/auth/confirmar-troca. Efetiva a troca de e-mail.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? ""
  const origem = origemApp(req)
  const destino = (ok: boolean) =>
    NextResponse.redirect(`${origem}/#/conta${ok ? "?email=ok" : "?erro=email"}`)
  // Token malformado redireciona com erro.
  if (!/^[0-9a-f]{64}$/.test(token)) return destino(false)

  const db = await banco()
  const registro = await db.tokensVerificacao.findFirst({
    where: {
      tokenHash: createHash("sha256").update(token).digest("hex"),
    },
  })
  if (
    !registro ||
    registro.tipo !== "troca_email" ||
    !registro.novoEmail ||
    registro.usadoEm ||
    registro.expiraEm < new Date()
  ) {
    return destino(false)
  }

  const ocupado = await db.usuarios.findFirst({ where: { email: registro.novoEmail } })
  // O endereço pode ter sido tomado enquanto o token estava pendente.
  if (ocupado && ocupado.id !== registro.usuarioId) return destino(false)

  // Atualiza usuarios e profiles na mesma transação.
  const agora = new Date().toISOString()
  await db.$transaction(async (tx) => {
    await tx.tokensVerificacao.update({ where: { id: registro.id }, data: { usadoEm: agora } })
    await tx.usuarios.update({
      where: { id: registro.usuarioId },
      data: {
        email: registro.novoEmail!,
      },
    })
    await tx.profiles.update({
      where: { id: registro.usuarioId },
      data: {
        email: registro.novoEmail!,
      },
    })
  })

  return destino(true)
}
