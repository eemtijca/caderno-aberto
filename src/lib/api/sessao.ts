import "server-only"

import { NextRequest, NextResponse } from "next/server"
import { banco } from "@/lib/banco"
import { sessaoRequisicao, type SessaoUsuario } from "@/lib/auth/sessao"
import type { PerfilLinha } from "@/lib/banco/tipos"

export interface SessaoProfessor {
  usuario: SessaoUsuario
  perfil: PerfilLinha | null
}

// Guarda única de sessão para rotas privadas.
/** Sessão da requisição com perfil. Null sem sessão válida. */
export async function sessaoProfessor(req?: NextRequest): Promise<SessaoProfessor | null> {
  const requisicao =
    req ?? ({ cookies: { get: () => undefined }, headers: new Headers() } as unknown as NextRequest)
  const usuario = await sessaoRequisicao(requisicao).catch(() => null)
  if (!usuario) return null

  const db = banco()
  const perfil = (await db.profiles.findFirst({ where: { id: usuario.id } })) as PerfilLinha | null

  // Contas com carência vencida não autenticam.
  if (perfil?.expiraEm && perfil.expiraEm < new Date()) return null

  return { usuario, perfil }
}

export function json(dados: unknown, status = 200): NextResponse {
  return NextResponse.json(dados, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  })
}

export function erroApi(mensagem: string, status = 400): NextResponse {
  return json({ erro: mensagem }, status)
}

export function naoAutenticado(): NextResponse {
  return json({ erro: "Faça login como professor para continuar." }, 401)
}
