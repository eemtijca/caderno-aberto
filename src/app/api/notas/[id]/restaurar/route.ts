// Restaura uma nota da lixeira, com os links que foram para a lixeira junto.

import { NextRequest } from "next/server";
import { banco } from "@/lib/banco";
import { sessaoProfessor, json, erroApi, naoAutenticado } from "@/lib/api/sessao";
import { ehUuid } from "@/lib/identificador";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const sessao = await sessaoProfessor(req);
  if (!sessao) return naoAutenticado();
  const { usuario } = sessao;
  const { id } = await ctx.params;

  const db = await banco();
  const nota = ehUuid(id)
    ? await db.notas.findFirst({
        where: { id, professorId: usuario.id, excluidoEm: { not: null } },
      })
    : null;
  if (!nota) return erroApi("Nota não encontrada na lixeira.", 404, "NAO_ENCONTRADO");

  await db.$transaction(async (tx) => {
    await tx.notas.update({ where: { id }, data: { excluidoEm: null } });
    await tx.links.updateMany({
      where: { professorId: usuario.id, notaId: id, excluidoEm: { not: null } },
      data: { excluidoEm: null },
    });
  });
  return json({ ok: true });
}
