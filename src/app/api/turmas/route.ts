import { NextRequest } from "next/server"
import { banco } from "@/lib/banco"
import { sessaoProfessor, json, erroApi, naoAutenticado } from "@/lib/api/sessao"
import type { TurmaLinha } from "@/lib/banco/tipos"

export const dynamic = "force-dynamic"

function ehConflito(erro: unknown): boolean {
  const e = erro as { code?: string; constraint?: string; message?: string } | null
  if (!e) return false
  if (e.code === "23505") return true
  const texto = `${e.constraint ?? ""} ${e.message ?? ""}`
  return texto.includes("turmas_professor_ano_unico")
}

function paraResposta(t: TurmaLinha, totalNotas: number) {
  return { id: t.id, nome: t.nome, serie: t.serie, anoLetivo: t.anoLetivo, totalNotas }
}

export async function GET(req: NextRequest) {
  const sessao = await sessaoProfessor(req)
  if (!sessao) return naoAutenticado()
  const { usuario } = sessao

  const ano = Number(req.nextUrl.searchParams.get("ano")) || undefined

  const db = await banco()
  const todas = (await db.orm.public.Turmas.where({
    professorId: usuario.id,
  }).all()) as unknown as TurmaLinha[]
  const turmas = todas
    .filter((t) => !ano || t.anoLetivo === ano)
    .sort((a, b) => b.anoLetivo - a.anoLetivo || a.nome.localeCompare(b.nome, "pt-BR"))
  const notas = await db.orm.public.Notas.where({ professorId: usuario.id }).all()

  const contagem = new Map<string, number>()
  for (const n of notas) {
    for (const tid of n.turmasIds ?? []) {
      contagem.set(tid, (contagem.get(tid) ?? 0) + 1)
    }
  }

  return json({ turmas: turmas.map((t) => paraResposta(t, contagem.get(t.id) ?? 0)) })
}

export async function POST(req: NextRequest) {
  const sessao = await sessaoProfessor(req)
  if (!sessao) return naoAutenticado()
  const { usuario } = sessao

  const corpo = await req.json().catch(() => null)
  const nome = typeof corpo?.nome === "string" ? corpo.nome.trim().toUpperCase() : ""
  if (!nome) return erroApi("Informe o nome da turma (ex.: 3A).")

  const serie =
    typeof corpo?.serie === "string" && corpo.serie
      ? corpo.serie
      : nome.startsWith("1")
        ? "1º ano"
        : nome.startsWith("2")
          ? "2º ano"
          : nome.startsWith("3")
            ? "3º ano"
            : "Outro"

  const db = await banco()
  try {
    const turma = (await db.orm.public.Turmas.create({
      professorId: usuario.id,
      nome,
      serie,
      anoLetivo: Number(corpo?.anoLetivo) || new Date().getFullYear(),
    })) as unknown as TurmaLinha
    return json({ turma: paraResposta(turma, 0) }, 201)
  } catch (erro) {
    if (ehConflito(erro)) return erroApi("Essa turma já existe no ano letivo.")
    return erroApi("Falha ao criar a turma.")
  }
}
