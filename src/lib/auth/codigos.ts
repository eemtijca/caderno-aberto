// Emissão de códigos de acesso: gera, invalida os anteriores e persiste o HMAC.
import { banco } from "@/lib/banco";
import { CODIGO_EXPIRA_MINUTOS } from "@/lib/ambiente";
import { gerarCodigo, hashCodigo } from "./codigo";

export type TipoCodigo = "primeiro_acesso" | "recuperacao";

export interface CodigoEmitido {
  codigo: string;
  expiraEm: Date;
}

/** Gera um código novo, revogando os ativos anteriores do mesmo par (e-mail, tipo). */
export async function emitirCodigo(
  usuarioId: string,
  email: string,
  tipo: TipoCodigo,
  criadoPor: string | null,
): Promise<CodigoEmitido> {
  const db = banco();
  const codigo = gerarCodigo();
  const expiraEm = new Date(Date.now() + CODIGO_EXPIRA_MINUTOS * 60 * 1000);
  const codigoHash = hashCodigo(email, tipo, codigo);
  await db.$transaction(async (tx) => {
    // Um código ativo por (e-mail, tipo): o anterior deixa de valer.
    await tx.codigosAcesso.deleteMany({ where: { usuarioId, tipo, usadoEm: null } });
    await tx.codigosAcesso.create({
      data: { usuarioId, email, tipo, codigoHash, criadoPor, expiraEm },
    });
  });
  return { codigo, expiraEm };
}
