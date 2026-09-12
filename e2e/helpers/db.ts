// Acesso direto ao banco para preparar a massa dos testes e2e.
import { createHmac, randomBytes, scrypt as scryptCb } from "node:crypto";
import { promisify } from "node:util";
import pg from "pg";

const scrypt = promisify(scryptCb) as unknown as (
  senha: string,
  sal: Buffer,
  tamanho: number,
  opcoes?: Record<string, number>,
) => Promise<Buffer>;

const URL_BANCO = process.env.DATABASE_URL || "postgresql://caderno:caderno@localhost:5432/caderno";
const SEGREDO = process.env.AUTH_SECRET || "segredo-dummy-de-32-bytes-para-testes-00";

const N = 131072;
const R = 8;
const P = 1;

export const ADMIN_PADRAO = { email: "admin_e2e@exemplo.br", senha: "adminSenha123" };

export function sufixo(): string {
  return Math.random().toString(36).slice(2, 8);
}

async function hashSenha(senha: string): Promise<string> {
  const sal = randomBytes(16);
  const chave = (await scrypt(senha, sal, 64, {
    N,
    r: R,
    p: P,
    maxmem: 256 * 1024 * 1024,
  })) as Buffer;
  return `scrypt$${N}$${R}$${P}$${sal.toString("hex")}$${chave.toString("hex")}`;
}

function hashCodigo(email: string, tipo: string, codigo: string): string {
  return createHmac("sha256", SEGREDO)
    .update(`${email.toLowerCase()}:${tipo}:${codigo.toUpperCase()}`)
    .digest("hex");
}

async function comBanco<T>(fn: (c: pg.Client) => Promise<T>): Promise<T> {
  const c = new pg.Client({ connectionString: URL_BANCO });
  await c.connect();
  try {
    return await fn(c);
  } finally {
    await c.end().catch(() => undefined);
  }
}

/** Cria ou atualiza o admin fixo dos testes e2e. */
export async function garantirAdmin(): Promise<void> {
  const hash = await hashSenha(ADMIN_PADRAO.senha);
  await comBanco(async (c) => {
    const r = await c.query(
      `insert into usuarios (email, senha_hash, papel, ativado_em)
       values ($1, $2, 'admin', now())
       on conflict (lower(email)) do update
         set senha_hash = excluded.senha_hash, papel = 'admin',
             ativado_em = coalesce(usuarios.ativado_em, now())
       returning id`,
      [ADMIN_PADRAO.email, hash],
    );
    await c.query(
      `insert into profiles (id, nome, email) values ($1, 'Admin E2E', $2)
       on conflict (id) do update set nome = excluded.nome, email = excluded.email`,
      [r.rows[0].id, ADMIN_PADRAO.email],
    );
  });
}

/** Cria uma conta já ativa com senha utilizável. */
export async function criarUsuarioAtivo(
  email: string,
  nome: string,
  senha = "senha123",
): Promise<void> {
  const hash = await hashSenha(senha);
  await comBanco(async (c) => {
    const r = await c.query(
      `insert into usuarios (email, senha_hash, papel, ativado_em)
       values ($1, $2, 'professor', now())
       on conflict (lower(email)) do update
         set senha_hash = excluded.senha_hash, ativado_em = now()
       returning id`,
      [email, hash],
    );
    await c.query(
      `insert into profiles (id, nome, email) values ($1, $2, $3)
       on conflict (id) do update set nome = excluded.nome, email = excluded.email`,
      [r.rows[0].id, nome, email],
    );
  });
}

/** Cria uma conta inativa (pendente de primeiro acesso). */
export async function criarUsuarioInativo(email: string, nome: string): Promise<void> {
  await comBanco(async (c) => {
    const r = await c.query(
      `insert into usuarios (email, papel) values ($1, 'professor')
       on conflict (lower(email)) do update set ativado_em = null
       returning id`,
      [email],
    );
    await c.query(
      `insert into profiles (id, nome, email) values ($1, $2, $3)
       on conflict (id) do update set nome = excluded.nome, email = excluded.email`,
      [r.rows[0].id, nome, email],
    );
  });
}

/** Emite um código conhecido para a conta informada. */
export async function emitirCodigo(
  email: string,
  codigo: string,
  tipo: "primeiro_acesso" | "recuperacao" = "primeiro_acesso",
): Promise<void> {
  await comBanco(async (c) => {
    const u = await c.query(`select id from usuarios where lower(email) = $1`, [
      email.toLowerCase(),
    ]);
    if (u.rows.length === 0) throw new Error(`usuário inexistente: ${email}`);
    await c.query(
      `delete from codigos_acesso where usuario_id = $1 and tipo = $2 and usado_em is null`,
      [u.rows[0].id, tipo],
    );
    await c.query(
      `insert into codigos_acesso (usuario_id, email, tipo, codigo_hash, expira_em)
       values ($1, $2, $3, $4, now() + interval '1 hour')`,
      [u.rows[0].id, email.toLowerCase(), tipo, hashCodigo(email, tipo, codigo)],
    );
  });
}

/** Remove contas pelo e-mail. */
export async function removerUsuarios(emails: string[]): Promise<void> {
  if (emails.length === 0) return;
  await comBanco(async (c) => {
    await c.query(`delete from eventos_seguranca where lower(email) = any($1::text[])`, [
      emails.map((e) => e.toLowerCase()),
    ]);
    await c.query(`delete from usuarios where lower(email) = any($1::text[])`, [
      emails.map((e) => e.toLowerCase()),
    ]);
  });
}
