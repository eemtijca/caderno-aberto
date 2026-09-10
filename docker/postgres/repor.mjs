// Recria o banco de desenvolvimento: apaga dados e registo de migrações.
// Uso: DATABASE_URL=postgresql://... node docker/postgres/repor.mjs
// Nunca apontar para produção.
import pg from "pg"

const url = process.env.DATABASE_URL
if (!url) {
  console.error("[repor] DATABASE_URL não definida.")
  process.exit(1)
}

const TABELAS_APP = [
  "tentativas_limite",
  "sessoes",
  "tokens_verificacao",
  "links",
  "notas",
  "turmas",
  "disciplinas",
  "profiles",
  "usuarios",
]

const FUNCOES_APP = [
  "definir_atualizado_em()",
  "sync_disciplina()",
  "sync_turma_nome()",
  "sync_turma_removida()",
  "sync_professor_nome()",
]

const cliente = new pg.Client({ connectionString: url })

try {
  await cliente.connect()
} catch (erro) {
  console.error("[repor] Sem ligação ao banco:", erro.message)
  process.exit(2)
}

try {
  console.log("[repor] Derrubando tabelas do app...")
  for (const tabela of TABELAS_APP) {
    await cliente.query(`drop table if exists public.${tabela} cascade`)
  }
  await cliente.query(`drop table if exists public._prisma_migrations cascade`)

  console.log("[repor] Derrubando funções do app...")
  for (const funcao of FUNCOES_APP) {
    await cliente.query(`drop function if exists public.${funcao} cascade`)
  }
  console.log("[repor] Banco limpo.")
  process.exit(0)
} catch (erro) {
  console.error("[repor] Falha:", erro.message)
  process.exit(1)
} finally {
  await cliente.end().catch(() => undefined)
}
