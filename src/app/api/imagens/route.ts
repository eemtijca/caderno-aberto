import { NextRequest, NextResponse } from "next/server"
import { sessaoProfessor, json, erroApi, naoAutenticado } from "@/lib/api/sessao"
import { gerarToken } from "@/lib/api/token"
import sharp from "sharp"

export const dynamic = "force-dynamic"

const MIMES = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"]
const MAX_BYTES = 6 * 1024 * 1024 // 6 MB (igual ao bucket)

/**
 * POST /api/imagens . Upload de figura (multipart/form-data).
 * Salva em `imagens/<uid>/<token>.<ext>` (bucket privado, RLS por pasta).
 */
export async function POST(req: NextRequest) {
  const sessao = await sessaoProfessor()
  if (!sessao) return naoAutenticado()
  const { cliente, usuario } = sessao

  const form = await req.formData().catch(() => null)
  const arquivo = form?.get("arquivo")
  if (!arquivo || typeof arquivo === "string") return erroApi("Arquivo inválido.")

  const mime = MIMES.includes(arquivo.type) ? arquivo.type : "image/png"
  const bytes = Buffer.from(await arquivo.arrayBuffer())
  if (bytes.length === 0) return erroApi("Imagem vazia.")
  if (bytes.length > MAX_BYTES) return erroApi("Imagem muito grande (máx. 6 MB).")

  const ext = mime.split("/")[1].replace("jpeg", "jpg").replace("svg+xml", "svg")
  const caminho = `${usuario.id}/${gerarToken(14)}.${ext}`

  const { error } = await cliente.storage
    .from("imagens")
    .upload(caminho, bytes, { contentType: mime, upsert: false })
  if (error) return erroApi("Falha no upload da imagem.")

  return json({ caminho, url: `/api/imagens?path=${encodeURIComponent(caminho)}` }, 201)
}

/**
 * GET /api/imagens?path=<uid>/<arquivo>&png=1 . Serve a figura (RLS do storage).
 * `png=1` converte webp/svg para PNG — pdfLaTeX (arquivo .tex exportado)
 * só aceita png/jpg.
 */
export async function GET(req: NextRequest) {
  const sessao = await sessaoProfessor()
  if (!sessao) return naoAutenticado()
  const { cliente, usuario } = sessao

  const caminho = req.nextUrl.searchParams.get("path") ?? ""
  if (!caminho.startsWith(`${usuario.id}/`) || caminho.includes("..")) {
    return erroApi("Caminho inválido.", 400)
  }

  const { data: arquivo, error } = await cliente.storage.from("imagens").download(caminho)
  if (error || !arquivo) return erroApi("Imagem não encontrada.", 404)

  const ext = caminho.split(".").pop()?.toLowerCase() ?? "png"
  const MIMES_SAIDA: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
    gif: "image/gif",
    svg: "image/svg+xml",
  }

  const converterPng =
    req.nextUrl.searchParams.get("png") === "1" && (ext === "webp" || ext === "svg")
  if (converterPng) {
    try {
      const png = await sharp(Buffer.from(await arquivo.arrayBuffer()))
        .png()
        .toBuffer()
      return new NextResponse(png, {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "private, max-age=3600",
        },
      })
    } catch {
      return erroApi("Não foi possível converter a imagem para PNG.", 500)
    }
  }

  return new NextResponse(await arquivo.arrayBuffer(), {
    headers: {
      "Content-Type": MIMES_SAIDA[ext] ?? "application/octet-stream",
      "Cache-Control": "private, max-age=3600",
    },
  })
}

/** DELETE /api/imagens?path=<uid>/<arquivo> */
export async function DELETE(req: NextRequest) {
  const sessao = await sessaoProfessor()
  if (!sessao) return naoAutenticado()
  const { cliente, usuario } = sessao

  const caminho = req.nextUrl.searchParams.get("path") ?? ""
  if (!caminho.startsWith(`${usuario.id}/`) || caminho.includes("..")) {
    return erroApi("Caminho inválido.", 400)
  }

  const { error } = await cliente.storage.from("imagens").remove([caminho])
  if (error) return erroApi("Falha ao excluir a imagem.")
  return json({ ok: true })
}
