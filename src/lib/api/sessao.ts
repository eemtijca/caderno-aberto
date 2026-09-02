import "server-only"

// Helpers das rotas de API: sessão do professor, respostas e erros padronizados.

import { NextResponse } from "next/server"
import type { SupabaseClient, User } from "@supabase/supabase-js"
import { clienteServidor } from "@/lib/supabase/servidor"
import type { Database, PerfilLinha } from "@/lib/supabase/tipos"

export interface SessaoProfessor {
  cliente: SupabaseClient<Database>
  usuario: User
  perfil: PerfilLinha | null
}

// Sessão do professor logado (validada contra o servidor de
// auth . Nunca confiamos apenas no JWT). Null se não houver.
export async function sessaoProfessor(): Promise<SessaoProfessor | null> {
  const cliente = await clienteServidor()
  const { data, error } = await cliente.auth.getUser()
  if (error || !data.user) return null

  const { data: perfil } = await cliente
    .from("profiles")
    .select("*")
    .eq("id", data.user.id)
    .maybeSingle()

  return { cliente, usuario: data.user, perfil: perfil ?? null }
}

/** Resposta JSON sem cache (dados personalizados por usuário). */
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
