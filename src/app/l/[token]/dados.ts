import "server-only"

// Dados mínimos para os metadados OpenGraph de /l/<token>. O mesmo RLS da
// vista pública decide o que é visível: links ativos + notas publicadas.

import { cache } from "react"
import { clienteAnon } from "@/lib/supabase/servidor"
import { DEMO_NOTA, DEMO_TOKEN } from "@/lib/notas/demo"

export interface ResumoNotaOg {
  titulo: string
  disciplinaNome: string
  disciplinaCor: string
  turmasNomes: string[]
  anoLetivo: number
  mes: number
  sobre: string
}

export interface DadosLinkOg {
  tipo: "nota" | "turma" | "disciplina"
  nome: string
  professorNome: string
  expiraEm: string | null
}

export interface DadosOg {
  link: DadosLinkOg
  nota: ResumoNotaOg | null
  totalNotas: number
}

/** Busca link + primeira nota (cacheado por requisição). Null se inválido. */
export const buscarDadosOg = cache(async (token: string): Promise<DadosOg | null> => {
  if (token === DEMO_TOKEN) {
    return {
      link: {
        tipo: "nota",
        nome: DEMO_NOTA.titulo,
        professorNome: "Equipe Caderno Aberto",
        expiraEm: null,
      },
      nota: {
        titulo: DEMO_NOTA.titulo,
        disciplinaNome: DEMO_NOTA.disciplina?.nome ?? "",
        disciplinaCor: DEMO_NOTA.disciplina?.cor ?? "ciano",
        turmasNomes: DEMO_NOTA.turmas.map((t) => t.nome),
        anoLetivo: DEMO_NOTA.anoLetivo,
        mes: DEMO_NOTA.mes,
        sobre: DEMO_NOTA.sobre,
      },
      totalNotas: 1,
    }
  }

  const cliente = clienteAnon()
  const { data: link } = await cliente
    .from("links")
    .select("tipo, nota_id, turma_id, disciplina_id, professor_nome, nome, expira_em")
    .eq("token", token)
    .maybeSingle()
  if (!link) return null

  let consulta = cliente
    .from("notas")
    .select("titulo, disciplina_nome, disciplina_cor, turmas_nomes, ano_letivo, mes, sobre")
  if (link.tipo === "nota") {
    consulta = consulta.eq("id", link.nota_id as string)
  } else if (link.tipo === "turma") {
    consulta = consulta.contains("turmas_ids", [link.turma_id as string])
  } else {
    consulta = consulta.eq("disciplina_id", link.disciplina_id as string)
  }
  const { data: notas } = await consulta
    .order("ano_letivo", { ascending: true })
    .order("mes", { ascending: true })
    .limit(1)

  const primeira = (notas ?? [])[0] ?? null
  return {
    link: {
      tipo: link.tipo,
      nome: link.nome,
      professorNome: link.professor_nome,
      expiraEm: link.expira_em,
    },
    nota: primeira
      ? {
          titulo: primeira.titulo,
          disciplinaNome: primeira.disciplina_nome,
          disciplinaCor: primeira.disciplina_cor,
          turmasNomes: primeira.turmas_nomes ?? [],
          anoLetivo: primeira.ano_letivo,
          mes: primeira.mes,
          sobre: primeira.sobre,
        }
      : null,
    totalNotas: notas?.length ?? 0,
  }
})
