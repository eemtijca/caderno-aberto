// Guarda de administração por requisição. O papel é reconferido no banco.
import type { NextRequest } from "next/server";
import type { NextResponse } from "next/server";
import { naoAutenticado, semPermissao, sessaoProfessor, type SessaoProfessor } from "./sessao";

export type ResultadoAdmin =
  { ok: true; sessao: SessaoProfessor } | { ok: false; resposta: NextResponse };

/** Exige sessão com papel de administrador. */
export async function exigirAdmin(req: NextRequest): Promise<ResultadoAdmin> {
  const sessao = await sessaoProfessor(req);
  if (!sessao) return { ok: false, resposta: naoAutenticado() };
  if (sessao.usuario.papel !== "admin") return { ok: false, resposta: semPermissao() };
  return { ok: true, sessao };
}
