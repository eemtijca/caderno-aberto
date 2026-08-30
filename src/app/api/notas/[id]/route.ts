import { NextRequest } from "next/server"
import { sessaoProfessor, json, erroApi, naoAutenticado } from "@/lib/api/sessao"
import { linhaParaNota, mapaTurmasProfessor, camposDenormalizados } from "@/lib/api/serializacao"
import { normalizarBlocos, type Bloco } from "@/lib/notas/tipos"
import { normalizar, textoDeBusca } from "@/lib/notas/texto"

export const dynamic = "force-dynamic"

type Ctx = { params: Promise<{ id: string }> }

/** GET /api/notas/[id] . Nota do professor por id */
export async function GET(_req: NextRequest, ctx: Ctx) {
  const sessao = await sessaoProfessor()
  if (!sessao) return naoAutenticado()
  const { cliente } = sessao
  const { id } = await ctx.params

  const { data: linha } = await cliente
    .from("notas")
    .select("*, disciplina:disciplinas(*)")
    .eq("id", id)
    .maybeSingle()

  if (!linha) return erroApi("Nota não encontrada.", 404)

  const mapaTurmas = await mapaTurmasProfessor(cliente, linha.professor_id)
  return json({ nota: linhaParaNota(linha, mapaTurmas) })
}

/** PUT /api/notas/[id] . Salva metadados + blocos */
export async function PUT(req: NextRequest, ctx: Ctx) {
  const sessao = await sessaoProfessor()
  if (!sessao) return naoAutenticado()
  const { cliente, usuario } = sessao
  const { id } = await ctx.params

  const corpo = await req.json().catch(() => null)
  if (!corpo || typeof corpo !== "object") return erroApi("Corpo inválido.")

  const { data: atual } = await cliente.from("notas").select("*").eq("id", id).maybeSingle()
  if (!atual) return erroApi("Nota não encontrada.", 404)

  const dados: Partial<Omit<import("@/lib/supabase/tipos").NotaLinha, "id">> = {}

  if (typeof corpo.titulo === "string" && corpo.titulo.trim()) {
    dados.titulo = corpo.titulo.trim()
  }

  // disciplina/turmas: revalida posse e recalcula a denormalização
  let disciplina: import("@/lib/supabase/tipos").DisciplinaLinha | null = null
  if (atual.disciplina_id) {
    const { data: d } = await cliente
      .from("disciplinas")
      .select("*")
      .eq("id", atual.disciplina_id)
      .maybeSingle()
    disciplina = d ?? null
  }
  let turmas: import("@/lib/supabase/tipos").TurmaLinha[] = []
  if (atual.turmas_ids.length > 0) {
    const { data: t } = await cliente.from("turmas").select("*").in("id", atual.turmas_ids)
    turmas = t ?? []
  }

  if (typeof corpo.disciplinaId === "string") {
    if (corpo.disciplinaId) {
      const { data: d } = await cliente
        .from("disciplinas")
        .select("*")
        .eq("id", corpo.disciplinaId)
        .eq("professor_id", usuario.id)
        .maybeSingle()
      if (!d) return erroApi("Disciplina não encontrada.", 404)
      disciplina = d
    } else {
      disciplina = null
    }
  }

  if (Array.isArray(corpo.turmasIds)) {
    const ids = corpo.turmasIds.filter((t: unknown) => typeof t === "string")
    const { data: t } = await cliente
      .from("turmas")
      .select("*")
      .eq("professor_id", usuario.id)
      .in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"])
    turmas = t ?? []
  }

  if (
    corpo.disciplinaId !== undefined ||
    Array.isArray(corpo.turmasIds) ||
    corpo.titulo !== undefined
  ) {
    Object.assign(dados, camposDenormalizados(disciplina, turmas))
  }

  if (corpo.anoLetivo !== undefined) {
    const ano = Number(corpo.anoLetivo)
    if (Number.isFinite(ano) && ano >= 2000 && ano <= 2100) dados.ano_letivo = ano
  }
  if (corpo.mes !== undefined) dados.mes = Math.min(12, Math.max(1, Number(corpo.mes) || 1))
  if (typeof corpo.sobre === "string") dados.sobre = corpo.sobre
  if (typeof corpo.habilidades === "string") dados.habilidades = corpo.habilidades
  if (corpo.status === "publicada" || corpo.status === "rascunho")
    dados.status = corpo.status as "publicada" | "rascunho"
  if (corpo.blocos !== undefined) dados.blocos = normalizarBlocos(corpo.blocos)

  // recalcula o texto de busca com o estado final
  const tituloFinal = dados.titulo ?? atual.titulo
  const sobreFinal = dados.sobre ?? atual.sobre
  const habilidadesFinal = dados.habilidades ?? atual.habilidades
  const blocosFinais = (dados.blocos as Bloco[] | undefined) ?? normalizarBlocos(atual.blocos)
  dados.busca = normalizar(
    textoDeBusca({
      titulo: tituloFinal,
      sobre: sobreFinal,
      habilidades: habilidadesFinal,
      blocos: blocosFinais,
      disciplina: disciplina ? { nome: disciplina.nome } : null,
      turmas: turmas.map((t) => ({ nome: t.nome, serie: t.serie })),
    }),
  )

  const { data: linha, error } = await cliente
    .from("notas")
    .update(dados)
    .eq("id", id)
    .select("*, disciplina:disciplinas(*)")
    .single()

  if (error || !linha) return erroApi("Falha ao salvar a nota.")

  const mapaTurmas = await mapaTurmasProfessor(cliente, usuario.id)
  return json({ nota: linhaParaNota(linha, mapaTurmas) })
}

/** DELETE /api/notas/[id] */
export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const sessao = await sessaoProfessor()
  if (!sessao) return naoAutenticado()
  const { cliente } = sessao
  const { id } = await ctx.params

  const { error } = await cliente.from("notas").delete().eq("id", id)
  if (error) return erroApi("Falha ao excluir a nota.")
  return json({ ok: true })
}
