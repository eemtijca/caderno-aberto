"use client"

// Cliente Supabase para o navegador. Gerencia autenticação, sessão e fluxo PKCE.
import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"
import { SUPABASE_URL, SUPABASE_CHAVE_ANON } from "./ambiente"
import type { Database } from "./tipos"

let cliente: SupabaseClient<Database> | null = null

export function supabaseNavegador(): SupabaseClient<Database> {
  if (!cliente) {
    cliente = createBrowserClient<Database>(SUPABASE_URL, SUPABASE_CHAVE_ANON, {
      auth: {
        flowType: "pkce",
        detectSessionInUrl: true,
      },
    })
  }
  return cliente
}
