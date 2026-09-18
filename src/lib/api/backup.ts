// Contagem, validação e snapshot dos dados antes de uma restauração substitutiva.
import "server-only";

import { banco } from "@/lib/banco";
import { obterArmazenamento } from "@/lib/armazenamento";

export interface ContagemDados {
  notas: number;
  disciplinas: number;
  turmas: number;
  links: number;
}

export async function contarDadosAtuais(usuarioId: string): Promise<ContagemDados> {
  const db = banco();
  const [notas, disciplinas, turmas, links] = await Promise.all([
    db.notas.count({ where: { professorId: usuarioId, excluidoEm: null } }),
    db.disciplinas.count({ where: { professorId: usuarioId } }),
    db.turmas.count({ where: { professorId: usuarioId } }),
    db.links.count({ where: { professorId: usuarioId, excluidoEm: null } }),
  ]);
  return { notas, disciplinas, turmas, links };
}

export interface ResumoBackup {
  versao: number;
  exportadoEm: string | null;
  professorNome: string;
  contagem: ContagemDados;
  imagens: number;
}

/** Resume um arquivo de backup recebido, sem escrever nada. */
export function resumirBackup(corpo: unknown): ResumoBackup | null {
  const c = corpo as {
    notas?: unknown;
    disciplinas?: unknown;
    turmas?: unknown;
    links?: unknown;
    imagens?: unknown;
    exportadoEm?: unknown;
    professor?: { nome?: unknown };
  } | null;
  if (!c || !Array.isArray(c.notas)) return null;
  const conta = (v: unknown) => (Array.isArray(v) ? v.length : 0);
  return {
    versao: Number(c.notas) === 2 ? 2 : 1,
    exportadoEm: typeof c.exportadoEm === "string" ? c.exportadoEm : null,
    professorNome: typeof c.professor?.nome === "string" ? c.professor.nome : "",
    contagem: {
      notas: conta(c.notas),
      disciplinas: conta(c.disciplinas),
      turmas: conta(c.turmas),
      links: conta(c.links),
    },
    imagens: conta(c.imagens),
  };
}

/** Grava um snapshot JSON do estado atual para rollback. */
export async function salvarSnapshot(usuarioId: string): Promise<string> {
  const db = banco();
  const [disciplinas, turmas, notas, links] = await Promise.all([
    db.disciplinas.findMany({ where: { professorId: usuarioId } }),
    db.turmas.findMany({ where: { professorId: usuarioId } }),
    db.notas.findMany({ where: { professorId: usuarioId } }),
    db.links.findMany({ where: { professorId: usuarioId } }),
  ]);
  const conteudo = {
    versao: 2,
    snapshot: true,
    criadoEm: new Date().toISOString(),
    disciplinas,
    turmas,
    notas,
    links,
  };
  const caminho = `${usuarioId}/backups/pre-restauracao-${Date.now()}.json`;
  await obterArmazenamento().salvar(
    caminho,
    Buffer.from(JSON.stringify(conteudo)),
    "application/json",
  );
  return caminho;
}

export interface SnapshotInfo {
  caminho: string;
  criadoEm: string | null;
}

export async function listarSnapshots(usuarioId: string): Promise<SnapshotInfo[]> {
  const arquivos = await obterArmazenamento().listar(`${usuarioId}/backups/`);
  return arquivos
    .map((a) => {
      const marca = a.caminho.match(/pre-restauracao-(\d+)\.json$/);
      return {
        caminho: a.caminho,
        criadoEm: marca ? new Date(Number(marca[1])).toISOString() : null,
      };
    })
    .sort((a, b) => (a.caminho < b.caminho ? 1 : -1))
    .slice(0, 10);
}

/** Lê um snapshot, restrito à pasta do professor. */
export async function lerSnapshot(usuarioId: string, caminho: string) {
  if (!caminho.startsWith(`${usuarioId}/backups/`) || !caminho.endsWith(".json")) return null;
  return obterArmazenamento().ler(caminho);
}
