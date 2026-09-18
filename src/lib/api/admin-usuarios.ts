// Operações destrutivas de administração sobre uma conta, com auditoria.
import "server-only";

import { banco } from "@/lib/banco";
import { registrarEvento } from "@/lib/api/auditoria";

interface Alvo {
  id: string;
  email: string;
  papel: string;
}

/** Suspende a conta, encerra sessões, revoga códigos e registra o motivo. */
export async function suspenderUsuario(entrada: {
  atorId: string;
  alvo: Alvo;
  motivo: string;
  req?: Request;
}): Promise<void> {
  const db = banco();
  await db.$transaction(async (tx) => {
    await tx.profiles.update({
      where: { id: entrada.alvo.id },
      data: { statusConta: "suspenso", motivo: entrada.motivo, suspensoEm: new Date() },
    });
    await tx.sessoes.deleteMany({ where: { usuarioId: entrada.alvo.id } });
    await tx.codigosAcesso.deleteMany({ where: { usuarioId: entrada.alvo.id, usadoEm: null } });
  });
  await registrarEvento({
    atorId: entrada.atorId,
    acao: "SUSPENDER_USUARIO",
    email: entrada.alvo.email,
    req: entrada.req,
    detalhe: { motivo: entrada.motivo },
  });
}

/** Reativa a conta suspensa. */
export async function reativarUsuario(entrada: {
  atorId: string;
  alvo: Alvo;
  req?: Request;
}): Promise<void> {
  const db = banco();
  await db.profiles.update({
    where: { id: entrada.alvo.id },
    data: { statusConta: "ativo", motivo: "", suspensoEm: null },
  });
  await registrarEvento({
    atorId: entrada.atorId,
    acao: "REATIVAR_USUARIO",
    email: entrada.alvo.email,
    req: entrada.req,
  });
}

/** Exclui a conta em cascata, preservando o motivo na auditoria. */
export async function excluirUsuario(entrada: {
  atorId: string;
  alvo: Alvo;
  motivo: string;
  req?: Request;
}): Promise<void> {
  const db = banco();
  await db.usuarios.delete({ where: { id: entrada.alvo.id } });
  await registrarEvento({
    atorId: entrada.atorId,
    acao: "EXCLUIR_USUARIO",
    email: entrada.alvo.email,
    req: entrada.req,
    detalhe: { motivo: entrada.motivo },
  });
}

export type TipoAprovacao = "suspender" | "excluir";

/** Cria a solicitação de aprovação (quatro olhos) com validade de 7 dias. */
export async function criarAprovacao(entrada: {
  tipo: TipoAprovacao;
  alvo: Alvo;
  motivo: string;
  solicitanteId: string;
}) {
  const db = banco();
  return db.aprovacoesAcao.create({
    data: {
      tipo: entrada.tipo,
      alvoId: entrada.alvo.id,
      alvoEmail: entrada.alvo.email,
      motivo: entrada.motivo,
      solicitadoPor: entrada.solicitanteId,
      expiraEm: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
}

export function alvoDeLinha(u: { id: string; email: string; papel: string }): Alvo {
  return { id: u.id, email: u.email, papel: u.papel };
}
