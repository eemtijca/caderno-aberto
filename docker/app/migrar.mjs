// Migrador idempotente das migrações Prisma. Aplica cada
// prisma/migrations/*/migration.sql uma vez, na ordem, e regista
// em public._prisma_migrations para interoperar com migrate deploy.
import { readdir, readFile } from "node:fs/promises"
import { createHash, randomUUID } from "node:crypto"
import path from "node:path"
import { fileURLToPath } from "node:url"
import pg from "pg"

const aqui = path.dirname(fileURLToPath(import.meta.url))
// docker/app -> raiz do projeto = dois níveis acima
import "dotenv/config"
const raiz = path.resolve(aqui, "..", "..")
const pasta = path.join(raiz, "prisma", "migrations")

const url = process.env.DATABASE_URL
if (!url) {
  console.error("[migrar] DATABASE_URL não definida.")
  process.exit(1)
}

const cliente = new pg.Client({ connectionString: url })

try {
  await cliente.connect()
} catch (erro) {
  console.error("[migrar] Sem ligação ao banco:", erro.message)
  process.exit(2)
}

try {
  await cliente.query(`
    create table if not exists public._prisma_migrations (
      id varchar(36) primary key,
      checksum varchar(64) not null,
      finished_at timestamptz,
      migration_name varchar(255) not null,
      logs text,
      rolled_back_at timestamptz,
      started_at timestamptz not null default now(),
      applied_steps_count integer not null default 0
    )
  `)
  const { rows } = await cliente.query(
    `select migration_name, checksum from public._prisma_migrations where rolled_back_at is null`,
  )
  const aplicadas = new Map(rows.map((r) => [r.migration_name, r.checksum]))

  const pastas = (await readdir(pasta, { withFileTypes: true }))
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort()
  for (const nome of pastas) {
    const sql = await readFile(path.join(pasta, nome, "migration.sql"), "utf8")
    const soma = createHash("sha256").update(sql).digest("hex")
    const registada = aplicadas.get(nome)
    if (registada === soma) continue
    if (registada) {
      console.error(`[migrar] Soma divergente em ${nome}; edite com nova migração.`)
      process.exit(1)
    }
    console.log(`[migrar] A aplicar ${nome}...`)
    await cliente.query("begin")
    try {
      await cliente.query(sql)
      await cliente.query(
        `insert into public._prisma_migrations
          (id, checksum, finished_at, migration_name, applied_steps_count)
          values ($1, $2, now(), $3, 1)`,
        [randomUUID(), soma, nome],
      )
      await cliente.query("commit")
      console.log(`[migrar] ${nome} aplicada.`)
    } catch (erro) {
      await cliente.query("rollback")
      throw erro
    }
  }
  console.log("[migrar] Banco atualizado.")
  process.exit(0)
} catch (erro) {
  console.error("[migrar] Falha:", erro.message)
  process.exit(1)
} finally {
  await cliente.end().catch(() => undefined)
}
