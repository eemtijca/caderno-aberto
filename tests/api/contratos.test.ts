// Contratos HTTP da API com app no ar e banco migrado.
// Uso: TEST_BASE_URL=http://127.0.0.1:3000 vitest run tests/api/contratos.test.ts
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Cliente, BASE } from "./ajuda/cliente";
import { criarProfessor, entrarAdmin, removerUsuarios, sufixo, contarSessoes } from "./ajuda/apoio";

const suf = sufixo();
const emailA = `api_a_${suf}@exemplo.br`;
const emailB = `api_b_${suf}@exemplo.br`;
const senha = "senha123";

let a: Cliente;
let b: Cliente;

beforeAll(async () => {
  const admin = await entrarAdmin();
  a = (await criarProfessor(admin, { nome: "Prof A", email: emailA, senha })).cliente;
  b = (await criarProfessor(admin, { nome: "Prof B", email: emailB, senha })).cliente;
});

afterAll(async () => {
  await removerUsuarios([emailA, emailB]);
});

describe("contratos.test", () => {
  it("Saúde", async () => {
    const r = await fetch(`${BASE}/api/`);
    expect(r.ok, "saúde /api responde").toBe(true);
  });

  it("Conta A: sessão ativa e papel", async () => {
    const conta = await a.get("/api/conta");
    expect(
      conta.dados.usuario?.email === emailA && conta.dados.perfil?.nome === "Prof A",
      "conta expõe usuário e perfil",
    ).toBe(true);
    expect(conta.dados.usuario?.papel === "professor", "papel de professor").toBe(true);
    expect(conta.dados.usuario?.ativado === true, "conta ativada").toBe(true);
  });

  it("Conta B isolada", async () => {
    const notas = await b.get("/api/notas");
    expect(
      Array.isArray(notas.dados.notas) && notas.dados.notas.length === 0,
      "professor novo começa vazio",
    ).toBe(true);
  });

  let discId: string;
  it("Disciplinas", async () => {
    const c = await a.post("/api/disciplinas", {
      nome: "História",
      cor: "vermelho",
      icone: "Livro",
    });
    expect(c.status === 201 && c.dados.disciplina.nome === "História", "cria disciplina").toBe(
      true,
    );
    discId = c.dados.disciplina.id;
    const dup = await a.post("/api/disciplinas", { nome: "História" });
    expect(dup.status === 400, "disciplina duplicada conflita").toBe(true);
    const lista = await a.get("/api/disciplinas");
    expect(
      lista.dados.disciplinas.length === 1 && lista.dados.disciplinas[0].totalNotas === 0,
      "lista com contagem",
    ).toBe(true);
  });

  let turmaId: string;
  it("Turmas", async () => {
    const c = await a.post("/api/turmas", { nome: "2b", anoLetivo: 2026 });
    expect(
      c.status === 201 && c.dados.turma.nome === "2B" && c.dados.turma.serie === "2º ano",
      "cria turma normalizada",
    ).toBe(true);
    turmaId = c.dados.turma.id;
  });

  let notaId: string;
  it("Notas", async () => {
    const c = await a.post("/api/notas", {
      titulo: "Revolução Francesa",
      disciplinaId: discId,
      anoLetivo: 2026,
      mes: 5,
      turmasIds: [turmaId],
      sobre: "Queda da Bastilha",
      habilidades: "EF09HI01",
    });
    expect(
      c.status === 201 && c.dados.nota.slug === "revolucao-francesa",
      "cria nota com slug",
    ).toBe(true);
    expect(c.dados.nota.disciplina.nome === "História", "nota traz disciplina").toBe(true);
    notaId = c.dados.nota.id;
    const alheia = await b.get(`/api/notas/${notaId}`);
    expect(alheia.status === 404, "nota alheia não abre").toBe(true);
    const f = await a.get(`/api/notas?disciplina=${discId}&status=rascunho`);
    expect(f.dados.notas.length === 1, "filtro por disciplina e status").toBe(true);
    const u = await a.put(`/api/notas/${notaId}`, { status: "publicada" });
    expect(u.dados.nota.status === "publicada", "publica nota").toBe(true);
    const busca = await a.get("/api/busca?q=bastilha");
    expect(
      busca.dados.resultados.length === 1 && busca.dados.resultados[0].campo === "resumo",
      "busca acha trecho",
    ).toBe(true);
    const dup = await a.post(`/api/notas/${notaId}/duplicar`);
    expect(
      dup.status === 201 && dup.dados.nota.status === "rascunho",
      "duplica como rascunho",
    ).toBe(true);
    await a.del(`/api/notas/${dup.dados.nota.id}`);
  });

  let tokenPub: string;
  it("Links e visão pública", async () => {
    const roubo = await b.post("/api/links", { tipo: "nota", notaId, nome: "x" });
    expect(roubo.status === 404, "link p/ nota alheia nega").toBe(true);
    const c = await a.post("/api/links", { tipo: "nota", notaId, nome: "Para alunos" });
    expect(c.status === 201 && c.dados.link.token.length === 22, "cria link com token").toBe(true);
    tokenPub = c.dados.link.token;
    const pub = await (await fetch(`${BASE}/api/publico/${tokenPub}`)).json();
    expect(
      pub.notas?.length === 1 && pub.link.professorNome === "Prof A",
      "público resolve nota",
    ).toBe(true);
    const pub2 = await (await fetch(`${BASE}/api/publico/${tokenPub}`)).json();
    expect(pub2 !== null, "segundo acesso ok (contador)").toBe(true);
    const nada = await fetch(`${BASE}/api/publico/token-invalido-123`);
    expect(nada.status === 404, "token inválido dá 404").toBe(true);
    const ed = await a.put(`/api/links/${c.dados.link.id}`, { ativo: false });
    expect(ed.dados.link.ativo === false, "desativa link").toBe(true);
    const fora = await fetch(`${BASE}/api/publico/${tokenPub}`);
    expect(fora.status === 404, "link desativado some do público").toBe(true);
    await a.put(`/api/links/${c.dados.link.id}`, { ativo: true });
  });

  it("Imagens", async () => {
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64",
    );
    const form = new FormData();
    form.append("arquivo", new Blob([png], { type: "image/png" }), "p.png");
    const up = await a.pedir("POST", "/api/imagens", form, "form");
    expect(
      up.status === 201 && up.dados.url.startsWith("/api/imagens?path="),
      "upload de imagem",
    ).toBe(true);
    const caminho = up.dados.caminho;
    const get = await a.pedir("GET", `/api/imagens?path=${encodeURIComponent(caminho)}`);
    expect(get.status === 200, "leitura da imagem").toBe(true);
    const alheio = await b.pedir("GET", `/api/imagens?path=${encodeURIComponent(caminho)}`);
    expect(alheio.status === 400, "imagem alheia nega").toBe(true);
    const del = await a.pedir("DELETE", `/api/imagens?path=${encodeURIComponent(caminho)}`);
    expect(del.status === 200, "exclui imagem").toBe(true);
  });

  it("Backup: exportação e restauração", async () => {
    const exp = await a.pedir("GET", "/api/backup");
    expect(exp.status === 200, "exporta backup").toBe(true);
    const corpo = exp.dados;
    expect(corpo.versao === 2 && corpo.notas.length === 1, "backup contém a nota").toBe(true);
    const imp = await a.post("/api/backup", corpo);
    expect(imp.dados.ok === true, "restaura backup").toBe(true);
    const depois = await a.get("/api/notas");
    expect(depois.dados.notas.length === 1, "restauração idempotente (1 nota)").toBe(true);
    const md = await a.post("/api/importar", {
      conteudo: "# Título importado\n\nTexto.",
      formato: "md",
    });
    expect(md.status === 201, "importa markdown").toBe(true);
    await a.del(`/api/notas/${md.dados.nota.id}`);
  });

  it("Conta: perfil, senha e saída", async () => {
    const p = await a.patch("/api/conta", { nome: "Prof A+", escola: "Escola X" });
    void p;
    const conta = await a.get("/api/conta");
    expect(conta.dados.perfil?.nome === "Prof A+", "atualiza perfil").toBe(true);
    const s = await a.post("/api/auth/trocar-senha", { atual: senha, nova: "senhaNova123" });
    expect(s.status === 200, "troca senha").toBe(true);
    // Trocar a senha derruba as sessões antigas; renova a sessão atual.
    const r = await a.post("/api/auth/renovar", {});
    expect(r.status === 200, "renova sessão").toBe(true);
    expect(await contarSessoes(emailA), "sessão ativa no banco").toBeGreaterThan(0);
    const sair = await a.post("/api/auth/sair", {});
    expect(sair.status === 200, "sai").toBe(true);
    const depois = await a.get("/api/conta");
    expect(depois.dados.usuario === null, "sem sessão após sair").toBe(true);
  });
});

