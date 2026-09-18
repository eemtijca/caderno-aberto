// Lista os itens na lixeira do professor (notas e links).

import { NextRequest } from "next/server";
import { banco } from "@/lib/banco";
import { sessaoProfessor, json, naoAutenticado } from "@/lib/api/sessao";
import { LIXEIRA_DIAS } from "@/lib/ambiente";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sessao = await sessaoProfessor(req);
  if (!sessao) return naoAutenticado();
  const { usuario } = sessao;

  const db = await banco();
  const [notas, links] = await Promise.all([
    db.notas.findMany({
      where: { professorId: usuario.id, excluidoEm: { not: null } },
      select: { id: true, titulo: true, excluidoEm: true },
    }),
    db.links.findMany({
      where: { professorId: usuario.id, excluidoEm: { not: null } },
      select: { id: true, nome: true, tipo: true, excluidoEm: true },
    }),
  ]);

  const prazo = new Date(Date.now() + LIXEIRA_DIAS * 24 * 60 * 60 * 1000);

  return json({
    dias: LIXEIRA_DIAS,
    notas: notas
      .map((n) => ({ id: n.id, titulo: n.titulo, excluidoEm: n.excluidoEm?.toISOString() ?? null }))
      .sort((a, b) => (a.excluidoEm! < b.excluidoEm! ? 1 : -1)),
    links: links
      .map((l) => ({
        id: l.id,
        nome: l.nome,
        tipo: l.tipo,
        excluidoEm: l.excluidoEm?.toISOString() ?? null,
      }))
      .sort((a, b) => (a.excluidoEm! < b.excluidoEm! ? 1 : -1)),
    expiraEm: prazo.toISOString(),
  });
}
