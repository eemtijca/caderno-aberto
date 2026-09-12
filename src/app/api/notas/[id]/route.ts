// Lê, atualiza e remove uma nota, restrito ao professor dono.

import { NextRequest } from "next/server";
import { banco } from "@/lib/banco";
import { sessaoProfessor, json, erroApi, naoAutenticado } from "@/lib/api/sessao";
import {
  linhaParaNota,
  mapaTurmasProfessor,
  camposDenormalizados,
  paraJson,
} from "@/lib/api/serializacao";
import type { DisciplinaLinha, NotaLinha, TurmaLinha } from "@/lib/banco/tipos";
import { normalizarAparencia, normalizarBlocos, type Bloco } from "@/lib/notas/tipos";
import { normalizar, textoDeBusca } from "@/lib/notas/texto";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

async function buscarNota(id: string, professorId: string): Promise<NotaLinha | null> {
  const db = await banco();
  // O filtro por professor garante o isolamento entre contas.
  const linha = await db.notas.findFirst({ where: { id, professorId } });
  return (linha as unknown as NotaLinha | null) ?? null;
}

export async function GET(req: NextRequest, ctx: Ctx) {
  const sessao = await sessaoProfessor(req);
  if (!sessao) return naoAutenticado();
  const { usuario } = sessao;
  const { id } = await ctx.params;

  const linha = await buscarNota(id, usuario.id);
  if (!linha) return erroApi("Nota não encontrada.", 404);

  const db = await banco();
  const disciplina = linha.disciplinaId
    ? await db.disciplinas.findFirst({ where: { id: linha.disciplinaId } })
    : null;
  const mapaTurmas = await mapaTurmasProfessor(usuario.id);
  return json({
    nota: linhaParaNota(
      { ...linha, disciplina: (disciplina as unknown as DisciplinaLinha | null) ?? null },
      mapaTurmas,
    ),
  });
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  const sessao = await sessaoProfessor(req);
  if (!sessao) return naoAutenticado();
  const { usuario } = sessao;
  const { id } = await ctx.params;

  const corpo = await req.json().catch(() => null);
  if (!corpo || typeof corpo !== "object") return erroApi("Corpo inválido.");

  const db = await banco();
  const atual = await buscarNota(id, usuario.id);
  if (!atual) return erroApi("Nota não encontrada.", 404);

  // Monta a atualização apenas com os campos enviados.
  const dados: Record<string, unknown> = {};

  if (typeof corpo.titulo === "string" && corpo.titulo.trim()) {
    dados.titulo = corpo.titulo.trim();
  }

  let disciplina: DisciplinaLinha | null = null;
  if (atual.disciplinaId) {
    const d = await db.disciplinas.findFirst({ where: { id: atual.disciplinaId } });
    disciplina = (d as unknown as DisciplinaLinha | null) ?? null;
  }
  let turmas: TurmaLinha[] = [];
  if (atual.turmasIds.length > 0) {
    const todas = await db.turmas.findMany({ where: { professorId: usuario.id } });
    const porId = new Map(todas.map((t) => [t.id, t]));
    turmas = atual.turmasIds
      .map((tid) => porId.get(tid))
      .filter((t): t is (typeof todas)[number] => Boolean(t)) as unknown as TurmaLinha[];
  }

  if (typeof corpo.disciplinaId === "string") {
    if (corpo.disciplinaId) {
      const d = await db.disciplinas.findFirst({
        where: {
          id: corpo.disciplinaId,
          professorId: usuario.id,
        },
      });
      if (!d) return erroApi("Disciplina não encontrada.", 404);
      disciplina = d as unknown as DisciplinaLinha;
    } else {
      disciplina = null;
    }
  }

  if (Array.isArray(corpo.turmasIds)) {
    const ids = (corpo.turmasIds as unknown[]).filter((t): t is string => typeof t === "string");
    const todas = await db.turmas.findMany({ where: { professorId: usuario.id } });
    const porId = new Map(todas.map((t) => [t.id, t]));
    turmas = ids
      .map((tid) => porId.get(tid))
      .filter((t): t is (typeof todas)[number] => Boolean(t)) as unknown as TurmaLinha[];
  }

  if (
    corpo.disciplinaId !== undefined ||
    Array.isArray(corpo.turmasIds) ||
    corpo.titulo !== undefined
  ) {
    Object.assign(dados, camposDenormalizados(disciplina, turmas));
  }

  if (corpo.anoLetivo !== undefined) {
    const ano = Number(corpo.anoLetivo);
    if (Number.isFinite(ano) && ano >= 2000 && ano <= 2100) dados.anoLetivo = ano;
  }
  if (corpo.mes !== undefined) dados.mes = Math.min(12, Math.max(1, Number(corpo.mes) || 1));
  if (typeof corpo.sobre === "string") dados.sobre = corpo.sobre;
  if (typeof corpo.habilidades === "string") dados.habilidades = corpo.habilidades;
  if (corpo.status === "publicada" || corpo.status === "rascunho") dados.status = corpo.status;
  if (corpo.blocos !== undefined) dados.blocos = paraJson(normalizarBlocos(corpo.blocos));
  if (corpo.aparencia !== undefined)
    dados.aparencia = paraJson(normalizarAparencia(corpo.aparencia));

  const tituloFinal = (dados.titulo as string | undefined) ?? atual.titulo;
  const sobreFinal = (dados.sobre as string | undefined) ?? atual.sobre;
  const habilidadesFinal = (dados.habilidades as string | undefined) ?? atual.habilidades;
  const blocosFinais =
    (dados.blocos as Bloco[] | undefined) ?? (normalizarBlocos(atual.blocos) as Bloco[]);
  dados.busca = normalizar(
    textoDeBusca({
      titulo: tituloFinal,
      sobre: sobreFinal,
      habilidades: habilidadesFinal,
      blocos: blocosFinais,
      disciplina: disciplina ? { nome: disciplina.nome } : null,
      turmas: turmas.map((t) => ({ nome: t.nome, serie: t.serie })),
    }),
  );

  // Carga validada campo a campo acima.
  const linha = (await db.notas.update({
    where: { id },
    data: dados as never,
  })) as unknown as NotaLinha | null;

  if (!linha) return erroApi("Falha ao salvar a nota.");

  const mapaTurmas = await mapaTurmasProfessor(usuario.id);
  return json({ nota: linhaParaNota({ ...linha, disciplina }, mapaTurmas) });
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const sessao = await sessaoProfessor(req);
  if (!sessao) return naoAutenticado();
  const { usuario } = sessao;
  const { id } = await ctx.params;

  const db = await banco();
  // Exclusão escopada ao professor.
  await db.notas.deleteMany({ where: { id, professorId: usuario.id } });
  return json({ ok: true });
}