describe("ações em lote", () => {
  const sufLote = sufixo();
  const emailC = `lote_c_${sufLote}@exemplo.br`;
  const emailD = `lote_d_${sufLote}@exemplo.br`;
  let c: Cliente;
  let d: Cliente;
  let discId: string;
  let discOutraId: string;
  const notasIds: string[] = [];

  beforeAll(async () => {
    const admin = await entrarAdmin();
    c = (await criarProfessor(admin, { nome: "Prof C", email: emailC, senha })).cliente;
    d = (await criarProfessor(admin, { nome: "Prof D", email: emailD, senha })).cliente;
    discId = (await c.post("/api/disciplinas", { nome: "Lote A", cor: "verde", icone: "BookOpen" }))
      .dados.disciplina.id;
    discOutraId = (
      await c.post("/api/disciplinas", { nome: "Lote B", cor: "azul", icone: "BookOpen" })
    ).dados.disciplina.id;
    for (let i = 1; i <= 3; i++) {
      const r = await c.post("/api/notas", {
        titulo: `Nota lote ${i}`,
        disciplinaId: discId,
        anoLetivo: 2026,
        mes: 9,
        comModelo: false,
      });
      notasIds.push(r.dados.nota.id);
    }
  });

  afterAll(async () => {
    await removerUsuarios([emailC, emailD]);
  });

  it("publica, volta a rascunho e define disciplina", async () => {
    const pub = await c.post("/api/notas/lote", { acao: "publicar", ids: notasIds.slice(0, 2) });
    expect(pub.status === 200 && pub.dados.atualizados === 2, "publica duas notas").toBe(true);
    const publicadas = await c.get("/api/notas?status=publicada");
    expect(publicadas.dados.notas.length === 2, "listagem reflete a publicação").toBe(true);

    const rasc = await c.post("/api/notas/lote", { acao: "rascunho", ids: notasIds.slice(0, 2) });
    expect(rasc.dados.atualizados === 2, "volta as duas a rascunho").toBe(true);

    const troca = await c.post("/api/notas/lote", {
      acao: "disciplina",
      ids: [notasIds[0]],
      disciplinaId: discOutraId,
    });
    expect(troca.dados.atualizados === 1, "troca a disciplina").toBe(true);
    const nota = await c.get(`/api/notas/${notasIds[0]}`);
    expect(nota.dados.nota.disciplina?.nome === "Lote B", "nota com a nova disciplina").toBe(true);
    const busca = await c.get("/api/busca?q=Lote B");
    expect(busca.dados.resultados.length >= 1, "busca acompanha a nova disciplina").toBe(true);
  });

  it("lixeira em lote leva os links e restaura junto", async () => {
    // Publicada para o link público resolver a nota.
    await c.put(`/api/notas/${notasIds[0]}`, { status: "publicada" });
    const link = await c.post("/api/links", { tipo: "nota", notaId: notasIds[0], nome: "Do lote" });
    const token = link.dados.link.token;

    const lixeira = await c.post("/api/notas/lote", { acao: "lixeira", ids: [notasIds[0]] });
    expect(lixeira.dados.atualizados === 1, "nota vai para a lixeira").toBe(true);
    const naLixeira = await c.get("/api/lixeira");
    expect(
      naLixeira.dados.notas.some((n: { id: string }) => n.id === notasIds[0]),
      "nota aparece na lixeira",
    ).toBe(true);
    expect(
      naLixeira.dados.links.some((l: { id: string }) => l.id === link.dados.link.id),
      "link da nota foi junto",
    ).toBe(true);
    expect((await fetch(`${BASE}/api/publico/${token}`)).status, "link some do público").toBe(404);

    const restaurar = await c.post("/api/lixeira/lote", {
      acao: "restaurar",
      notas: [notasIds[0]],
      links: [],
    });
    expect(restaurar.dados.restaurados.notas === 1, "restaura a nota").toBe(true);
    expect((await fetch(`${BASE}/api/publico/${token}`)).status, "link volta ao público").toBe(200);
  });

  it("pausa, reativa e exclui links em lote", async () => {
    for (const id of [notasIds[1], notasIds[2]]) {
      await c.put(`/api/notas/${id}`, { status: "publicada" });
    }
    const l1 = await c.post("/api/links", { tipo: "nota", notaId: notasIds[1], nome: "Lote 1" });
    const l2 = await c.post("/api/links", { tipo: "nota", notaId: notasIds[2], nome: "Lote 2" });
    const ids = [l1.dados.link.id, l2.dados.link.id];

    const pausar = await c.post("/api/links/lote", { acao: "pausar", ids });
    expect(pausar.dados.atualizados === 2, "pausa os dois").toBe(true);
    expect(
      (await fetch(`${BASE}/api/publico/${l1.dados.link.token}`)).status,
      "link pausado some",
    ).toBe(404);

    const reativar = await c.post("/api/links/lote", { acao: "reativar", ids });
    expect(reativar.dados.atualizados === 2, "reativa os dois").toBe(true);
    expect(
      (await fetch(`${BASE}/api/publico/${l1.dados.link.token}`)).status,
      "link reativado volta",
    ).toBe(200);

    const excluir = await c.post("/api/links/lote", { acao: "excluir", ids: [ids[0]] });
    expect(excluir.dados.atualizados === 1, "exclui um link").toBe(true);
    const lixeira = await c.get("/api/lixeira");
    expect(
      lixeira.dados.links.some((l: { id: string }) => l.id === ids[0]),
      "link excluído na lixeira",
    ).toBe(true);
    const restaurar = await c.post("/api/lixeira/lote", {
      acao: "restaurar",
      notas: [],
      links: [ids[0]],
    });
    expect(restaurar.dados.restaurados.links === 1, "restaura o link").toBe(true);
  });

  it("valida entrada e isola entre professores", async () => {
    const vazia = await c.post("/api/notas/lote", { acao: "publicar", ids: [] });
    expect(vazia.status, "sem ids responde 400").toBe(400);
    const invalida = await c.post("/api/notas/lote", { acao: "apagar", ids: notasIds });
    expect(invalida.status, "ação desconhecida responde 400").toBe(400);

    const alheio = await d.post("/api/notas/lote", { acao: "publicar", ids: notasIds });
    expect(alheio.dados.atualizados, "nada do outro professor é afetado").toBe(0);
    expect(alheio.dados.ausentes.length === notasIds.length, "ids alheios viram ausentes").toBe(
      true,
    );

    const falso = "00000000-0000-4000-8000-000000000000";
    const misto = await c.post("/api/notas/lote", { acao: "rascunho", ids: [notasIds[0], falso] });
    expect(misto.dados.atualizados === 1, "atualiza só o existente").toBe(true);
    expect(misto.dados.ausentes.includes(falso), "id inexistente vira ausente").toBe(true);

    const ultrapassa = await c.post("/api/notas/lote", {
      acao: "rascunho",
      ids: Array.from({ length: 101 }, () => crypto.randomUUID()),
    });
    expect(ultrapassa.status, "acima do teto responde 400").toBe(400);
  });
});
