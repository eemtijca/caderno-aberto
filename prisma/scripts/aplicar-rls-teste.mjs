// Aplica prisma/scripts/rls-teste.sql. Só local/CI.
// Uso: node prisma/scripts/aplicar-rls-teste.mjs
import { readFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import pg from "pg"
import "dotenv/config"

const aqui = path.dirname(fileURLToPath(import.meta.url))
const arquivo = path.join(aqui, "rls-teste.sql")

const url = process.env.DATABASE_URL
if (!url) {
  console.error("[rls-teste] DATABASE_URL não definida.")
  process.exit(1)
}

const sql = await readFile(arquivo, "utf8")
const cliente = new pg.Client({ connectionString: url })

try {
  await cliente.connect()
} catch (erro) {
  console.error("[rls-teste] Sem ligação ao banco:", erro.message)
  process.exit(2)
}

try {
  await cliente.query(sql)
  console.log("[rls-teste] Papel app_teste pronto.")
} catch (erro) {
  console.error("[rls-teste] Falha:", erro.message)
  process.exit(1)
} finally {
  await cliente.end().catch(() => undefined)
}
