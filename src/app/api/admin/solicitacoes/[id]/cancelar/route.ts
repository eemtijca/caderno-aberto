// Cancela uma solicitação de acesso.

import { NextRequest } from "next/server";
import { banco } from "@/lib/banco";
import { erroApi, json } from "@/lib/api/sessao";
import { exigirAdmin } from "@/lib/api/admin";
import { registrarEvento } from "@/lib/api/auditoria";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// POST /api/admin/solicitacoes/[id]/cancelar.
export async function POST(req: NextRequest, ctx: Ctx) {
  const guarda = await exigirAdmin(req);
  if (!guarda.ok) return guarda.resposta;

  const { id } = await ctx.params;
  const db = banco();
  const solicitacao = await db.solicitacoesAcesso.findFirst({ where: { id } });
  if (!solicitacao) return erroApi("Solicitação não encontrada.", 404);
  if (solicitacao.status !== "pendente") return erroApi("Solicitação já resolvida.", 409);

  const adminId = guarda.sessao.usuario.id;
  await db.solicitacoesAcesso.update({
    where: { id },
    data: { status: "cancelada", atendidaPor: adminId, atendidaEm: new Date() },
  });
  await registrarEvento({
    atorId: adminId,
    acao: "CANCELAR_SOLICITACAO",
    email: solicitacao.email,
    req,
  });
  return json({ ok: true });
}
