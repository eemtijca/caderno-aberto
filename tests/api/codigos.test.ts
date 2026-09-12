// Contratos do fluxo de acesso por código.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Cliente } from "./ajuda/cliente";
import {
  criarProfessor,
  emitirCodigo,
  entrarAdmin,
  expirarCodigos,
  ipTeste,
  removerUsuarios,
  sufixo,
} from "./ajuda/apoio";

const suf = sufixo();
let admin: Cliente;
const criados: string[] = [];

beforeAll(async () => {
  admin = await entrarAdmin();
});

afterAll(async () => {
  await removerUsuarios(criados);
});

describe("acesso por código", () => {
  it("primeiro acesso: solicitar, atender e ativar", async () => {
    const email = `cod_pa_${suf}@exemplo.br`;
    criados.push(email);
    const pub = new Cliente();
    const s = await pub.post(
      "/api/auth/solicitar",
      { nome: "Novo Professor", email, tipo: "primeiro_acesso" },
      ipTeste(),
    );
    expect(s.status, "solicitação aceita").toBe(200);

    const lista = await admin.get("/api/admin/solicitacoes?status=pendente");
    const pedido = lista.dados.solicitacoes.find((x: { email: string }) => x.email === email);
    expect(pedido, "solicitação aparece na fila").toBeTruthy();

    const loginAntes = await pub.post("/api/auth/entrar", { email, senha: "senha123" }, ipTeste());
    expect(loginAntes.status, "login negado antes de ativar").toBe(401);

    const at = await admin.post(`/api/admin/solicitacoes/${pedido.id}/atender`, {});
    expect(at.status).toBe(200);
    const codigo = at.dados.codigo as string;
    expect(codigo.length, "código com 8 caracteres").toBe(8);

    const use = await pub.post(
      "/api/auth/usar-codigo",
      { email, codigo, novaSenha: "senha123" },
      ipTeste(),
    );
    expect(use.status, "código ativa a conta").toBe(200);
    const conta = await pub.get("/api/conta");
    expect(conta.dados.usuario?.email).toBe(email);
    expect(conta.dados.usuario?.ativado).toBe(true);
  });

  it("recuperação troca a senha e invalida a senha antiga", async () => {
    const email = `cod_rec_${suf}@exemplo.br`;
    criados.push(email);
    await criarProfessor(admin, { nome: "Rec", email, senha: "senha123" });
    const codigo = await emitirCodigo(admin, email, "recuperacao");

    const c = new Cliente();
    const r = await c.post(
      "/api/auth/usar-codigo",
      { email, codigo, novaSenha: "novaSenha123" },
      ipTeste(),
    );
    expect(r.status, "recuperação aceita").toBe(200);

    const nova = new Cliente();
    expect(
      (await nova.post("/api/auth/entrar", { email, senha: "novaSenha123" }, ipTeste())).status,
      "entra com a nova senha",
    ).toBe(200);
    const antiga = new Cliente();
    expect(
      (await antiga.post("/api/auth/entrar", { email, senha: "senha123" }, ipTeste())).status,
      "senha antiga recusada",
    ).toBe(401);
  });

  it("código é de uso único", async () => {
    const email = `cod_unico_${suf}@exemplo.br`;
    criados.push(email);
    const codigo = await emitirCodigo(admin, email, "primeiro_acesso", "Único");
    const c1 = new Cliente();
    expect(
      (await c1.post("/api/auth/usar-codigo", { email, codigo, novaSenha: "senha123" }, ipTeste()))
        .status,
    ).toBe(200);
    const c2 = new Cliente();
    expect(
      (await c2.post("/api/auth/usar-codigo", { email, codigo, novaSenha: "senha123" }, ipTeste()))
        .status,
    ).toBe(400);
  });

  it("código expirado é recusado", async () => {
    const email = `cod_exp_${suf}@exemplo.br`;
    criados.push(email);
    const codigo = await emitirCodigo(admin, email, "primeiro_acesso", "Exp");
    await expirarCodigos(email);
    const c = new Cliente();
    expect(
      (await c.post("/api/auth/usar-codigo", { email, codigo, novaSenha: "senha123" }, ipTeste()))
        .status,
    ).toBe(400);
  });

  it("tentativas erradas bloqueiam após o teto", async () => {
    const email = `cod_lock_${suf}@exemplo.br`;
    criados.push(email);
    await emitirCodigo(admin, email, "primeiro_acesso", "Lock");
    const c = new Cliente();
    for (let i = 0; i < 5; i++) {
      const r = await c.post(
        "/api/auth/usar-codigo",
        { email, codigo: "ZZZZZZZZ", novaSenha: "senha123" },
        ipTeste(),
      );
      expect(r.status, `tentativa ${i + 1}`).toBe(400);
    }
    const bloqueado = await c.post(
      "/api/auth/usar-codigo",
      { email, codigo: "ZZZZZZZZ", novaSenha: "senha123" },
      ipTeste(),
    );
    expect(bloqueado.status, "bloqueio por excesso de tentativas").toBe(429);
  });

  it("código serve para qualquer conta ainda não usada (isolamento por e-mail)", async () => {
    const email = `cod_iso_${suf}@exemplo.br`;
    criados.push(email);
    const codigo = await emitirCodigo(admin, email, "primeiro_acesso", "Iso");
    const outro = new Cliente();
    const r = await outro.post(
      "/api/auth/usar-codigo",
      { email: `outro_${suf}@exemplo.br`, codigo, novaSenha: "senha123" },
      ipTeste(),
    );
    expect(r.status, "código não vale para outro e-mail").toBe(400);
  });

  it("gerar código invalida o anterior", async () => {
    const email = `cod_troca_${suf}@exemplo.br`;
    criados.push(email);
    const antigo = await emitirCodigo(admin, email, "primeiro_acesso", "Troca");
    const novo = await emitirCodigo(admin, email, "primeiro_acesso", "Troca");
    const c = new Cliente();
    expect(
      (
        await c.post(
          "/api/auth/usar-codigo",
          { email, codigo: antigo, novaSenha: "senha123" },
          ipTeste(),
        )
      ).status,
    ).toBe(400);
    const c2 = new Cliente();
    expect(
      (
        await c2.post(
          "/api/auth/usar-codigo",
          { email, codigo: novo, novaSenha: "senha123" },
          ipTeste(),
        )
      ).status,
    ).toBe(200);
  });
});
