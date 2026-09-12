// Trilha de auditoria dos eventos de segurança.

import { NextRequest } from "next/server";
import { banco } from "@/lib/banco";
import { json } from "@/lib/api/sessao";
import { exigirAdmin } from "@/lib/api/admin";
import { mascararEmail } from "@/lib/auth/validacao";

export const dynamic = "force-dynamic";

// GET /api/admin/auditoria?acao=. Lista os eventos recentes.
export async function GET(req: NextRequest) {
  const guarda = await exigirAdmin(req);
  if (!guarda.ok) return guarda.resposta;

  const acao = req.nextUrl.searchParams.get("acao") ?? "";
  const db = banco();
  const linhas = await db.eventosSeguranca.findMany({
    where: acao ? { acao } : {},
    orderBy: { criadoEm: "desc" },
    take: 200,
  });
  return json({
    eventos: linhas.map((e) => ({
      id: e.id,
      acao: e.acao,
      email: e.email ? mascararEmail(e.email) : "",
      ip: e.ip,
      criadoEm: e.criadoEm.toISOString(),
      detalhe: e.detalhe,
    })),
  });
}
