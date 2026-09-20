// Trilha de auditoria dos eventos de segurança.

import { NextRequest } from "next/server";
import { banco } from "@/lib/banco";
import { json, erroApi } from "@/lib/api/sessao";
import { exigirAdmin } from "@/lib/api/admin";
import { confereSenhaAdmin } from "@/lib/api/admin-guarda";
import { registrarEvento } from "@/lib/api/auditoria";
import { mascararEmail } from "@/lib/auth/validacao";
import { parametrosPagina } from "@/lib/api/paginacao";

export const dynamic = "force-dynamic";

// GET /api/admin/auditoria?acao=. Lista os eventos recentes.
export async function GET(req: NextRequest) {
  const guarda = await exigirAdmin(req);
  if (!guarda.ok) return guarda.resposta;

  const acao = req.nextUrl.searchParams.get("acao") ?? "";
  const where = acao ? { acao } : {};
  const { pagina, porPagina, skip, take } = parametrosPagina(req);
  const db = banco();
  const [linhas, total] = await Promise.all([
    db.eventosSeguranca.findMany({
      where,
      orderBy: [{ criadoEm: "desc" }, { id: "desc" }],
      skip,
      take,
    }),
    db.eventosSeguranca.count({ where }),
  ]);
  return json({
    eventos: linhas.map((e) => ({
      id: e.id,
      acao: e.acao,
      email: e.email ? mascararEmail(e.email) : "",
      ip: e.ip,
      criadoEm: e.criadoEm.toISOString(),
      detalhe: e.detalhe,
    })),
    total,
    pagina,
    porPagina,
  });
}

// DELETE /api/admin/auditoria. Limpa a trilha mediante confirmação e senha.
export async function DELETE(req: NextRequest) {
  const guarda = await exigirAdmin(req);
  if (!guarda.ok) return guarda.resposta;

  const corpo = await req.json().catch(() => null);
  if (!corpo || corpo.confirmacao !== "LIMPAR") {
    return erroApi("Confirmação inválida.");
  }
  const { usuario } = guarda.sessao;
  if (!(await confereSenhaAdmin(usuario.id, corpo.senha))) {
    return erroApi("Senha incorreta.", 403);
  }

  const db = banco();
  const removidos = await db.eventosSeguranca.deleteMany({});
  // A própria limpeza fica registrada para manter o rastro da ação.
  await registrarEvento({
    atorId: usuario.id,
    acao: "LIMPAR_AUDITORIA",
    email: usuario.email,
    detalhe: { removidos: removidos.count },
    req,
  });
  return json({ ok: true, removidos: removidos.count });
}
