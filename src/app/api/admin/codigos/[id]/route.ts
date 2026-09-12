// Revoga um código de acesso ativo.

import { NextRequest } from "next/server";
import { banco } from "@/lib/banco";
import { erroApi, json } from "@/lib/api/sessao";
import { exigirAdmin } from "@/lib/api/admin";
import { registrarEvento } from "@/lib/api/auditoria";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// DELETE /api/admin/codigos/[id]. Remove o código pendente.
export async function DELETE(req: NextRequest, ctx: Ctx) {
  const guarda = await exigirAdmin(req);
  if (!guarda.ok) return guarda.resposta;

  const { id } = await ctx.params;
  const db = banco();
  const codigo = await db.codigosAcesso.findFirst({ where: { id } });
  if (!codigo) return erroApi("Código não encontrado.", 404);
  if (codigo.usadoEm) return erroApi("Código já utilizado.", 409);

  await db.codigosAcesso.delete({ where: { id } });
  await registrarEvento({
    atorId: guarda.sessao.usuario.id,
    acao: "REVOGAR_CODIGO",
    email: codigo.email,
    req,
  });
  return json({ ok: true });
}
