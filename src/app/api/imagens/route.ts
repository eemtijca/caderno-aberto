// Upload, leitura e remoção de imagens do professor autenticado.

import { NextRequest, NextResponse } from "next/server"
import { sessaoProfessor, json, erroApi, naoAutenticado } from "@/lib/api/sessao"
import { caminhoDoProfessor, obterArmazenamento } from "@/lib/armazenamento"
import { imagemValida, mimePorExtensao } from "@/lib/armazenamento/provedor-disco"
import { gerarToken } from "@/lib/api/token"
import sharp from "sharp"

export const dynamic = "force-dynamic"

const MIMES = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"]
const MAX_BYTES = 6 * 1024 * 1024 // Limite de 6 MB por imagem.

export async function POST(req: NextRequest) {
  const sessao = await sessaoProfessor(req)
  if (!sessao) return naoAutenticado()
  const { usuario } = sessao

  const form = await req.formData().catch(() => null)
  const arquivo = form?.get("arquivo")
  if (!arquivo || typeof arquivo === "string") return erroApi("Arquivo inválido.")

  const mime = MIMES.includes(arquivo.type) ? arquivo.type : "image/png"
  const bytes = Buffer.from(await arquivo.arrayBuffer())
  if (bytes.length === 0) return erroApi("Imagem vazia.")
  if (bytes.length > MAX_BYTES) return erroApi("Imagem muito grande (máx. 6 MB).")
  if (!imagemValida(mime, bytes)) return erroApi("Arquivo inválido para o tipo.")

  const ext = mime.split("/")[1].replace("jpeg", "jpg").replace("svg+xml", "svg")
  // O nome aleatório evita colisões e adivinhação do caminho.
  const caminho = `${usuario.id}/${gerarToken(14)}.${ext}`

  try {
    await obterArmazenamento().salvar(caminho, bytes, mime)
  } catch {
    return erroApi("Falha no upload da imagem.")
  }

  return json({ caminho, url: `/api/imagens?path=${encodeURIComponent(caminho)}` }, 201)
}

export async function GET(req: NextRequest) {
  const sessao = await sessaoProfessor(req)
  if (!sessao) return naoAutenticado()
  const { usuario } = sessao

  const caminho = req.nextUrl.searchParams.get("path") ?? ""
  // Garante que o caminho pertence ao professor antes de servir.
  if (!caminhoDoProfessor(caminho, usuario.id)) {
    return erroApi("Caminho inválido.", 400)
  }

  const arquivo = await obterArmazenamento().ler(caminho)
  if (!arquivo) return erroApi("Imagem não encontrada.", 404)

  const ext = caminho.split(".").pop()?.toLowerCase() ?? "png"

  // Converte WebP e SVG para PNG quando pedido, útil para exportação.
  const converterPng =
    req.nextUrl.searchParams.get("png") === "1" && (ext === "webp" || ext === "svg")
  if (converterPng) {
    try {
      const png = await sharp(arquivo.bytes, { limitInputPixels: 25_000_000 }).png().toBuffer()
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

export async function DELETE(req: NextRequest) {
  const sessao = await sessaoProfessor(req)
  if (!sessao) return naoAutenticado()
  const { usuario } = sessao

  const caminho = req.nextUrl.searchParams.get("path") ?? ""
  // Só remove imagens do próprio professor.
  if (!caminhoDoProfessor(caminho, usuario.id)) {
    return erroApi("Caminho inválido.", 400)
  }

  await obterArmazenamento().remover(caminho)
  return json({ ok: true })
}
