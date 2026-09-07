import "server-only"

import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"
import { SUPABASE_URL, SUPABASE_CHAVE_ANON } from "./ambiente"
import type { Database } from "./tipos"

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
        } catch {}
      },
    },
  })
}

export function clienteAnon(): SupabaseClient<Database> {
  return createServerClient<Database>(SUPABASE_URL, SUPABASE_CHAVE_ANON, {
    cookies: {
      getAll: () => [],
      setAll: () => undefined,
    },
  })
}
