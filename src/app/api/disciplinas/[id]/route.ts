import { NextRequest } from "next/server"
import { banco } from "@/lib/banco"
import { sessaoProfessor, json, erroApi, naoAutenticado } from "@/lib/api/sessao"
import type { DisciplinaLinha } from "@/lib/banco/tipos"

export const dynamic = "force-dynamic"

type Ctx = { params: Promise<{ id: string }> }

function ehConflito(erro: unknown): boolean {
  const e = erro as { code?: string; constraint?: string; message?: string } | null
  if (!e) return false
  if (e.code === "23505") return true
  const texto = `${e.constraint ?? ""} ${e.message ?? ""}`
  return texto.includes("disciplinas_professor_nome_unico")
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  const sessao = await sessaoProfessor(req)
  if (!sessao) return naoAutenticado()
  const { usuario } = sessao
  const { id } = await ctx.params

  const corpo = await req.json().catch(() => null)
  if (!corpo) return erroApi("Corpo inválido.")

  const dados: { nome?: string; cor?: string; icone?: string; ordem?: number } = {}
  if (typeof corpo.nome === "string" && corpo.nome.trim()) dados.nome = corpo.nome.trim()
  if (typeof corpo.cor === "string") dados.cor = corpo.cor
  if (typeof corpo.icone === "string") dados.icone = corpo.icone
  if (corpo.ordem !== undefined) dados.ordem = Number(corpo.ordem) || 0

  if (Object.keys(dados).length === 0) return erroApi("Nada para atualizar.")

  const db = await banco()
  try {
    const existe = await db.disciplinas.findFirst({ where: { id, professorId: usuario.id } })
    if (!existe) return erroApi("Disciplina não encontrada.", 404)
    const disciplina = (await db.disciplinas.update({
      where: {
        id,
      },
      data: dados,
    })) as unknown as DisciplinaLinha | null
    if (!disciplina) return erroApi("Disciplina não encontrada.", 404)
    return json({ disciplina })
  } catch (erro) {
    if (ehConflito(erro)) return erroApi("Já existe uma disciplina com esse nome.")
    return erroApi("Falha ao editar a disciplina.")
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const sessao = await sessaoProfessor(req)
  if (!sessao) return naoAutenticado()
  const { usuario } = sessao
  const { id } = await ctx.params

  const db = await banco()
  await db.disciplinas.deleteMany({ where: { id, professorId: usuario.id } })
  return json({ ok: true })
}
