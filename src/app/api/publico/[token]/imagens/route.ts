import { NextRequest, NextResponse } from "next/server"
import { resolverLinkPublico } from "@/lib/api/publico"
import { caminhoDoProfessor, obterArmazenamento } from "@/lib/armazenamento"
import { mimePorExtensao } from "@/lib/armazenamento/provedor-disco"
import { erroApi } from "@/lib/api/sessao"

export const dynamic = "force-dynamic"

type Ctx = { params: Promise<{ token: string }> }

// Serve imagem referenciada pelos blocos do link.
export async function GET(req: NextRequest, ctx: Ctx) {
  const { token } = await ctx.params
  const caminho = req.nextUrl.searchParams.get("caminho") ?? ""

  if (!caminho.includes("/") || caminho.includes("..")) {
    return erroApi("Caminho inválido.", 400)
  }

  const resolvido = await resolverLinkPublico(token)
  if (!resolvido) return erroApi("Link indisponível.", 404)
  const { link, notas } = resolvido

  if (!caminhoDoProfessor(caminho, link.professorId)) {
    return erroApi("Link indisponível.", 404)
  }

  const referenciado = notas.some((nota) => JSON.stringify(nota.blocos ?? []).includes(caminho))
  if (!referenciado) return erroApi("Link indisponível.", 404)

  const arquivo = await obterArmazenamento().ler(caminho)
  if (!arquivo) return erroApi("Imagem não encontrada.", 404)

  return new NextResponse(new Uint8Array(arquivo.bytes), {
    headers: {
      "Content-Type": mimePorExtensao(caminho),
      "Cache-Control": "private, max-age=3600",
    },
  })
}
