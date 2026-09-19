// Restaura um link da lixeira.

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
  const link = ehUuid(id)
    ? await db.links.findFirst({
        where: { id, professorId: usuario.id, excluidoEm: { not: null } },
      })
    : null;
  if (!link) return erroApi("Link não encontrado na lixeira.", 404, "NAO_ENCONTRADO");

  await db.links.update({ where: { id }, data: { excluidoEm: null } });
  return json({ ok: true });
}
