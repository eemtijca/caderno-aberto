"use client"

// Cliente de API + hooks TanStack Query (rotas /api do app. Sessão via cookies do Supabase)

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { AparenciaNota, Bloco, DisciplinaInfo, NotaDados, TurmaInfo } from "./tipos"

async function pedir<T>(url: string, init?: RequestInit): Promise<T> {
  let r: Response
  try {
    r = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
      cache: "no-store",
    })
  } catch {
    // falha de rede (offline, DNS, timeout) não devolve JSON
    throw new Error("Não foi possível falar com o servidor. Verifique sua conexão.")
  }
  if (!r.ok) {
    const corpo = await r.json().catch(() => null)
    throw new Error(corpo?.erro ?? `Erro ${r.status}`)
  }
  return r.json() as Promise<T>
}

export interface DisciplinaLista extends DisciplinaInfo {
  totalNotas: number
}

export function useDisciplinas() {
  return useQuery({
    queryKey: ["disciplinas"],
    queryFn: () => pedir<{ disciplinas: DisciplinaLista[] }>("/api/disciplinas"),
    select: (d) => d.disciplinas,
  })
}

export function useCriarDisciplina() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dados: { nome: string; cor: string; icone: string }) =>
      pedir<{ disciplina: DisciplinaInfo }>("/api/disciplinas", {
        method: "POST",
        body: JSON.stringify(dados),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["disciplinas"] }),
  })
}

export function useEditarDisciplina() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      dados,
    }: {
      id: string
      dados: Partial<{ nome: string; cor: string; icone: string }>
    }) =>
      pedir<{ disciplina: DisciplinaInfo }>(`/api/disciplinas/${id}`, {
        method: "PUT",
        body: JSON.stringify(dados),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["disciplinas"] })
      qc.invalidateQueries({ queryKey: ["notas"] })
    },
  })
}

export function useExcluirDisciplina() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      pedir<{ ok: boolean }>(`/api/disciplinas/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["disciplinas"] })
      qc.invalidateQueries({ queryKey: ["notas"] })
    },
  })
}

export interface TurmaLista extends TurmaInfo {
  totalNotas: number
}

export function useTurmas(ano?: number) {
  return useQuery({
    queryKey: ["turmas", ano ?? "todas"],
    queryFn: () => pedir<{ turmas: TurmaLista[] }>(`/api/turmas${ano ? `?ano=${ano}` : ""}`),
    select: (t) => t.turmas,
  })
}

export function useCriarTurma() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dados: { nome: string; serie: string; anoLetivo: number }) =>
      pedir<{ turma: TurmaInfo }>("/api/turmas", {
        method: "POST",
        body: JSON.stringify(dados),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["turmas"] }),
  })
}

export function useEditarTurma() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      dados,
    }: {
      id: string
      dados: Partial<{ nome: string; serie: string; anoLetivo: number }>
    }) =>
      pedir<{ turma: TurmaInfo }>(`/api/turmas/${id}`, {
        method: "PUT",
        body: JSON.stringify(dados),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["turmas"] })
      qc.invalidateQueries({ queryKey: ["notas"] })
    },
  })
}

export function useExcluirTurma() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => pedir<{ ok: boolean }>(`/api/turmas/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["turmas"] })
      qc.invalidateQueries({ queryKey: ["notas"] })
    },
  })
}

export interface FiltrosNotas {
  q?: string
  disciplina?: string
  ano?: number
  mes?: number
  turma?: string
  status?: string
}

export function useNotas(filtros: FiltrosNotas = {}) {
  const sp = new URLSearchParams()
  if (filtros.q) sp.set("q", filtros.q)
  if (filtros.disciplina) sp.set("disciplina", filtros.disciplina)
  if (filtros.ano) sp.set("ano", String(filtros.ano))
  if (filtros.mes) sp.set("mes", String(filtros.mes))
  if (filtros.turma) sp.set("turma", filtros.turma)
  if (filtros.status) sp.set("status", filtros.status)
  const qs = sp.toString()
  return useQuery({
    queryKey: ["notas", qs],
    queryFn: () => pedir<{ notas: NotaDados[] }>(`/api/notas${qs ? `?${qs}` : ""}`),
    select: (d) => d.notas,
  })
}

export function useNota(id: string | undefined) {
  return useQuery({
    queryKey: ["nota", id],
    queryFn: () => pedir<{ nota: NotaDados }>(`/api/notas/${id}`),
    enabled: Boolean(id),
    select: (d) => d.nota,
  })
}

export interface DadosCriarNota {
  titulo: string
  disciplinaId: string
  anoLetivo: number
  mes: number
  turmasIds: string[]
  sobre?: string
  habilidades?: string
  comModelo?: boolean
}

export function useCriarNota() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dados: DadosCriarNota) =>
      pedir<{ nota: NotaDados }>("/api/notas", {
        method: "POST",
        body: JSON.stringify(dados),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notas"] })
      qc.invalidateQueries({ queryKey: ["disciplinas"] })
      qc.invalidateQueries({ queryKey: ["turmas"] })
    },
  })
}

export interface DadosSalvarNota {
  titulo?: string
  disciplinaId?: string
  anoLetivo?: number
  mes?: number
  sobre?: string
  habilidades?: string
  status?: "rascunho" | "publicada"
  blocos?: Bloco[]
  turmasIds?: string[]
  aparencia?: AparenciaNota
}

