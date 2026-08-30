import { NextRequest } from "next/server"
import { sessaoProfessor, json, erroApi, naoAutenticado } from "@/lib/api/sessao"
import { linhaParaNota, mapaTurmasProfessor, camposDenormalizados } from "@/lib/api/serializacao"
import { normalizarBlocos } from "@/lib/notas/tipos"
import { notaModelo, notaVazia } from "@/lib/notas/modelo"
import { normalizar, textoDeBusca } from "@/lib/notas/texto"

export const dynamic = "force-dynamic"

/** GET /api/notas . Lista com filtros (?q=&disciplina=&ano=&mes=&turma=&status=) */
export async function GET(req: NextRequest) {
  const sessao = await sessaoProfessor()
  if (!sessao) return naoAutenticado()
  const { cliente, usuario } = sessao

  const sp = req.nextUrl.searchParams
  const q = normalizar(sp.get("q")?.trim() ?? "")
  const disciplina = sp.get("disciplina") ?? ""
  const ano = Number(sp.get("ano")) || undefined
  const mes = Number(sp.get("mes")) || undefined
  const turma = sp.get("turma") ?? ""
  const status = sp.get("status") ?? ""

  let consulta = cliente
    .from("notas")
    .select("*, disciplina:disciplinas(*)")
    .eq("professor_id", usuario.id)

  if (q) consulta = consulta.ilike("busca", `%${q}%`)
  if (disciplina) consulta = consulta.eq("disciplina_id", disciplina)
  if (ano) consulta = consulta.eq("ano_letivo", ano)
  if (mes) consulta = consulta.eq("mes", mes)
  if (turma) consulta = consulta.contains("turmas_ids", [turma])
  if (status === "rascunho" || status === "publicada") consulta = consulta.eq("status", status)

  consulta = consulta
    .order("ano_letivo", { ascending: false })
    .order("mes", { ascending: false })
    .order("atualizado_em", { ascending: false })

  const { data: linhas, error } = await consulta
  if (error) return erroApi("Falha ao buscar notas.")

  const mapaTurmas = await mapaTurmasProfessor(cliente, usuario.id)
  const notas = (linhas ?? []).map((linha) => linhaParaNota(linha, mapaTurmas))
  return json({ notas })
}

/** POST /api/notas . Cria nota nova (com modelo ou vazia) */
export async function POST(req: NextRequest) {
  const sessao = await sessaoProfessor()
  if (!sessao) return naoAutenticado()
  const { cliente, usuario } = sessao

  const corpo = await req.json().catch(() => null)
  if (!corpo) return erroApi("Corpo inválido.")

  const titulo: string = (corpo.titulo ?? "").trim()
  const disciplinaId: string = corpo.disciplinaId ?? ""
  if (!titulo) return erroApi("Informe o título da nota.")
  if (!disciplinaId) return erroApi("Selecione a disciplina.")

  const { data: disciplina } = await cliente
    .from("disciplinas")
    .select("*")
    .eq("id", disciplinaId)
    .eq("professor_id", usuario.id)
    .maybeSingle()
  if (!disciplina) return erroApi("Disciplina não encontrada.", 404)

  const anoLetivo = Number(corpo.anoLetivo) || new Date().getFullYear()
  const mes = Math.min(12, Math.max(1, Number(corpo.mes) || new Date().getMonth() + 1))
  const comModelo = corpo.comModelo !== false

  const turmasIds: string[] = Array.isArray(corpo.turmasIds)
    ? corpo.turmasIds.filter((t: unknown) => typeof t === "string")
    : []
  const { data: turmas } = await cliente
    .from("turmas")
    .select("*")
    .eq("professor_id", usuario.id)
    .in("id", turmasIds.length ? turmasIds : ["00000000-0000-0000-0000-000000000000"])
  const listaTurmas = turmas ?? []

  const blocos = corpo.blocos
    ? normalizarBlocos(corpo.blocos)
    : comModelo
      ? notaModelo(titulo)
      : notaVazia(titulo)

  const sobre: string = typeof corpo.sobre === "string" ? corpo.sobre : ""
  const habilidades: string = typeof corpo.habilidades === "string" ? corpo.habilidades : ""

  const { data: linha, error } = await cliente
    .from("notas")
    .insert({
      professor_id: usuario.id,
      titulo,
      ...camposDenormalizados(disciplina, listaTurmas),
      ano_letivo: anoLetivo,
      mes,
      sobre,
      habilidades,
      status: (corpo.status === "publicada" ? "publicada" : "rascunho") as "publicada" | "rascunho",
      blocos,
      busca: normalizar(
        textoDeBusca({
          titulo,
          sobre,
          habilidades,
          blocos,
          disciplina: { nome: disciplina.nome },
          turmas: listaTurmas.map((t) => ({ nome: t.nome, serie: t.serie })),
        }),
      ),
    })
    .select("*, disciplina:disciplinas(*)")
    .single()

  if (error || !linha) return erroApi("Falha ao criar a nota.")

  const mapaTurmas = await mapaTurmasProfessor(cliente, usuario.id)
  return json({ nota: linhaParaNota(linha, mapaTurmas) }, 201)
}
