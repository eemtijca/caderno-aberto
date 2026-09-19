// Lista e baixa os snapshots criados antes de restaurações.

import { NextRequest, NextResponse } from "next/server";
import { sessaoProfessor, json, erroApi, naoAutenticado } from "@/lib/api/sessao";
import { lerSnapshot, listarSnapshots } from "@/lib/api/backup";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sessao = await sessaoProfessor(req);
  if (!sessao) return naoAutenticado();

  const caminho = req.nextUrl.searchParams.get("caminho");
  if (caminho) {
    const arquivo = await lerSnapshot(sessao.usuario.id, caminho);
    if (!arquivo) return erroApi("Snapshot não encontrado.", 404, "NAO_ENCONTRADO");
    return new NextResponse(new Uint8Array(arquivo.bytes), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="snapshot-caderno.json"`,
        "Cache-Control": "private, no-store",
      },
    });
  }

  return json({ snapshots: await listarSnapshots(sessao.usuario.id) });
}
