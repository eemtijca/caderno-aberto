// Rota raiz da API. Expõe o nome, a versão e a revisão do aplicativo, sem autenticação.

import { NextResponse } from "next/server";
import { VERSAO } from "@/lib/versao";

const COMMIT = process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GIT_COMMIT ?? "local";

export async function GET() {
  return NextResponse.json({ app: "Caderno Aberto", versao: VERSAO, commit: COMMIT });
}
