import { NextRequest } from "next/server"
import { banco } from "@/lib/banco"
import { sessaoProfessor, json, erroApi, naoAutenticado } from "@/lib/api/sessao"
import type { TurmaLinha } from "@/lib/banco/tipos"

export const dynamic = "force-dynamic"

type Ctx = { params: Promise<{ id: string }> }

function ehConflito(erro: unknown): boolean {
  const e = erro as { code?: string; constraint?: string; message?: string } | null
  if (!e) return false
  if (e.code === "23505") return true
  const texto = `${e.constraint ?? ""} ${e.message ?? ""}`
  return texto.includes("turmas_professor_ano_unico")
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  const sessao = await sessaoProfessor(req)
  if (!sessao) return naoAutenticado()
  const { usuario } = sessao
  const { id } = await ctx.params

  const corpo = await req.json().catch(() => null)
  if (!corpo) return erroApi("Corpo inválido.")

  const dados: { nome?: string; serie?: string; anoLetivo?: number } = {}
  if (typeof corpo.nome === "string" && corpo.nome.trim())
    dados.nome = corpo.nome.trim().toUpperCase()
  if (typeof corpo.serie === "string" && corpo.serie) dados.serie = corpo.serie
  if (corpo.anoLetivo !== undefined) {
    const ano = Number(corpo.anoLetivo)
    if (Number.isFinite(ano) && ano >= 2000 && ano <= 2100) dados.anoLetivo = ano
  }

  if (Object.keys(dados).length === 0) return erroApi("Nada para atualizar.")

  const db = await banco()
  try {
    const turma = (await db.orm.public.Turmas.where({ id, professorId: usuario.id }).update(
      dados,
    )) as unknown as TurmaLinha | null
    if (!turma) return erroApi("Turma não encontrada.", 404)
    return json({ turma })
  } catch (erro) {
    if (ehConflito(erro)) return erroApi("Essa turma já existe no ano letivo.")
    return erroApi("Falha ao editar a turma.")
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const sessao = await sessaoProfessor(req)
  if (!sessao) return naoAutenticado()
  const { usuario } = sessao
  const { id } = await ctx.params

  const db = await banco()
  await db.orm.public.Turmas.where({ id, professorId: usuario.id }).deleteAll()
  return json({ ok: true })
}
