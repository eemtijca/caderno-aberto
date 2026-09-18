// Sessão de professor e helpers de resposta JSON para rotas privadas.
import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { banco } from "@/lib/banco";
import { sessaoRequisicao, type SessaoUsuario } from "@/lib/auth/sessao";
import type { PerfilLinha } from "@/lib/banco/tipos";
import type { CodigoErro } from "@/lib/api/erro";

export interface SessaoProfessor {
  usuario: SessaoUsuario;
  perfil: PerfilLinha | null;
}

// Guarda única de sessão para rotas privadas.
/** Sessão da requisição com perfil. Null sem sessão válida. */
export async function sessaoProfessor(
  req?: NextRequest,
  opcoes?: { permitirCarencia?: boolean },
): Promise<SessaoProfessor | null> {
  // Permite chamar sem Request (ex.: Server Components) criando uma vazia.
  const requisicao =
    req ??
    ({ cookies: { get: () => undefined }, headers: new Headers() } as unknown as NextRequest);
  const usuario = await sessaoRequisicao(requisicao).catch(() => null);
  if (!usuario) return null;

  const db = banco();
  const perfil = (await db.profiles.findFirst({ where: { id: usuario.id } })) as PerfilLinha | null;

  // Contas desativadas perdem o acesso imediatamente.
  if (!usuario.ativadoEm) return null;
  // Contas com carência vencida não autenticam.
  if (perfil?.expiraEm && perfil.expiraEm < new Date()) return null;
  // Conta suspensa pela administração fica bloqueada.
  if (perfil?.statusConta === "suspenso") return null;
  // Conta em carência de exclusão fica bloqueada, exceto nas rotas de recuperação.
  if (perfil?.exclusaoSolicitadaEm && !opcoes?.permitirCarencia) return null;

  return { usuario, perfil };
}

export function json(dados: unknown, status = 200): NextResponse {
  return NextResponse.json(dados, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}

export function erroApi(mensagem: string, status = 400, codigo?: CodigoErro): NextResponse {
  return json({ erro: mensagem, ...(codigo ? { codigo } : {}) }, status);
}

export function naoAutenticado(): NextResponse {
  return erroApi("Faça login para continuar.", 401, "NAO_AUTENTICADO");
}

export function semPermissao(): NextResponse {
  return erroApi("Acesso restrito à administração.", 403, "SEM_PERMISSAO");
}
