// Aprova ou recusa uma ação destrutiva pendente (quatro olhos).

import { NextRequest } from "next/server";
import { banco } from "@/lib/banco";
import { erroApi, json } from "@/lib/api/sessao";
import { exigirAdmin } from "@/lib/api/admin";
import { registrarEvento } from "@/lib/api/auditoria";
import { confereSenhaAdmin, ehAdminBootstrap, ehUltimoAdmin } from "@/lib/api/admin-guarda";
import { alvoDeLinha, excluirUsuario, suspenderUsuario } from "@/lib/api/admin-usuarios";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const guarda = await exigirAdmin(req);
  if (!guarda.ok) return guarda.resposta;
  const eu = guarda.sessao.usuario.id;
  const { id } = await ctx.params;

  const corpo = await req.json().catch(() => null);
  const acao = corpo?.acao === "recusar" ? "recusar" : corpo?.acao === "aprovar" ? "aprovar" : "";
  if (!acao) return erroApi("Ação inválida.");

  const db = banco();
  const aprovacao = await db.aprovacoesAcao.findFirst({ where: { id, status: "pendente" } });
  if (!aprovacao) return erroApi("Solicitação não encontrada.", 404, "NAO_ENCONTRADO");
  // Quem solicitou não pode aprovar a própria ação.
  if (aprovacao.solicitadoPor === eu)
    return erroApi("Outro administrador deve analisar esta solicitação.", 403, "SEM_PERMISSAO");
  if (aprovacao.expiraEm < new Date()) {
    await db.aprovacoesAcao.update({ where: { id }, data: { status: "expirada" } });
    return erroApi("Solicitação expirada.", 410, "EXTRAVIOU_PRAZO");
  }
  if (!(await confereSenhaAdmin(eu, corpo?.senha)))
    return erroApi("Senha incorreta.", 403, "SEM_PERMISSAO");

  if (acao === "recusar") {
    await db.aprovacoesAcao.update({
      where: { id },
      data: { status: "recusada", aprovadoPor: eu },
    });
    await registrarEvento({
      atorId: eu,
      acao: "RECUSAR_ACAO",
      email: aprovacao.alvoEmail,
      req,
      detalhe: { tipo: aprovacao.tipo },
    });
    return json({ ok: true });
  }

  const usuario = await db.usuarios.findFirst({ where: { id: aprovacao.alvoId } });
  if (!usuario) {
    await db.aprovacoesAcao.update({ where: { id }, data: { status: "expirada" } });
    return erroApi("A conta de destino não existe mais.", 404, "NAO_ENCONTRADO");
  }
  if (ehAdminBootstrap(usuario.email))
    return erroApi("A conta de administração inicial não pode ser afetada.", 403, "SEM_PERMISSAO");
  if (usuario.papel === "admin" && (await ehUltimoAdmin(usuario.id)))
    return erroApi("Não é possível afetar o último administrador ativo.");

  const alvo = alvoDeLinha({ id: usuario.id, email: usuario.email, papel: usuario.papel });
  if (aprovacao.tipo === "suspender") {
    await suspenderUsuario({ atorId: eu, alvo, motivo: aprovacao.motivo, req });
  } else if (aprovacao.tipo === "excluir") {
    await excluirUsuario({ atorId: eu, alvo, motivo: aprovacao.motivo, req });
  }

  await db.aprovacoesAcao.update({
    where: { id },
    data: { status: "aprovada", aprovadoPor: eu },
  });
  await registrarEvento({
    atorId: eu,
    acao: "APROVAR_ACAO",
    email: aprovacao.alvoEmail,
    req,
    detalhe: { tipo: aprovacao.tipo, motivo: aprovacao.motivo },
  });
  return json({ ok: true });
}
