import { NextRequest } from "next/server"
import { sessaoProfessor, json } from "@/lib/api/sessao"
import { extrairTextoBlocos, normalizar } from "@/lib/notas/texto"
import type { Bloco } from "@/lib/notas/tipos"

export const dynamic = "force-dynamic"

/** GET /api/busca?q=... . Busca global (sem acento) com trechos */
export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim()
  if (q.length < 2) return json({ resultados: [] })

  const sessao = await sessaoProfessor()
  if (!sessao) return json({ resultados: [] })
  const { cliente, usuario } = sessao

  const alvo = normalizar(q)
  const { data: linhas } = await cliente
    .from("notas")
    .select(
      "id, titulo, sobre, habilidades, status, ano_letivo, mes, blocos, turmas_nomes, disciplina_nome, disciplina_cor, atualizado_em",
    )
    .eq("professor_id", usuario.id)
    .ilike("busca", `%${alvo}%`)
    .order("atualizado_em", { ascending: false })
    .limit(40)

  const resultados = (linhas ?? [])
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
            disciplina: linha.disciplina_nome,
            cor: linha.disciplina_cor,
            status: linha.status,
            anoLetivo: linha.ano_letivo,
            mes: linha.mes,
            turmas: linha.turmas_nomes ?? [],
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
