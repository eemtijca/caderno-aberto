// Cancela exclusões pendentes e remove definitivamente contas com carência vencida.

import { NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { banco } from "@/lib/banco";
import { CRON_SECRET, LIXEIRA_DIAS } from "@/lib/ambiente";
import { sessaoProfessor, json, erroApi, naoAutenticado } from "@/lib/api/sessao";

export const dynamic = "force-dynamic";

// POST /api/conta/restaurar. Cancela solicitação de exclusão dentro da carência.
export async function POST(req: NextRequest) {
  const sessao = await sessaoProfessor(req, { permitirCarencia: true });
  if (!sessao) return naoAutenticado();
  const { usuario } = sessao;
  const db = await banco();
  const perfil = await db.profiles.findFirst({ where: { id: usuario.id } });
  if (!perfil?.exclusaoSolicitadaEm) return erroApi("Nenhuma solicitação de exclusão pendente.");
  if (perfil.expiraEm && perfil.expiraEm < new Date())
    return erroApi("Prazo de carência expirado. A conta será removida.", 410);
  await db.$transaction(async (tx) => {
    await tx.profiles.update({
      where: { id: usuario.id },
      data: {
        exclusaoSolicitadaEm: null,
        expiraEm: null,
      },
    });
    const links = await tx.links.findMany({ where: { professorId: usuario.id } });
    for (const link of links) {
      // Reativa só os pausados pela exclusão; os demais seguem como estavam.
      if (link.pausadoNaExclusao)
        await tx.links.update({
          where: { id: link.id },
          data: { ativo: true, pausadoNaExclusao: false },
        });
    }
  });
  return json({ ok: true });
}

// DELETE /api/conta/restaurar. Remove contas com carência vencida.
// Exige sempre o segredo do agendador (CRON_SECRET).
// Sem "confirmar=1" apenas pré-visualiza o que seria removido (dry-run).
export async function DELETE(req: NextRequest) {
  if (!CRON_SECRET) return erroApi("Agendador não configurado.", 503);
  const cabecalho = req.headers.get("authorization") ?? "";
  const esperado = `Bearer ${CRON_SECRET}`;
  const confere =
    cabecalho.length === esperado.length &&
    timingSafeEqual(Buffer.from(cabecalho), Buffer.from(esperado));
  if (!confere) return erroApi("Acesso negado.", 403);
  const confirmar = req.nextUrl.searchParams.get("confirmar") === "1";
  return json({ previa: !confirmar, ...(await removerVencidas(confirmar)) });
}

// GET /api/conta/restaurar. Variante para agendadores que disparam GET
// (Vercel Cron). Exige CRON_SECRET sempre.
export async function GET(req: NextRequest) {
  if (!CRON_SECRET) return erroApi("Agendador não configurado.", 503);
  const cabecalho = req.headers.get("authorization") ?? "";
  const esperado = `Bearer ${CRON_SECRET}`;
  const confere =
    cabecalho.length === esperado.length &&
    timingSafeEqual(Buffer.from(cabecalho), Buffer.from(esperado));
  if (!confere) return erroApi("Acesso negado.", 403);
  const confirmar = req.nextUrl.searchParams.get("confirmar") === "1";
  return json({ previa: !confirmar, ...(await removerVencidas(confirmar)) });
}

async function removerVencidas(confirmar: boolean): Promise<{
  contas: number;
  notas: number;
  links: number;
}> {
  const db = banco();
  const agora = new Date();
  const limiteLixeira = new Date(agora.getTime() - LIXEIRA_DIAS * 24 * 60 * 60 * 1000);

  // Contas com carência vencida, ignorando administradores.
  const perfis = await db.profiles.findMany({
    where: {
      exclusaoSolicitadaEm: { not: null },
      expiraEm: { lt: agora },
      usuario: { papel: { not: "admin" } },
    },
    select: { id: true },
    take: 500,
  });
  if (confirmar) {
    for (const perfil of perfis) {
      await db.usuarios.delete({ where: { id: perfil.id } }).catch(() => undefined);
    }
  }

  // Itens da lixeira além do prazo de retenção.
  const notas = await db.notas.findMany({
    where: { excluidoEm: { lt: limiteLixeira } },
    select: { id: true },
  });
  const links = await db.links.findMany({
    where: { excluidoEm: { lt: limiteLixeira } },
    select: { id: true },
  });
  if (confirmar && notas.length > 0) {
    await db.notas.deleteMany({ where: { id: { in: notas.map((n) => n.id) } } });
  }
  if (confirmar && links.length > 0) {
    await db.links.deleteMany({ where: { id: { in: links.map((l) => l.id) } } });
  }

  return { contas: perfis.length, notas: notas.length, links: links.length };
}