export function useSalvarNota(id: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dados: DadosSalvarNota) =>
      pedir<{ nota: NotaDados }>(`/api/notas/${id}`, {
        method: "PUT",
        body: JSON.stringify(dados),
      }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["nota", id] })
      qc.invalidateQueries({ queryKey: ["notas"] })
      qc.invalidateQueries({ queryKey: ["disciplinas"] })
      qc.invalidateQueries({ queryKey: ["turmas"] })
    },
  })
}

export function useExcluirNota() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => pedir<{ ok: boolean }>(`/api/notas/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notas"] })
      qc.invalidateQueries({ queryKey: ["disciplinas"] })
      qc.invalidateQueries({ queryKey: ["turmas"] })
    },
  })
}

export function useDuplicarNota() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      pedir<{ nota: NotaDados }>(`/api/notas/${id}/duplicar`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notas"] }),
  })
}

export interface ResultadoBusca {
  id: string
  titulo: string
  disciplina: string
  cor: string
  status: string
  anoLetivo: number
  mes: number
  turmas: string[]
  campo: string
  trecho: string
}

export function useBusca(q: string) {
  return useQuery({
    queryKey: ["busca", q],
    queryFn: () => pedir<{ resultados: ResultadoBusca[] }>(`/api/busca?q=${encodeURIComponent(q)}`),
    enabled: q.trim().length >= 2,
    select: (d) => d.resultados,
  })
}

export type TipoLink = "nota" | "turma" | "disciplina"

export interface LinkInfo {
  id: string
  tipo: TipoLink
  token: string
  nome: string
  alvo: string
  alvoDetalhe: string
  notaId: string | null
  turmaId: string | null
  disciplinaId: string | null
  ativo: boolean
  expiraEm: string | null
  acessos: number
  criadoEm: string
}

export function urlDoLink(token: string): string {
  // caminho real (sem #): crawlers leem as meta tags do OpenGraph em
  // /l/<token>; a página redireciona para a vista hash existente
  return typeof window !== "undefined" ? `${window.location.origin}/l/${token}` : `/l/${token}`
}

export function useLinks() {
  return useQuery({
    queryKey: ["links"],
    queryFn: () => pedir<{ links: LinkInfo[] }>("/api/links"),
    select: (d) => d.links,
  })
}

export function useCriarLink() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dados: {
      tipo: TipoLink
      notaId?: string
      turmaId?: string
      disciplinaId?: string
      nome?: string
    }) =>
      pedir<{ link: { token: string } }>("/api/links", {
        method: "POST",
        body: JSON.stringify(dados),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["links"] }),
  })
}

export function useEditarLink() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      dados,
    }: {
      id: string
      dados: Partial<{ nome: string; ativo: boolean; expiraEm: string | null; regenerar: boolean }>
    }) =>
      pedir<{ link: LinkInfo }>(`/api/links/${id}`, {
        method: "PUT",
        body: JSON.stringify(dados),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["links"] }),
  })
}

export function useExcluirLink() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => pedir<{ ok: boolean }>(`/api/links/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["links"] }),
  })
}

export async function enviarImagem(
  arquivo: File | Blob,
  nome: string,
): Promise<{ caminho: string; url: string }> {
  const form = new FormData()
  const tipo = (arquivo as File).type || "image/png"
  const nomeSeguro = nome.replace(/[^\w.\-]+/g, "_").slice(-80) || "imagem"
  form.append(
    "arquivo",
    arquivo instanceof File ? arquivo : new File([arquivo], nomeSeguro, { type: tipo }),
  )
  const r = await fetch("/api/imagens", { method: "POST", body: form })
  if (!r.ok) {
    const c = await r.json().catch(() => ({ erro: "Falha no upload." }))
    throw new Error(c.erro ?? "Falha no upload.")
  }
  return r.json() as Promise<{ caminho: string; url: string }>
}

/** Redimensiona/comprime a imagem no cliente antes do upload. */
export async function comprimirImagem(arquivo: File, maxLado = 1600): Promise<Blob> {
  const bitmap = await createImageBitmap(arquivo).catch(() => null)
  if (!bitmap) return arquivo
  const escala = Math.min(1, maxLado / Math.max(bitmap.width, bitmap.height))
  if (escala === 1 && arquivo.size < 500 * 1024) return arquivo
  const canvas = document.createElement("canvas")
  canvas.width = Math.round(bitmap.width * escala)
  canvas.height = Math.round(bitmap.height * escala)
  const ctx = canvas.getContext("2d")
  if (!ctx) return arquivo
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return new Promise((resolver) => {
    canvas.toBlob((blob) => resolver(blob ?? arquivo), "image/webp", 0.9)
  })
}

export async function importarBackup(conteudo: string): Promise<void> {
  const r = await fetch("/api/backup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(JSON.parse(conteudo)),
  })
  if (!r.ok) {
    const c = await r.json().catch(() => ({ erro: "Falha na importação." }))
    throw new Error(c.erro ?? "Falha na importação.")
  }
}

export async function importarNotaArquivo(
  conteudo: string,
  formato: "md" | "json",
): Promise<NotaDados> {
  const r = await fetch("/api/importar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conteudo, formato }),
  })
  const c = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(c.erro ?? "Falha na importação.")
  return c.nota as NotaDados
}
