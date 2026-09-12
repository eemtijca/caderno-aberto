// Cancela exclusões pendentes e remove definitivamente contas com carência vencida.

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
  const perfil = await db.profiles.findFirst({ where: { id: usuario.id } })
  if (!perfil?.exclusaoSolicitadaEm) return erroApi("Nenhuma solicitação de exclusão pendente.")
  if (perfil.expiraEm && perfil.expiraEm < new Date())
    return erroApi("Prazo de carência expirado. A conta será removida.", 410)
  await db.$transaction(async (tx) => {
    await tx.profiles.update({
      where: { id: usuario.id },
      data: {
        exclusaoSolicitadaEm: null,
        expiraEm: null,
      },
    })
    const links = await tx.links.findMany({ where: { professorId: usuario.id } })
    for (const link of links) {
      // Reativa só os pausados pela exclusão; os demais seguem como estavam.
      if (link.pausadoNaExclusao)
        await tx.links.update({
          where: { id: link.id },
          data: { ativo: true, pausadoNaExclusao: false },
        })
    }
  })
  return json({ ok: true })
}

// DELETE /api/conta/restaurar. Remove contas com carência vencida.
// Exige sempre o segredo do agendador (CRON_SECRET).
export async function DELETE(req: NextRequest) {
  if (!CRON_SECRET) return erroApi("Agendador não configurado.", 503)
  const cabecalho = req.headers.get("authorization") ?? ""
  const esperado = `Bearer ${CRON_SECRET}`
  const confere =
    cabecalho.length === esperado.length &&
    timingSafeEqual(Buffer.from(cabecalho), Buffer.from(esperado))
  if (!confere) return erroApi("Acesso negado.", 403)
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
  const db = banco()
  // Purga em lotes só as contas com exclusão solicitada e carência vencida.
  const agora = new Date()
  let removidas = 0
  for (;;) {
    const lote = await db.profiles.findMany({
      where: {
        exclusaoSolicitadaEm: { not: null },
        expiraEm: { lt: agora },
      },
      select: { id: true },
      take: 100,
    })
    if (lote.length === 0) break
    for (const perfil of lote) {
      try {
        await db.usuarios.delete({ where: { id: perfil.id } })
        removidas++
      } catch {
        // Falhas isoladas não interrompem a purga.
      }
    }
  }
  return removidas
}
