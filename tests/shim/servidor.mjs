// ============================================================
// Shim local do Supabase para testes de ponta a ponta (sem Docker)
//
// Emula a superfície da API que o Caderno Aberto usa:
//   /auth/v1/*    : GoTrue (cadastro, login, refresh, user,
//                   logout, recuperação de senha)
//   /rest/v1/*    : PostgREST (filtros eq/neq/in/ilike/cs,
//                   order/limit, embedded por FK, rpc) : cada
//                   consulta roda com `set local role` + JWT em
//                   request.jwt.claims, então a RLS REAL do
//                   banco é exercida de verdade
//   /storage/v1/* : upload/download/list/remove com políticas
//                   de storage aplicadas via storage.objects
//
// Os "e-mails" do GoTrue são gravados em dados/emails.jsonl
// (o teste lê o link de recuperação de lá).
//
// Uso:  node tests/shim/servidor.mjs
// ============================================================

import http from "node:http"
import {
  createHash,
  createHmac,
  randomBytes,
  randomUUID,
  scryptSync,
  timingSafeEqual,
} from "node:crypto"
import {
  mkdirSync,
  readFileSync,
  writeFileSync,
  existsSync,
  rmSync,
  statSync,
  appendFileSync,
} from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { Client } from "pg"

const BASE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")
const DADOS = path.join(BASE, "tests/shim/dados")
const ARMAZENAMENTO = path.join(DADOS, "armazenamento")

export const PORTA = Number(process.env.SHIM_PORTA ?? 59999)
export const ANON_KEY = process.env.SHIM_ANON_KEY ?? "chave-anon-de-teste-0000000000000000"
export const SERVICE_KEY = process.env.SHIM_SERVICE_KEY ?? "chave-service-de-teste-0000000000000"
const JWT_SECRET = process.env.SHIM_JWT_SECRET ?? "segredo-jwt-de-teste"
const AUTO_CONFIRM = process.env.SHIM_AUTO_CONFIRM !== "false"
const ORIGEM_APP = process.env.SHIM_ORIGEM_APP ?? "http://localhost:3000"
const URL_SHIM_PUBLICA = process.env.SHIM_URL_PUBLICA ?? `http://127.0.0.1:${PORTA}`

const ARQ_USUARIOS = path.join(DADOS, "usuarios.json")
/** recuperação: token -> {userId, code_challenge, redirect_to} */
const PENDENCIAS = new Map()
/** pkce: code -> {userId, code_challenge} */
const CODIGOS_PKCE = new Map()
const ARQ_EMAILS = path.join(DADOS, "emails.jsonl")

const PG = {
  host: process.env.PGHOST ?? "127.0.0.1",
  port: Number(process.env.PGPORT ?? 54329),
  user: "postgres",
  database: process.env.PGDATABASE ?? "caderno_teste",
}

// ------------------------------------------------------------
// helpers: JWT + senha
// ------------------------------------------------------------

const b64u = (buf) => Buffer.from(buf).toString("base64url")

function assinarJWT(payload) {
  const header = b64u(JSON.stringify({ alg: "HS256", typ: "JWT" }))
  const corpo = b64u(JSON.stringify({ iat: Math.floor(Date.now() / 1000), ...payload }))
  const sig = b64u(createHmac("sha256", JWT_SECRET).update(`${header}.${corpo}`).digest())
  return `${header}.${corpo}.${sig}`
}

