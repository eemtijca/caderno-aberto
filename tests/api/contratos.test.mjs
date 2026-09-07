// Contratos HTTP da API com banco limpo e app no ar.
// Uso: TEST_BASE_URL=http://127.0.0.1:3000 node tests/api/contratos.test.mjs
const BASE = process.env.TEST_BASE_URL || "http://127.0.0.1:3000"

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

class Cliente {
  constructor() {
    this.jar = {}
  }
  async pedir(metodo, caminho, corpo, tipo) {
    const cabecalhos = {}
    const cookies = Object.entries(this.jar)
      .map(([k, v]) => `${k}=${v}`)
      .join("; ")
    if (cookies) cabecalhos.cookie = cookies
    let payload
    if (tipo === "form") {
      payload = corpo
    } else if (corpo !== undefined) {
      cabecalhos["content-type"] = "application/json"
      payload = JSON.stringify(corpo)
    }
    const r = await fetch(`${BASE}${caminho}`, { method: metodo, headers: cabecalhos, body: payload, redirect: "manual" })
    const brutas = r.headers.getSetCookie?.() ?? []
    for (const c of brutas) {
      const [par] = c.split(";")
      const i = par.indexOf("=")
      this.jar[par.slice(0, i).trim()] = par.slice(i + 1).trim()
    }
    const texto = await r.text()
    let dados = null
    try {
      dados = texto ? JSON.parse(texto) : null
    } catch {
      dados = { _texto: texto }
    }
    return { status: r.status, dados, cabecalhos: r.headers }
  }
  get(c) { return this.pedir("GET", c) }
  post(c, b) { return this.pedir("POST", c, b) }
  put(c, b) { return this.pedir("PUT", c, b) }
  patch(c, b) { return this.pedir("PATCH", c, b) }
  del(c) { return this.pedir("DELETE", c) }
}

const sufixo = Math.random().toString(36).slice(2, 8)
const emailA = `api_a_${sufixo}@exemplo.br`
const emailB = `api_b_${sufixo}@exemplo.br`
const senha = "senha123"

async function tokenOutbox(email) {
  for (let i = 0; i < 40; i++) {
    const r = await fetch(`${BASE}/api/teste/outbox`)
    const { emails } = await r.json()
    const achado = [...emails].reverse().find((e) => e.para.includes(email))
    if (achado) {
      const m = achado.html.match(/token=([0-9a-f]{64})/)
      if (m) return m[1]
    }
    await new Promise((r2) => setTimeout(r2, 500))
  }
  throw new Error(`sem token para ${email}`)
}

// Saúde.
{
  const r = await fetch(`${BASE}/api/`)
  ok(r.ok, "saúde /api responde")
}

// Conta A: cadastro, verificação e login.
const a = new Cliente()
{
  const r = await a.post("/api/auth/cadastro", { nome: "Prof A", email: emailA, senha })
  ok(r.status === 201 && r.dados.estado === "confirmar", "cadastro cria e pede confirmação")
  const antes = await a.post("/api/auth/entrar", { email: emailA, senha })
  ok(antes.status === 403, "login bloqueado antes de confirmar")
  const token = await tokenOutbox(emailA)
  const v = await fetch(`${BASE}/api/auth/verificar?token=${token}`, { redirect: "manual" })
  ok(v.status === 307 || v.status === 302, "verificação redireciona")
  const e = await a.post("/api/auth/entrar", { email: emailA, senha })
  ok(e.status === 200, "login após confirmação")
  const conta = await a.get("/api/conta")
  ok(conta.dados.usuario?.email === emailA && conta.dados.perfil?.nome === "Prof A", "conta expõe usuário e perfil")
}

// Conta B isolada.
const b = new Cliente()
{
  await b.post("/api/auth/cadastro", { nome: "Prof B", email: emailB, senha })
  await fetch(`${BASE}/api/auth/verificar?token=${await tokenOutbox(emailB)}`, { redirect: "manual" })
  await b.post("/api/auth/entrar", { email: emailB, senha })
  const notas = await b.get("/api/notas")
  ok(Array.isArray(notas.dados.notas) && notas.dados.notas.length === 0, "professor novo começa vazio")
}

// Disciplinas e turmas.
let discId
{
  const c = await a.post("/api/disciplinas", { nome: "História", cor: "vermelho", icone: "Livro" })
  ok(c.status === 201 && c.dados.disciplina.nome === "História", "cria disciplina")
  discId = c.dados.disciplina.id
  const dup = await a.post("/api/disciplinas", { nome: "História" })
  ok(dup.status === 400, "disciplina duplicada conflita")
  const lista = await a.get("/api/disciplinas")
  ok(lista.dados.disciplinas.length === 1 && lista.dados.disciplinas[0].totalNotas === 0, "lista com contagem")
}
let turmaId
{
  const c = await a.post("/api/turmas", { nome: "2b", anoLetivo: 2026 })
  ok(c.status === 201 && c.dados.turma.nome === "2B" && c.dados.turma.serie === "2º ano", "cria turma normalizada")
  turmaId = c.dados.turma.id
}

