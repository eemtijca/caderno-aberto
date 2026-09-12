import { NextRequest } from "next/server"
import { banco } from "@/lib/banco"
import { sessaoProfessor, json, erroApi, naoAutenticado } from "@/lib/api/sessao"
import { linhaParaNota, mapaTurmasProfessor, paraJson } from "@/lib/api/serializacao"
import type { DisciplinaLinha, NotaLinha } from "@/lib/banco/tipos"

export const dynamic = "force-dynamic"

type Ctx = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, ctx: Ctx) {
  const sessao = await sessaoProfessor(req)
  if (!sessao) return naoAutenticado()
  const { usuario } = sessao
  const { id } = await ctx.params

  const db = await banco()
  const original = (await db.notas.findFirst({
    where: {
      id,
      professorId: usuario.id,
    },
  })) as unknown as NotaLinha | null
  if (!original) return erroApi("Nota não encontrada.", 404)

  const disciplina = original.disciplinaId
    ? ((await db.disciplinas.findFirst({
        where: {
          id: original.disciplinaId,
        },
      })) as unknown as DisciplinaLinha | null)
    : null

  const linha = (await db.notas.create({
    data: {
      professorId: original.professorId,
      titulo: `${original.titulo} (cópia)`,
      disciplinaId: original.disciplinaId,
      disciplinaNome: original.disciplinaNome,
      disciplinaCor: original.disciplinaCor,
      turmasIds: [...original.turmasIds],
      turmasNomes: [...original.turmasNomes],
      anoLetivo: original.anoLetivo,
      mes: original.mes,
      sobre: original.sobre,
      habilidades: original.habilidades,
      status: "rascunho",
      blocos: paraJson(original.blocos),
      aparencia: paraJson(original.aparencia ?? {}),
      busca: original.busca,
    },
  })) as unknown as NotaLinha

  if (!linha) return erroApi("Falha ao duplicar a nota.")

  const mapaTurmas = await mapaTurmasProfessor(original.professorId)
  return json({ nota: linhaParaNota({ ...linha, disciplina }, mapaTurmas) }, 201)
}
