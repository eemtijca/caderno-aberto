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
