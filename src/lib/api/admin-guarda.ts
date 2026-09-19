// Guardas para ações destrutivas de administração: senha, bootstrap e último admin.
import "server-only";

import { banco } from "@/lib/banco";
import { confereSenha } from "@/lib/auth/senha";
import { ADMIN_EMAIL } from "@/lib/ambiente";

/** Confere a senha do próprio administrador que executa a ação (step-up). */
export async function confereSenhaAdmin(usuarioId: string, senha: unknown): Promise<boolean> {
  if (typeof senha !== "string" || !senha) return false;
  const db = banco();
  const linha = await db.usuarios.findFirst({ where: { id: usuarioId } });
  if (!linha) return false;
  return confereSenha(senha, linha.senhaHash);
}

/** Conta de bootstrap definida em ADMIN_EMAIL nunca é suspensa nem excluída. */
export function ehAdminBootstrap(email: string): boolean {
  return Boolean(ADMIN_EMAIL) && email.toLowerCase() === ADMIN_EMAIL!.toLowerCase();
}

/** True quando a remoção/suspensão deixaria a escola sem administrador ativo. */
export async function ehUltimoAdmin(usuarioId: string): Promise<boolean> {
  const db = banco();
  const admins = await db.usuarios.findMany({
    where: { papel: "admin", ativadoEm: { not: null } },
  });
  return admins.length <= 1 && admins.some((a) => a.id === usuarioId);
}
