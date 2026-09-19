// Autentica o usuário e abre a sessão via cookies.

import { NextRequest } from "next/server";
import { banco } from "@/lib/banco";
import { erroApi, json } from "@/lib/api/sessao";
import { cabeNoLimite, chavePorIp } from "@/lib/api/limite";
import { confereSenha, hashDesatualizado, hashSenha } from "@/lib/auth/senha";
import { iniciarSessao } from "@/lib/auth/sessao";
import { normalizarEmail } from "@/lib/auth/validacao";
import { registrarEvento } from "@/lib/api/auditoria";

export const dynamic = "force-dynamic";

// Hash fictício para equiparar o tempo quando o e-mail não existe.
const HASH_FALSO =
  "scrypt$16384$8$1$00000000000000000000000000000000$00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";

// POST /api/auth/entrar. Confere credenciais e abre a sessão (cookies).
// Respostas genéricas para não revelar contas existentes ou inativas.
export async function POST(req: NextRequest) {
  // Limita tentativas de login por IP.
  const limite = await cabeNoLimite(chavePorIp(req, "entrar"));
  if (!limite.permitido)
    return erroApi("Muitas tentativas. Aguarde um momento e tente novamente.", 429);

  const corpo = await req.json().catch(() => null);
  const email = normalizarEmail(corpo?.email);
  const senha = typeof corpo?.senha === "string" ? corpo.senha : "";
  if (!email || !senha) {
    await registrarEvento({ acao: "LOGIN_FALHA", email: email ?? "", req });
    return erroApi("E-mail ou senha incorretos.", 401);
  }

  const db = banco();
  const usuario = await db.usuarios.findFirst({ where: { email } });
  // Conta sem senha definida usa o hash falso para igualar o tempo.
  const hashParaConferir = usuario?.senhaHash ? usuario.senhaHash : HASH_FALSO;
  const confere = await confereSenha(senha, hashParaConferir);
  // Conta inexistente ou senha errada: mesma resposta genérica.
  if (!usuario || !confere) {
    await registrarEvento({ acao: "LOGIN_FALHA", email, req });
    return erroApi("E-mail ou senha incorretos.", 401, "NAO_AUTENTICADO");
  }

  const perfil = await db.profiles.findFirst({ where: { id: usuario.id } });

  // Só revela o estado da conta depois de conferir a senha (sem enumeração).
  if (!usuario.ativadoEm) {
    await registrarEvento({ acao: "LOGIN_FALHA", email, req, detalhe: { motivo: "pendente" } });
    return erroApi(
      "Conta pendente de ativação. Use o código de primeiro acesso.",
      403,
      "CONTA_PENDENTE",
    );
  }
  if (perfil?.statusConta === "suspenso") {
    await registrarEvento({ acao: "LOGIN_FALHA", email, req, detalhe: { motivo: "suspenso" } });
    return json(
      {
        erro: "Conta desativada pela administração.",
        codigo: "CONTA_SUSPENSA",
        detalhe: { motivo: perfil.motivo ?? "", suspensoEm: perfil.suspensoEm ?? null },
      },
      403,
    );
  }
  // Conta em carência de exclusão ainda entra para poder restaurar. Somente o
  // prazo vencido recusa o login.
  if (perfil?.expiraEm && perfil.expiraEm < new Date()) {
    await registrarEvento({ acao: "LOGIN_FALHA", email, req, detalhe: { motivo: "carencia" } });
    return erroApi("E-mail ou senha incorretos.", 401, "NAO_AUTENTICADO");
  }

  // Sobescreve o hash se os parâmetros mudaram, sem interromper o login.
  if (hashDesatualizado(usuario.senhaHash)) {
    const novoHash = await hashSenha(senha);
    await db.usuarios
      .update({ where: { id: usuario.id }, data: { senhaHash: novoHash } })
      .catch(() => undefined);
  }

  // "Manter conectado" define se o cookie de refresh é persistente.
  const manterConectado = corpo?.manterConectado !== false;
  await iniciarSessao(
    usuario.id,
    req,
    usuario.papel === "admin" ? "admin" : "professor",
    manterConectado,
  );
  await registrarEvento({ atorId: usuario.id, acao: "LOGIN_OK", email, req });
  return json({ ok: true });
}
