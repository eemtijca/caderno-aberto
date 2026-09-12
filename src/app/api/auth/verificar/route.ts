// Confirma o e-mail do usuário a partir do token e redireciona de volta.

import { NextRequest, NextResponse } from "next/server"
import { createHash } from "crypto"
import { banco } from "@/lib/banco"
import { origemApp } from "@/lib/auth/validacao"

export const dynamic = "force-dynamic"

// GET /api/auth/verificar. Consome o token e confirma o e-mail.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? ""
  const origem = origemApp(req)
  const destino = (ok: boolean, motivo?: string) =>
    NextResponse.redirect(`${origem}/#/entrar${ok ? "?verificado=1" : `?erro=${motivo ?? "link"}`}`)

  // Token fora do formato esperado volta como erro para o app.
  if (!/^[0-9a-f]{64}$/.test(token)) return destino(false)

  const db = await banco()
  const hash = createHash("sha256").update(token).digest("hex")
  const registro = await db.tokensVerificacao.findFirst({ where: { tokenHash: hash } })
  // Precisa existir, ser do tipo certo, estar no prazo e não ter sido usado.
  if (
    !registro ||
    registro.tipo !== "verificacao" ||
    registro.usadoEm ||
    registro.expiraEm < new Date()
  ) {
    return destino(false, "expirado")
  }

  const agora = new Date().toISOString()
  await db.$transaction(async (tx) => {
    await tx.tokensVerificacao.update({ where: { id: registro.id }, data: { usadoEm: agora } })
    await tx.usuarios.update({
      where: { id: registro.usuarioId },
      data: {
        emailVerificadoEm: agora,
      },
    })
  })

  return destino(true)
}
