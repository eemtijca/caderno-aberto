import { NextRequest } from "next/server"
import { banco } from "@/lib/banco"
import { sessaoProfessor, json, erroApi, naoAutenticado } from "@/lib/api/sessao"
import {
  linhaParaNota,
  mapaTurmasProfessor,
  camposDenormalizados,
  paraJson,
} from "@/lib/api/serializacao"
import type { NotaLinha } from "@/lib/banco/tipos"
import { normalizarBlocos } from "@/lib/notas/tipos"
import { notaModelo, notaVazia } from "@/lib/notas/modelo"
import { normalizar, textoDeBusca } from "@/lib/notas/texto"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const sessao = await sessaoProfessor(req)
  if (!sessao) return naoAutenticado()
  const { usuario } = sessao

  const sp = req.nextUrl.searchParams
  const q = normalizar(sp.get("q")?.trim() ?? "")
  const disciplina = sp.get("disciplina") ?? ""
  const ano = Number(sp.get("ano")) || undefined
  const mes = Number(sp.get("mes")) || undefined
  const turma = sp.get("turma") ?? ""
  const status = sp.get("status") ?? ""

  const db = await banco()
  void db
  // Busca textual no banco; demais filtros em memória.
  const base = q ? await filtrarBusca(usuario.id, q) : await notasDoProfessor(usuario.id)

  const notas = base
    .filter((l) => !disciplina || l.disciplinaId === disciplina)
    .filter((l) => !ano || l.anoLetivo === ano)
    .filter((l) => !mes || l.mes === mes)
    .filter((l) => !turma || l.turmasIds.includes(turma))
    .filter((l) => (status === "rascunho" || status === "publicada" ? l.status === status : true))
    .sort((a, b) => {
      if (a.anoLetivo !== b.anoLetivo) return b.anoLetivo - a.anoLetivo
      if (a.mes !== b.mes) return b.mes - a.mes
      return a.atualizadoEm < b.atualizadoEm ? 1 : -1
    })

  const mapaTurmas = await mapaTurmasProfessor(usuario.id)
  return json({
    notas: notas.map((linha) => linhaParaNota(comDisciplinaLinha(linha), mapaTurmas)),
  })
}

async function notasDoProfessor(professorId: string): Promise<NotaLinha[]> {
  const db = await banco()
  return (await db.notas.findMany({ where: { professorId } })) as unknown as NotaLinha[]
}

async function filtrarBusca(professorId: string, q: string): Promise<NotaLinha[]> {
  const db = banco()
  // Busca textual já isolada por professor no banco.
  const like = q.replace(/[%_\\]/g, (c) => `\\${c}`)
  const linhas = await db.notas.findMany({
    where: { professorId, busca: { contains: like } },
  })
  return linhas as unknown as NotaLinha[]
}

function comDisciplinaLinha(linha: NotaLinha) {
  return linha
}

export async function POST(req: NextRequest) {
  const sessao = await sessaoProfessor(req)
  if (!sessao) return naoAutenticado()
  const { usuario } = sessao

  const corpo = await req.json().catch(() => null)
  if (!corpo) return erroApi("Corpo inválido.")

  const titulo: string = (corpo.titulo ?? "").trim()
  const disciplinaId: string = corpo.disciplinaId ?? ""
  if (!titulo) return erroApi("Informe o título da nota.")
  if (!disciplinaId) return erroApi("Selecione a disciplina.")

  const db = await banco()
  const disciplina = await db.disciplinas.findFirst({
    where: {
      id: disciplinaId,
      professorId: usuario.id,
    },
  })
  if (!disciplina) return erroApi("Disciplina não encontrada.", 404)

  const anoLetivo = Number(corpo.anoLetivo) || new Date().getFullYear()
  const mes = Math.min(12, Math.max(1, Number(corpo.mes) || new Date().getMonth() + 1))
  const comModelo = corpo.comModelo !== false

  const turmasIds: string[] = Array.isArray(corpo.turmasIds)
    ? corpo.turmasIds.filter((t: unknown) => typeof t === "string")
    : []
  // Restringe às turmas do professor.
  const turmasDoProfessor = await db.turmas.findMany({ where: { professorId: usuario.id } })
  const porId = new Map(turmasDoProfessor.map((t) => [t.id, t]))
  const turmasFinais = turmasIds
    .map((id) => porId.get(id))
    .filter((t): t is (typeof turmasDoProfessor)[number] => Boolean(t))

  const blocos = corpo.blocos
    ? normalizarBlocos(corpo.blocos)
    : comModelo
      ? notaModelo(titulo)
      : notaVazia(titulo)

  const sobre: string = typeof corpo.sobre === "string" ? corpo.sobre : ""
  const habilidades: string = typeof corpo.habilidades === "string" ? corpo.habilidades : ""

  const linha = (await db.notas.create({
    data: {
      professorId: usuario.id,
      titulo,
      ...camposDenormalizados(
        disciplina as unknown as Parameters<typeof camposDenormalizados>[0],
        turmasFinais as unknown as Parameters<typeof camposDenormalizados>[1],
      ),
      anoLetivo,
      mes,
      sobre,
      habilidades,
      status: corpo.status === "publicada" ? "publicada" : "rascunho",
      blocos: paraJson(blocos),
      busca: normalizar(
        textoDeBusca({
          titulo,
          sobre,
          habilidades,
          blocos,
          disciplina: { nome: disciplina.nome },
          turmas: turmasFinais.map((t) => ({ nome: t.nome, serie: t.serie })),
        }),
      ),
    },
  })) as unknown as NotaLinha

  const mapaTurmas = await mapaTurmasProfessor(usuario.id)
  const nota = linhaParaNota(
    {
      ...linha,
      disciplina: {
        id: disciplina.id,
        nome: disciplina.nome,
        cor: disciplina.cor,
        icone: disciplina.icone,
        ordem: disciplina.ordem,
      },
    },
    mapaTurmas,
  )
  return json({ nota }, 201)
}
