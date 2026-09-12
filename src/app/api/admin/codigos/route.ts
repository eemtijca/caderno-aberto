// Lista e emite códigos de acesso diretamente (sem solicitação prévia).

import { NextRequest } from "next/server";
import { banco } from "@/lib/banco";
import { erroApi, json } from "@/lib/api/sessao";
import { exigirAdmin } from "@/lib/api/admin";
import { registrarEvento } from "@/lib/api/auditoria";
import { normalizarEmail, normalizarNome } from "@/lib/auth/validacao";
import { criarContaInativa } from "@/lib/auth/contas";
import { emitirCodigo, type TipoCodigo } from "@/lib/auth/codigos";

export const dynamic = "force-dynamic";

const TIPOS = new Set(["primeiro_acesso", "recuperacao"]);

// GET /api/admin/codigos. Lista os códigos recentes com o status derivado.
export async function GET(req: NextRequest) {
  const guarda = await exigirAdmin(req);
  if (!guarda.ok) return guarda.resposta;

  const db = banco();
  const linhas = await db.codigosAcesso.findMany({
    orderBy: { criadoEm: "desc" },
    take: 200,
  });
  const agora = new Date();
  return json({
    codigos: linhas.map((c) => ({
      id: c.id,
      email: c.email,
      tipo: c.tipo,
      criadoEm: c.criadoEm.toISOString(),
      expiraEm: c.expiraEm.toISOString(),
      usadoEm: c.usadoEm?.toISOString() ?? null,
      status: c.usadoEm ? "usado" : c.expiraEm < agora ? "expirado" : "ativo",
    })),
  });
}

// POST /api/admin/codigos {email, tipo, nome?}. Emite e devolve o código uma vez.
export async function POST(req: NextRequest) {
  const guarda = await exigirAdmin(req);
  if (!guarda.ok) return guarda.resposta;

  const corpo = await req.json().catch(() => null);
  const email = normalizarEmail(corpo?.email);
  const tipo = typeof corpo?.tipo === "string" ? corpo.tipo : "";
  const nome = normalizarNome(corpo?.nome) ?? "";
  if (!email || !TIPOS.has(tipo)) return erroApi("Dados inválidos.");
  const tipoCodigo = tipo as TipoCodigo;

  const db = banco();
  let usuario = await db.usuarios.findFirst({ where: { email } });
  if (!usuario) {
    if (tipoCodigo === "recuperacao") return erroApi("Conta não encontrada para este e-mail.", 404);
    usuario = await criarContaInativa(email, nome);
  } else if (tipoCodigo === "recuperacao" && !usuario.ativadoEm) {
    return erroApi("Conta ainda não ativada. Emita o código de primeiro acesso.");
  }

  const adminId = guarda.sessao.usuario.id;
  const { codigo, expiraEm } = await emitirCodigo(usuario.id, usuario.email, tipoCodigo, adminId);
  await registrarEvento({
    atorId: adminId,
    acao: "GERAR_CODIGO",
    email: usuario.email,
    req,
    detalhe: { tipo: tipoCodigo, origem: "direto" },
  });

  return json({
    codigo,
    expiraEm: expiraEm.toISOString(),
    email: usuario.email,
    tipo: tipoCodigo,
  });
}
