// Middleware da aplicação: bloqueio de mutações cross-site (CSRF), cabeçalhos de
// segurança com CSP por nonce e propagação do usuário do JWT na requisição.

import { NextResponse, type NextRequest } from "next/server";
import * as jose from "jose";
import { AUTH_SECRET, MANUTENCAO } from "@/lib/ambiente";

const SEGREDO = new TextEncoder().encode(AUTH_SECRET);

// Lê o usuário do cookie de sessão sem consultar o banco.
async function lerSessao(req: NextRequest): Promise<{ id: string | null; papel: string | null }> {
  const token = req.cookies.get("sessao")?.value;
  if (!token) return { id: null, papel: null };
  try {
    const { payload } = await jose.jwtVerify(token, SEGREDO);
    return {
      id: typeof payload.sub === "string" ? payload.sub : null,
      papel: typeof payload.papel === "string" ? payload.papel : null,
    };
  } catch {
    return { id: null, papel: null };
  }
}

function querJson(req: NextRequest): boolean {
  return (
    req.nextUrl.pathname.startsWith("/api/") ||
    (req.headers.get("accept") ?? "").includes("application/json")
  );
}

/** Resposta de erro do proxy, em JSON para a API e HTML para navegação. */
function respostaErro(
  req: NextRequest,
  status: number,
  mensagem: string,
  codigo: string,
): NextResponse {
  if (querJson(req)) {
    return NextResponse.json(
      { erro: mensagem, codigo },
      { status, headers: { "Cache-Control": "private, no-store" } },
    );
  }
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${mensagem}</title><style>body{margin:0;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:24px;font-family:system-ui,sans-serif;text-align:center;background:#fafaf8;color:#1c1c1a}h1{font-size:20px;margin:0}p{max-width:420px;color:#6b6b66;font-size:14px;margin:0}a{margin-top:8px;color:#008241;font-weight:600}</style></head><body><h1>${mensagem}</h1><p>Acesso bloqueado pelo servidor.</p><a href="/">Voltar ao início</a></body></html>`;
  return new NextResponse(html, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

function hostProprio(req: NextRequest): string {
  const url = new URL(process.env.APP_URL || req.url);
  return url.host.toLowerCase();
}

/** Nega mutação cross-site (CSRF). GET/HEAD/OPTIONS passam. */
function negarCsrf(req: NextRequest): boolean {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") return false;
  const sitio = req.headers.get("sec-fetch-site");
  if (sitio === "same-origin" || sitio === "none") return false;
  if (sitio === "cross-site" || sitio === "same-site") return true;
  const origem = req.headers.get("origin") ?? req.headers.get("referer") ?? "";
  if (!origem) return false;
  try {
    return new URL(origem).host.toLowerCase() !== hostProprio(req);
  } catch {
    return true;
  }
}

export async function proxy(request: NextRequest) {
  if (negarCsrf(request)) {
    return respostaErro(request, 403, "Origem não confiável.", "CSRF");
  }

  const { id: usuarioId, papel } = await lerSessao(request);

  // Modo manutenção: só administradores e rotas essenciais passam.
  if (MANUTENCAO) {
    const caminho = request.nextUrl.pathname;
    const liberado =
      caminho.startsWith("/_next") ||
      caminho.startsWith("/api/auth") ||
      caminho.startsWith("/api/publico") ||
      caminho.startsWith("/l/") ||
      caminho === "/favicon.ico" ||
      caminho === "/icon.svg" ||
      caminho === "/robots.txt";
    if (papel !== "admin" && !liberado) {
      return respostaErro(request, 503, "Em manutenção", "INDISPONIVEL");
    }
  }

  // Nonce por requisição libera apenas os scripts marcados pelo layout.
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";

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
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  // O Next extrai o nonce do CSP da requisição para os próprios scripts.
  requestHeaders.set("Content-Security-Policy", csp);

  // Propaga o usuário do JWT válido; sem acesso ao banco.
  if (usuarioId) requestHeaders.set("x-usuario-id", usuarioId);
  else requestHeaders.delete("x-usuario-id");

  const resposta = NextResponse.next({
    request: { headers: requestHeaders },
  });

  resposta.headers.set("Content-Security-Policy", csp);
  resposta.headers.set("x-nonce", nonce);
  resposta.headers.set("X-Content-Type-Options", "nosniff");
  resposta.headers.set("X-Frame-Options", "DENY");
  resposta.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  resposta.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  return resposta;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|webmanifest)$).*)",
  ],
};
