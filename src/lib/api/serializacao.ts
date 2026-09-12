// Converte linhas do banco no contrato NotaDados exposto pela API.
import "server-only";

import type { Bloco, NotaDados } from "@/lib/notas/tipos";
import { normalizarAparencia, normalizarBlocos } from "@/lib/notas/tipos";
import { slugificar } from "@/lib/notas/texto";
import { banco } from "@/lib/banco";
import type { DisciplinaLinha, NotaLinha, TurmaLinha } from "@/lib/banco/tipos";

type NotaComDisciplina = NotaLinha & {
  disciplina?: Pick<DisciplinaLinha, "id" | "nome" | "cor" | "icone" | "ordem"> | null;
};

/** Linha do banco para NotaDados, com fallback denormalizado. */
export function linhaParaNota(
  linha: NotaComDisciplina,
  mapaTurmas: Map<string, TurmaLinha>,
): NotaDados {
  // Prefere a relação; cai nos campos denormalizados quando ela falta.
  const disciplina: NotaDados["disciplina"] = linha.disciplina
    ? {
        id: linha.disciplina.id,
        nome: linha.disciplina.nome,
        cor: linha.disciplina.cor,
        icone: linha.disciplina.icone,
        ordem: linha.disciplina.ordem,
      }
    : linha.disciplinaId && linha.disciplinaNome
      ? {
          id: linha.disciplinaId,
          nome: linha.disciplinaNome,
          cor: linha.disciplinaCor,
          icone: "BookOpen",
          ordem: 0,
        }
      : null;

  const turmas = linha.turmasIds
    .map((id) => mapaTurmas.get(id))
    .filter((t): t is TurmaLinha => Boolean(t))
    .map((t) => ({
      id: t.id,
      nome: t.nome,
      serie: t.serie,
      anoLetivo: t.anoLetivo,
    }));

  return {
    id: linha.id,
    slug: slugificar(linha.titulo) || "nota",
    titulo: linha.titulo,
    disciplinaId: linha.disciplinaId ?? "",
    disciplina,
    anoLetivo: linha.anoLetivo,
    mes: linha.mes,
    sobre: linha.sobre,
    habilidades: linha.habilidades,
    status: linha.status,
    // Normaliza o JSON persistido para o formato tipado do app.
    blocos: normalizarBlocos(linha.blocos) as Bloco[],
    aparencia: normalizarAparencia(linha.aparencia),
    criadoEm: linha.criadoEm.toISOString(),
    atualizadoEm: linha.atualizadoEm.toISOString(),
    turmas,
  };
}

/** Turmas do professor indexadas por id. */
export async function mapaTurmasProfessor(professorId: string): Promise<Map<string, TurmaLinha>> {
  const db = banco();
  const turmas = await db.turmas.findMany({ where: { professorId } });
  return new Map((turmas as unknown as TurmaLinha[]).map((t) => [t.id, t]));
}

/** Copia nome e cor para a nota, evitando joins na leitura pública. */
export function camposDenormalizados(disciplina: DisciplinaLinha | null, turmas: TurmaLinha[]) {
  return {
    disciplinaId: disciplina?.id ?? null,
    disciplinaNome: disciplina?.nome ?? "",
    disciplinaCor: disciplina?.cor ?? "verde",
    turmasIds: turmas.map((t) => t.id),
    turmasNomes: turmas.map((t) => t.nome),
  };
}

/** Converte blocos/aparência em JSON puro aceito pelo contrato. */
export function paraJson(valor: unknown): any {
  return JSON.parse(JSON.stringify(valor ?? null));
}
