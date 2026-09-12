// Recebe pedidos de primeiro acesso ou recuperação e alimenta a fila da administração.

import { NextRequest } from "next/server";
import { banco } from "@/lib/banco";
import { erroApi, json } from "@/lib/api/sessao";
import { cabeNoLimite, chavePorIp } from "@/lib/api/limite";
import { normalizarEmail, normalizarNome } from "@/lib/auth/validacao";
import { registrarEvento } from "@/lib/api/auditoria";

export const dynamic = "force-dynamic";

const TIPOS = new Set(["primeiro_acesso", "recuperacao"]);

// POST /api/auth/solicitar {nome?, email, tipo}. Resposta sempre genérica.
export async function POST(req: NextRequest) {
  const limite = await cabeNoLimite(chavePorIp(req, "solicitar"));
  if (!limite.permitido)
    return erroApi("Muitas solicitações em pouco tempo. Tente novamente em alguns minutos.", 429);

  const corpo = await req.json().catch(() => null);
  const email = normalizarEmail(corpo?.email);
  const tipo = typeof corpo?.tipo === "string" ? corpo.tipo : "";
  const nome = normalizarNome(corpo?.nome) ?? "";
  if (!email || !TIPOS.has(tipo)) return erroApi("Dados inválidos.");

  const db = banco();
  const usuario = await db.usuarios.findFirst({ where: { email } });

  // Só entra na fila quem pode receber código: conta existente no primeiro
  // acesso ou conta ativa na recuperação. O restante recebe a mesma resposta.
  const elegivel =
    tipo === "primeiro_acesso" ? !usuario || !usuario.ativadoEm : Boolean(usuario?.ativadoEm);

  if (elegivel) {
    const pendente = await db.solicitacoesAcesso.findFirst({
      where: { email, tipo, status: "pendente" },
    });
    if (!pendente) {
      await db.solicitacoesAcesso
        .create({ data: { nome: nome || usuario?.email.split("@")[0] || "", email, tipo } })
        .catch(() => undefined);
    }
    await registrarEvento({ acao: "SOLICITAR_ACESSO", email, req, detalhe: { tipo } });
  }

  return json({ ok: true });
}
