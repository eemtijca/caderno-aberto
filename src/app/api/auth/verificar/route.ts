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

  if (!/^[0-9a-f]{64}$/.test(token)) return destino(false)

  const db = await banco()
  const hash = createHash("sha256").update(token).digest("hex")
  const registro = await db.orm.public.TokensVerificacao.where({ tokenHash: hash }).first()
  if (
    !registro ||
    registro.tipo !== "verificacao" ||
    registro.usadoEm ||
    new Date(registro.expiraEm) < new Date()
  ) {
    return destino(false, "expirado")
  }

  const agora = new Date().toISOString()
  await db.transaction(async (tx: any) => {
    await tx.orm.public.TokensVerificacao.where({ id: registro.id }).update({ usadoEm: agora })
    await tx.orm.public.Usuarios.where({ id: registro.usuarioId }).update({
      emailVerificadoEm: agora,
    })
  })

  return destino(true)
}
