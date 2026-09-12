// Sessões em cookie HttpOnly: JWT de acesso e refresh com rotação.
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { createHash, randomBytes } from "crypto";
import * as jose from "jose";
import { AUTH_SECRET } from "@/lib/ambiente";
import { banco } from "@/lib/banco";
import type { Papel } from "@/lib/banco/tipos";

export const COOKIE_ACESSO = "sessao";
export const COOKIE_REFRESH = "sessao_refresh";
const UMA_HORA = 60 * 60;
const TRINTA_DIAS = 30 * 24 * 60 * 60;

const chave = new TextEncoder().encode(AUTH_SECRET);

export interface SessaoUsuario {
  id: string;
  email: string;
  papel: Papel;
  ativadoEm: string | null;
  criadoEm: string;
}

function hashOpaco(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Aguarda sem propagar falha (higiene oportunista, nunca crítica). */
async function silenciar(promessa: PromiseLike<unknown>): Promise<void> {
  try {
    await promessa;
  } catch {
    // Falhas de limpeza não propagam.
  }
}

function opcoesCookie(maxIdade: number) {
  return {
    httpOnly: true as const,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxIdade,
  };
}

/** Emite o JWT de acesso (1h) para o usuário, com o papel no payload. */
export async function emitirAcesso(usuarioId: string, papel: Papel = "professor"): Promise<string> {
  // HS256 com segredo compartilhado; o refresh é opaco e fica no banco.
  return new jose.SignJWT({ papel })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(usuarioId)
    .setIssuedAt()
    .setExpirationTime(`${UMA_HORA}s`)
    .sign(chave);
}

/** Lê o usuário do JWT sem tocar no banco (p/ proxy e atalhos). */
export async function lerAcesso(token: string): Promise<string | null> {
  try {
    const { payload } = await jose.jwtVerify(token, chave);
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

/** Cria a sessão persistente (refresh) e grava os dois cookies. */
export async function iniciarSessao(
  usuarioId: string,
  req?: NextRequest,
  papel: Papel = "professor",
): Promise<{ acesso: string }> {
  const db = banco();
  const refresh = randomBytes(32).toString("hex");
  const expira = new Date(Date.now() + TRINTA_DIAS * 1000);
  await db.sessoes.create({
    data: {
      usuarioId,
      tokenHash: hashOpaco(refresh),
      expiraEm: expira,
      ip:
        req?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        req?.headers.get("x-real-ip") ??
        "",
      agente: req?.headers.get("user-agent")?.slice(0, 300) ?? "",
    },
  });
  // Remove sessões vencidas, exceto a atual.
  const limite = new Date();
  await silenciar(db.sessoes.deleteMany({ where: { expiraEm: { lt: limite } } }));
  const acesso = await emitirAcesso(usuarioId, papel);
  const jar = await cookies();
  jar.set(COOKIE_ACESSO, acesso, opcoesCookie(UMA_HORA));
  jar.set(COOKIE_REFRESH, refresh, opcoesCookie(TRINTA_DIAS));
  return { acesso };
}

/** Encerra a sessão atual (apaga o refresh e limpa os cookies). */
export async function encerrarSessao(req: NextRequest): Promise<void> {
  const refresh = req.cookies.get(COOKIE_REFRESH)?.value;
  if (refresh) {
    const db = banco();
    await silenciar(db.sessoes.deleteMany({ where: { tokenHash: hashOpaco(refresh) } }));
  }
  const jar = await cookies();
  jar.set(COOKIE_ACESSO, "", { ...opcoesCookie(0), maxAge: 0 });
  jar.set(COOKIE_REFRESH, "", { ...opcoesCookie(0), maxAge: 0 });
}

/** Renova o acesso a partir do refresh, com detecção de reuso. */
export async function renovarSessao(req: NextRequest): Promise<SessaoUsuario | null> {
  const refresh = req.cookies.get(COOKIE_REFRESH)?.value;
  if (!refresh) return null;
  const db = banco();
  const sessao = await db.sessoes.findFirst({ where: { tokenHash: hashOpaco(refresh) } });
  if (!sessao || sessao.expiraEm < new Date()) return null;
  const usuario = await db.usuarios.findFirst({ where: { id: sessao.usuarioId } });
  if (!usuario) return null;
  // Invalida o refresh anterior; concorrência perde (sem sessão dupla).
  const apagadas = await db.sessoes.deleteMany({ where: { tokenHash: hashOpaco(refresh) } });
  if (apagadas.count !== 1) return null;
  await iniciarSessao(usuario.id, req, usuario.papel as Papel);
  return mapearUsuario(usuario);
}

export function mapearUsuario(linha: {
  id: string;
  email: string;
  papel: string;
  ativadoEm: Date | null;
  criadoEm: Date;
}): SessaoUsuario {
  return {
    id: linha.id,
    email: linha.email,
    papel: linha.papel === "admin" ? "admin" : "professor",
    ativadoEm: linha.ativadoEm?.toISOString() ?? null,
    criadoEm: linha.criadoEm.toISOString(),
  };
}

/** Resolve o usuário da requisição: acesso válido ou refresh rotativo. */
export async function sessaoRequisicao(req: NextRequest): Promise<SessaoUsuario | null> {
  const acesso = req.cookies.get(COOKIE_ACESSO)?.value;
  if (acesso) {
    const id = await lerAcesso(acesso);
    if (id) {
      const db = banco();
      const usuario = await db.usuarios.findFirst({ where: { id } });
      if (usuario) return mapearUsuario(usuario);
    }
  }
  return renovarSessao(req);
}
