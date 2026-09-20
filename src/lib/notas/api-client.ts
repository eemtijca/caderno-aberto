"use client";

// Hooks React Query que falam com a API de notas, turmas e links.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mapearErro } from "@/lib/api/erro";
import type { AparenciaNota, Bloco, DisciplinaInfo, NotaDados, TurmaInfo } from "./tipos";

// Avisa a sessão global quando o acesso expira, para limpar o estado e voltar ao login.
export const EVENTO_SESSAO_EXPIRADA = "caderno:sessao-expirada";

async function pedir<T>(url: string, init?: RequestInit): Promise<T> {
  // Sem cache para que mutações recém-feitas apareçam de imediato.
  let r: Response;
  try {
    r = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
      cache: "no-store",
    });
  } catch {
    throw new Error("Não foi possível falar com o servidor. Verifique sua conexão.");
  }
  if (!r.ok) {
    const corpo = await r.json().catch(() => null);
    const erro = mapearErro(r.status, corpo, `Erro ${r.status}`);
    if (r.status === 401 && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(EVENTO_SESSAO_EXPIRADA));
    }
    throw erro;
  }
  return r.json() as Promise<T>;
}

export interface DisciplinaLista extends DisciplinaInfo {
  totalNotas: number;
}

export function useDisciplinas() {
  return useQuery({
    queryKey: ["disciplinas"],
    queryFn: () => pedir<{ disciplinas: DisciplinaLista[] }>("/api/disciplinas"),
    select: (d) => d.disciplinas,
  });
}

export function useCriarDisciplina() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dados: { nome: string; cor: string; icone: string }) =>
      pedir<{ disciplina: DisciplinaInfo }>("/api/disciplinas", {
        method: "POST",
        body: JSON.stringify(dados),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["disciplinas"] }),
  });
}

export function useEditarDisciplina() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      dados,
    }: {
      id: string;
      dados: Partial<{ nome: string; cor: string; icone: string }>;
    }) =>
      pedir<{ disciplina: DisciplinaInfo }>(`/api/disciplinas/${id}`, {
        method: "PUT",
        body: JSON.stringify(dados),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["disciplinas"] });
      qc.invalidateQueries({ queryKey: ["notas"] });
    },
  });
}

export function useExcluirDisciplina() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      pedir<{ ok: boolean }>(`/api/disciplinas/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["disciplinas"] });
      qc.invalidateQueries({ queryKey: ["notas"] });
    },
  });
}

export interface TurmaLista extends TurmaInfo {
  totalNotas: number;
}

export function useTurmas(ano?: number) {
  return useQuery({
    queryKey: ["turmas", ano ?? "todas"],
    queryFn: () => pedir<{ turmas: TurmaLista[] }>(`/api/turmas${ano ? `?ano=${ano}` : ""}`),
    select: (t) => t.turmas,
  });
}

export function useCriarTurma() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dados: { nome: string; serie: string; anoLetivo: number }) =>
      pedir<{ turma: TurmaInfo }>("/api/turmas", {
        method: "POST",
        body: JSON.stringify(dados),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["turmas"] }),
  });
}

export function useEditarTurma() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      dados,
    }: {
      id: string;
      dados: Partial<{ nome: string; serie: string; anoLetivo: number }>;
    }) =>
      pedir<{ turma: TurmaInfo }>(`/api/turmas/${id}`, {
        method: "PUT",
        body: JSON.stringify(dados),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["turmas"] });
      qc.invalidateQueries({ queryKey: ["notas"] });
    },
  });
}

export function useExcluirTurma() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pedir<{ ok: boolean }>(`/api/turmas/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["turmas"] });
      qc.invalidateQueries({ queryKey: ["notas"] });
    },
  });
}

export interface FiltrosNotas {
  q?: string;
  disciplina?: string;
  ano?: number;
  mes?: number;
  turma?: string;
  status?: string;
}

