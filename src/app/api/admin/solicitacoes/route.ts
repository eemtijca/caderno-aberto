// Fila de solicitações de acesso.

import { NextRequest } from "next/server";
import { banco } from "@/lib/banco";
import { json } from "@/lib/api/sessao";
import { exigirAdmin } from "@/lib/api/admin";
import { parametrosPagina } from "@/lib/api/paginacao";

export const dynamic = "force-dynamic";

const STATUS = new Set(["pendente", "atendida", "cancelada"]);

// GET /api/admin/solicitacoes?status=pendente. Lista os pedidos recentes.
export async function GET(req: NextRequest) {
  const guarda = await exigirAdmin(req);
  if (!guarda.ok) return guarda.resposta;

  const status = req.nextUrl.searchParams.get("status") ?? "";
  const where = STATUS.has(status) ? { status } : {};
  const { pagina, porPagina, skip, take } = parametrosPagina(req);
  const db = banco();
  const [linhas, total] = await Promise.all([
    db.solicitacoesAcesso.findMany({
      where,
      orderBy: [{ criadoEm: "desc" }, { id: "desc" }],
      skip,
      take,
    }),
    db.solicitacoesAcesso.count({ where }),
  ]);

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
    total,
    pagina,
    porPagina,
  });
}