function verificarJWT(token) {
  try {
    const [h, c, s] = token.split(".")
    const esperado = b64u(createHmac("sha256", JWT_SECRET).update(`${h}.${c}`).digest())
    if (s !== esperado) return null
    const payload = JSON.parse(Buffer.from(c, "base64url").toString())
    if (payload.exp && payload.exp * 1000 < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

function hashSenha(senha) {
  const sal = randomBytes(16).toString("hex")
  const hash = scryptSync(senha, sal, 32).toString("hex")
  return `${sal}:${hash}`
}

function senhaCorreta(senha, guardada) {
  const [sal, hash] = guardada.split(":")
  const calculado = scryptSync(senha, sal, 32)
  const alvo = Buffer.from(hash, "hex")
  return calculado.length === alvo.length && timingSafeEqual(calculado, alvo)
}

// ------------------------------------------------------------
// loja de usuários + "caixa de e-mails"
// ------------------------------------------------------------

function limparDados() {
  mkdirSync(DADOS, { recursive: true })
  mkdirSync(ARMAZENAMENTO, { recursive: true })
  if (!existsSync(ARQ_USUARIOS)) writeFileSync(ARQ_USUARIOS, "{}")
  try {
    rmSync(ARQ_EMAILS)
  } catch {
    /* ok */
  }
}
limparDados()

function lerUsuarios() {
  return JSON.parse(readFileSync(ARQ_USUARIOS, "utf8"))
}
function salvarUsuarios(u) {
  writeFileSync(ARQ_USUARIOS, JSON.stringify(u, null, 2))
}
function registrarEmail(destinatario, assunto, link) {
  appendFileSync(
    ARQ_EMAILS,
    JSON.stringify({ para: destinatario, assunto, link, em: new Date().toISOString() }) + "\n",
  )
}
export function ultimosEmails() {
  try {
    return readFileSync(ARQ_EMAILS, "utf8")
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((l) => JSON.parse(l))
  } catch {
    return []
  }
}

// ------------------------------------------------------------
// banco: pool + tipos de colunas
// ------------------------------------------------------------

const adm = new Client(PG)
await adm.connect()

/** mapa tabela -> coluna -> tipo postgres (para casts corretos) */
const TIPOS = new Map()
{
  const { rows } = await adm.query(`
    select table_name, column_name, data_type
    from information_schema.columns
    where table_schema in ('public', 'storage')
  `)
  for (const r of rows) {
    if (!TIPOS.has(r.table_name)) TIPOS.set(r.table_name, new Map())
    TIPOS.get(r.table_name).set(r.column_name, r.data_type)
  }
}

function tipoCol(tabela, coluna) {
  return TIPOS.get(tabela)?.get(coluna) ?? "text"
}

/** Prepara um valor JS para o parâmetro SQL (jsonb vira string JSON). */
function prepararValor(tabela, coluna, valor) {
  const t = tipoCol(tabela, coluna)
  if ((t === "jsonb" || t === "json") && valor !== null && typeof valor !== "undefined") {
    return JSON.stringify(valor)
  }
  return valor
}

/** Executa SQL como um papel do Supabase (como o PostgREST faz). */
async function comoPapel(papel, claims, sql, valores = []) {
  const c = new Client(PG)
  await c.connect()
  try {
    await c.query("begin")
    await c.query(`set local role ${papel}`)
    await c.query(`set local request.jwt.claims = '${JSON.stringify(claims ?? {})}'`)
    const r = await c.query(sql, valores)
    await c.query("commit")
    return r
  } catch (e) {
    await c.query("rollback").catch(() => undefined)
    throw e
  } finally {
    await c.end().catch(() => undefined)
  }
}

// ------------------------------------------------------------
// usuário GoTrue
// ------------------------------------------------------------

async function usuarioPG(id) {
  const { rows } = await adm.query("select * from auth.users where id = $1", [id])
  return rows[0] ?? null
}

function objetoUsuario(u, extra = {}) {
  return {
    id: u.id,
    aud: "authenticated",
    role: "authenticated",
    email: u.email,
    email_confirmed_at: u.email_confirmed_at?.toISOString?.() ?? u.email_confirmed_at ?? null,
    phone: "",
    confirmed_at: u.email_confirmed_at?.toISOString?.() ?? null,
    last_sign_in_at: u.last_sign_in_at?.toISOString?.() ?? null,
    app_metadata: u.raw_app_meta_data ?? { provider: "email", providers: ["email"] },
    user_metadata: u.raw_user_meta_data ?? {},
    identities: u.email_confirmed_at
      ? [
          {
            id: u.id,
            user_id: u.id,
            identity_data: { email: u.email, sub: u.id },
            provider: "email",
            last_sign_in_at: u.created_at?.toISOString?.() ?? null,
          },
        ]
      : [],
    created_at: u.created_at?.toISOString?.() ?? u.created_at ?? null,
    updated_at: u.updated_at?.toISOString?.() ?? u.updated_at ?? null,
    is_anonymous: false,
    ...extra,
  }
}

function corpoSessao(u, loja) {
  const agora = Math.floor(Date.now() / 1000)
  const access = assinarJWT({ sub: u.id, role: "authenticated", email: u.email, exp: agora + 3600 })
  const refresh = randomBytes(24).toString("hex")
  loja[u.id].refresh_token = refresh
  salvarUsuarios(loja)
  return {
    access_token: access,
    token_type: "bearer",
    expires_in: 3600,
    expires_at: agora + 3600,
    refresh_token: refresh,
    user: objetoUsuario(u),
  }
}

// ------------------------------------------------------------
// papel a partir dos cabeçalhos (apikey/Authorization)
// ------------------------------------------------------------

function papelDosHeaders(req) {
  const auth = req.headers.authorization ?? ""
  const apikey = req.headers.apikey ?? ""
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : ""
  const token = bearer || apikey
  if (token === SERVICE_KEY) return { papel: "service_role", claims: { role: "service_role" } }
  if (token && token !== ANON_KEY) {
    const payload = verificarJWT(token)
    if (payload?.sub) return { papel: "authenticated", claims: payload }
  }
  return { papel: "anon", claims: { role: "anon" } }
}

// ------------------------------------------------------------
// PostgREST: parser de filtros
// ------------------------------------------------------------

function castValor(tabela, coluna) {
  const t = tipoCol(tabela, coluna)
  if (t.startsWith("timestamp")) return "::timestamptz"
  if (t === "uuid") return "::uuid"
  if (t === "integer" || t === "smallint" || t === "bigint") return "::int8"
  if (t === "numeric") return "::numeric"
  if (t === "boolean") return "::bool"
  if (t === "ARRAY") return ""
  return ""
}

function montarWhere(tabela, query) {
  const clausulas = []
  const valores = []
  const OPERACOES = ["eq", "neq", "in", "ilike", "cs"]

  for (const [chave, valor] of query.entries()) {
    if (["select", "order", "limit", "offset", "on_conflict"].includes(chave)) continue
    const m = /^(\w+)\.([\s\S]*)$/.exec(valor ?? "")
    if (!m || !OPERACOES.includes(m[1])) continue
    const [_, op, resto] = m

    const col = `"${chave}"`
    const cast = castValor(tabela, chave)

    if (op === "eq") {
      valores.push(resto)
      clausulas.push(`${col} = $${valores.length}${cast}`)
    } else if (op === "neq") {
      valores.push(resto)
      clausulas.push(`${col} <> $${valores.length}${cast}`)
    } else if (op === "in") {
      const itens = resto
        .replace(/^\(|\)$/g, "")
        .split(",")
        .map((v) => v.replace(/^"|"$/g, ""))
        .filter(Boolean)
      valores.push(itens)
      clausulas.push(`${col} = any($${valores.length}${cast}[])`)
    } else if (op === "ilike") {
      valores.push(resto.replace(/\*/g, "%"))
      clausulas.push(`${col} ilike $${valores.length}`)
    } else if (op === "cs") {
      // cs.{v1,v2} ou cs.{"v1","v2"}
      const itens = resto
        .replace(/^\{|}$/g, "")
        .split(",")
        .map((v) => v.replace(/^"|"$/g, "").trim())
        .filter(Boolean)
      const t = tipoCol(tabela, chave)
      const tipoArray = t === "ARRAY" ? "uuid[]" : "text[]"
      valores.push(itens)
      clausulas.push(`${col} @> $${valores.length}::${tipoArray}`)
    }
  }
  return { clausulas, valores }
}

/** Relações FK conhecidas (tabela -> alvo) para o select embutido. */
const FKS = {
  notas: { disciplinas: { coluna: "disciplina_id", ref: "id" } },
}

function montarSelect(tabela, spec, prefixo = "t") {
  // spec: "*,disciplina:disciplinas(*)" | "id, titulo" | "*"
  const partes = spec
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean)
  const colunas = []
  const embutidos = []
  for (const p of partes) {
    if (p === "*") {
      colunas.push(`${prefixo}.*`)
    } else {
      const m = /^(\w+):(\w+)\(\*\)$/.exec(p)
      if (m) {
        const [, alias, alvo] = m
        const fk = FKS[tabela]?.[alvo]
        if (fk) embutidos.push({ alias, alvo, fk })
      } else if (/^\w+$/.test(p)) {
        colunas.push(`${prefixo}."${p}"`)
      }
    }
  }
  if (colunas.length === 0) colunas.push(`${prefixo}.*`)
  return { colunas: colunas.join(", "), embutidos }
}

function sqlComEmbutido(tabela, sqlInterno, embutidos, prefixo = "t") {
  if (embutidos.length === 0) return { sql: sqlInterno, juntas: [] }
  // CTE (insert/update não podem ficar em subquery no Postgres)
  const joins = embutidos
    .map(
      ({ alias, alvo, fk }) =>
        `left join ${alvo} "${alias}_t" on interna."${fk.coluna}" = "${alias}_t"."${fk.ref}"`,
    )
    .join(" ")
  const selects = [`interna.*`]
  for (const { alias } of embutidos) {
    selects.push(`row_to_json("${alias}_t".*) as "${alias}"`)
  }
  return {
    sql: `with interna as (${sqlInterno}) select ${selects.join(", ")} from interna ${joins}`,
    juntas: embutidos,
  }
}

// ------------------------------------------------------------
// handler REST
// ------------------------------------------------------------

const CODIGO_HTTP = {
  23505: 409,
  23503: 409,
  42501: 403,
  23514: 400,
  23000: 409,
}

function erroPostgrest(e) {
  return {
    status: CODIGO_HTTP[e.code] ?? 400,
    corpo: {
      code: e.code ?? "XX000",
      message: e.message,
      details: e.detail ?? "",
      hint: e.hint ?? "",
    },
  }
}

async function restHandler(req, res, url) {
  const { papel, claims } = papelDosHeaders(req)
  const caminho = url.pathname.replace(/^\/rest\/v1\//, "")
  const aceitaObjeto = (req.headers.accept ?? "").includes("vnd.pgrst.object+json")
  const retorno = (req.headers.prefer ?? "").includes("return=representation")

  try {
    // ---------- RPC ----------
    if (caminho.startsWith("rpc/")) {
      const fn = caminho.slice(4)
      const args = req.__corpo ?? {}
      const chaves = Object.keys(args)
      const valores = chaves.map((k) => args[k])
      const params = chaves.map((_, i) => `$${i + 1}`).join(",")
      const r = await comoPapel(
        papel,
        claims,
        `select public.${fn}(${params}) as resultado`,
        valores,
      )
      res.writeHead(200, { "Content-Type": "application/json" })
      res.end(JSON.stringify(r.rows[0]?.resultado ?? null))
      return
    }

    // ---------- tabela ----------
    const tabela = caminho
    if (!TIPOS.has(tabela)) {
      res.writeHead(404, { "Content-Type": "application/json" })
      res.end(JSON.stringify({ code: "42P01", message: `relation "${tabela}" does not exist` }))
      return
    }

    const query = url.searchParams
    const spec = query.get("select") ?? "*"
    const { clausulas, valores } = montarWhere(tabela, query)
    const where = clausulas.length ? `where ${clausulas.join(" and ")}` : ""
    const { colunas, embutidos } = montarSelect(tabela, spec)

    // ordenação: order=col.dir,col2.dir2
    let order = ""
    const ordemBruta = query.get("order")
    if (ordemBruta) {
      const partes = ordemBruta.split(",").map((p) => {
        const [col, dir] = p.trim().split(".")
        return `"${col}" ${dir === "desc" ? "desc" : "asc"} nulls last`
      })
      order = `order by ${partes.join(", ")}`
    }
    const limite = query.get("limit") ? `limit ${parseInt(query.get("limit"), 10)}` : ""
    const offset = query.get("offset") ? `offset ${parseInt(query.get("offset"), 10)}` : ""

    if (req.method === "GET") {
      const sqlBase = `select ${colunas} from ${tabela} t ${where} ${order} ${limite} ${offset}`
      const { sql } = embutidos.length
        ? sqlComEmbutido(tabela, sqlBase, embutidos)
        : { sql: sqlBase }
      const r = await comoPapel(papel, claims, sql, valores)
      const linhas = r.rows
      res.writeHead(200, { "Content-Type": "application/json" })
      if (aceitaObjeto) {
        if (linhas.length === 0) {
          res.writeHead(406, { "Content-Type": "application/json" })
          res.end(
            JSON.stringify({
              code: "PGRST116",
              message: "JSON object requested, multiple (or no) rows returned",
              details: "Results contain 0 rows",
              hint: null,
            }),
          )
        } else {
          res.end(JSON.stringify(linhas[0]))
        }
      } else {
        res.end(JSON.stringify(linhas))
      }
      return
    }

    if (req.method === "POST") {
      const corpo = req.__corpo ?? {}
      const registro = Array.isArray(corpo) ? corpo[0] : corpo
      const chaves = Object.keys(registro)
      if (chaves.length === 0) throw new Error("Corpo vazio")
      const cols = chaves.map((c) => `"${c}"`).join(", ")
      const params = chaves
        .map((c, i) => {
          const t = tipoCol(tabela, c)
          return t === "jsonb" || t === "json" ? `$${i + 1}::jsonb` : `$${i + 1}`
        })
        .join(", ")
      const vals = chaves.map((c) => prepararValor(tabela, c, registro[c]))
      const { sql } = retorno
        ? embutidos.length
          ? sqlComEmbutido(
              tabela,
              `insert into ${tabela} (${cols}) values (${params}) returning *`,
              embutidos,
            )
          : { sql: `insert into ${tabela} (${cols}) values (${params}) returning *` }
        : { sql: `insert into ${tabela} (${cols}) values (${params})` }
      const r = await comoPapel(papel, claims, sql, vals)
      res.writeHead(201, { "Content-Type": "application/json" })
      if (retorno) {
        const linhas = r.rows
        if (aceitaObjeto) res.end(JSON.stringify(linhas[0] ?? null))
        else res.end(JSON.stringify(linhas))
      } else {
        res.end("null")
      }
      return
    }

    if (req.method === "PATCH") {
      const corpo = req.__corpo ?? {}
      const chaves = Object.keys(corpo)
      const sets = chaves
        .map((c, i) => {
          const t = tipoCol(tabela, c)
          const cast = t === "jsonb" || t === "json" ? "::jsonb" : ""
          return `"${c}" = $${valores.length + i + 1}${cast}`
        })
        .join(", ")
      const vals = [...valores, ...chaves.map((c) => prepararValor(tabela, c, corpo[c]))]
      const sqlBase = `update ${tabela} t set ${sets} ${where} returning *`
      const { sql } = embutidos.length
        ? sqlComEmbutido(tabela, sqlBase, embutidos)
        : { sql: sqlBase }
      const r = await comoPapel(papel, claims, sql, vals)
      res.writeHead(200, { "Content-Type": "application/json" })
      const linhas = r.rows
      if (aceitaObjeto) {
        if (linhas.length === 0) {
          res.writeHead(406, { "Content-Type": "application/json" })
          res.end(
            JSON.stringify({
              code: "PGRST116",
              message: "JSON object requested, multiple (or no) rows returned",
            }),
          )
        } else res.end(JSON.stringify(linhas[0]))
      } else {
        res.end(JSON.stringify(linhas))
      }
      return
    }

    if (req.method === "DELETE") {
      const sql = retorno
        ? `delete from ${tabela} ${where} returning *`
        : `delete from ${tabela} ${where}`
      const r = await comoPapel(papel, claims, sql, valores)
      if (retorno) {
        res.writeHead(200, { "Content-Type": "application/json" })
        res.end(JSON.stringify(r.rows))
      } else {
        res.writeHead(204)
        res.end()
      }
      return
    }

    res.writeHead(405)
    res.end()
  } catch (e) {
    const { status, corpo } = erroPostgrest(e)
    res.writeHead(status, { "Content-Type": "application/json" })
    res.end(JSON.stringify(corpo))
  }
}

// ------------------------------------------------------------
// handler Storage
// ------------------------------------------------------------

function caminhoArquivo(bucket, caminho) {
  const alvo = path.join(ARMAZENAMENTO, bucket, caminho)
  if (!alvo.startsWith(path.join(ARMAZENAMENTO, bucket))) throw new Error("caminho inválido")
  return alvo
}

async function storageHandler(req, res, url) {
  const { papel, claims } = papelDosHeaders(req)
  const partes = url.pathname.replace(/^\/storage\/v1\//, "").split("/")
  const recurso = partes[0] // "object" | "object" com ações
  try {
    // POST /object/list/{bucket}
    if (req.method === "POST" && partes[1] === "list" && partes[2]) {
      const bucket = partes[2]
      const corpo = req.__corpo ?? {}
      const prefixo = (corpo.prefix ?? "").replace(/\/$/, "")
      const filtro = prefixo ? `${prefixo}/%` : "%"
      const r = await comoPapel(
        papel,
        claims,
        `select name, id, metadata, created_at, updated_at from storage.objects
         where bucket_id = $1 and name like $2
         order by name asc limit $3`,
        [bucket, filtro, corpo.limit ?? 100],
      )
      const itens = r.rows.map((row) => {
        const alvo = caminhoArquivo(bucket, row.name)
        const existeArquivo = existsSync(alvo)
        return {
          name: row.name.split("/").pop(),
          id: existeArquivo ? row.id : null, // id null = pasta (convenção do Storage)
          updated_at: row.updated_at,
          created_at: row.created_at,
          last_accessed_at: row.updated_at,
          metadata: row.metadata ?? { size: 0 },
        }
      })
      // inclui pastas intermediárias quando há prefixo vazio
      res.writeHead(200, { "Content-Type": "application/json" })
      res.end(JSON.stringify(itens))
      return
    }

    // DELETE /object/{bucket} com body {prefixes}
    if (req.method === "DELETE" && partes[1] && !partes[2]) {
      const bucket = partes[1]
      const prefixos = req.__corpo?.prefixes ?? []
      for (const p of prefixos) {
        await comoPapel(
          papel,
          claims,
          `delete from storage.objects where bucket_id = $1 and name = $2`,
          [bucket, p],
        )
        const alvo = caminhoArquivo(bucket, p)
        if (existsSync(alvo)) rmSync(alvo)
      }
      res.writeHead(200, { "Content-Type": "application/json" })
      res.end(JSON.stringify({ message: `${prefixos.length} objetos removidos` }))
      return
    }

    // POST /object/{bucket}/{caminho...} : upload
    if (req.method === "POST" && partes[1] && partes.length >= 3) {
      const bucket = partes[1]
      const caminho = partes.slice(2).join("/")
      const mime = req.headers["content-type"] ?? "application/octet-stream"
      const alvo = caminhoArquivo(bucket, caminho)
      // RLS: insert em storage.objects (política valida a pasta do professor)
      await comoPapel(
        papel,
        claims,
        `insert into storage.objects (bucket_id, name, owner, metadata)
         values ($1, $2, $3, $4::jsonb)`,
        [
          bucket,
          caminho,
          claims.sub ?? null,
          JSON.stringify({ size: req.__corpo.length, mimetype: mime }),
        ],
      )
      mkdirSync(path.dirname(alvo), { recursive: true })
      writeFileSync(alvo, req.__corpo)
      res.writeHead(200, { "Content-Type": "application/json" })
      res.end(JSON.stringify({ Key: `${bucket}/${caminho}` }))
      return
    }

    // GET /object/{bucket}/{caminho...} : download (RLS no select)
    if (req.method === "GET" && partes[1] && partes.length >= 3) {
      const bucket = partes[1]
      const caminho = partes.slice(2).join("/")
      const r = await comoPapel(
        papel,
        claims,
        `select id, metadata from storage.objects where bucket_id = $1 and name = $2`,
        [bucket, caminho],
      )
      if (r.rows.length === 0) {
        res.writeHead(400, { "Content-Type": "application/json" })
        res.end(
          JSON.stringify({
            statusCode: "404",
            error: "Object not found",
            message: "Object not found",
          }),
        )
        return
      }
      const alvo = caminhoArquivo(bucket, caminho)
      if (!existsSync(alvo)) {
        res.writeHead(400, { "Content-Type": "application/json" })
        res.end(JSON.stringify({ statusCode: "404", error: "Object not found" }))
        return
      }
      const mime = r.rows[0].metadata?.mimetype ?? "application/octet-stream"
      const bytes = readFileSync(alvo)
      res.writeHead(200, { "Content-Type": mime })
      res.end(bytes)
      return
    }

    res.writeHead(404, { "Content-Type": "application/json" })
    res.end(
      JSON.stringify({ error: "rota de storage não implementada no shim", rota: url.pathname }),
    )
  } catch (e) {
    const { status, corpo } = erroPostgrest(e)
    res.writeHead(status, { "Content-Type": "application/json" })
    res.end(JSON.stringify(corpo))
  }
}

// ------------------------------------------------------------
// handler Auth (GoTrue)
// ------------------------------------------------------------

async function authHandler(req, res, url) {
  const rota = url.pathname.replace(/^\/auth\/v1\//, "")
  const corpo = req.__corpo ?? {}
  const loja = lerUsuarios()

  const responder = (status, json) => {
    res.writeHead(status, { "Content-Type": "application/json" })
    res.end(JSON.stringify(json))
  }

  // ---- token (login / refresh) ----
  if (rota === "token") {
    const grant = url.searchParams.get("grant_type")
    if (grant === "password") {
      const { rows } = await adm.query("select * from auth.users where lower(email) = lower($1)", [
        corpo.email ?? "",
      ])
      const u = rows[0]
      const registro = u ? loja[u.id] : null
      if (!u || !registro || !senhaCorreta(corpo.password ?? "", registro.hash)) {
        return responder(400, { code: "invalid_credentials", msg: "Invalid login credentials" })
      }
      await adm.query("update auth.users set last_sign_in_at = now() where id = $1", [u.id])
      return responder(200, corpoSessao(u, loja))
    }
    if (grant === "refresh_token") {
      const token = corpo.refresh_token ?? ""
      const id = Object.keys(loja).find((k) => loja[k].refresh_token === token)
      const u = id ? await usuarioPG(id) : null
      if (!u)
        return responder(400, { code: "refresh_token_not_found", msg: "Invalid Refresh Token" })
      return responder(200, corpoSessao(u, loja))
    }
    if (grant === "pkce") {
      const entrada = CODIGOS_PKCE.get(corpo.auth_code ?? "")
      if (!entrada)
        return responder(400, { code: "invalid_request", msg: "Invalid authorization code" })
      CODIGOS_PKCE.delete(corpo.auth_code)
      // S256: challenge = base64url(sha256(verifier))
      if (entrada.code_challenge) {
        const calculado = b64u(
          createHash("sha256")
            .update(String(corpo.code_verifier ?? ""))
            .digest(),
        )
        if (calculado !== entrada.code_challenge) {
          return responder(400, { code: "invalid_grant", msg: "PKCE code_verifier mismatch" })
        }
      }
      const u = await usuarioPG(entrada.userId)
      if (!u) return responder(400, { code: "invalid_request", msg: "Usuário não encontrado" })
      await adm.query("update auth.users set last_sign_in_at = now() where id = $1", [u.id])
      return responder(200, corpoSessao(u, loja))
    }
    return responder(400, { error: "unsupported_grant_type" })
  }

  // ---- signup ----
  if (rota === "signup" && req.method === "POST") {
    const email = String(corpo.email ?? "")
      .trim()
      .toLowerCase()
    const senha = String(corpo.password ?? "")
    const nome = corpo.data?.nome ?? ""
    if (!email.includes("@") || senha.length < 6) {
      return responder(400, {
        code: "weak_password",
        msg: "Password should be at least 6 characters.",
      })
    }
    const { rows } = await adm.query("select id from auth.users where lower(email) = lower($1)", [
      email,
    ])
    if (rows.length > 0) {
      return responder(400, { code: "user_already_exists", msg: "User already registered" })
    }
    const id = randomUUID()
    const confirmadoEm = AUTO_CONFIRM ? new Date() : null
    await adm.query(
      `insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, raw_app_meta_data)
       values ($1, $2, $3, $4, $5::jsonb, $6::jsonb)`,
      [
        id,
        email,
        "(shim)",
        confirmadoEm,
        JSON.stringify({ nome }),
        JSON.stringify({ provider: "email", providers: ["email"] }),
      ],
    )
    loja[id] = { hash: hashSenha(senha) }
    salvarUsuarios(loja)
    const u = await usuarioPG(id)

    if (AUTO_CONFIRM) {
      const sessao = corpoSessao(u, loja)
      return responder(200, sessao) // sessão no topo + user embutido
    }
    registrarEmail(email, "Confirme sua conta", `${ORIGEM_APP}/#/entrar`)
    return responder(200, objetoUsuario(u)) // só o usuário (sem sessão)
  }

  // ---- logout ----
  if (rota === "logout" && req.method === "POST") {
    const auth = req.headers.authorization ?? ""
    const payload = verificarJWT(auth.replace(/^Bearer /, ""))
    if (payload?.sub && loja[payload.sub]) {
      loja[payload.sub].refresh_token = null
      salvarUsuarios(loja)
    }
    res.writeHead(200, { "Content-Type": "application/json" })
    return res.end("{}")
  }

  // ---- usuário atual ----
  if (rota === "user" && req.method === "GET") {
    const { papel, claims } = papelDosHeaders(req)
    if (papel !== "authenticated" || !claims.sub) {
      return responder(401, { code: "bad_jwt", msg: "invalid claim: sub" })
    }
    const u = await usuarioPG(claims.sub)
    if (!u) return responder(404, { message: "User from sub claim in JWT does not exist" })
    return responder(200, objetoUsuario(u))
  }

  // ---- atualizar usuário (senha / e-mail / metadados) ----
  if (rota === "user" && req.method === "PUT") {
    const { papel, claims } = papelDosHeaders(req)
    if (papel !== "authenticated" || !claims.sub) {
      return responder(401, { code: "bad_jwt", msg: "invalid claim: sub" })
    }
    const u = await usuarioPG(claims.sub)
    if (!u) return responder(404, { message: "não encontrado" })

    if (typeof corpo.password === "string") {
      if (corpo.password.length < 6) {
        return responder(400, {
          code: "weak_password",
          msg: "Password should be at least 6 characters.",
        })
      }
      loja[claims.sub].hash = hashSenha(corpo.password)
      salvarUsuarios(loja)
    }
    if (typeof corpo.email === "string" && corpo.email !== u.email) {
      const { rows } = await adm.query("select id from auth.users where lower(email) = lower($1)", [
        corpo.email,
      ])
      if (rows.length > 0)
        return responder(422, { code: "email_exists", msg: "This email is already in use" })
      // guarda pendência e "envia" e-mail de confirmação
      loja[claims.sub].email_pendente = corpo.email.toLowerCase()
      salvarUsuarios(loja)
      registrarEmail(
        corpo.email.toLowerCase(),
        "Confirme a troca de e-mail",
        `${ORIGEM_APP}/#/conta`,
      )
      await adm.query(
        "update auth.users set raw_user_meta_data = raw_user_meta_data || $1::jsonb where id = $2",
        [JSON.stringify({ email_pendente: corpo.email.toLowerCase() }), claims.sub],
      )
    }
    if (corpo.data && typeof corpo.data === "object") {
      await adm.query(
        "update auth.users set raw_user_meta_data = raw_user_meta_data || $1::jsonb where id = $2",
        [JSON.stringify(corpo.data), claims.sub],
      )
    }
    const atualizado = await usuarioPG(claims.sub)
    return responder(
      200,
      objetoUsuario(atualizado, { new_email: loja[claims.sub].email_pendente ?? null }),
    )
  }

  // ---- recuperação de senha (fluxo PKCE, como o GoTrue real) ----
  if (rota === "recover" && req.method === "POST") {
    const email = String(corpo.email ?? "")
      .trim()
      .toLowerCase()
    const { rows } = await adm.query("select * from auth.users where lower(email) = lower($1)", [
      email,
    ])
    if (rows[0] && loja[rows[0].id]) {
      const token = randomBytes(20).toString("hex")
      PENDENCIAS.set(token, {
        userId: rows[0].id,
        code_challenge: corpo.code_challenge ?? null,
        code_challenge_method: corpo.code_challenge_method ?? null,
        redirect_to: url.searchParams.get("redirect_to") ?? `${ORIGEM_APP}/`,
      })
      const link = `${URL_SHIM_PUBLICA}/auth/v1/verify?token=${token}&redirect_to=${encodeURIComponent(
        url.searchParams.get("redirect_to") ?? `${ORIGEM_APP}/`,
      )}&type=recovery`
      registrarEmail(email, "Redefinição de senha", link)
    }
    res.writeHead(200, { "Content-Type": "application/json" })
    return res.end("{}")
  }

  // ---- verify: troca o token do e-mail por um código de autorização ----
  if (rota === "verify" && req.method === "GET") {
    const token = url.searchParams.get("token") ?? ""
    const pendencia = PENDENCIAS.get(token)
    if (!pendencia) {
      res.writeHead(400, { "Content-Type": "application/json" })
      return res.end(JSON.stringify({ msg: "Token inválido ou expirado", code: "403" }))
    }
    PENDENCIAS.delete(token)
    const code = randomBytes(20).toString("hex")
    CODIGOS_PKCE.set(code, { userId: pendencia.userId, code_challenge: pendencia.code_challenge })
    const redirect = pendencia.redirect_to ?? `${ORIGEM_APP}/`
    const sep = redirect.includes("?") ? "&" : "?"
    res.writeHead(302, { Location: `${redirect}${sep}code=${code}` })
    return res.end()
  }

  // ---- admin: excluir usuário (service role) ----
  if (rota.startsWith("admin/users/") && req.method === "DELETE") {
    const { papel } = papelDosHeaders(req)
    if (papel !== "service_role")
      return responder(403, { message: "Only service role can delete users" })
    const id = rota.split("/").pop()
    const u = await usuarioPG(id)
    if (!u) return responder(404, { message: "User not found" })
    await adm.query("delete from auth.users where id = $1", [id])
    delete loja[id]
    salvarUsuarios(loja)
    res.writeHead(200, { "Content-Type": "application/json" })
    return res.end("{}")
  }

  res.writeHead(404, { "Content-Type": "application/json" })
  res.end(JSON.stringify({ error: `rota auth não implementada: ${rota}` }))
}

// ------------------------------------------------------------
// servidor HTTP
// ------------------------------------------------------------

const CABECALHOS_CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type, x-client-info, x-supabase-api-version, x-upsert, accept, accept-profile, content-profile, prefer, range",
  "Access-Control-Expose-Headers": "Content-Range, Content-Type",
  "Access-Control-Max-Age": "86400",
}

const servidor = http.createServer(async (req, res) => {
  for (const [k, v] of Object.entries(CABECALHOS_CORS)) res.setHeader(k, v)
  if (req.method === "OPTIONS") {
    res.writeHead(204)
    return res.end()
  }

  const url = new URL(req.url ?? "/", `http://127.0.0.1:${PORTA}`)

  // corpo (texto para storage, json para o resto)
  await new Promise((resolver) => {
    const pedacos = []
    req.on("data", (c) => pedacos.push(c))
    req.on("end", () => {
      const bruto = Buffer.concat(pedacos)
      if (url.pathname.startsWith("/storage/v1/")) {
        req.__corpo = bruto
      } else {
        const texto = bruto.toString("utf8")
        try {
          req.__corpo = texto ? JSON.parse(texto) : {}
        } catch {
          req.__corpo = {}
        }
      }
      resolver()
    })
  })

  try {
    if (url.pathname.startsWith("/auth/v1/")) return await authHandler(req, res, url)
    if (url.pathname.startsWith("/rest/v1/")) return await restHandler(req, res, url)
    if (url.pathname.startsWith("/storage/v1/")) return await storageHandler(req, res, url)

    // utilidades de teste
    if (url.pathname === "/_teste/emails") {
      res.writeHead(200, { "Content-Type": "application/json" })
      return res.end(JSON.stringify(ultimosEmails()))
    }
    if (url.pathname === "/_teste/health") {
      res.writeHead(200, { "Content-Type": "application/json" })
      return res.end(JSON.stringify({ ok: true }))
    }

    res.writeHead(404, { "Content-Type": "application/json" })
    res.end(
      JSON.stringify({ erro: `rota não implementada no shim: ${req.method} ${url.pathname}` }),
    )
  } catch (e) {
    console.error("[shim] erro:", e)
    res.writeHead(500, { "Content-Type": "application/json" })
    res.end(JSON.stringify({ erro: e.message }))
  }
})

export function iniciar() {
  return new Promise((resolver) => {
    servidor.listen(PORTA, "127.0.0.1", () => {
      console.log(`✓ Shim do Supabase em http://127.0.0.1:${PORTA}`)
      console.log(`  (anon ${ANON_KEY.slice(0, 12)}… · service ${SERVICE_KEY.slice(0, 12)}…)`)
      resolver(servidor)
    })
  })
}

// execução direta: `node tests/shim/servidor.mjs`
if (import.meta.url === `file://${process.argv[1]}`) {
  iniciar()
  const desligar = async () => {
    await adm.end().catch(() => undefined)
    servidor.close(() => process.exit(0))
    setTimeout(() => process.exit(0), 500).unref()
  }
  process.on("SIGINT", desligar)
  process.on("SIGTERM", desligar)
}
