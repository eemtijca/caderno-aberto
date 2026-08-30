// Variáveis de ambiente do Supabase. Suporta URL dinâmica em Codespaces.
function obterUrlSupabase(): string {
  const direta =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL_PRODUCTION ?? ""
  if (direta) return direta
  if (typeof window !== "undefined") {
    const host = window.location.hostname
    if (host.includes("app.github.dev")) {
      const base = host.replace(/-3000\./, "-54321.")
      return `https://${base}`
    }
  }
  const nome = process.env.CODESPACE_NAME ?? process.env.NEXT_PUBLIC_CODESPACE_NAME ?? ""
  const dominio = process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN ?? "app.github.dev"
  if (nome) return `https://${nome}-54321.${dominio}`
  return "http://127.0.0.1:54321"
}

export const SUPABASE_URL = obterUrlSupabase()

export const SUPABASE_CHAVE_ANON =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  ""

export const SUPABASE_CHAVE_SERVICO = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""

export function supabaseConfigurado(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_CHAVE_ANON)
}
