// Ações em lote nas notas do professor: publicar, voltar a rascunho, lixeira e disciplina.

import { NextRequest } from "next/server";
import { banco } from "@/lib/banco";
import { sessaoProfessor, json, erroApi, naoAutenticado } from "@/lib/api/sessao";
import { camposDenormalizados } from "@/lib/api/serializacao";
import { separarIds } from "@/lib/api/lote";
import type { DisciplinaLinha, TurmaLinha } from "@/lib/banco/tipos";
import { normalizarBlocos } from "@/lib/notas/tipos";
import { normalizar, textoDeBusca } from "@/lib/notas/texto";

export const dynamic = "force-dynamic";

const ACOES = ["publicar", "rascunho", "lixeira", "disciplina"] as const;
type Acao = (typeof ACOES)[number];

export async function POST(req: NextRequest) {
  const sessao = await sessaoProfessor(req);
  if (!sessao) return naoAutenticado();
  const { usuario } = sessao;

  const corpo = await req.json().catch(() => null);
  const acao = ACOES.includes(corpo?.acao) ? (corpo.acao as Acao) : null;
  if (!acao) return erroApi("Ação inválida.");
  const ids = separarIds(corpo?.ids);
  if (!ids || ids.validos.length === 0) {
    return erroApi("Informe de 1 a 100 identificadores.");
  }

  const db = await banco();
  // Só entram ids existentes, do professor e fora da lixeira.
  const linhas = await db.notas.findMany({
    where: { professorId: usuario.id, excluidoEm: null, id: { in: ids.validos } },
    select: { id: true },
  });
  const encontrados = linhas.map((l) => l.id);
  const ausentes = [...ids.invalidos, ...ids.validos.filter((id) => !encontrados.includes(id))];

  if (encontrados.length === 0) return json({ ok: true, atualizados: 0, ausentes });

  if (acao === "publicar" || acao === "rascunho") {
    const r = await db.notas.updateMany({
      where: { professorId: usuario.id, id: { in: encontrados }, excluidoEm: null },
      data: { status: acao === "publicar" ? "publicada" : "rascunho" },
    });
    return json({ ok: true, atualizados: r.count, ausentes });
  }

  if (acao === "lixeira") {
    const agora = new Date();
    // Mesma semântica do excluir individual: os links da nota vão junto.
    await db.$transaction(async (tx) => {
      await tx.notas.updateMany({
        where: { professorId: usuario.id, id: { in: encontrados }, excluidoEm: null },
        data: { excluidoEm: agora },
      });
      await tx.links.updateMany({
        where: { professorId: usuario.id, notaId: { in: encontrados }, excluidoEm: null },
        data: { excluidoEm: agora },
      });
    });
    return json({ ok: true, atualizados: encontrados.length, ausentes });
  }

  // Disciplina: troca nos itens selecionados e recalcula campos e busca.
  const disciplinaId = typeof corpo?.disciplinaId === "string" ? corpo.disciplinaId : "";
  if (!disciplinaId) return erroApi("Informe a disciplina.");
  const disciplina = await db.disciplinas.findFirst({
    where: { id: disciplinaId, professorId: usuario.id },
  });
  if (!disciplina) return erroApi("Disciplina não encontrada.", 404);

  const turmasTodas = await db.turmas.findMany({ where: { professorId: usuario.id } });
  const porTurma = new Map(turmasTodas.map((t) => [t.id, t]));
  const completas = await db.notas.findMany({
    where: { professorId: usuario.id, id: { in: encontrados }, excluidoEm: null },
  });

  await db.$transaction(
    completas.map((nota) => {
      const turmas = (nota.turmasIds as string[])
        .map((tid) => porTurma.get(tid))
        .filter((t): t is (typeof turmasTodas)[number] => Boolean(t)) as unknown as TurmaLinha[];
      const blocos = normalizarBlocos(nota.blocos);
      return db.notas.update({
        where: { id: nota.id },
        data: {
          ...camposDenormalizados(disciplina as unknown as DisciplinaLinha, turmas),
          busca: normalizar(
            textoDeBusca({
              titulo: nota.titulo,
              sobre: nota.sobre,
              habilidades: nota.habilidades,
              blocos,
              disciplina: { nome: disciplina.nome },
              turmas: turmas.map((t) => ({ nome: t.nome, serie: t.serie })),
            }),
          ),
        },
      });
    }),
  );
  return json({ ok: true, atualizados: completas.length, ausentes });
}
