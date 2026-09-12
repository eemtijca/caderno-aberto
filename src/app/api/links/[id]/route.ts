import { NextRequest } from "next/server"
import { banco } from "@/lib/banco"
import { sessaoProfessor, json, erroApi, naoAutenticado } from "@/lib/api/sessao"
import type { LinkLinha } from "@/lib/banco/tipos"
import { gerarToken } from "@/lib/api/token"

export const dynamic = "force-dynamic"

type Ctx = { params: Promise<{ id: string }> }

function paraResposta(l: LinkLinha) {
  return {
    id: l.id,
    tipo: l.tipo,
    token: l.token,
    nome: l.nome,
    notaId: l.notaId,
    turmaId: l.turmaId,
    disciplinaId: l.disciplinaId,
    ativo: l.ativo,
    expiraEm: l.expiraEm,
    acessos: l.acessos,
    criadoEm: l.criadoEm,
  }
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  const sessao = await sessaoProfessor(req)
  if (!sessao) return naoAutenticado()
  const { usuario } = sessao
  const { id } = await ctx.params

  const corpo = await req.json().catch(() => null)
  if (!corpo) return erroApi("Corpo inválido.")

  const dados: { nome?: string; ativo?: boolean; expiraEm?: string | null; token?: string } = {}
  if (typeof corpo.nome === "string") dados.nome = corpo.nome.trim().slice(0, 120)
  if (typeof corpo.ativo === "boolean") dados.ativo = corpo.ativo
  if (corpo.expiraEm !== undefined) {
    if (corpo.expiraEm === null || corpo.expiraEm === "") {
      dados.expiraEm = null
    } else {
      const d = new Date(String(corpo.expiraEm))
      if (Number.isNaN(d.getTime())) return erroApi("Data de expiração inválida.")
      if (d.getTime() < Date.now() - 60_000)
        return erroApi("A expiração não pode estar no passado.")
      dados.expiraEm = d.toISOString()
    }
  }
  if (corpo.regenerar === true) dados.token = gerarToken()

  if (Object.keys(dados).length === 0) return erroApi("Nada para atualizar.")

  const db = await banco()
  const existe = await db.links.findFirst({ where: { id, professorId: usuario.id } })
  if (!existe) return erroApi("Link não encontrado.", 404)
  const link = (await db.links.update({
    where: { id },
    data: dados,
  })) as unknown as LinkLinha | null

  if (!link) return erroApi("Link não encontrado.", 404)
  return json({ link: paraResposta(link) })
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const sessao = await sessaoProfessor(req)
  if (!sessao) return naoAutenticado()
  const { usuario } = sessao
  const { id } = await ctx.params

  const db = await banco()
  await db.links.deleteMany({ where: { id, professorId: usuario.id } })
  return json({ ok: true })
}
