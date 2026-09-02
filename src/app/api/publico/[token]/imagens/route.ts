import { NextRequest, NextResponse } from "next/server"
import { clienteAnon } from "@/lib/supabase/servidor"
import { clienteAdmin } from "@/lib/supabase/admin"
import { erroApi } from "@/lib/api/sessao"

export const dynamic = "force-dynamic"

type Ctx = { params: Promise<{ token: string }> }

const MIMES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
}

// GET /api/publico/[token]/imagens?caminho=<uid>/<arquivo>
// Serve figuras das notas públicas SEM expor o bucket: valida o
// link (ativo/não expirado via RLS), confere que a imagem
// pertence ao professor do link E que o caminho está referenciado
// nos blocos de uma nota alcançável por esse link.
export async function GET(req: NextRequest, ctx: Ctx) {
  const { token } = await ctx.params
  const caminho = req.nextUrl.searchParams.get("caminho") ?? ""

  if (!caminho.includes("/") || caminho.includes("..")) {
    return erroApi("Caminho inválido.", 400)
  }

  const anon = clienteAnon()
  const { data: link } = await anon
    .from("links")
    .select("id, tipo, nota_id, turma_id, disciplina_id, professor_id")
    .eq("token", token)
    .maybeSingle()
  if (!link) return erroApi("Link indisponível.", 404)

  // a pasta do objeto precisa ser a do professor dono do link
  if (!caminho.startsWith(`${link.professor_id}/`)) {
    return erroApi("Link indisponível.", 404)
  }

  // o caminho precisa estar referenciado em uma nota alcançável pelo link
  let consulta = anon.from("notas").select("blocos")
  if (link.tipo === "nota") consulta = consulta.eq("id", link.nota_id as string)
  else if (link.tipo === "turma")
    consulta = consulta.contains("turmas_ids", [link.turma_id as string])
  else consulta = consulta.eq("disciplina_id", link.disciplina_id as string)

  const { data: linhas } = await consulta
  const referenciado = (linhas ?? []).some((linha) =>
    JSON.stringify(linha.blocos ?? []).includes(caminho),
  )
  if (!referenciado) return erroApi("Link indisponível.", 404)

  const { data: arquivo, error } = await clienteAdmin().storage.from("imagens").download(caminho)
  if (error || !arquivo) return erroApi("Imagem não encontrada.", 404)

  const ext = caminho.split(".").pop()?.toLowerCase() ?? "png"
  const bytes = await arquivo.arrayBuffer()

  return new NextResponse(bytes, {
    headers: {
      "Content-Type": MIMES[ext] ?? "application/octet-stream",
      "Cache-Control": "private, max-age=3600",
    },
  })
}
