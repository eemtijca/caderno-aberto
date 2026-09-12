// Atende uma solicitação: cria a conta (se preciso) e emite o código.

import { NextRequest } from "next/server";
import { banco } from "@/lib/banco";
import { erroApi, json } from "@/lib/api/sessao";
import { exigirAdmin } from "@/lib/api/admin";
import { registrarEvento } from "@/lib/api/auditoria";
import { criarContaInativa } from "@/lib/auth/contas";
import { emitirCodigo, type TipoCodigo } from "@/lib/auth/codigos";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// POST /api/admin/solicitacoes/[id]/atender.
export async function POST(req: NextRequest, ctx: Ctx) {
  const guarda = await exigirAdmin(req);
  if (!guarda.ok) return guarda.resposta;

  const { id } = await ctx.params;
  const db = banco();
  const solicitacao = await db.solicitacoesAcesso.findFirst({ where: { id } });
  if (!solicitacao) return erroApi("Solicitação não encontrada.", 404);
  if (solicitacao.status !== "pendente") return erroApi("Solicitação já atendida.", 409);

  const tipo = solicitacao.tipo as TipoCodigo;
  const adminId = guarda.sessao.usuario.id;

  let usuario = await db.usuarios.findFirst({ where: { email: solicitacao.email } });
  if (!usuario) {
    // Primeiro acesso cria a conta inativa; recuperação exige conta existente.
    if (tipo === "recuperacao") return erroApi("Conta não encontrada para este e-mail.", 404);
    usuario = await criarContaInativa(solicitacao.email, solicitacao.nome);
  } else if (tipo === "recuperacao" && !usuario.ativadoEm) {
    return erroApi("Conta ainda não ativada. Use o código de primeiro acesso.");
  }

  const { codigo, expiraEm } = await emitirCodigo(usuario.id, usuario.email, tipo, adminId);

  await db.solicitacoesAcesso.update({
    where: { id: solicitacao.id },
    data: { status: "atendida", atendidaPor: adminId, atendidaEm: new Date() },
  });

  await registrarEvento({
    atorId: adminId,
    acao: "GERAR_CODIGO",
    email: usuario.email,
    req,
    detalhe: { tipo, solicitacaoId: solicitacao.id },
  });

  return json({
    codigo,
    expiraEm: expiraEm.toISOString(),
    email: usuario.email,
    nome: solicitacao.nome,
    tipo,
  });
}
