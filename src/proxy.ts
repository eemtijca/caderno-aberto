import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

// Proxy. Renova a sessão do Supabase em cada navegação e aplica CSP estrita dinâmica com nonce.

const URL_SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
const CHAVE_ANON =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  ""

function getSupabaseOrigin(request: NextRequest): string {
  const direta =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL_PRODUCTION ?? ""
  if (direta) {
    try {
      return new URL(direta).origin
    } catch {
      // fallback
    }
  }
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? ""
  if (host.includes("app.github.dev")) {
    return `https://${host.replace(/-3000\./, "-54321.")}`
  }
  const nome = process.env.CODESPACE_NAME ?? process.env.NEXT_PUBLIC_CODESPACE_NAME ?? ""
  const dominio = process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN ?? "app.github.dev"
  if (nome) return `https://${nome}-54321.${dominio}`
  return "http://127.0.0.1:54321"
}

export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64")
  const isDev = process.env.NODE_ENV === "development"
  const supaOrigin = getSupabaseOrigin(request)
  const supaWs = supaOrigin.replace(/^http/, "ws")

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'wasm-unsafe-eval' ${isDev ? "'unsafe-inline' 'unsafe-eval'" : `'nonce-${nonce}' 'strict-dynamic' https: 'unsafe-inline'`}`,
    "style-src 'self' 'unsafe-inline'",
    "style-src-elem 'self' 'unsafe-inline'",
    "style-src-attr 'unsafe-inline'",
    "worker-src 'self' blob:",
    "child-src blob:",
    `connect-src 'self' ${supaOrigin} ${supaWs} http://127.0.0.1:54321 ws://127.0.0.1:54321 http://localhost:54321 ws://localhost:54321 https://*.app.github.dev wss://*.app.github.dev https://*.supabase.co wss://*.supabase.co`,
    "font-src 'self' data:",
    "img-src 'self' data: blob: https://*.app.github.dev https://*.supabase.co",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ")

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-nonce", nonce)
  requestHeaders.set("Content-Security-Policy", csp)

  let resposta = NextResponse.next({
    request: { headers: requestHeaders },
  })

  resposta.headers.set("Content-Security-Policy", csp)
  resposta.headers.set("x-nonce", nonce)

  if (!URL_SUPABASE || !CHAVE_ANON) return resposta

  const supabase = createServerClient(URL_SUPABASE, CHAVE_ANON, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(lista, headers) {
        for (const { name, value } of lista) {
          request.cookies.set(name, value)
        }
        resposta = NextResponse.next({ request })
        for (const { name, value, options } of lista) {
          resposta.cookies.set(name, value, options)
        }
        for (const [chave, valor] of Object.entries(headers)) {
          resposta.headers.set(chave, valor)
        }
        // preservar CSP e nonce após recriação da resposta
        resposta.headers.set("Content-Security-Policy", csp)
        resposta.headers.set("x-nonce", nonce)
      },
    },
  })

  await supabase.auth.getUser()

  return resposta
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|webmanifest)$).*)",
  ],
}
