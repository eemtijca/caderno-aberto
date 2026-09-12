import { NextRequest } from "next/server"
import { json, erroApi } from "@/lib/api/sessao"
import { registrarAcesso, resolverLinkPublico } from "@/lib/api/publico"
import type { AparenciaNota, Bloco } from "@/lib/notas/tipos"
import { normalizarAparencia, normalizarBlocos } from "@/lib/notas/tipos"
import { DEMO_NOTA, DEMO_TOKEN } from "@/lib/notas/demo"

export const dynamic = "force-dynamic"

type Ctx = { params: Promise<{ token: string }> }

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
  aparencia: AparenciaNota
  atualizadoEm: string
}

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
        aparencia: normalizarAparencia(nota.aparencia),
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

  const resolvido = await resolverLinkPublico(token)
  if (!resolvido || (resolvido.link.tipo === "nota" && resolvido.notas.length === 0)) {
    return erroApi("Este link não existe, foi revogado ou expirou.", 404)
  }
  const { link, notas: linhas } = resolvido

  // Contador de acessos tolerante a falhas.
  await registrarAcesso(link.id, link.acessos)

  const notas: NotaPublica[] = linhas.map((linha) => ({
    id: linha.id,
    titulo: linha.titulo,
    disciplinaNome: linha.disciplinaNome,
    disciplinaCor: linha.disciplinaCor,
    turmasNomes: linha.turmasNomes ?? [],
    anoLetivo: linha.anoLetivo,
    mes: linha.mes,
    sobre: linha.sobre,
    habilidades: linha.habilidades,
    blocos: reescreverImagens(normalizarBlocos(linha.blocos) as Bloco[], token),
    aparencia: normalizarAparencia(linha.aparencia),
    atualizadoEm: linha.atualizadoEm.toISOString(),
  }))

  return json({
    link: {
      tipo: link.tipo,
      nome: link.nome,
      professorNome: link.professorNome,
      expiraEm: link.expiraEm?.toISOString() ?? null,
    },
    notas,
  })
}

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

/** Reescreve URL interna de imagem para o caminho público do link. */
export function urlImagemPublica(url: string, token: string): string {
  if (url.startsWith("/api/imagens?path=")) {
    const caminho = decodeURIComponent(url.slice("/api/imagens?path=".length))
    return `/api/publico/${encodeURIComponent(token)}/imagens?caminho=${encodeURIComponent(caminho)}`
  }
  return url
}
