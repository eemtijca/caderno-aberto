import { NextRequest, NextResponse } from "next/server"
import { resolverLinkPublico } from "@/lib/api/publico"
import { caminhoDoProfessor, obterArmazenamento } from "@/lib/armazenamento"
import { mimePorExtensao } from "@/lib/armazenamento/provedor-disco"
import { erroApi } from "@/lib/api/sessao"
import type { NotaLinha } from "@/lib/banco/tipos"

export const dynamic = "force-dynamic"

type Ctx = { params: Promise<{ token: string }> }

/** Caminhos de figura citados nos blocos (igualdade exata). */
function caminhosReferenciados(notas: NotaLinha[]): Set<string> {
  const saidos = new Set<string>()
  const visita = (blocos: unknown): void => {
    if (!Array.isArray(blocos)) return
    for (const b of blocos as { tipo?: unknown; url?: unknown; filhos?: unknown }[]) {
      if (b?.tipo === "figura" && typeof b.url === "string") {
        const prefixo = "/api/imagens?path="
        saidos.add(
          b.url.startsWith(prefixo) ? decodeURIComponent(b.url.slice(prefixo.length)) : b.url,
        )
      }
      if (Array.isArray(b?.filhos)) visita(b.filhos)
    }
  }
  for (const n of notas) visita(n.blocos)
  return saidos
}

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

  const referenciado = caminhosReferenciados(notas).has(caminho)
  if (!referenciado) return erroApi("Link indisponível.", 404)

  const arquivo = await obterArmazenamento().ler(caminho)
  if (!arquivo) return erroApi("Imagem não encontrada.", 404)

  const ext = caminho.split(".").pop()?.toLowerCase() ?? ""
  return new NextResponse(new Uint8Array(arquivo.bytes), {
    headers: {
      "Content-Type": mimePorExtensao(caminho),
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
      // SVG abre isolado mesmo em navegação direta.
      ...(ext === "svg" ? { "Content-Security-Policy": "sandbox" } : {}),
    },
  })
}
