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
  if (!/^[0-9a-f]{64}$/.test(token)) return destino(false)

  const db = await banco()
  const registro = await db.orm.public.TokensVerificacao.where({
    tokenHash: createHash("sha256").update(token).digest("hex"),
  }).first()
  if (
    !registro ||
    registro.tipo !== "troca_email" ||
    !registro.novoEmail ||
    registro.usadoEm ||
    new Date(registro.expiraEm) < new Date()
  ) {
    return destino(false)
  }

  const ocupado = await db.orm.public.Usuarios.where({ email: registro.novoEmail }).first()
  if (ocupado && ocupado.id !== registro.usuarioId) return destino(false)

  const agora = new Date().toISOString()
  await db.transaction(async (tx: any) => {
    await tx.orm.public.TokensVerificacao.where({ id: registro.id }).update({ usadoEm: agora })
    await tx.orm.public.Usuarios.where({ id: registro.usuarioId }).update({
      email: registro.novoEmail!,
    })
    await tx.orm.public.Profiles.where({ id: registro.usuarioId }).update({
      email: registro.novoEmail!,
    })
  })

  return destino(true)
}
