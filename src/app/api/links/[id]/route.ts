import { NextRequest } from "next/server"
import { sessaoProfessor, json, erroApi, naoAutenticado } from "@/lib/api/sessao"
import { gerarToken } from "@/lib/api/token"

export const dynamic = "force-dynamic"

type Ctx = { params: Promise<{ id: string }> }

// PUT /api/links/[id] . Gerencia o link:
// { nome?, ativo?, expiraEm? (ISO | null), regenerar? }
export async function PUT(req: NextRequest, ctx: Ctx) {
  const sessao = await sessaoProfessor()
  if (!sessao) return naoAutenticado()
  const { cliente } = sessao
  const { id } = await ctx.params

  const corpo = await req.json().catch(() => null)
  if (!corpo) return erroApi("Corpo inválido.")

  const dados: Partial<
    Pick<import("@/lib/supabase/tipos").LinkLinha, "nome" | "ativo" | "expira_em" | "token">
  > = {}
  if (typeof corpo.nome === "string") dados.nome = corpo.nome.trim().slice(0, 120)
  if (typeof corpo.ativo === "boolean") dados.ativo = corpo.ativo
  if (corpo.expiraEm !== undefined) {
    if (corpo.expiraEm === null || corpo.expiraEm === "") {
      dados.expira_em = null
    } else {
      const d = new Date(String(corpo.expiraEm))
      if (Number.isNaN(d.getTime())) return erroApi("Data de expiração inválida.")
      if (d.getTime() < Date.now() - 60_000)
        return erroApi("A expiração não pode estar no passado.")
      dados.expira_em = d.toISOString()
    }
  }
  if (corpo.regenerar === true) dados.token = gerarToken()

  if (Object.keys(dados).length === 0) return erroApi("Nada para atualizar.")

  const { data: link, error } = await cliente
    .from("links")
    .update(dados)
    .eq("id", id)
    .select("*")
    .maybeSingle()

  if (error || !link) return erroApi("Link não encontrado.", 404)
  return json({ link })
}

/** DELETE /api/links/[id] . Exclui o link (alunos perdem o acesso) */
export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const sessao = await sessaoProfessor()
  if (!sessao) return naoAutenticado()
  const { cliente } = sessao
  const { id } = await ctx.params

  const { error } = await cliente.from("links").delete().eq("id", id)
  if (error) return erroApi("Falha ao excluir o link.")
  return json({ ok: true })
}
