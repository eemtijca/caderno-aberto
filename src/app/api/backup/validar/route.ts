// Valida um arquivo de backup e devolve o impacto antes de restaurar (dry-run).

import { NextRequest } from "next/server";
import { sessaoProfessor, json, erroApi, naoAutenticado } from "@/lib/api/sessao";
import { contarDadosAtuais, resumirBackup } from "@/lib/api/backup";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const sessao = await sessaoProfessor(req);
  if (!sessao) return naoAutenticado();

  const corpo = await req.json().catch(() => null);
  const resumo = resumirBackup(corpo);
  if (!resumo) return erroApi("Arquivo de backup inválido.", 400, "VALIDACAO");

  const atual = await contarDadosAtuais(sessao.usuario.id);
  return json({ backup: resumo, atual });
}