export function useNotas(filtros: FiltrosNotas = {}) {
  const sp = new URLSearchParams();
  if (filtros.q) sp.set("q", filtros.q);
  if (filtros.disciplina) sp.set("disciplina", filtros.disciplina);
  if (filtros.ano) sp.set("ano", String(filtros.ano));
  if (filtros.mes) sp.set("mes", String(filtros.mes));
  if (filtros.turma) sp.set("turma", filtros.turma);
  if (filtros.status) sp.set("status", filtros.status);
  const qs = sp.toString();
  return useQuery({
    queryKey: ["notas", qs],
    queryFn: () => pedir<{ notas: NotaDados[] }>(`/api/notas${qs ? `?${qs}` : ""}`),
    select: (d) => d.notas,
  });
}

export function useNota(id: string | undefined) {
  return useQuery({
    queryKey: ["nota", id],
    queryFn: () => pedir<{ nota: NotaDados }>(`/api/notas/${id}`),
    enabled: Boolean(id),
    select: (d) => d.nota,
  });
}

export interface DadosCriarNota {
  titulo: string;
  disciplinaId: string;
  anoLetivo: number;
  mes: number;
  turmasIds: string[];
  sobre?: string;
  habilidades?: string;
  comModelo?: boolean;
}

export function useCriarNota() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dados: DadosCriarNota) =>
      pedir<{ nota: NotaDados }>("/api/notas", {
        method: "POST",
        body: JSON.stringify(dados),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notas"] });
      qc.invalidateQueries({ queryKey: ["disciplinas"] });
      qc.invalidateQueries({ queryKey: ["turmas"] });
    },
  });
}

export interface DadosSalvarNota {
  titulo?: string;
  disciplinaId?: string;
  anoLetivo?: number;
  mes?: number;
  sobre?: string;
  habilidades?: string;
  status?: "rascunho" | "publicada";
  blocos?: Bloco[];
  turmasIds?: string[];
  aparencia?: AparenciaNota;
}

export function useSalvarNota(id: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dados: DadosSalvarNota) =>
      pedir<{ nota: NotaDados }>(`/api/notas/${id}`, {
        method: "PUT",
        body: JSON.stringify(dados),
      }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["nota", id] });
      qc.invalidateQueries({ queryKey: ["notas"] });
      qc.invalidateQueries({ queryKey: ["disciplinas"] });
      qc.invalidateQueries({ queryKey: ["turmas"] });
    },
  });
}

