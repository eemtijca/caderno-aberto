// Criação de contas inativas (ativadas no primeiro acesso por código).
import { banco } from "@/lib/banco";

export type Papel = "admin" | "professor";

/** Cria usuário e perfil sem senha utilizável, pendente de ativação. */
export async function criarContaInativa(email: string, nome: string, papel: Papel = "professor") {
  const db = banco();
  return db.$transaction(async (tx) => {
    const criado = await tx.usuarios.create({ data: { email, papel } });
    await tx.profiles.create({
      data: { id: criado.id, nome: nome || email.split("@")[0], email },
    });
    return criado;
  });
}
