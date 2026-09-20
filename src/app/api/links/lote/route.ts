// Ações em lote nos links do professor: pausar, reativar e mover para a lixeira.

import { NextRequest } from "next/server";
import { banco } from "@/lib/banco";
import { sessaoProfessor, json, erroApi, naoAutenticado } from "@/lib/api/sessao";
import { separarIds } from "@/lib/api/lote";

export const dynamic = "force-dynamic";

const ACOES = ["pausar", "reativar", "excluir"] as const;
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
  const linhas = await db.links.findMany({
    where: { professorId: usuario.id, excluidoEm: null, id: { in: ids.validos } },
    select: { id: true },
  });
  const encontrados = linhas.map((l) => l.id);
  const ausentes = [...ids.invalidos, ...ids.validos.filter((id) => !encontrados.includes(id))];
  if (encontrados.length === 0) return json({ ok: true, atualizados: 0, ausentes });

  const r = await db.links.updateMany({
    where: { professorId: usuario.id, id: { in: encontrados }, excluidoEm: null },
    data: acao === "excluir" ? { excluidoEm: new Date() } : { ativo: acao === "reativar" },
  });
  return json({ ok: true, atualizados: r.count, ausentes });
}
