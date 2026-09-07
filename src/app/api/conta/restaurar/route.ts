import { NextRequest } from "next/server"
import { timingSafeEqual } from "node:crypto"
import { banco } from "@/lib/banco"
import { CRON_SECRET } from "@/lib/ambiente"
import { sessaoProfessor, json, erroApi, naoAutenticado } from "@/lib/api/sessao"

export const dynamic = "force-dynamic"

// POST /api/conta/restaurar. Cancela solicitação de exclusão dentro da carência.
export async function POST(req: NextRequest) {
  const sessao = await sessaoProfessor(req)
  if (!sessao) return naoAutenticado()
  const { usuario } = sessao
  const db = await banco()
  const perfil = await db.orm.public.Profiles.where({ id: usuario.id }).first()
  if (!perfil?.exclusaoSolicitadaEm) return erroApi("Nenhuma solicitação de exclusão pendente.")
  if (perfil.expiraEm && new Date(perfil.expiraEm) < new Date())
    return erroApi("Prazo de carência expirado. A conta será removida.", 410)
  await db.transaction(async (tx: any) => {
    await tx.orm.public.Profiles.where({ id: usuario.id }).update({
      exclusaoSolicitadaEm: null,
      expiraEm: null,
    })
    const links = await tx.orm.public.Links.where({ professorId: usuario.id }).all()
    for (const link of links) {
      if (!link.ativo) await tx.orm.public.Links.where({ id: link.id }).update({ ativo: true })
    }
  })
  return json({ ok: true })
}

// DELETE /api/conta/restaurar. Remove contas com carência vencida.
// Exige o segredo do agendador quando configurado (CRON_SECRET).
export async function DELETE(req: NextRequest) {
  if (CRON_SECRET) {
    const cabecalho = req.headers.get("authorization") ?? ""
    const esperado = `Bearer ${CRON_SECRET}`
    const confere =
      cabecalho.length === esperado.length &&
      timingSafeEqual(Buffer.from(cabecalho), Buffer.from(esperado))
    if (!confere) return erroApi("Acesso negado.", 403)
  }
  return json({ removidas: await removerVencidas() })
}

// GET /api/conta/restaurar. Variante para agendadores que disparam GET
// (Vercel Cron). Exige CRON_SECRET sempre.
export async function GET(req: NextRequest) {
  if (!CRON_SECRET) return erroApi("Agendador não configurado.", 503)
  const cabecalho = req.headers.get("authorization") ?? ""
  const esperado = `Bearer ${CRON_SECRET}`
  const confere =
    cabecalho.length === esperado.length &&
    timingSafeEqual(Buffer.from(cabecalho), Buffer.from(esperado))
  if (!confere) return erroApi("Acesso negado.", 403)
  return json({ removidas: await removerVencidas() })
}

async function removerVencidas(): Promise<number> {
  const db = await banco()
  const agora = new Date().toISOString()
  let removidas = 0
  const perfis = await db.orm.public.Profiles.all()
  for (const perfil of perfis) {
    if (perfil.expiraEm && perfil.expiraEm < agora) {
      try {
        await db.orm.public.Usuarios.where({ id: perfil.id }).deleteAll()
        removidas++
      } catch {
        // Falhas isoladas não interrompem a purga.
      }
    }
  }
  return removidas
}
