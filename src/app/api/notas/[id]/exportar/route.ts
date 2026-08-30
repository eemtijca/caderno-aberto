import { NextRequest, NextResponse } from "next/server"
import { sessaoProfessor, erroApi, naoAutenticado } from "@/lib/api/sessao"
import { linhaParaNota, mapaTurmasProfessor } from "@/lib/api/serializacao"
import { gerarTex } from "@/lib/notas/render-latex"
import { gerarMarkdown } from "@/lib/notas/render-markdown"

export const dynamic = "force-dynamic"

type Ctx = { params: Promise<{ id: string }> }

/** GET /api/notas/[id]/exportar?formato=tex|md|json */
export async function GET(req: NextRequest, ctx: Ctx) {
  const sessao = await sessaoProfessor()
  if (!sessao) return naoAutenticado()
  const { cliente, perfil } = sessao
  const { id } = await ctx.params
  const formato = (req.nextUrl.searchParams.get("formato") ?? "json").toLowerCase()

  const { data: linha } = await cliente
    .from("notas")
    .select("*, disciplina:disciplinas(*)")
    .eq("id", id)
    .maybeSingle()
  if (!linha) return erroApi("Nota não encontrada.", 404)

  const mapaTurmas = await mapaTurmasProfessor(cliente, linha.professor_id)
  const nota = linhaParaNota(linha, mapaTurmas)
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
