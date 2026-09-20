// Lista solicitações de ação destrutiva aguardando aprovação (quatro olhos).

import { NextRequest } from "next/server";
import { banco } from "@/lib/banco";
import { json } from "@/lib/api/sessao";
import { exigirAdmin } from "@/lib/api/admin";
import { parametrosPagina } from "@/lib/api/paginacao";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const guarda = await exigirAdmin(req);
  if (!guarda.ok) return guarda.resposta;

  const where = { status: "pendente" };
  const { pagina, porPagina, skip, take } = parametrosPagina(req);
  const db = banco();
  const [linhas, total] = await Promise.all([
    db.aprovacoesAcao.findMany({
      where,
      orderBy: [{ criadoEm: "desc" }, { id: "desc" }],
      skip,
      take,
    }),
    db.aprovacoesAcao.count({ where }),
  ]);
  return json({
    aprovacoes: linhas.map((a) => ({
      id: a.id,
      tipo: a.tipo,
      alvoEmail: a.alvoEmail,
      motivo: a.motivo,
      solicitadoPor: a.solicitadoPor,
      expiraEm: a.expiraEm.toISOString(),
      criadoEm: a.criadoEm.toISOString(),
    })),
    total,
    pagina,
    porPagina,
  });
}
