import "server-only"

// Serialização: linhas do banco -> tipos da AST do app (NotaDados/DisciplinaInfo/TurmaInfo seguem em tipos.ts).

import type { Bloco, NotaDados } from "@/lib/notas/tipos"
import { normalizarAparencia, normalizarBlocos } from "@/lib/notas/tipos"
import { slugificar } from "@/lib/notas/texto"
import type { Database, DisciplinaLinha, NotaLinha, TurmaLinha } from "@/lib/supabase/tipos"

type NotaComDisciplina = NotaLinha & { disciplina?: DisciplinaLinha | null }

/** Converte a linha de `notas` em NotaDados (com AST validada). */
export function linhaParaNota(
  linha: NotaComDisciplina,
  mapaTurmas: Map<string, TurmaLinha>,
): NotaDados {
  const disciplina: NotaDados["disciplina"] = linha.disciplina
    ? {
        id: linha.disciplina.id,
        nome: linha.disciplina.nome,
        cor: linha.disciplina.cor,
        icone: linha.disciplina.icone,
        ordem: linha.disciplina.ordem,
      }
    : linha.disciplina_id && linha.disciplina_nome
      ? {
          // disciplina excluída: mantém o rótulo histórico denormalizado
          id: linha.disciplina_id,
          nome: linha.disciplina_nome,
          cor: linha.disciplina_cor,
          icone: "BookOpen",
          ordem: 0,
        }
      : null

  const turmas = linha.turmas_ids
    .map((id) => mapaTurmas.get(id))
    .filter((t): t is TurmaLinha => Boolean(t))
    .map((t) => ({
      id: t.id,
      nome: t.nome,
      serie: t.serie,
      anoLetivo: t.ano_letivo,
    }))

  return {
    id: linha.id,
    slug: slugificar(linha.titulo) || "nota",
    titulo: linha.titulo,
    disciplinaId: linha.disciplina_id ?? "",
    disciplina,
    anoLetivo: linha.ano_letivo,
    mes: linha.mes,
    sobre: linha.sobre,
    habilidades: linha.habilidades,
    status: linha.status,
    blocos: normalizarBlocos(linha.blocos) as Bloco[],
    aparencia: normalizarAparencia(linha.aparencia),
    criadoEm: linha.criado_em,
    atualizadoEm: linha.atualizado_em,
    turmas,
  }
}

/** Busca todas as turmas do professor (para montar NotaDados). */
export async function mapaTurmasProfessor(
  cliente: import("@supabase/supabase-js").SupabaseClient<Database>,
  professorId: string,
): Promise<Map<string, TurmaLinha>> {
  const { data } = await cliente.from("turmas").select("*").eq("professor_id", professorId)
  return new Map((data ?? []).map((t) => [t.id, t]))
}

/** Monta os campos denormalizados de disciplina/turmas para gravar. */
export function camposDenormalizados(disciplina: DisciplinaLinha | null, turmas: TurmaLinha[]) {
  return {
    disciplina_id: disciplina?.id ?? null,
    disciplina_nome: disciplina?.nome ?? "",
    disciplina_cor: disciplina?.cor ?? "verde",
    turmas_ids: turmas.map((t) => t.id),
    turmas_nomes: turmas.map((t) => t.nome),
  }
}
