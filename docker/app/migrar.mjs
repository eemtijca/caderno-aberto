// Migrador idempotente dos esquemas versionados. Regista cada ficheiro
// em public.migracoes_aplicadas.
import { readdir, readFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import pg from "pg"

const aqui = path.dirname(fileURLToPath(import.meta.url))
// docker/app -> raiz do projeto = dois níveis acima
import "dotenv/config"
const raiz = path.resolve(aqui, "..", "..")
const pasta = path.join(raiz, "docker", "postgres", "migracoes")

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
    create table if not exists public.migracoes_aplicadas (
      nome text primary key,
      aplicada_em timestamptz not null default now()
    )
  `)
  const { rows } = await cliente.query(`select nome from public.migracoes_aplicadas`)
  const aplicadas = new Set(rows.map((r) => r.nome))

  const ficheiros = (await readdir(pasta)).filter((f) => f.endsWith(".sql")).sort()
  for (const ficheiro of ficheiros) {
    if (aplicadas.has(ficheiro)) continue
    const sql = await readFile(path.join(pasta, ficheiro), "utf8")
    console.log(`[migrar] A aplicar ${ficheiro}...`)
    await cliente.query("begin")
    try {
      await cliente.query(sql)
      await cliente.query(`insert into public.migracoes_aplicadas (nome) values ($1)`, [ficheiro])
      await cliente.query("commit")
      console.log(`[migrar] ${ficheiro} aplicada.`)
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
