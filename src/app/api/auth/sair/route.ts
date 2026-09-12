// Encerra a sessão do professor e limpa os cookies.

import { NextRequest } from "next/server";
import { json } from "@/lib/api/sessao";
import { encerrarSessao } from "@/lib/auth/sessao";

export const dynamic = "force-dynamic";

// POST /api/auth/sair. Apaga o refresh e limpa os cookies.
export async function POST(req: NextRequest) {
  await encerrarSessao(req);
  return json({ ok: true });
}
