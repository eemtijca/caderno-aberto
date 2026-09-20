// Restauração em lote da lixeira, misturando notas e links.

import { NextRequest } from "next/server";
import { banco } from "@/lib/banco";
import { sessaoProfessor, json, erroApi, naoAutenticado } from "@/lib/api/sessao";
import { separarIds } from "@/lib/api/lote";

export const dynamic = "force-dynamic";

async function restaurar(
  tabela: "notas" | "links",
  professorId: string,
  candidatos: string[],
): Promise<{ restaurados: string[]; ausentes: string[] }> {
  if (candidatos.length === 0) return { restaurados: [], ausentes: [] };
  const db = banco();
  const existentes =
    tabela === "notas"
      ? await db.notas.findMany({
          where: { professorId, id: { in: candidatos }, excluidoEm: { not: null } },
          select: { id: true },
        })
      : await db.links.findMany({
          where: { professorId, id: { in: candidatos }, excluidoEm: { not: null } },
          select: { id: true },
        });
  const ids = existentes.map((e) => e.id);
  const ausentes = candidatos.filter((id) => !ids.includes(id));
  if (ids.length === 0) return { restaurados: [], ausentes };

  if (tabela === "notas") {
    // Restaurar a nota traz de volta os links que foram para a lixeira com ela.
    await db.notas.updateMany({
      where: { professorId, id: { in: ids } },
      data: { excluidoEm: null },
    });
    await db.links.updateMany({
      where: { professorId, notaId: { in: ids }, excluidoEm: { not: null } },
      data: { excluidoEm: null },
    });
  } else {
    await db.links.updateMany({
      where: { professorId, id: { in: ids } },
      data: { excluidoEm: null },
    });
  }
  return { restaurados: ids, ausentes };
}

export async function POST(req: NextRequest) {
  const sessao = await sessaoProfessor(req);
  if (!sessao) return naoAutenticado();
  const { usuario } = sessao;

  const corpo = await req.json().catch(() => null);
  if (corpo?.acao !== "restaurar") return erroApi("Ação inválida.");
  const notas = separarIds(corpo?.notas ?? []);
  const links = separarIds(corpo?.links ?? []);
  if (!notas || !links) return erroApi("Informe de 1 a 100 identificadores por tipo.");
  if (notas.validos.length + links.validos.length === 0) {
    return erroApi("Selecione ao menos um item.");
  }

  const resultadoNotas = await restaurar("notas", usuario.id, notas.validos);
  const resultadoLinks = await restaurar("links", usuario.id, links.validos);
  return json({
    ok: true,
    restaurados: {
      notas: resultadoNotas.restaurados.length,
      links: resultadoLinks.restaurados.length,
    },
    ausentes: [
      ...notas.invalidos,
      ...links.invalidos,
      ...resultadoNotas.ausentes,
      ...resultadoLinks.ausentes,
    ],
  });
}
