import "server-only"

// Conteúdo da visão pública para metadados.

import { cache } from "react"
import { resolverLinkPublico } from "@/lib/api/publico"
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

  const resolvido = await resolverLinkPublico(token)
  if (!resolvido) return null
  const { link, notas } = resolvido
  const primeira = notas[0] ?? null
  return {
    link: {
      tipo: link.tipo,
      nome: link.nome,
      professorNome: link.professorNome,
      expiraEm: link.expiraEm?.toISOString() ?? null,
    },
    nota: primeira
      ? {
          titulo: primeira.titulo,
          disciplinaNome: primeira.disciplinaNome,
          disciplinaCor: primeira.disciplinaCor,
          turmasNomes: primeira.turmasNomes ?? [],
          anoLetivo: primeira.anoLetivo,
          mes: primeira.mes,
          sobre: primeira.sobre,
        }
      : null,
    totalNotas: notas.length,
  }
})
