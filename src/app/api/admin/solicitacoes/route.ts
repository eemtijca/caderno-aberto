// Fila de solicitações de acesso.

import { NextRequest } from "next/server";
import { banco } from "@/lib/banco";
import { json } from "@/lib/api/sessao";
import { exigirAdmin } from "@/lib/api/admin";

export const dynamic = "force-dynamic";

const STATUS = new Set(["pendente", "atendida", "cancelada"]);

// GET /api/admin/solicitacoes?status=pendente. Lista os pedidos recentes.
export async function GET(req: NextRequest) {
  const guarda = await exigirAdmin(req);
  if (!guarda.ok) return guarda.resposta;

  const status = req.nextUrl.searchParams.get("status") ?? "";
  const db = banco();
  const linhas = await db.solicitacoesAcesso.findMany({
    where: STATUS.has(status) ? { status } : {},
    orderBy: { criadoEm: "desc" },
    take: 200,
  });

  return json({
    solicitacoes: linhas.map((s) => ({
      id: s.id,
      nome: s.nome,
      email: s.email,
      tipo: s.tipo,
      status: s.status,
      criadoEm: s.criadoEm.toISOString(),
      atendidaEm: s.atendidaEm?.toISOString() ?? null,
    })),
  });
}
