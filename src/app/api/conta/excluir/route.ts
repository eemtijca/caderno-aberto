// Solicita a exclusão da conta do professor, com carência de 24 horas.

import { NextRequest } from "next/server";
import { banco } from "@/lib/banco";
import { sessaoProfessor, json, erroApi, naoAutenticado } from "@/lib/api/sessao";
import { confereSenha } from "@/lib/auth/senha";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const sessao = await sessaoProfessor(req);
  if (!sessao) return naoAutenticado();
  const { usuario } = sessao;

  const corpo = await req.json().catch(() => null);
  const senha = typeof corpo?.senha === "string" ? corpo.senha : "";
  const confirmacao = typeof corpo?.confirmacao === "string" ? corpo.confirmacao : "";
  // Exige senha e a palavra EXCLUIR para evitar exclusões acidentais.
  if (!senha) return erroApi("Confirme com a senha para solicitar a exclusão.");
  if (confirmacao !== "EXCLUIR") return erroApi("Digite EXCLUIR para confirmar.");

  const db = await banco();
  const linha = await db.usuarios.findFirst({ where: { id: usuario.id } });
  if (!linha || !(await confereSenha(senha, linha.senhaHash))) {
    return erroApi("Senha incorreta.", 403);
  }

  const agora = new Date();
  const expira = new Date(agora.getTime() + 24 * 60 * 60 * 1000);

  await db.$transaction(async (tx) => {
    await tx.profiles.update({
      where: { id: usuario.id },
      data: {
        exclusaoSolicitadaEm: agora.toISOString(),
        expiraEm: expira.toISOString(),
      },
    });
    const links = await tx.links.findMany({ where: { professorId: usuario.id } });
    for (const link of links) {
      // Só pausa os ativos; os já pausados continuam pausados na restauração.
      if (link.ativo)
        await tx.links.update({
          where: { id: link.id },
          data: { ativo: false, pausadoNaExclusao: true },
        });
    }
  });

  return json({ ok: true, expiraEm: expira.toISOString() });
}
