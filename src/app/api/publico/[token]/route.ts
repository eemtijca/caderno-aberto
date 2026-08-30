import { NextRequest } from "next/server"
import { clienteAnon } from "@/lib/supabase/servidor"
import { json, erroApi } from "@/lib/api/sessao"
import type { Bloco } from "@/lib/notas/tipos"
import { normalizarBlocos } from "@/lib/notas/tipos"
import { DEMO_NOTA, DEMO_TOKEN } from "@/lib/notas/demo"

export const dynamic = "force-dynamic"

type Ctx = { params: Promise<{ token: string }> }

/** Colunas mínimas que a vista pública precisa (RLS anon decide as linhas). */
const COLUNAS =
  "id, titulo, disciplina_nome, disciplina_cor, turmas_nomes, ano_letivo, mes, sobre, habilidades, blocos, atualizado_em"

export interface NotaPublica {
  id: string
  titulo: string
  disciplinaNome: string
  disciplinaCor: string
  turmasNomes: string[]
  anoLetivo: number
  mes: number
  sobre: string
  habilidades: string
  blocos: Bloco[]
  atualizadoEm: string
}

/**
 * GET /api/publico/[token] . Vista do aluno.
 * Sem login: o RLS só devolve links ativos/não expirados e notas
 * PUBLICADAS alcançáveis pelo link (nota própria, turma ou
 * disciplina).
 */
export async function GET(_req: NextRequest, ctx: Ctx) {
  const { token } = await ctx.params
  if (token === DEMO_TOKEN) {
    const nota = DEMO_NOTA
    const notas: NotaPublica[] = [
      {
        id: nota.id,
        titulo: nota.titulo,
        disciplinaNome: nota.disciplina?.nome ?? "",
        disciplinaCor: nota.disciplina?.cor ?? "ciano",
        turmasNomes: nota.turmas.map((t) => t.nome),
        anoLetivo: nota.anoLetivo,
        mes: nota.mes,
        sobre: nota.sobre,
        habilidades: nota.habilidades,
        blocos: nota.blocos,
        atualizadoEm: nota.atualizadoEm,
      },
    ]
    return json({
      link: {
        tipo: "nota" as const,
        nome: nota.titulo,
        professorNome: "Equipe Caderno Aberto",
        expiraEm: null,
      },
      notas,
    })
  }
  const cliente = clienteAnon()

  const { data: link } = await cliente
    .from("links")
    .select("id, tipo, nota_id, turma_id, disciplina_id, professor_nome, nome, expira_em")
    .eq("token", token)
    .maybeSingle()

  if (!link) {
    return erroApi("Este link não existe, foi revogado ou expirou.", 404)
  }

  // contador de acessos (função pública; falha não bloqueia a leitura)
  try {
    await cliente.rpc("registrar_acesso", { p_token: token })
  } catch {
    // ignora
  }

  let consulta = cliente.from("notas").select(COLUNAS)
  if (link.tipo === "nota") {
    consulta = consulta.eq("id", link.nota_id as string)
  } else if (link.tipo === "turma") {
    consulta = consulta.contains("turmas_ids", [link.turma_id as string])
  } else {
    consulta = consulta.eq("disciplina_id", link.disciplina_id as string)
  }
  consulta = consulta
    .order("ano_letivo", { ascending: true })
    .order("mes", { ascending: true })
    .order("atualizado_em", { ascending: true })

  const { data: linhas } = await consulta

  // link de nota apontando p/ rascunho → para o aluno é 404
  if (link.tipo === "nota" && (!linhas || linhas.length === 0)) {
    return erroApi("Este link não existe, foi revogado ou expirou.", 404)
  }

  const notas: NotaPublica[] = (linhas ?? []).map((linha) => ({
    id: linha.id,
    titulo: linha.titulo,
    disciplinaNome: linha.disciplina_nome,
    disciplinaCor: linha.disciplina_cor,
    turmasNomes: linha.turmas_nomes ?? [],
    anoLetivo: linha.ano_letivo,
    mes: linha.mes,
    sobre: linha.sobre,
    habilidades: linha.habilidades,
    blocos: reescreverImagens(normalizarBlocos(linha.blocos) as Bloco[], token),
    atualizadoEm: linha.atualizado_em,
  }))

  return json({
    link: {
      tipo: link.tipo,
      nome: link.nome,
      professorNome: link.professor_nome,
      expiraEm: link.expira_em,
    },
    notas,
  })
}

/** URLs internas de imagem viram o endpoint público do token. */
function reescreverImagens(blocos: Bloco[], token: string): Bloco[] {
  const visita = (lista: Bloco[]): Bloco[] =>
    lista.map((b) => {
      if (b.tipo === "figura") {
        return {
          ...b,
          url: urlImagemPublica(b.url, token),
        }
      }
      if (b.tipo === "copiar" || b.tipo === "exemplo" || b.tipo === "dica") {
        return { ...b, filhos: b.filhos.map((f) => f) }
      }
      return b
    })
  return visita(blocos)
}

export function urlImagemPublica(url: string, token: string): string {
  // imagens do app: /api/imagens?path=<caminho>
  if (url.startsWith("/api/imagens?path=")) {
    const caminho = decodeURIComponent(url.slice("/api/imagens?path=".length))
    return `/api/publico/${encodeURIComponent(token)}/imagens?caminho=${encodeURIComponent(caminho)}`
  }
  return url
}
