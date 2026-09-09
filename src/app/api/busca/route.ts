import { NextRequest } from "next/server"
import { banco } from "@/lib/banco"
import { sessaoProfessor, json } from "@/lib/api/sessao"
import { extrairTextoBlocos, normalizar } from "@/lib/notas/texto"
import type { Bloco } from "@/lib/notas/tipos"
import type { NotaLinha } from "@/lib/banco/tipos"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim()
  if (q.length < 2) return json({ resultados: [] })

  const sessao = await sessaoProfessor(req)
  if (!sessao) return json({ resultados: [] })
  const { usuario } = sessao

  const alvo = normalizar(q)
  // Busca textual já isolada por professor no banco.
  const like = alvo.replace(/[%_\\]/g, (c) => `\\${c}`)
  const db = banco()
  const linhas = (await db.notas.findMany({
    where: { professorId: usuario.id, busca: { contains: like } },
    orderBy: { atualizadoEm: "desc" },
    take: 40,
  })) as unknown as NotaLinha[]

  const resultados = linhas
    .map((linha) => {
      const blocos = (linha.blocos ?? []) as Bloco[]
      const campos: { campo: string; texto: string }[] = [
        { campo: "título", texto: linha.titulo },
        { campo: "resumo", texto: linha.sobre },
        { campo: "habilidades", texto: linha.habilidades },
        { campo: "conteúdo", texto: extrairTextoBlocos(blocos) },
      ]
      for (const { campo, texto } of campos) {
        const idx = normalizar(texto).indexOf(alvo)
        if (idx !== -1) {
          const inicio = Math.max(0, idx - 40)
          const trecho =
            (inicio > 0 ? "…" : "") +
            texto.slice(inicio, idx + q.length + 80).trim() +
            (idx + q.length + 80 < texto.length ? "…" : "")
          return {
            id: linha.id,
            titulo: linha.titulo,
            disciplina: linha.disciplinaNome,
            cor: linha.disciplinaCor,
            status: linha.status,
            anoLetivo: linha.anoLetivo,
            mes: linha.mes,
            turmas: linha.turmasNomes ?? [],
            campo,
            trecho,
          }
        }
      }
      return null
    })
    .filter(Boolean)

  return json({ resultados })
}
