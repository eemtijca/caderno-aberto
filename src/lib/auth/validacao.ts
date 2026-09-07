// Validação e normalização de e-mail e nome.

/** Normaliza o e-mail (minúsculas, sem espaços) ou responde null. */
export function normalizarEmail(valor: unknown): string | null {
  if (typeof valor !== "string") return null
  const email = valor.trim().toLowerCase()
  if (email.length < 5 || email.length > 254) return null
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return null
  return email
}

/** Normaliza o nome do professor ou responde null. */
export function normalizarNome(valor: unknown): string | null {
  if (typeof valor !== "string") return null
  const nome = valor.trim().replace(/\s+/g, " ").slice(0, 120)
  return nome.length >= 2 ? nome : null
}

/** Origem pública da aplicação para compor links. Prioriza os cabeçalhos de host. */
export function origemApp(req: Request): string {
  const host =
    req.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ??
    req.headers.get("host") ??
    "127.0.0.1:3000"
  const proto =
    req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ??
    (host.startsWith("localhost") || host.startsWith("127.") || host.startsWith("192.168.")
      ? "http"
      : "https")
  return `${proto}://${host}`
}
