import { NextRequest } from "next/server"
import { json } from "@/lib/api/sessao"
import { renovarSessao } from "@/lib/auth/sessao"

export const dynamic = "force-dynamic"

// POST /api/auth/renovar. Emite novo acesso via refresh.
export async function POST(req: NextRequest) {
  const usuario = await renovarSessao(req)
  if (!usuario) return json({ ok: false }, 401)
  return json({ ok: true })
}
