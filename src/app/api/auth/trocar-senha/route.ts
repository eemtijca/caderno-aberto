// Troca a senha do professor autenticado e reemite a sessão.

import { NextRequest } from "next/server";
import { banco } from "@/lib/banco";
import { erroApi, json, naoAutenticado, sessaoProfessor } from "@/lib/api/sessao";
import { confereSenha, hashSenha, senhaValida } from "@/lib/auth/senha";
import { iniciarSessao } from "@/lib/auth/sessao";

export const dynamic = "force-dynamic";

// POST /api/auth/trocar-senha {atual, nova}. Exige a senha atual,
// troca o hash e invalida todas as sessões (a atual é reemitida).
export async function POST(req: NextRequest) {
  const sessao = await sessaoProfessor(req);
  if (!sessao) return naoAutenticado();

  const corpo = await req.json().catch(() => null);
  const atual = typeof corpo?.atual === "string" ? corpo.atual : "";
  const nova = typeof corpo?.nova === "string" ? corpo.nova : "";
  if (!atual) return erroApi("Informe a senha atual.");
  if (!nova) return erroApi("Informe a nova senha.");
  if (!senhaValida(nova)) return erroApi("A senha deve ter pelo menos 8 caracteres.");

  const db = banco();
  const usuario = await db.usuarios.findFirst({ where: { id: sessao.usuario.id } });
  if (!usuario) return naoAutenticado();
  if (!(await confereSenha(atual, usuario.senhaHash))) {
    return erroApi("Senha atual incorreta.", 403);
  }
  // Impede reutilizar a senha atual.
  if (await confereSenha(nova, usuario.senhaHash)) {
    return erroApi("A nova senha é igual à atual.");
  }

  // Derruba as sessões antigas e reabre a atual em seguida.
  await db.$transaction(async (tx) => {
    await tx.usuarios.update({
      where: { id: usuario.id },
      data: { senhaHash: await hashSenha(nova) },
    });
    await tx.sessoes.deleteMany({ where: { usuarioId: usuario.id } });
  });
  await iniciarSessao(usuario.id, req, usuario.papel === "admin" ? "admin" : "professor");

  return json({ ok: true });
}
