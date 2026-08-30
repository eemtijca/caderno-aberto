// ============================================================
// Caderno Aberto : preparar o banco de teste local (Node)
//
// 1. Sobe um Postgres embutido (binários em node_modules) se
//    ainda não estiver rodando : não exige Docker nem root.
// 2. Recria o banco de teste.
// 3. Aplica os stubs do Supabase (roles, auth.*, storage.*).
// 4. Aplica as migrations oficiais com o Supabase CLI.
//
// Uso:  node tests/harness/preparar.mjs
// ============================================================

import { execFileSync, spawnSync } from "node:child_process"
import { existsSync, readFileSync, readdirSync, rmSync } from "node:fs"
import { fileURLToPath } from "node:url"
import path from "node:path"
import { Client } from "pg"

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")
const binDir = path.join(raiz, "node_modules/@embedded-postgres/linux-x64/native/bin")
const dataDir = path.join(raiz, "tools/pg/data")
const logArq = path.join(raiz, "tools/pg/pg.log")

export const PGHOST = process.env.PGHOST ?? "127.0.0.1"
export const PGPORT = Number(process.env.PGPORT ?? 54329)
export const PGDATABASE = process.env.PGDATABASE ?? "caderno_teste"
// sslmode=disable: Postgres de teste local não fala TLS
export const DB_URL = `postgres://postgres@${PGHOST}:${PGPORT}/${PGDATABASE}?sslmode=disable`

/** Garante que o Postgres embutido está no ar. */
async function garantirServidor() {
  const { Client } = await import("pg")
  const sonda = new Client({
    host: PGHOST,
    port: PGPORT,
    user: "postgres",
    database: "postgres",
    connectionTimeoutMillis: 1500,
  })
  try {
    await sonda.connect()
    await sonda.end()
    console.log("• Postgres de teste já está no ar.")
    return
  } catch {
    // segue para iniciar
  }
  if (!existsSync(path.join(binDir, "postgres"))) {
    throw new Error(
      "Binários do Postgres embutido não encontrados. Rode `npm install` na raiz do projeto.",
    )
  }
  if (!existsSync(path.join(dataDir, "PG_VERSION"))) {
    console.log("• Inicializando cluster de teste (primeira vez)…")
    execFileSync(
      path.join(binDir, "initdb"),
      ["-D", dataDir, "-U", "postgres", "--auth=trust", "-E", "UTF8"],
      { stdio: "inherit" },
    )
  }
  console.log("• Iniciando Postgres de teste…")
  execFileSync(path.join(binDir, "pg_ctl"), [
    "-D",
    dataDir,
    "-l",
    logArq,
    "-o",
    `-p ${PGPORT} -k ${path.dirname(dataDir)} -c listen_addresses=127.0.0.1`,
    "start",
  ])
  // aguarda aceitar conexões
  for (let i = 0; i < 30; i++) {
    try {
      const c = new Client({ host: PGHOST, port: PGPORT, user: "postgres", database: "postgres" })
      await c.connect()
      await c.end()
      return
    } catch {
      await new Promise((r) => setTimeout(r, 500))
    }
  }
  throw new Error("Postgres não respondeu após iniciar.")
}

async function main() {
  await garantirServidor()

  // recria o banco limpo
  const adm = new Client({ host: PGHOST, port: PGPORT, user: "postgres", database: "postgres" })
  await adm.connect()
  await adm.query(`drop database if exists ${PGDATABASE}`)
  await adm.query(`create database ${PGDATABASE}`)
  await adm.end()
  console.log(`• Banco ${PGDATABASE} recriado.`)

  // stubs do Supabase
  const stubs = readFileSync(path.join(raiz, "tests/harness/stubs.sql"), "utf8")
  const db = new Client({ host: PGHOST, port: PGPORT, user: "postgres", database: PGDATABASE })
  await db.connect()
  await db.query(stubs)
  await db.end()
  console.log("• Stubs do Supabase aplicados (roles, auth.*, storage.*).")

  // migrations oficiais via Supabase CLI (--yes evita o prompt [Y/n]
  // de confirmação; stdin ignorado para não travar em ambientes sem TTY)
  console.log("• Aplicando migrations com o Supabase CLI…")
  spawnSync("supabase", ["db", "push", "--db-url", DB_URL, "--include-all", "--yes"], {
    cwd: raiz,
    stdio: ["ignore", "inherit", "inherit"],
    timeout: 90_000,
  })

  // a verdade oficial é o histórico de migrations no próprio banco
  const ver = new Client({ host: PGHOST, port: PGPORT, user: "postgres", database: PGDATABASE })
  await ver.connect()
  const { rows } = await ver.query(
    "select version, name from supabase_migrations.schema_migrations order by version",
  )
  await ver.end()
  const esperadas = readdirSync(path.join(raiz, "supabase/migrations"))
    .filter((f) => f.endsWith(".sql"))
    .map((f) => f.replace(".sql", "").split("_")[0])
  const aplicadas = rows.map((x) => x.version)
  const faltando = esperadas.filter((v) => !aplicadas.includes(v))
  if (faltando.length > 0) {
    throw new Error(`Migrations não aplicadas: ${faltando.join(", ")}`)
  }
  console.log(`• Migrations registradas no banco: ${aplicadas.join(", ")}`)

  // zera os dados do shim (usuários, e-mails, arquivos) para o ciclo começar limpo
  const dadosShim = path.join(raiz, "tests/shim/dados")
  try {
    rmSync(dadosShim, { recursive: true, force: true })
  } catch {
    /* ok */
  }
  console.log(`✓ Banco de teste pronto: ${DB_URL}`)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error(e.message ?? e)
    process.exit(1)
  })
}
