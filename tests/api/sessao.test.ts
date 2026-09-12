// Ciclo de vida da sessão: rotação, reuso, logout e troca de senha.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Cliente } from "./ajuda/cliente";
import { criarProfessor, entrarAdmin, removerUsuarios, sufixo } from "./ajuda/apoio";

const suf = sufixo();
let admin: Cliente;
const criados: string[] = [];

beforeAll(async () => {
  admin = await entrarAdmin();
});

afterAll(async () => {
  await removerUsuarios(criados);
});

describe("sessão", () => {
  it("refresh rotaciona e o antigo não pode ser reusado", async () => {
    const email = `sess_rot_${suf}@exemplo.br`;
    criados.push(email);
    const { cliente } = await criarProfessor(admin, { nome: "Rot", email, senha: "senha123" });
    const antigo = cliente.cookie("sessao_refresh");
    expect(antigo, "refresh presente").toBeTruthy();

    expect((await cliente.post("/api/auth/renovar", {})).status, "renova").toBe(200);

    const replay = new Cliente();
    replay.definirCookie("sessao_refresh", antigo!);
    expect((await replay.post("/api/auth/renovar", {})).status, "refresh antigo recusado").toBe(
      401,
    );
  });

  it("sair invalida o refresh", async () => {
    const email = `sess_sair_${suf}@exemplo.br`;
    criados.push(email);
    const { cliente } = await criarProfessor(admin, { nome: "Sair", email, senha: "senha123" });
    await cliente.post("/api/auth/sair", {});
    expect((await cliente.post("/api/auth/renovar", {})).status).toBe(401);
  });

  it("refresh forjado é recusado", async () => {
    const c = new Cliente();
    c.definirCookie("sessao_refresh", "0".repeat(64));
    expect((await c.post("/api/auth/renovar", {})).status).toBe(401);
  });

  it("acesso com JWT inválido não autentica", async () => {
    const c = new Cliente();
    c.definirCookie("sessao", "token-invalido");
    const conta = await c.get("/api/conta");
    expect(conta.dados.usuario).toBe(null);
  });

  it("trocar a senha derruba as sessões antigas", async () => {
    const email = `sess_senha_${suf}@exemplo.br`;
    criados.push(email);
    const { cliente } = await criarProfessor(admin, { nome: "Senha", email, senha: "senha123" });
    const refreshAntigo = cliente.cookie("sessao_refresh");
    const r = await cliente.post("/api/auth/trocar-senha", {
      atual: "senha123",
      nova: "outraSenha123",
    });
    expect(r.status, "troca aceita").toBe(200);

    const replay = new Cliente();
    replay.definirCookie("sessao_refresh", refreshAntigo!);
    expect((await replay.post("/api/auth/renovar", {})).status, "refresh antigo inválido").toBe(
      401,
    );
  });
});
