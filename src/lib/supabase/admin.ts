import "server-only"

// Cliente administrativo (service_role). NUNCA chegue ao navegador. Usado apenas onde o RLS não basta: * excluir a conta do usuário (auth.admin.deleteUser) * servir imagens das notas públicas (storage download)

import { createClient } from "@supabase/supabase-js"
import type { SupabaseClient } from "@supabase/supabase-js"
import { SUPABASE_URL, SUPABASE_CHAVE_SERVICO } from "./ambiente"
import type { Database } from "./tipos"

let cliente: SupabaseClient<Database> | null = null

/** Cliente service_role (bypassa RLS). Somente no servidor. */
export function clienteAdmin(): SupabaseClient<Database> {
  if (!cliente) {
    if (!SUPABASE_CHAVE_SERVICO) {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada no servidor.")
    }
    cliente = createClient<Database>(SUPABASE_URL, SUPABASE_CHAVE_SERVICO, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }
  return cliente
}
