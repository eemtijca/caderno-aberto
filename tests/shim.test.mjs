// ============================================================
// Teste de fumaça do shim : exercita o shim com o supabase-js
// oficial (auth + rest + storage + rpc), validando que o E2E
// do app tem uma base fiel do Supabase por baixo.
//
// Uso: node tests/harness/preparar.mjs && node tests/shim.test.mjs
// ============================================================

import { createClient } from "@supabase/supabase-js"
import { ANON_KEY, SERVICE_KEY, PORTA, iniciar, ultimosEmails } from "./shim/servidor.mjs"

const URL_SHIM = `http://127.0.0.1:${PORTA}`
let passou = 0
const falhas = []

function teste(nome, fn) {
  return Promise.resolve()
    .then(fn)
    .then(() => passou++)
    .catch((e) => falhas.push({ nome, erro: e.message ?? String(e) }))
}
function ok(cond, msg) {
  if (!cond) throw new Error(msg)
}

const admin = createClient(URL_SHIM, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

await iniciar()

const EMAIL_A = "ana@escola.br"
const EMAIL_B = "beto@escola.br"
const UID = {}
let notaA = ""

await teste("signup cria usuário + perfil (gatilho)", async () => {
  const c = createClient(URL_SHIM, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data, error } = await c.auth.signUp({
    email: EMAIL_A,
    password: "senha123",
    options: { data: { nome: "Professora Ana" } },
  })
  if (error) throw error
  ok(data.user, "signup deveria devolver usuário")
  ok(data.session, "auto-confirm deveria devolver sessão")
  UID.A = data.user.id

  const { data: perfil } = await c.from("profiles").select("*").eq("id", UID.A).maybeSingle()
  ok(perfil?.nome === "Professora Ana", `perfil criado pelo gatilho (veio: ${perfil?.nome})`)
  ok(perfil?.email === EMAIL_A, "email do perfil sincronizado")

  const c2 = createClient(URL_SHIM, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const r2 = await c2.auth.signUp({
    email: EMAIL_B,
    password: "senha123",
    options: { data: { nome: "Professor Beto" } },
  })
  UID.B = r2.data.user.id
})

function clienteDe(uid) {
  // login fresh para obter JWT do usuário
  const c = createClient(URL_SHIM, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return c
}

let A = null
let B = null
await teste("login com senha (grant_type=password)", async () => {
  const c = createClient(URL_SHIM, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data, error } = await c.auth.signInWithPassword({ email: EMAIL_A, password: "senha123" })
  if (error) throw error
  ok(data.session?.access_token, "sessão deveria ter access_token")
  A = c
  const cb = createClient(URL_SHIM, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  await cb.auth.signInWithPassword({ email: EMAIL_B, password: "senha123" })
  B = cb
})

await teste("login com senha errada → invalid_credentials", async () => {
  const c = createClient(URL_SHIM, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { error } = await c.auth.signInWithPassword({ email: EMAIL_A, password: "errada" })
  ok(error?.message === "Invalid login credentials", `mensagem veio: ${error?.message}`)
})

await teste("CRUD notas via PostgREST com RLS + embedded", async () => {
  const { data: disc, error: eDisc } = await A.from("disciplinas")
    .insert({ professor_id: UID.A, nome: "Matemática", cor: "verde" })
    .select("*")
    .single()
  if (eDisc) throw eDisc

  const { data: nota, error: eNota } = await A.from("notas")
    .insert({
      professor_id: UID.A,
      titulo: "Função do 2º grau",
      disciplina_id: disc.id,
      disciplina_nome: "Matemática",
      disciplina_cor: "verde",
      status: "publicada",
      busca: "funcao do 2 grau parabola",
      blocos: [{ tipo: "secao", titulo: "Introdução" }],
    })
    .select("*, disciplina:disciplinas(*)")
    .single()
  if (eNota) throw eNota
  ok(
    nota.disciplina?.nome === "Matemática",
    `embedded disciplina (veio: ${JSON.stringify(nota.disciplina)})`,
  )
  notaA = nota.id

  // filtros: ilike + order múltiplo
  const { data: lista } = await A.from("notas")
    .select("*, disciplina:disciplinas(*)")
    .eq("professor_id", UID.A)
    .ilike("busca", "%parabola%")
    .order("ano_letivo", { ascending: false })
    .order("mes", { ascending: false })
    .order("atualizado_em", { ascending: false })
  ok(lista?.length === 1, `ilike+order deveria trazer 1 (veio ${lista?.length})`)

  // update com maybeSingle
  const { data: up } = await A.from("notas")
    .update({ titulo: "Função do 2º grau (revisada)" })
    .eq("id", notaA)
    .select("*")
    .maybeSingle()
  ok(up?.titulo?.includes("revisada"), "update deveria aplicar")

  // isolamento: B não vê a nota de A
  const { data: listaB } = await B.from("notas").select("id")
  ok((listaB ?? []).length === 0, "B não deveria ver notas de A")

  // unique violation vira código 23505
  const { error: eDup } = await A.from("disciplinas").insert({
    professor_id: UID.A,
    nome: "Matemática",
  })
  ok(eDup?.code === "23505", `duplicidade deveria dar 23505 (veio ${eDup?.code})`)
})

await teste("links + leitura pública anon com RLS", async () => {
  const { data: link, error } = await A.from("links")
    .insert({
      professor_id: UID.A,
      tipo: "nota",
      nota_id: notaA,
      token: "tok-e2e-1",
      professor_nome: "Ana",
    })
    .select("*")
    .single()
  if (error) throw error

  const anon = createClient(URL_SHIM, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: visivel } = await anon
    .from("notas")
    .select("id, titulo")
    .eq("id", notaA)
    .maybeSingle()
  ok(visivel?.id === notaA, "anon deveria ver a nota publicada com link ativo")

  const { error: eRoubo } = await B.from("links").insert({
    professor_id: UID.B,
    tipo: "nota",
    nota_id: notaA,
    token: "roubo",
  })
  ok(eRoubo?.code === "42501", `B criando link p/ nota de A deveria dar RLS (veio ${eRoubo?.code})`)

  // rpc contador
  const { data: contou } = await anon.rpc("registrar_acesso", { p_token: "tok-e2e-1" })
  ok(contou === true, "registrar_acesso deveria retornar true")
})

await teste("storage: upload/download/list/remove com RLS por pasta", async () => {
  const caminho = `${UID.A}/figura-1.png`
  const { error: eUp } = await A.storage
    .from("imagens")
    .upload(caminho, Buffer.from("conteudo-da-imagem"), {
      contentType: "image/png",
    })
  ok(!eUp, `upload da própria pasta deveria funcionar (veio ${eUp?.message})`)

  const { data: baixado, error: eDown } = await A.storage.from("imagens").download(caminho)
  ok(!eDown && baixado, "download da própria pasta deveria funcionar")
  const texto = Buffer.from(await baixado.arrayBuffer()).toString()
  ok(texto === "conteudo-da-imagem", "conteúdo do download difere")

  const { data: objetos } = await A.storage.from("imagens").list(UID.A, { limit: 100 })
  ok(
    (objetos ?? []).some((o) => o.name === "figura-1.png"),
    "list deveria mostrar o arquivo",
  )

  const { error: eInvasao } = await B.storage
    .from("imagens")
    .upload(`${UID.A}/invasao.png`, Buffer.from("x"), { contentType: "image/png" })
  ok(eInvasao, "upload na pasta de outro professor deveria falhar")

  const { error: eRm } = await A.storage.from("imagens").remove([caminho])
  ok(!eRm, "remove deveria funcionar")
})

await teste("atualização de senha via updateUser + novo login", async () => {
  const { error } = await A.auth.updateUser({ password: "novaSenha456" })
  ok(!error, `updateUser senha falhou: ${error?.message}`)
  const c = createClient(URL_SHIM, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data, error: eLogin } = await c.auth.signInWithPassword({
    email: EMAIL_A,
    password: "novaSenha456",
  })
  ok(!eLogin && data.session, "login com a nova senha deveria funcionar")
})

await teste("recuperação de senha gera e-mail com link de redefinição", async () => {
  // fluxo PKCE, como o @supabase/ssr configura no app
  const c = createClient(URL_SHIM, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, flowType: "pkce" },
  })
  const { error } = await c.auth.resetPasswordForEmail(EMAIL_A)
  ok(!error, `recover não deveria falhar (veio: ${error?.message})`)
  const emails = ultimosEmails()
  const ultimo = emails[emails.length - 1]
  ok(ultimo?.para === EMAIL_A, "e-mail de recuperação registrado")
  ok(
    ultimo?.link?.includes("/auth/v1/verify?") && ultimo.link.includes("type=recovery"),
    "link de verificação PKCE no e-mail",
  )
  // segue o link: verify responde 302 com ?code= e troca o código por sessão
  const r = await fetch(ultimo.link, { redirect: "manual" })
  const destino = r.headers.get("location") ?? ""
  ok(r.status === 302 && destino.includes("code="), "verify deveria redirecionar com ?code=")
  const code = new URL(destino).searchParams.get("code")
  const troca = await fetch(`${URL_SHIM}/auth/v1/token?grant_type=pkce`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: ANON_KEY },
    body: JSON.stringify({ auth_code: code, code_verifier: "verificador-errado" }),
  })
  ok(troca.status === 400, "verificador errado deve falhar")
})

await teste("exclusão da conta (service role) derruba tudo em cascata", async () => {
  const { error } = await admin.auth.admin.deleteUser(UID.B)
  ok(!error, `deleteUser falhou: ${error?.message}`)
  const { data: perfis } = await admin.from("profiles").select("id")
  ok(
    (perfis ?? []).every((p) => p.id !== UID.B),
    "perfil de B deveria ter caído",
  )
})

console.log("")
if (falhas.length === 0) {
  console.log(`✓ Shim: ${passou} testes passaram.`)
  process.exit(0)
} else {
  console.error(`✗ ${falhas.length} teste(s) falharam (de ${passou + falhas.length}):`)
  for (const f of falhas) console.error(`  • ${f.nome}\n    ${f.erro}`)
  process.exit(1)
}