export function useExcluirNota() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pedir<{ ok: boolean }>(`/api/notas/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notas"] });
      qc.invalidateQueries({ queryKey: ["disciplinas"] });
      qc.invalidateQueries({ queryKey: ["turmas"] });
    },
  });
}

export interface ResultadoLote {
  atualizados: number;
  ausentes: string[];
}

const TAMANHO_LOTE = 100;

/** Divide os ids em lotes de 100 para respeitar o teto da API. */
function lotesDe(ids: string[]): string[][] {
  const lotes: string[][] = [];
  for (let i = 0; i < ids.length; i += TAMANHO_LOTE) lotes.push(ids.slice(i, i + TAMANHO_LOTE));
  return lotes;
}

export async function loteNotas(dados: {
  acao: "publicar" | "rascunho" | "lixeira" | "disciplina";
  ids: string[];
  disciplinaId?: string;
}): Promise<ResultadoLote> {
  let atualizados = 0;
  const ausentes: string[] = [];
  for (const lote of lotesDe(dados.ids)) {
    const r = await pedir<ResultadoLote>("/api/notas/lote", {
      method: "POST",
      body: JSON.stringify({ acao: dados.acao, disciplinaId: dados.disciplinaId, ids: lote }),
    });
    atualizados += r.atualizados;
    ausentes.push(...r.ausentes);
  }
  return { atualizados, ausentes };
}

export async function loteLinks(dados: {
  acao: "pausar" | "reativar" | "excluir";
  ids: string[];
}): Promise<ResultadoLote> {
  let atualizados = 0;
  const ausentes: string[] = [];
  for (const lote of lotesDe(dados.ids)) {
    const r = await pedir<ResultadoLote>("/api/links/lote", {
      method: "POST",
      body: JSON.stringify({ acao: dados.acao, ids: lote }),
    });
    atualizados += r.atualizados;
    ausentes.push(...r.ausentes);
  }
  return { atualizados, ausentes };
}

export async function loteLixeira(dados: {
  notas: string[];
  links: string[];
}): Promise<{ notas: number; links: number; ausentes: string[] }> {
  const resultados = await Promise.all([
    ...lotesDe(dados.notas).map((lote) =>
      pedir<{ restaurados: { notas: number; links: number }; ausentes: string[] }>(
        "/api/lixeira/lote",
        {
          method: "POST",
          body: JSON.stringify({ acao: "restaurar", notas: lote, links: [] }),
        },
      ),
    ),
    ...lotesDe(dados.links).map((lote) =>
      pedir<{ restaurados: { notas: number; links: number }; ausentes: string[] }>(
        "/api/lixeira/lote",
        {
          method: "POST",
          body: JSON.stringify({ acao: "restaurar", notas: [], links: lote }),
        },
      ),
    ),
  ]);
  return resultados.reduce(
    (total, r) => ({
      notas: total.notas + r.restaurados.notas,
      links: total.links + r.restaurados.links,
      ausentes: [...total.ausentes, ...r.ausentes],
    }),
    { notas: 0, links: 0, ausentes: [] as string[] },
  );
}

/** Esvazia a lixeira do professor em definitivo. */
export async function limparLixeira(): Promise<{ notas: number; links: number }> {
  const r = await pedir<{ notas: number; links: number }>("/api/lixeira", { method: "DELETE" });
  return { notas: r.notas, links: r.links };
}

export function useDuplicarNota() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      pedir<{ nota: NotaDados }>(`/api/notas/${id}/duplicar`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notas"] }),
  });
}

export interface LixeiraInfo {
  dias: number;
  expiraEm: string;
  notas: { id: string; titulo: string; excluidoEm: string | null }[];
  links: { id: string; nome: string; tipo: string; excluidoEm: string | null }[];
}

export function useLixeira() {
  return useQuery({
    queryKey: ["lixeira"],
    queryFn: () => pedir<LixeiraInfo>("/api/lixeira"),
  });
}

export function useRestaurarNota() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      pedir<{ ok: true }>(`/api/notas/${id}/restaurar`, { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notas"] });
      qc.invalidateQueries({ queryKey: ["lixeira"] });
      qc.invalidateQueries({ queryKey: ["links"] });
    },
  });
}

export function useRestaurarLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      pedir<{ ok: true }>(`/api/links/${id}/restaurar`, { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["links"] });
      qc.invalidateQueries({ queryKey: ["lixeira"] });
    },
  });
}

export interface ResultadoBusca {
  id: string;
  titulo: string;
  disciplina: string;
  cor: string;
  status: string;
  anoLetivo: number;
  mes: number;
  turmas: string[];
  campo: string;
  trecho: string;
}

export function useBusca(q: string) {
  return useQuery({
    queryKey: ["busca", q],
    queryFn: () => pedir<{ resultados: ResultadoBusca[] }>(`/api/busca?q=${encodeURIComponent(q)}`),
    // Evita disparar busca a cada tecla em consultas curtas.
    enabled: q.trim().length >= 2,
    select: (d) => d.resultados,
  });
}

export type TipoLink = "nota" | "turma" | "disciplina";

export interface LinkInfo {
  id: string;
  tipo: TipoLink;
  token: string;
  nome: string;
  alvo: string;
  alvoDetalhe: string;
  notaId: string | null;
  turmaId: string | null;
  disciplinaId: string | null;
  ativo: boolean;
  expiraEm: string | null;
  acessos: number;
  criadoEm: string;
}

export function urlDoLink(token: string): string {
  // No cliente usa a origem real; no servidor cai no caminho relativo.
  return typeof window !== "undefined" ? `${window.location.origin}/l/${token}` : `/l/${token}`;
}

export function useLinks() {
  return useQuery({
    queryKey: ["links"],
    queryFn: () => pedir<{ links: LinkInfo[] }>("/api/links"),
    select: (d) => d.links,
  });
}

export function useCriarLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dados: {
      tipo: TipoLink;
      notaId?: string;
      turmaId?: string;
      disciplinaId?: string;
      nome?: string;
    }) =>
      pedir<{ link: { token: string } }>("/api/links", {
        method: "POST",
        body: JSON.stringify(dados),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["links"] }),
  });
}

export function useEditarLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      dados,
    }: {
      id: string;
      dados: Partial<{ nome: string; ativo: boolean; expiraEm: string | null; regenerar: boolean }>;
    }) =>
      pedir<{ link: LinkInfo }>(`/api/links/${id}`, {
        method: "PUT",
        body: JSON.stringify(dados),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["links"] }),
  });
}

export function useExcluirLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pedir<{ ok: boolean }>(`/api/links/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["links"] }),
  });
}

