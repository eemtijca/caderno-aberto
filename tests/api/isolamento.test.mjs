// Prova das políticas com o papel restrito app_teste.
// Uso: DATABASE_URL=postgresql://caderno:caderno@localhost:5432/caderno node tests/api/isolamento.test.mjs
// O papel de teste não contorna o RLS.
import pg from "pg"

const url = process.env.DATABASE_URL || "postgresql://caderno:caderno@localhost:5432/caderno"

let passadas = 0
function ok(cond, nome) {
  if (!cond) {
    console.error(`FALHOU: ${nome}`)
    process.exitCode = 1
  } else {
    passadas++
    console.log(`ok: ${nome}`)
  }
}

const admin = new pg.Client({ connectionString: url })
await admin.connect()

// Massa de dois professores.
const a = "11111111-1111-1111-1111-111111111111"
const bId = "22222222-2222-2222-2222-222222222222"
await admin.query(`insert into usuarios (id, email, senha_hash, email_verificado_em) values ($1, 'iso_a@exemplo.br', 'x', now()), ($2, 'iso_b@exemplo.br', 'x', now()) on conflict (id) do nothing`, [a, bId])
await admin.query(`insert into profiles (id, nome, email) values ($1, 'A', 'iso_a@exemplo.br'), ($2, 'B', 'iso_b@exemplo.br') on conflict (id) do nothing`, [a, bId])
await admin.query(`insert into notas (id, professor_id, titulo, status) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', $1, 'Nota A', 'rascunho'), ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', $2, 'Nota B', 'rascunho') on conflict (id) do nothing`, [a, bId])

// Conexão com papel e contexto fixados.
async function como(usuarioId, fn) {
  const c = new pg.Client({ connectionString: url })
  await c.connect()
  try {
    await c.query(`set role app_teste`)
    if (usuarioId) await c.query(`select set_config('app.usuario_atual', $1, false)`, [usuarioId])
    return await fn(c)
  } finally {
    await c.end().catch(() => undefined)
  }
}

// Sem contexto, nenhuma linha.
await como(null, async (c) => {
  const r = await c.query(`select count(*)::int as n from notas`)
  ok(r.rows[0].n === 0, "sem contexto, zero linhas")
})

// Visibilidade por professor.
await como(a, async (c) => {
  const r = await c.query(`select id from notas order by id`)
  ok(r.rows.length === 1 && r.rows[0].id === "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "A vê só a nota A")
  const p = await c.query(`select id from profiles`)
  ok(p.rows.length === 1 && p.rows[0].id === a, "A vê só o próprio perfil")
  const cruzada = await c.query(`select count(*)::int as n from notas where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'`)
  ok(cruzada.rows[0].n === 0, "A não alcança a nota B")
})
await como(bId, async (c) => {
  const r = await c.query(`select id from notas order by id`)
  ok(r.rows.length === 1 && r.rows[0].id === "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", "B vê só a nota B")
})

// Escrita cruzada negada.
await como(a, async (c) => {
  let negou = false
  try {
    await c.query(`insert into notas (professor_id, titulo) values ($1, 'Roubo')`, [bId])
  } catch {
    negou = true
  }
  ok(negou, "insert com professor alheio nega")
})

// Remove a massa.
await admin.query(`delete from usuarios where id in ($1, $2)`, [a, bId])
await admin.end()

console.log(`\n${passadas} verificações passaram.`)
