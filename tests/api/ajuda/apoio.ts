// Apoio dos testes de contrato: admin, códigos e limpeza no banco.

import { randomBytes, scrypt as scryptCb } from "node:crypto";
import { promisify } from "node:util";
import pg from "pg";
import { Cliente } from "./cliente";

const scrypt = promisify(scryptCb) as unknown as (
  senha: string,
  sal: Buffer,
  tamanho: number,
  opcoes?: Record<string, number>,
) => Promise<Buffer>;
const URL_BANCO = process.env.DATABASE_URL || "postgresql://caderno:caderno@localhost:5432/caderno";

const N = 131072;
const R = 8;
const P = 1;

export function sufixo(): string {
  return Math.random().toString(36).slice(2, 8);
}

/** IP sintético único para não colidir nos limites por IP. */
export function ipTeste(): Record<string, string> {
  return {
    "x-forwarded-for": `10.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`,
  };
}

export async function hashSenha(senha: string): Promise<string> {
  const sal = randomBytes(16);
  const chave = (await scrypt(senha, sal, 64, {
    N,
    r: R,
    p: P,
    maxmem: 256 * 1024 * 1024,
  })) as Buffer;
  return `scrypt$${N}$${R}$${P}$${sal.toString("hex")}$${chave.toString("hex")}`;
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

/** Garante um admin ativo e devolve o id. */
export async function garantirAdmin(
  email: string,
  senha: string,
  nome = "Admin Teste",
): Promise<string> {
  const hash = await hashSenha(senha);
  return comBanco(async (c) => {
    const r = await c.query(
      `insert into usuarios (email, senha_hash, papel, ativado_em)
       values ($1, $2, 'admin', now())
       on conflict (lower(email)) do update
         set senha_hash = excluded.senha_hash, papel = 'admin',
             ativado_em = coalesce(usuarios.ativado_em, now())
       returning id`,
      [email, hash],
    );
    const id = r.rows[0].id;
    await c.query(
      `insert into profiles (id, nome, email) values ($1, $2, $3)
       on conflict (id) do update set nome = excluded.nome, email = excluded.email`,
      [id, nome, email],
    );
    return id;
  });
}

/** Cria um admin único e abre a sessão. */
export async function entrarAdmin(senha = "adminSenha123"): Promise<Cliente> {
  const email = `admin_${sufixo()}@exemplo.br`;
  await garantirAdmin(email, senha);
  const cliente = new Cliente();
  const r = await cliente.post("/api/auth/entrar", { email, senha }, ipTeste());
  if (r.status !== 200) throw new Error(`falha ao entrar como admin: ${r.status}`);
  return cliente;
}

/** Cria uma conta inativa pelo admin, ativa por código e devolve o cliente logado. */
export async function criarProfessor(
  admin: Cliente,
  dados: { nome: string; email: string; senha: string },
): Promise<{ cliente: Cliente; codigo: string }> {
  const r = await admin.post("/api/admin/codigos", {
    email: dados.email,
    tipo: "primeiro_acesso",
    nome: dados.nome,
  });
  if (r.status !== 200 || !r.dados?.codigo) {
    throw new Error(`falha ao emitir código: ${r.status} ${JSON.stringify(r.dados)}`);
  }
  const cliente = new Cliente();
  const u = await cliente.post(
    "/api/auth/usar-codigo",
    {
      email: dados.email,
      codigo: r.dados.codigo,
      novaSenha: dados.senha,
    },
    ipTeste(),
  );
  if (u.status !== 200) throw new Error(`falha ao ativar conta: ${u.status}`);
  return { cliente, codigo: r.dados.codigo };
}

/** Emite um código ativo para um e-mail (cria a conta, se preciso). */
export async function emitirCodigo(
  admin: Cliente,
  email: string,
  tipo: "primeiro_acesso" | "recuperacao" = "primeiro_acesso",
  nome = "Usuário",
): Promise<string> {
  const r = await admin.post("/api/admin/codigos", { email, tipo, nome });
  if (r.status !== 200 || !r.dados?.codigo) {
    throw new Error(`falha ao emitir código: ${r.status} ${JSON.stringify(r.dados)}`);
  }
  return r.dados.codigo;
}

/** Remove contas pelo e-mail (cascata cobre perfil, códigos e sessões). */
export async function removerUsuarios(emails: string[]): Promise<void> {
  if (emails.length === 0) return;
  await comBanco(async (c) => {
    await c.query(`delete from usuarios where lower(email) = any($1::text[])`, [
      emails.map((e) => e.toLowerCase()),
    ]);
  });
}

/** Marca como expirados os códigos ativos de um e-mail. */
export async function expirarCodigos(email: string): Promise<void> {
  await comBanco(async (c) => {
    await c.query(
      `update codigos_acesso set expira_em = now() - interval '1 minute'
       where lower(email) = $1 and usado_em is null`,
      [email.toLowerCase()],
    );
  });
}

/** Conta sessões ativas de um e-mail. */
export async function contarSessoes(email: string): Promise<number> {
  return comBanco(async (c) => {
    const r = await c.query(
      `select count(*)::int as n from sessoes s
       join usuarios u on u.id = s.usuario_id
       where lower(u.email) = $1`,
      [email.toLowerCase()],
    );
    return r.rows[0].n as number;
  });
}
