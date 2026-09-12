// Encerra todas as sessões de um usuário.

import { NextRequest } from "next/server";
import { banco } from "@/lib/banco";
import { json } from "@/lib/api/sessao";
import { exigirAdmin } from "@/lib/api/admin";
import { registrarEvento } from "@/lib/api/auditoria";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// DELETE /api/admin/usuarios/[id]/sessoes.
export async function DELETE(req: NextRequest, ctx: Ctx) {
  const guarda = await exigirAdmin(req);
  if (!guarda.ok) return guarda.resposta;

  const { id } = await ctx.params;
  const db = banco();
  const usuario = await db.usuarios.findFirst({ where: { id } });
  if (!usuario) return json({ ok: true });

  const removidas = await db.sessoes.deleteMany({ where: { usuarioId: id } });
  await registrarEvento({
    atorId: guarda.sessao.usuario.id,
    acao: "REVOGAR_SESSOES",
    email: usuario.email,
    req,
    detalhe: { removidas: removidas.count },
  });
  return json({ ok: true, removidas: removidas.count });
}
