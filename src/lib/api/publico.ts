// Regras de visibilidade de links públicos.
import "server-only"

import { banco } from "@/lib/banco"
import type { LinkLinha, NotaLinha } from "@/lib/banco/tipos"

export interface LinkPublico {
  link: LinkLinha
  notas: NotaLinha[]
}

/** Indica exclusão pendente para ocultar da vista pública. */
async function professorExcluido(professorId: string): Promise<boolean> {
  const db = await banco()
  const perfil = await db.orm.public.Profiles.where({ id: professorId }).first()
  return Boolean(perfil?.exclusaoSolicitadaEm)
}

/** Incrementa o contador de acessos sem falhar a leitura. */
export async function registrarAcesso(linkId: string, acessos: number): Promise<void> {
  const db = await banco()
  await db.orm.public.Links.where({ id: linkId })
    .update({ acessos: acessos + 1 })
    .catch(() => undefined)
}

/** Resolve o token no link + notas visíveis. Null = indisponível. */
export async function resolverLinkPublico(token: string): Promise<LinkPublico | null> {
  if (!token || token.length > 120) return null
  const db = await banco()
  const link = (await db.orm.public.Links.where({ token }).first()) as unknown as LinkLinha | null
  if (!link || !link.ativo) return null
  if (link.expiraEm && new Date(link.expiraEm) < new Date()) return null
  if (await professorExcluido(link.professorId)) return null

  const todas = (await db.orm.public.Notas.where({
    professorId: link.professorId,
  }).all()) as unknown as NotaLinha[]

  let notas = todas.filter((n) => {
    if (n.status !== "publicada") return false
    if (link.tipo === "nota") return n.id === link.notaId
    if (link.tipo === "turma") return link.turmaId !== null && n.turmasIds.includes(link.turmaId)
    return link.disciplinaId !== null && n.disciplinaId === link.disciplinaId
  })

  notas = notas.sort((a, b) => {
    if (a.anoLetivo !== b.anoLetivo) return a.anoLetivo - b.anoLetivo
    if (a.mes !== b.mes) return a.mes - b.mes
    return a.criadoEm < b.criadoEm ? -1 : 1
  })

  return { link, notas }
}

/** Confere se a imagem aparece nos blocos alcançáveis pelo link. */
export async function imagemAlunosAlcança(link: LinkLinha, caminho: string): Promise<boolean> {
  const resolvido = await resolverLinkPublico(link.token)
  if (!resolvido) return false
  return resolvido.notas.some((n) => JSON.stringify(n.blocos ?? []).includes(caminho))
}
