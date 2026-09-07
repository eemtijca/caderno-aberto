// Reposição total do banco de desenvolvimento: apaga todos os dados
// (incluindo auth.users e objetos do Storage) e reaplica as migrações.
// Uso: DATABASE_URL=postgresql://... node docker/postgres/repor.mjs
// Nunca apontar para produção: o workflow db-reset.yml trava o destino.
import pg from "pg"

const url = process.env.DATABASE_URL
if (!url) {
  console.error("[repor] DATABASE_URL não definida.")
  process.exit(1)
}

const TABELAS_APP = [
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

// Executa o passo, pulando quando o objeto nem existe (ex.: banco novo
// sem os schemas gerenciados do Supabase).
async function ignorarAusente(passo) {
  try {
    await passo()
  } catch (erro) {
    if (erro.code === "42P01") {
      console.log(`[repor] Ausente, pulando: ${erro.message.split("\n")[0]}`)
      return
    }
    throw erro
  }
}

try {
  await cliente.connect()
} catch (erro) {
  console.error("[repor] Sem ligação ao banco:", erro.message)
  process.exit(2)
}

try {
  console.log("[repor] Apagando objetos do Storage...")
  await ignorarAusente(() => cliente.query(`delete from storage.objects`))

  console.log("[repor] Apagando usuários do Auth...")
  await ignorarAusente(() => cliente.query(`delete from auth.users`))

  console.log("[repor] Derrubando tabelas do app...")
  for (const tabela of TABELAS_APP) {
    await cliente.query(`drop table if exists public.${tabela} cascade`)
  }
  await cliente.query(`drop table if exists public.migracoes_aplicadas cascade`)

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
