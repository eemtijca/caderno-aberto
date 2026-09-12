// Middleware da aplicação: bloqueio de mutações cross-site (CSRF), cabeçalhos de
// segurança com CSP por nonce e propagação do usuário do JWT na requisição.

import { NextResponse, type NextRequest } from "next/server"
import * as jose from "jose"
import { AUTH_SECRET } from "@/lib/ambiente"

const SEGREDO = new TextEncoder().encode(AUTH_SECRET)

// Lê o usuário do cookie de sessão sem consultar o banco.
async function lerUsuarioId(req: NextRequest): Promise<string | null> {
  const token = req.cookies.get("sessao")?.value
  if (!token) return null
  try {
    const { payload } = await jose.jwtVerify(token, SEGREDO)
    return typeof payload.sub === "string" ? payload.sub : null
  } catch {
    return null
  }
}

function hostProprio(req: NextRequest): string {
  const url = new URL(process.env.APP_URL || req.url)
  return url.host.toLowerCase()
}

/** Nega mutação cross-site (CSRF). GET/HEAD/OPTIONS passam. */
function negarCsrf(req: NextRequest): boolean {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") return false
  const sitio = req.headers.get("sec-fetch-site")
  if (sitio === "same-origin" || sitio === "none") return false
  if (sitio === "cross-site" || sitio === "same-site") return true
  const origem = req.headers.get("origin") ?? req.headers.get("referer") ?? ""
  if (!origem) return false
  try {
    return new URL(origem).host.toLowerCase() !== hostProprio(req)
  } catch {
    return true
  }
}

export async function proxy(request: NextRequest) {
  if (negarCsrf(request)) {
    return new NextResponse("Origem não confiável.", { status: 403 })
  }

  // Nonce por requisição libera apenas os scripts marcados pelo layout.
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64")
  const isDev = process.env.NODE_ENV === "development"

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'wasm-unsafe-eval' ${isDev ? "'unsafe-inline' 'unsafe-eval'" : `'nonce-${nonce}' 'strict-dynamic'`}`,
    "style-src 'self' 'unsafe-inline'",
    "style-src-elem 'self' 'unsafe-inline'",
    "style-src-attr 'unsafe-inline'",
    "worker-src 'self' blob:",
    "child-src blob:",
    "connect-src 'self'",
    "font-src 'self' data:",
    "img-src 'self' data: blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    // Produção usa HTTPS; desenvolvimento mantém loopback.
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ")

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-nonce", nonce)

  // Propaga o usuário do JWT válido; sem acesso ao banco.
  const usuarioId = await lerUsuarioId(request)
  if (usuarioId) requestHeaders.set("x-usuario-id", usuarioId)
  else requestHeaders.delete("x-usuario-id")

  const resposta = NextResponse.next({
    request: { headers: requestHeaders },
  })

  resposta.headers.set("Content-Security-Policy", csp)
  resposta.headers.set("x-nonce", nonce)
  resposta.headers.set("X-Content-Type-Options", "nosniff")
  resposta.headers.set("X-Frame-Options", "DENY")
  resposta.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  resposta.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")

  return resposta
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|webmanifest)$).*)",
  ],
}
