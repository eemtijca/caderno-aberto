import { NextRequest } from "next/server"
import { sessaoProfessor, json, erroApi, naoAutenticado } from "@/lib/api/sessao"
import { linhaParaNota, mapaTurmasProfessor, camposDenormalizados } from "@/lib/api/serializacao"
import { normalizarAparencia, normalizarBlocos, type AparenciaNota } from "@/lib/notas/tipos"
import { analisarMarkdown } from "@/lib/notas/render-markdown"
import { normalizar, textoDeBusca } from "@/lib/notas/texto"

export const dynamic = "force-dynamic"

/** POST /api/importar . Importa UMA nota de arquivo .md ou .json */
export async function POST(req: NextRequest) {
  const sessao = await sessaoProfessor()
  if (!sessao) return naoAutenticado()
  const { cliente, usuario } = sessao

  const corpo = await req.json().catch(() => null)
  if (!corpo || typeof corpo.conteudo !== "string") return erroApi("Conteúdo inválido.")
  const formato = corpo.formato === "json" ? "json" : "md"

  let dados: {
    titulo: string
    disciplina: string
    anoLetivo: number
    mes: number
    sobre: string
    habilidades: string
    status: "rascunho" | "publicada"
    turmas: string[]
    blocos: unknown
    aparencia: AparenciaNota
  }

  if (formato === "json") {
    let obj: { nota?: Record<string, unknown> } | Record<string, unknown>
    try {
      obj = JSON.parse(corpo.conteudo)
    } catch {
      return erroApi("JSON inválido.")
    }
    const n = (obj as { nota?: Record<string, unknown> }).nota ?? (obj as Record<string, unknown>)
    dados = {
      titulo: String(n.titulo ?? "Nota importada"),
      disciplina:
        typeof n.disciplina === "object" && n.disciplina
          ? String((n.disciplina as { nome?: string }).nome ?? "")
          : String(n.disciplina ?? ""),
      anoLetivo: Number(n.anoLetivo) || new Date().getFullYear(),
      mes: Math.min(12, Math.max(1, Number(n.mes) || new Date().getMonth() + 1)),
      sobre: String(n.sobre ?? ""),
      habilidades: String(n.habilidades ?? ""),
      status: n.status === "publicada" ? "publicada" : "rascunho",
      turmas: Array.isArray(n.turmas)
        ? n.turmas.map((t: unknown) =>
            typeof t === "string" ? t : String((t as { nome?: string })?.nome ?? ""),
          )
        : [],
      blocos: n.blocos,
      aparencia: normalizarAparencia(n.aparencia),
    }
  } else {
    const md = analisarMarkdown(corpo.conteudo)
    dados = {
      titulo: md.titulo,
      disciplina: md.disciplina,
      anoLetivo: md.anoLetivo,
      mes: md.mes,
      sobre: md.sobre,
      habilidades: md.habilidades,
      status: md.status === "publicada" ? "publicada" : "rascunho",
      turmas: md.turmas,
      blocos: md.blocos,
      aparencia: normalizarAparencia(md.aparencia),
    }
  }

  if (!dados.titulo.trim()) return erroApi("Arquivo sem título identificável.")

  // disciplina: cria se não existir (do próprio professor)
  const nomeDisc = dados.disciplina.trim() || "Sem disciplina"
  const { data: existente } = await cliente
    .from("disciplinas")
    .select("*")
    .eq("professor_id", usuario.id)
    .ilike("nome", nomeDisc)
    .maybeSingle()

  let disciplina = existente
  if (!disciplina) {
    const { data: criada, error } = await cliente
      .from("disciplinas")
      .insert({ professor_id: usuario.id, nome: nomeDisc, cor: "verde", icone: "BookOpen" })
      .select("*")
      .single()
    if (error || !criada) return erroApi("Falha ao criar a disciplina.")
    disciplina = criada
  }

  // turmas: cria as que faltarem no ano letivo da nota
  const { data: turmasExistentes } = await cliente
    .from("turmas")
    .select("*")
    .eq("professor_id", usuario.id)
    .eq("ano_letivo", dados.anoLetivo)
  const porNome = new Map((turmasExistentes ?? []).map((t) => [t.nome.toUpperCase(), t]))

  const turmasFinais: import("@/lib/supabase/tipos").TurmaLinha[] = []
  for (const nome of dados.turmas) {
    const nomeUp = nome.trim().toUpperCase()
    if (!nomeUp) continue
    let turma = porNome.get(nomeUp)
    if (!turma) {
      const serie = nomeUp.startsWith("1")
        ? "1º ano"
        : nomeUp.startsWith("2")
          ? "2º ano"
          : nomeUp.startsWith("3")
            ? "3º ano"
            : "Outro"
      const { data: criada, error } = await cliente
        .from("turmas")
        .insert({ professor_id: usuario.id, nome: nomeUp, serie, ano_letivo: dados.anoLetivo })
        .select("*")
        .single()
      if (!error && criada) {
        turma = criada
        porNome.set(nomeUp, criada)
      }
    }
    if (turma) turmasFinais.push(turma)
  }

  const blocos = normalizarBlocos(dados.blocos)
  const { data: linha, error } = await cliente
    .from("notas")
    .insert({
      professor_id: usuario.id,
      titulo: dados.titulo.trim(),
      ...camposDenormalizados(disciplina, turmasFinais),
      ano_letivo: dados.anoLetivo,
      mes: dados.mes,
      sobre: dados.sobre,
      habilidades: dados.habilidades,
      status: dados.status,
      blocos,
      aparencia: dados.aparencia,
      busca: normalizar(
        textoDeBusca({
          titulo: dados.titulo,
          sobre: dados.sobre,
          habilidades: dados.habilidades,
          blocos,
          disciplina: { nome: disciplina.nome },
          turmas: turmasFinais.map((t) => ({ nome: t.nome, serie: t.serie })),
        }),
      ),
    })
    .select("*, disciplina:disciplinas(*)")
    .single()

  if (error || !linha) return erroApi("Falha ao importar a nota.")

  const mapaTurmas = await mapaTurmasProfessor(cliente, usuario.id)
  return json({ nota: linhaParaNota(linha, mapaTurmas) }, 201)
}
