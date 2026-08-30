import "server-only"

// Cliente Supabase do servidor (rotas de API e render no servidor). Uma instância por requisição com os cookies do usuário. O RLS é aplicado com o JWT do professor logado.

import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"
import { SUPABASE_URL, SUPABASE_CHAVE_ANON } from "./ambiente"
import type { Database } from "./tipos"

/** Cria o cliente com a sessão do professor (cookies da requisição). */
export async function clienteServidor(): Promise<SupabaseClient<Database>> {
  const jar = await cookies()

  return createServerClient<Database>(SUPABASE_URL, SUPABASE_CHAVE_ANON, {
    cookies: {
      getAll() {
        return jar.getAll()
      },
      setAll(lista) {
        try {
          for (const { name, value, options } of lista) {
            jar.set(name, value, options)
          }
        } catch {
          // chamadas de leitura (p.ex. render de componentes) não podem
          // definir cookies. O proxy cuida da renovação da sessão
        }
      },
    },
  })
}

/** Cliente SEM sessão (chave anon) . Para rotas públicas. */
export function clienteAnon(): SupabaseClient<Database> {
  // sem cookies: as políticas TO anon aplicam
  return createServerClient<Database>(SUPABASE_URL, SUPABASE_CHAVE_ANON, {
    cookies: {
      getAll: () => [],
      setAll: () => undefined,
    },
  })
}
