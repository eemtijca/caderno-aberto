// Lista solicitações de ação destrutiva aguardando aprovação (quatro olhos).

import { NextRequest } from "next/server";
import { banco } from "@/lib/banco";
import { json } from "@/lib/api/sessao";
import { exigirAdmin } from "@/lib/api/admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const guarda = await exigirAdmin(req);
  if (!guarda.ok) return guarda.resposta;

  const db = banco();
  const linhas = await db.aprovacoesAcao.findMany({
    where: { status: "pendente" },
    orderBy: { criadoEm: "desc" },
    take: 100,
  });
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
  });
}
