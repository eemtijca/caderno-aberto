// Totais do painel administrativo.

import { NextRequest } from "next/server";
import { banco } from "@/lib/banco";
import { json } from "@/lib/api/sessao";
import { exigirAdmin } from "@/lib/api/admin";

export const dynamic = "force-dynamic";

// GET /api/admin/resumo. Contadores exibidos no topo do console.
export async function GET(req: NextRequest) {
  const guarda = await exigirAdmin(req);
  if (!guarda.ok) return guarda.resposta;

  const db = banco();
  const agora = new Date();
  const [pendentes, codigosAtivos, usuarios, inativos] = await Promise.all([
    db.solicitacoesAcesso.count({ where: { status: "pendente" } }),
    db.codigosAcesso.count({ where: { usadoEm: null, expiraEm: { gt: agora } } }),
    db.usuarios.count(),
    db.usuarios.count({ where: { ativadoEm: null } }),
  ]);

  return json({
    solicitacoesPendentes: pendentes,
    codigosAtivos,
    usuarios,
    usuariosInativos: inativos,
  });
}
