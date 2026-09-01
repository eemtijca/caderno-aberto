import { NextRequest } from "next/server"
import { sessaoProfessor, json, erroApi, naoAutenticado } from "@/lib/api/sessao"
import { linhaParaNota, mapaTurmasProfessor } from "@/lib/api/serializacao"

export const dynamic = "force-dynamic"

type Ctx = { params: Promise<{ id: string }> }

/** POST /api/notas/[id]/duplicar . Cria uma cópia completa da nota */
export async function POST(_req: NextRequest, ctx: Ctx) {
  const sessao = await sessaoProfessor()
  if (!sessao) return naoAutenticado()
  const { cliente } = sessao
  const { id } = await ctx.params

  const { data: original } = await cliente.from("notas").select("*").eq("id", id).maybeSingle()
  if (!original) return erroApi("Nota não encontrada.", 404)

  const { data: linha, error } = await cliente
    .from("notas")
    .insert({
      professor_id: original.professor_id,
      titulo: `${original.titulo} (cópia)`,
      disciplina_id: original.disciplina_id,
      disciplina_nome: original.disciplina_nome,
      disciplina_cor: original.disciplina_cor,
      turmas_ids: original.turmas_ids,
      turmas_nomes: original.turmas_nomes,
      ano_letivo: original.ano_letivo,
      mes: original.mes,
      sobre: original.sobre,
      habilidades: original.habilidades,
      status: "rascunho",
      blocos: original.blocos,
      aparencia: original.aparencia ?? {},
      busca: original.busca,
    })
    .select("*, disciplina:disciplinas(*)")
    .single()

  if (error || !linha) return erroApi("Falha ao duplicar a nota.")

  const mapaTurmas = await mapaTurmasProfessor(cliente, original.professor_id)
  return json({ nota: linhaParaNota(linha, mapaTurmas) }, 201)
}
