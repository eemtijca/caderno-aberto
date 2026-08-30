import { NextRequest } from "next/server"
import { sessaoProfessor, json, erroApi, naoAutenticado } from "@/lib/api/sessao"

export const dynamic = "force-dynamic"

type Ctx = { params: Promise<{ id: string }> }

/** PUT /api/disciplinas/[id] . Edita nome/cor/ícone/ordem */
export async function PUT(req: NextRequest, ctx: Ctx) {
  const sessao = await sessaoProfessor()
  if (!sessao) return naoAutenticado()
  const { cliente } = sessao
  const { id } = await ctx.params

  const corpo = await req.json().catch(() => null)
  if (!corpo) return erroApi("Corpo inválido.")

  const dados: Partial<
    Pick<import("@/lib/supabase/tipos").DisciplinaLinha, "nome" | "cor" | "icone" | "ordem">
  > = {}
  if (typeof corpo.nome === "string" && corpo.nome.trim()) dados.nome = corpo.nome.trim()
  if (typeof corpo.cor === "string") dados.cor = corpo.cor
  if (typeof corpo.icone === "string") dados.icone = corpo.icone
  if (corpo.ordem !== undefined) dados.ordem = Number(corpo.ordem) || 0

  if (Object.keys(dados).length === 0) return erroApi("Nada para atualizar.")

  const { data: disciplina, error } = await cliente
    .from("disciplinas")
    .update(dados)
    .eq("id", id)
    .select("*")
    .maybeSingle()

  if (error) {
    if (error.code === "23505") return erroApi("Já existe uma disciplina com esse nome.")
    return erroApi("Falha ao editar a disciplina.")
  }
  if (!disciplina) return erroApi("Disciplina não encontrada.", 404)

  return json({ disciplina })
}

/** DELETE /api/disciplinas/[id] . Notas ficam (sem disciplina) */
export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const sessao = await sessaoProfessor()
  if (!sessao) return naoAutenticado()
  const { cliente } = sessao
  const { id } = await ctx.params

  const { error } = await cliente.from("disciplinas").delete().eq("id", id)
  if (error) return erroApi("Falha ao excluir a disciplina.")
  return json({ ok: true })
}
