import { NextRequest } from "next/server"
import { sessaoProfessor, json, erroApi, naoAutenticado } from "@/lib/api/sessao"

export const dynamic = "force-dynamic"

type Ctx = { params: Promise<{ id: string }> }

/** PUT /api/turmas/[id] . Edita nome/série/ano letivo */
export async function PUT(req: NextRequest, ctx: Ctx) {
  const sessao = await sessaoProfessor()
  if (!sessao) return naoAutenticado()
  const { cliente } = sessao
  const { id } = await ctx.params

  const corpo = await req.json().catch(() => null)
  if (!corpo) return erroApi("Corpo inválido.")

  const dados: Partial<
    Pick<import("@/lib/supabase/tipos").TurmaLinha, "nome" | "serie" | "ano_letivo">
  > = {}
  if (typeof corpo.nome === "string" && corpo.nome.trim())
    dados.nome = corpo.nome.trim().toUpperCase()
  if (typeof corpo.serie === "string" && corpo.serie) dados.serie = corpo.serie
  if (corpo.anoLetivo !== undefined) {
    const ano = Number(corpo.anoLetivo)
    if (Number.isFinite(ano) && ano >= 2000 && ano <= 2100) dados.ano_letivo = ano
  }

  if (Object.keys(dados).length === 0) return erroApi("Nada para atualizar.")

  const { data: turma, error } = await cliente
    .from("turmas")
    .update(dados)
    .eq("id", id)
    .select("*")
    .maybeSingle()

  if (error) {
    if (error.code === "23505") return erroApi("Essa turma já existe no ano letivo.")
    return erroApi("Falha ao editar a turma.")
  }
  if (!turma) return erroApi("Turma não encontrada.", 404)

  return json({ turma })
}

/** DELETE /api/turmas/[id] . Notas ficam (sem a turma) */
export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const sessao = await sessaoProfessor()
  if (!sessao) return naoAutenticado()
  const { cliente } = sessao
  const { id } = await ctx.params

  const { error } = await cliente.from("turmas").delete().eq("id", id)
  if (error) return erroApi("Falha ao excluir a turma.")
  return json({ ok: true })
}
