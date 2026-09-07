import { NextResponse, type NextRequest } from "next/server"
import * as jose from "jose"

const SEGREDO = new TextEncoder().encode(process.env.AUTH_SECRET ?? "")

async function lerUsuarioId(req: NextRequest): Promise<string | null> {
  const token = req.cookies.get("sessao")?.value
  if (!token || !process.env.AUTH_SECRET) return null
  try {
    const { payload } = await jose.jwtVerify(token, SEGREDO)
    return typeof payload.sub === "string" ? payload.sub : null
  } catch {
    return null
  }
}

export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64")
  const isDev = process.env.NODE_ENV === "development"

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'wasm-unsafe-eval' ${isDev ? "'unsafe-inline' 'unsafe-eval'" : `'nonce-${nonce}' 'strict-dynamic' https: 'unsafe-inline'`}`,
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
  requestHeaders.set("Content-Security-Policy", csp)

  // Propaga o usuário do JWT válido; sem acesso ao banco.
  const usuarioId = await lerUsuarioId(request)
  if (usuarioId) requestHeaders.set("x-usuario-id", usuarioId)

  const resposta = NextResponse.next({
    request: { headers: requestHeaders },
  })

  resposta.headers.set("Content-Security-Policy", csp)
  resposta.headers.set("x-nonce", nonce)

  return resposta
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|webmanifest)$).*)",
  ],
}
