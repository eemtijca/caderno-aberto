// Valida um código de acesso e define a senha (primeiro acesso ou recuperação).

import { NextRequest } from "next/server";
import { banco } from "@/lib/banco";
import { erroApi, json } from "@/lib/api/sessao";
import {
  LIMITE_VERIFICACAO_CODIGO,
  cabeNoLimite,
  chavePorEmail,
  chavePorIp,
  excedeLimite,
  limparTentativas,
  registrarTentativa,
} from "@/lib/api/limite";
import { confereCodigo, normalizarCodigo } from "@/lib/auth/codigo";
import { hashSenha, senhaValida } from "@/lib/auth/senha";
import { iniciarSessao } from "@/lib/auth/sessao";
import { normalizarEmail } from "@/lib/auth/validacao";
import { registrarEvento } from "@/lib/api/auditoria";

export const dynamic = "force-dynamic";

// POST /api/auth/usar-codigo {email, codigo, novaSenha}.
export async function POST(req: NextRequest) {
  const limite = await cabeNoLimite(chavePorIp(req, "usar-codigo"));
  if (!limite.permitido)
    return erroApi("Muitas tentativas. Aguarde um momento e tente novamente.", 429);

  const corpo = await req.json().catch(() => null);
  const email = normalizarEmail(corpo?.email);
  const codigo = normalizarCodigo(corpo?.codigo);
  const novaSenha = typeof corpo?.novaSenha === "string" ? corpo.novaSenha : "";
  if (!email || !codigo || !senhaValida(novaSenha)) {
    return erroApi("Código inválido ou expirado.");
  }

  const chave = chavePorEmail("codigo", email);
  const tentativas = await excedeLimite(chave, LIMITE_VERIFICACAO_CODIGO);
  if (tentativas.excedido) {
    return erroApi(
      "Muitas tentativas com este e-mail. Solicite um novo código à administração.",
      429,
    );
  }

  const db = banco();
  const usuario = await db.usuarios.findFirst({ where: { email } });
  if (!usuario) {
    await registrarTentativa(chave);
    await registrarEvento({ acao: "USAR_CODIGO_FALHA", email, req });
    return erroApi("Código inválido ou expirado.");
  }

  // Procura um código ativo entre os tipos possíveis, comparando o HMAC.
  const ativos = await db.codigosAcesso.findMany({
    where: { usuarioId: usuario.id, usadoEm: null, expiraEm: { gt: new Date() } },
    orderBy: { criadoEm: "desc" },
  });
  const registro = ativos.find((c) => confereCodigo(email, c.tipo, codigo, c.codigoHash));
  if (!registro) {
    await registrarTentativa(chave);
    await registrarEvento({ acao: "USAR_CODIGO_FALHA", email, req });
    return erroApi("Código inválido ou expirado.");
  }

  // Consome de forma atômica para impedir reuso em requisições concorrentes.
  const consumido = await db.codigosAcesso.updateMany({
    where: { id: registro.id, usadoEm: null },
    data: { usadoEm: new Date() },
  });
  if (consumido.count !== 1) {
    await registrarTentativa(chave);
    await registrarEvento({ acao: "USAR_CODIGO_FALHA", email, req, detalhe: { motivo: "reuso" } });
    return erroApi("Código inválido ou expirado.");
  }

  const senhaHash = await hashSenha(novaSenha);
  await db.$transaction(async (tx) => {
    await tx.usuarios.update({
      where: { id: usuario.id },
      data: {
        senhaHash,
        // Primeiro acesso ativa a conta; recuperação não altera a ativação.
        ...(registro.tipo === "primeiro_acesso" ? { ativadoEm: new Date() } : {}),
      },
    });
    // Qualquer senha nova derruba as sessões antigas.
    await tx.sessoes.deleteMany({ where: { usuarioId: usuario.id } });
  });

  await limparTentativas(chave);
  await registrarEvento({
    atorId: usuario.id,
    acao: "USAR_CODIGO_OK",
    email,
    req,
    detalhe: { tipo: registro.tipo },
  });
  await iniciarSessao(usuario.id, req, usuario.papel === "admin" ? "admin" : "professor");
  return json({ ok: true });
}
