// Cria ou atualiza o administrador inicial de forma idempotente.
// Uso: ADMIN_EMAIL, ADMIN_SENHA e ADMIN_NOME no ambiente, depois
//   node scripts/criar-admin.mjs
import "dotenv/config";
import { randomBytes, scrypt as scryptCb } from "node:crypto";
import { promisify } from "node:util";
import pg from "pg";

const scrypt = promisify(scryptCb);

// Mesmos parâmetros de src/lib/auth/senha.ts.
const N = 131072;
const R = 8;
const P = 1;

async function hashSenha(senha) {
  const sal = randomBytes(16);
  const chave = await scrypt(senha, sal, 64, { N, r: R, p: P, maxmem: 256 * 1024 * 1024 });
  return `scrypt$${N}$${R}$${P}$${sal.toString("hex")}$${chave.toString("hex")}`;
}

function mascarar(url) {
  return url.replace(/(:\/\/[^:]+:)[^@]+@/, "$1***@");
}

const email = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
const senha = process.env.ADMIN_SENHA ?? "";
const nome = (process.env.ADMIN_NOME ?? "").trim();

if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
  console.error("[admin] Defina ADMIN_EMAIL com um e-mail válido.");
  process.exit(1);
}
if (senha.length < 8 || senha.length > 256) {
  console.error("[admin] Defina ADMIN_SENHA com 8 a 256 caracteres.");
  process.exit(1);
}

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) {
  console.error("[admin] DIRECT_URL/DATABASE_URL não definida.");
  process.exit(1);
}

const cliente = new pg.Client({ connectionString: url });

try {
  await cliente.connect();
} catch (erro) {
  console.error("[admin] Sem ligação ao banco:", erro.message);
  process.exit(2);
}

try {
  const senhaHash = await hashSenha(senha);
  await cliente.query("begin");

  const { rows } = await cliente.query(
    "select id from public.usuarios where lower(email) = $1 for update",
    [email],
  );

  let id;
  if (rows.length > 0) {
    id = rows[0].id;
    await cliente.query(
      "update public.usuarios set senha_hash = $2, papel = 'admin', ativado_em = coalesce(ativado_em, now()) where id = $1",
      [id, senhaHash],
    );
    await cliente.query(
      `insert into public.profiles (id, nome, email)
       values ($1, $2, $3)
       on conflict (id) do update set nome = excluded.nome, email = excluded.email`,
      [id, nome || email.split("@")[0], email],
    );
    console.log(`[admin] Administrador atualizado: ${email}`);
  } else {
    const inserido = await cliente.query(
      "insert into public.usuarios (email, senha_hash, papel, ativado_em) values ($1, $2, 'admin', now()) returning id",
      [email, senhaHash],
    );
    id = inserido.rows[0].id;
    await cliente.query("insert into public.profiles (id, nome, email) values ($1, $2, $3)", [
      id,
      nome || email.split("@")[0],
      email,
    ]);
    console.log(`[admin] Administrador criado: ${email}`);
  }

  await cliente.query(
    `insert into public.eventos_seguranca (ator_id, acao, email, detalhe)
     values ($1, 'CONFIGURAR_ADMIN', $2, '{"origem":"script"}')`,
    [id, email],
  );
  await cliente.query("commit");
  console.log(`[admin] Banco: ${mascarar(url)}`);
  process.exit(0);
} catch (erro) {
  await cliente.query("rollback").catch(() => undefined);
  console.error("[admin] Falha:", erro.message);
  console.error("[admin] Verifique se as migrações foram aplicadas.");
  process.exit(1);
} finally {
  await cliente.end().catch(() => undefined);
}
