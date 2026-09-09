// Armazenamento em disco sob UPLOAD_DIR. O caminho relativo é a chave.
import { mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises"
import path from "node:path"
import { UPLOAD_DIR } from "@/lib/ambiente"
import type { ArquivoGuardado, ProvedorArmazenamento } from "./tipos"

const MIMES_POR_EXT: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
}

function absoluto(caminho: string): string {
  // Contém o caminho dentro do diretório base.
  const normalizado = path.posix.normalize(caminho).replace(/^(\.\.(\/|\\|$))+/, "")
  return path.join(UPLOAD_DIR, normalizado)
}

/** Extensões de imagem aceitas no upload e no backup. */
export const EXTENSOES_IMAGEM = ["png", "jpg", "jpeg", "webp", "gif", "svg"]

function comecaCom(bytes: Buffer, cabeca: number[]): boolean {
  return cabeca.every((b, i) => bytes[i] === b)
}

/** Confere os bytes contra o tipo declarado; SVG sem scripts. */
export function imagemValida(mime: string, bytes: Buffer): boolean {
  if (mime === "image/png") return comecaCom(bytes, [0x89, 0x50, 0x4e, 0x47])
  if (mime === "image/jpeg") return comecaCom(bytes, [0xff, 0xd8, 0xff])
  if (mime === "image/gif") {
    const marca = bytes.subarray(0, 6).toString("ascii")
    return marca === "GIF87a" || marca === "GIF89a"
  }
  if (mime === "image/webp") {
    return (
      bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
      bytes.subarray(8, 12).toString("ascii") === "WEBP"
    )
  }
  const texto = bytes.subarray(0, 4096).toString("utf8").trimStart().toLowerCase()
  if (!(texto.startsWith("<svg") || texto.startsWith("<?xml"))) return false
  const inteiro = bytes.toString("utf8").toLowerCase()
  return !inteiro.includes("<script") && !/on\w+\s*=/.test(inteiro)
}

/** MIME pela extensão; desconhecidas viram octet-stream. */
export function mimePorExtensao(caminho: string): string {
  const ext = caminho.split(".").pop()?.toLowerCase() ?? ""
  return MIMES_POR_EXT[ext] ?? "application/octet-stream"
}

export function provedorDisco(): ProvedorArmazenamento {
  return {
    nome: "disk",
    async salvar(caminho, bytes, _mime) {
      const destino = absoluto(caminho)
      await mkdir(path.dirname(destino), { recursive: true })
      await writeFile(destino, bytes)
    },
    async ler(caminho): Promise<ArquivoGuardado | null> {
      try {
        const destino = absoluto(caminho)
        const info = await stat(destino)
        if (!info.isFile()) return null
        const bytes = await readFile(destino)
        return { bytes, mime: mimePorExtensao(caminho) }
      } catch {
        return null
      }
    },
    async remover(caminho) {
      await rm(absoluto(caminho), { force: true })
    },
    async listar(prefixo) {
      try {
        const pasta = absoluto(prefixo)
        const nomes = await readdir(pasta)
        const saida: { caminho: string; mime: string }[] = []
        for (const nome of nomes) {
          const info = await stat(path.join(pasta, nome)).catch(() => null)
          if (info?.isFile()) {
            saida.push({ caminho: `${prefixo}/${nome}`, mime: mimePorExtensao(nome) })
          }
        }
        return saida
      } catch {
        return []
      }
    },
  }
}
