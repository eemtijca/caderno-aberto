import { NextRequest, NextResponse } from "next/server"
import { banco } from "@/lib/banco"
import { sessaoProfessor, erroApi, naoAutenticado } from "@/lib/api/sessao"
import { linhaParaNota, mapaTurmasProfessor } from "@/lib/api/serializacao"
import type { DisciplinaLinha, NotaLinha } from "@/lib/banco/tipos"
import { gerarTex } from "@/lib/notas/render-latex"
import { gerarMarkdown } from "@/lib/notas/render-markdown"

export const dynamic = "force-dynamic"

type Ctx = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, ctx: Ctx) {
  const sessao = await sessaoProfessor(req)
  if (!sessao) return naoAutenticado()
  const { usuario, perfil } = sessao
  const { id } = await ctx.params
  const formato = (req.nextUrl.searchParams.get("formato") ?? "json").toLowerCase()

  const db = await banco()
  const linha = (await db.notas.findFirst({
    where: {
      id,
      professorId: usuario.id,
    },
  })) as unknown as NotaLinha | null
  if (!linha) return erroApi("Nota não encontrada.", 404)

  const disciplina = linha.disciplinaId
    ? ((await db.disciplinas.findFirst({
        where: {
          id: linha.disciplinaId,
        },
      })) as unknown as DisciplinaLinha | null)
    : null
  const mapaTurmas = await mapaTurmasProfessor(linha.professorId)
  const nota = linhaParaNota({ ...linha, disciplina }, mapaTurmas)
  const professor = perfil?.nome ?? ""

  if (formato === "tex") {
    const tex = gerarTex(nota, professor)
    return new NextResponse(tex, {
      headers: {
        "Content-Type": "application/x-tex; charset=utf-8",
        "Content-Disposition": `attachment; filename="${nota.slug}.tex"`,
        "Cache-Control": "private, no-store",
      },
    })
  }

  if (formato === "md") {
    const md = gerarMarkdown(nota)
    return new NextResponse(md, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${nota.slug}.md"`,
        "Cache-Control": "private, no-store",
      },
    })
  }

  return new NextResponse(JSON.stringify({ nota }, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nota.slug}.json"`,
      "Cache-Control": "private, no-store",
    },
  })
}
