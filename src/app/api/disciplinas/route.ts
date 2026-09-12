import { NextRequest } from "next/server"
import { banco } from "@/lib/banco"
import { sessaoProfessor, json, erroApi, naoAutenticado } from "@/lib/api/sessao"
import type { DisciplinaLinha } from "@/lib/banco/tipos"

export const dynamic = "force-dynamic"

function ehConflito(erro: unknown): boolean {
  const e = erro as { code?: string; constraint?: string; message?: string } | null
  if (!e) return false
  if (e.code === "23505") return true
  const texto = `${e.constraint ?? ""} ${e.message ?? ""}`
  return texto.includes("disciplinas_professor_nome_unico")
}

function paraResposta(d: DisciplinaLinha) {
  return { id: d.id, nome: d.nome, cor: d.cor, icone: d.icone, ordem: d.ordem }
}

export async function GET(req: NextRequest) {
  const sessao = await sessaoProfessor(req)
  if (!sessao) return naoAutenticado()
  const { usuario } = sessao

  const db = await banco()
  const disciplinas = (await db.disciplinas.findMany({
    where: {
      professorId: usuario.id,
    },
  })) as unknown as DisciplinaLinha[]
  disciplinas.sort((a, b) => a.ordem - b.ordem)
  const notas = await db.notas.findMany({ where: { professorId: usuario.id } })

  // Contagem por disciplina via mapa em memória.
  const contagem = new Map<string, number>()
  for (const n of notas) {
    if (n.disciplinaId) contagem.set(n.disciplinaId, (contagem.get(n.disciplinaId) ?? 0) + 1)
  }

  return json({
    disciplinas: disciplinas.map((d) => ({
      ...paraResposta(d),
      totalNotas: contagem.get(d.id) ?? 0,
    })),
  })
}

export async function POST(req: NextRequest) {
  const sessao = await sessaoProfessor(req)
  if (!sessao) return naoAutenticado()
  const { usuario } = sessao

  const corpo = await req.json().catch(() => null)
  const nome = typeof corpo?.nome === "string" ? corpo.nome.trim() : ""
  if (!nome) return erroApi("Informe o nome da disciplina.")

  const db = await banco()
  try {
    const disciplina = (await db.disciplinas.create({
      data: {
        professorId: usuario.id,
        nome,
        cor: typeof corpo?.cor === "string" ? corpo.cor : "verde",
        icone: typeof corpo?.icone === "string" ? corpo.icone : "BookOpen",
      },
    })) as unknown as DisciplinaLinha
    return json({ disciplina: paraResposta(disciplina) }, 201)
  } catch (erro) {
    if (ehConflito(erro)) return erroApi("Já existe uma disciplina com esse nome.")
    return erroApi("Falha ao criar a disciplina.")
  }
}
