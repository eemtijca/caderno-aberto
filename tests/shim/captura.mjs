// Captura as URLs/headers que o supabase-js realmente envia para cada
// padrão de query usado pelo app : base para o shim de testes.
import http from "node:http"
import { createClient } from "@supabase/supabase-js"

const log = []
const srv = http.createServer((req, res) => {
  let body = ""
  req.on("data", (c) => (body += c))
  req.on("end", () => {
    log.push(
      `${req.method} ${req.url} | accept=${req.headers.accept} | prefer=${req.headers.prefer} | body=${body.slice(0, 120)}`,
    )
    res.writeHead(200, { "Content-Type": "application/json" })
    res.end("[]")
  })
})

await new Promise((r) => srv.listen(59998, r))

const c = createClient("http://127.0.0.1:59998", "anonkey123", {
  auth: { persistSession: false, autoRefreshToken: false },
})

const uid = "11111111-1111-1111-1111-111111111111"
const jwt =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMTExMTExMS0xMTExLTExMTEtMTExMS0xMTExMTExMTExMTEiLCJyb2xlIjoiYXV0aGVudGljYXRlZCJ9.sig"
await c.auth.setSession({
  access_token: jwt,
  refresh_token: "ref",
  expires_in: 3600,
  expires_at: Date.now() / 1000 + 3600,
  token_type: "bearer",
  user: { id: uid },
})

// padrões usados pelas rotas do app
await c
  .from("notas")
  .select("*, disciplina:disciplinas(*)")
  .eq("professor_id", uid)
  .ilike("busca", "%func%")
  .contains("turmas_ids", [uid])
  .order("ano_letivo", { ascending: false })
  .order("mes", { ascending: false })
  .order("atualizado_em", { ascending: false })
  .limit(40)
await c.from("notas").select("*").eq("id", uid).maybeSingle()
await c.from("notas").select("id, titulo").in("id", [uid, "22222222-2222-2222-2222-222222222222"])
await c
  .from("notas")
  .insert({ professor_id: uid, titulo: "x" })
  .select("*, disciplina:disciplinas(*)")
  .single()
await c
  .from("notas")
  .update({ titulo: "y" })
  .eq("id", uid)
  .select("*, disciplina:disciplinas(*)")
  .single()
await c.from("notas").update({ titulo: "z" }).eq("id", uid).select("*").maybeSingle()
await c.from("notas").delete().eq("id", uid)
await c.from("notas").delete().neq("id", "00000000-0000-0000-0000-000000000000")
await c.from("profiles").select("*").eq("id", uid).maybeSingle()
await c.from("disciplinas").select("*").eq("professor_id", uid).order("ordem")
await c.rpc("registrar_acesso", { p_token: "abc" })
await c.storage
  .from("imagens")
  .upload(`${uid}/fig.png`, Buffer.from("x"), { contentType: "image/png" })
await c.storage.from("imagens").download(`${uid}/fig.png`)
await c.storage.from("imagens").list(uid, { limit: 1000 })
await c.storage.from("imagens").remove([`${uid}/fig.png`])

console.log(log.join("\n"))
srv.close()
process.exit(0)
