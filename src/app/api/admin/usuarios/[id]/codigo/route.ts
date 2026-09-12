// Reemite um código de acesso para o usuário.

import { NextRequest } from "next/server";
import { banco } from "@/lib/banco";
import { erroApi, json } from "@/lib/api/sessao";
import { exigirAdmin } from "@/lib/api/admin";
import { registrarEvento } from "@/lib/api/auditoria";
import { emitirCodigo, type TipoCodigo } from "@/lib/auth/codigos";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// POST /api/admin/usuarios/[id]/codigo {tipo?}. Padrão: primeiro acesso se inativo.
export async function POST(req: NextRequest, ctx: Ctx) {
  const guarda = await exigirAdmin(req);
  if (!guarda.ok) return guarda.resposta;

  const { id } = await ctx.params;
  const db = banco();
  const usuario = await db.usuarios.findFirst({ where: { id } });
  if (!usuario) return erroApi("Usuário não encontrado.", 404);

  const corpo = await req.json().catch(() => null);
  const tipo: TipoCodigo =
    corpo?.tipo === "recuperacao"
      ? "recuperacao"
      : corpo?.tipo === "primeiro_acesso"
        ? "primeiro_acesso"
        : usuario.ativadoEm
          ? "recuperacao"
          : "primeiro_acesso";

  if (tipo === "recuperacao" && !usuario.ativadoEm) {
    return erroApi("Conta ainda não ativada. Emita o código de primeiro acesso.");
  }

  const { codigo, expiraEm } = await emitirCodigo(
    usuario.id,
    usuario.email,
    tipo,
    guarda.sessao.usuario.id,
  );
  await registrarEvento({
    atorId: guarda.sessao.usuario.id,
    acao: "GERAR_CODIGO",
    email: usuario.email,
    req,
    detalhe: { tipo, origem: "usuario" },
  });
  return json({ codigo, expiraEm: expiraEm.toISOString(), email: usuario.email, tipo });
}