export async function enviarImagem(
  arquivo: File | Blob,
  nome: string,
): Promise<{ caminho: string; url: string }> {
  const form = new FormData();
  const tipo = (arquivo as File).type || "image/png";
  const nomeSeguro = nome.replace(/[^\w.\-]+/g, "_").slice(-80) || "imagem";
  form.append(
    "arquivo",
    arquivo instanceof File ? arquivo : new File([arquivo], nomeSeguro, { type: tipo }),
  );
  const r = await fetch("/api/imagens", { method: "POST", body: form });
  if (!r.ok) {
    const c = await r.json().catch(() => ({ erro: "Falha no upload." }));
    throw new Error(c.erro ?? "Falha no upload.");
  }
  return r.json() as Promise<{ caminho: string; url: string }>;
}

export async function comprimirImagem(arquivo: File, maxLado = 1600): Promise<Blob> {
  // Se o navegador não decodificar, envia o original sem tratamento.
  const bitmap = await createImageBitmap(arquivo).catch(() => null);
  if (!bitmap) return arquivo;
  const escala = Math.min(1, maxLado / Math.max(bitmap.width, bitmap.height));
  if (escala === 1 && arquivo.size < 500 * 1024) return arquivo;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * escala);
  canvas.height = Math.round(bitmap.height * escala);
  const ctx = canvas.getContext("2d");
  if (!ctx) return arquivo;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolver) => {
    // WebP 0.9 mantém legibilidade com bom tamanho de arquivo.
    canvas.toBlob((blob) => resolver(blob ?? arquivo), "image/webp", 0.9);
  });
}

export async function importarBackup(conteudo: string): Promise<{ snapshot?: string | null }> {
  const r = await fetch("/api/backup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(JSON.parse(conteudo)),
  });
  if (!r.ok) {
    const c = await r.json().catch(() => ({ erro: "Falha na importação." }));
    throw mapearErro(r.status, c, "Falha na importação.");
  }
  return (await r.json()) as { snapshot?: string | null };
}

export interface ResumoBackup {
  versao: number;
  exportadoEm: string | null;
  professorNome: string;
  contagem: { notas: number; disciplinas: number; turmas: number; links: number };
  imagens: number;
}

export interface ContagemDados {
  notas: number;
  disciplinas: number;
  turmas: number;
  links: number;
}

/** Dry-run da restauração: resume o arquivo e compara com os dados atuais. */
export async function validarBackup(
  conteudo: string,
): Promise<{ backup: ResumoBackup; atual: ContagemDados }> {
  const r = await fetch("/api/backup/validar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(JSON.parse(conteudo)),
  });
  const c = await r.json().catch(() => ({}));
  if (!r.ok) throw mapearErro(r.status, c, "Arquivo de backup inválido.");
  return c as { backup: ResumoBackup; atual: ContagemDados };
}

export async function listarSnapshots(): Promise<{ caminho: string; criadoEm: string | null }[]> {
  const r = await fetch("/api/backup/snapshots", { cache: "no-store" });
  if (!r.ok) return [];
  const c = (await r.json()) as { snapshots?: { caminho: string; criadoEm: string | null }[] };
  return c.snapshots ?? [];
}

export async function importarNotaArquivo(
  conteudo: string,
  formato: "md" | "json",
): Promise<NotaDados> {
  const r = await fetch("/api/importar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conteudo, formato }),
  });
  const c = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(c.erro ?? "Falha na importação.");
  return c.nota as NotaDados;
}