// Notas.
let notaId
{
  const c = await a.post("/api/notas", {
    titulo: "Revolução Francesa", disciplinaId: discId, anoLetivo: 2026, mes: 5,
    turmasIds: [turmaId], sobre: "Queda da Bastilha", habilidades: "EF09HI01",
  })
  ok(c.status === 201 && c.dados.nota.slug === "revolucao-francesa", "cria nota com slug")
  ok(c.dados.nota.disciplina.nome === "História", "nota traz disciplina")
  notaId = c.dados.nota.id
  const alheia = await b.get(`/api/notas/${notaId}`)
  ok(alheia.status === 404, "nota alheia não abre")
  const f = await a.get(`/api/notas?disciplina=${discId}&status=rascunho`)
  ok(f.dados.notas.length === 1, "filtro por disciplina e status")
  const u = await a.put(`/api/notas/${notaId}`, { status: "publicada" })
  ok(u.dados.nota.status === "publicada", "publica nota")
  const busca = await a.get("/api/busca?q=bastilha")
  ok(busca.dados.resultados.length === 1 && busca.dados.resultados[0].campo === "resumo", "busca acha trecho")
  const dup = await a.post(`/api/notas/${notaId}/duplicar`)
  ok(dup.status === 201 && dup.dados.nota.status === "rascunho", "duplica como rascunho")
  await a.del(`/api/notas/${dup.dados.nota.id}`)
}

// Links e visão pública.
let tokenPub
{
  const roubo = await b.post("/api/links", { tipo: "nota", notaId, nome: "x" })
  ok(roubo.status === 404, "link p/ nota alheia nega")
  const c = await a.post("/api/links", { tipo: "nota", notaId, nome: "Para alunos" })
  ok(c.status === 201 && c.dados.link.token.length === 22, "cria link com token")
  tokenPub = c.dados.link.token
  const pub = await (await fetch(`${BASE}/api/publico/${tokenPub}`)).json()
  ok(pub.notas?.length === 1 && pub.link.professorNome === "Prof A", "público resolve nota")
  const pub2 = await (await fetch(`${BASE}/api/publico/${tokenPub}`)).json()
  ok(pub2 !== null, "segundo acesso ok (contador)")
  const nada = await fetch(`${BASE}/api/publico/token-invalido-123`)
  ok(nada.status === 404, "token inválido dá 404")
  const ed = await a.put(`/api/links/${c.dados.link.id}`, { ativo: false })
  ok(ed.dados.link.ativo === false, "desativa link")
  const fora = await fetch(`${BASE}/api/publico/${tokenPub}`)
  ok(fora.status === 404, "link desativado some do público")
  await a.put(`/api/links/${c.dados.link.id}`, { ativo: true })
}

// Imagens.
{
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64")
  const form = new FormData()
  form.append("arquivo", new Blob([png], { type: "image/png" }), "p.png")
  const up = await a.pedir("POST", "/api/imagens", form, "form")
  ok(up.status === 201 && up.dados.url.startsWith("/api/imagens?path="), "upload de imagem")
  const caminho = up.dados.caminho
  const get = await a.pedir("GET", `/api/imagens?path=${encodeURIComponent(caminho)}`)
  ok(get.status === 200, "leitura da imagem")
  const alheio = await b.pedir("GET", `/api/imagens?path=${encodeURIComponent(caminho)}`)
  ok(alheio.status === 400, "imagem alheia nega")
  const del = await a.pedir("DELETE", `/api/imagens?path=${encodeURIComponent(caminho)}`)
  ok(del.status === 200, "exclui imagem")
}

// Backup: exportação e restauração.
{
  const exp = await a.pedir("GET", "/api/backup")
  ok(exp.status === 200, "exporta backup")
  const corpo = exp.dados
  ok(corpo.versao === 2 && corpo.notas.length === 1, "backup contém a nota")
  const imp = await a.post("/api/backup", corpo)
  ok(imp.dados.ok === true, "restaura backup")
  const depois = await a.get("/api/notas")
  ok(depois.dados.notas.length === 1, "restauração idempotente (1 nota)")
  const md = await a.post("/api/importar", { conteudo: "# Título importado\n\nTexto.", formato: "md" })
  ok(md.status === 201, "importa markdown")
  await a.del(`/api/notas/${md.dados.nota.id}`)
}

// Conta: perfil, senha, e-mail e saída.
{
  const p = await a.patch("/api/conta", { nome: "Prof A+", escola: "Escola X" })
  void p
  const conta = await a.get("/api/conta")
  ok(conta.dados.perfil?.nome === "Prof A+", "atualiza perfil")
  const s = await a.post("/api/auth/trocar-senha", { nova: "senhaNova123" })
  ok(s.status === 200, "troca senha")
  const e = await a.post("/api/auth/trocar-email", { novoEmail: `api_a_novo_${sufixo}@exemplo.br` })
  ok(e.status === 200, "pede troca de e-mail")
  const r = await a.post("/api/auth/renovar", {})
  ok(r.status === 200, "renova sessão")
  const sair = await a.post("/api/auth/sair", {})
  ok(sair.status === 200, "sai")
  const depois = await a.get("/api/conta")
  ok(depois.dados.usuario === null, "sem sessão após sair")
}

console.log(`\n${passadas} verificações passaram.`)
