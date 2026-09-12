// Contratos das rotas administrativas e do papel de administrador.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Cliente } from "./ajuda/cliente";
import { criarProfessor, garantirAdmin, ipTeste, removerUsuarios, sufixo } from "./ajuda/apoio";

const suf = sufixo();
let admin: Cliente;
const criados: string[] = [];

beforeAll(async () => {
  const email = `admin_${suf}@exemplo.br`;
  criados.push(email);
  await garantirAdmin(email, "adminSenha123", "Admin Principal");
  admin = new Cliente();
  const r = await admin.post("/api/auth/entrar", { email, senha: "adminSenha123" }, ipTeste());
  if (r.status !== 200) throw new Error(`falha ao entrar como admin: ${r.status}`);
});

afterAll(async () => {
  await removerUsuarios(criados);
});

describe("administração", () => {
  it("exige sessão de administrador", async () => {
    const anon = new Cliente();
    expect((await anon.get("/api/admin/usuarios")).status, "anônimo recebe 401").toBe(401);

    const emailProf = `prof_guard_${suf}@exemplo.br`;
    criados.push(emailProf);
    const { cliente: prof } = await criarProfessor(admin, {
      nome: "Prof Guarda",
      email: emailProf,
      senha: "senha123",
    });
    expect((await prof.get("/api/admin/usuarios")).status, "professor recebe 403").toBe(403);
    expect((await admin.get("/api/admin/usuarios")).status, "admin recebe 200").toBe(200);
  });

  it("cria conta, ativa por código e lista", async () => {
    const email = `criado_${suf}@exemplo.br`;
    criados.push(email);
    const r = await admin.post("/api/admin/usuarios", {
      nome: "Conta Nova",
      email,
      papel: "professor",
    });
    expect(r.status, "cria conta").toBe(201);
    expect(typeof r.dados.codigo, "devolve código").toBe("string");

    const login = new Cliente();
    const u = await login.post(
      "/api/auth/usar-codigo",
      { email, codigo: r.dados.codigo, novaSenha: "senha123" },
      ipTeste(),
    );
    expect(u.status).toBe(200);

    const lista = await admin.get("/api/admin/usuarios");
    const achado = lista.dados.usuarios.find((x: { email: string }) => x.email === email);
    expect(achado?.ativado, "conta ativa na listagem").toBe(true);
  });

  it("reemite código e invalida o anterior", async () => {
    const email = `reemitir_${suf}@exemplo.br`;
    criados.push(email);
    const c = await admin.post("/api/admin/usuarios", {
      nome: "Reemitir",
      email,
      papel: "professor",
    });
    const lista = await admin.get("/api/admin/usuarios");
    const alvo = lista.dados.usuarios.find((x: { email: string }) => x.email === email);
    const novo = await admin.post(`/api/admin/usuarios/${alvo.id}/codigo`);
    expect(novo.status).toBe(200);
    const c1 = new Cliente();
    expect(
      (
        await c1.post(
          "/api/auth/usar-codigo",
          { email, codigo: c.dados.codigo, novaSenha: "senha123" },
          ipTeste(),
        )
      ).status,
      "código antigo não vale",
    ).toBe(400);
    const c2 = new Cliente();
    expect(
      (
        await c2.post(
          "/api/auth/usar-codigo",
          { email, codigo: novo.dados.codigo, novaSenha: "senha123" },
          ipTeste(),
        )
      ).status,
      "código novo vale",
    ).toBe(200);
  });

  it("desativar derruba o acesso imediatamente", async () => {
    const email = `desativar_${suf}@exemplo.br`;
    criados.push(email);
    const { cliente } = await criarProfessor(admin, {
      nome: "Desativar",
      email,
      senha: "senha123",
    });
    expect((await cliente.get("/api/conta")).dados.usuario?.email).toBe(email);

    const lista = await admin.get("/api/admin/usuarios");
    const alvo = lista.dados.usuarios.find((x: { email: string }) => x.email === email);
    const r = await admin.patch(`/api/admin/usuarios/${alvo.id}`, { ativado: false });
    expect(r.status).toBe(200);
    expect((await cliente.get("/api/conta")).dados.usuario, "acesso encerrado").toBe(null);
  });

  it("rebaixar admin revoga o painel na hora", async () => {
    const email = `admin2_${suf}@exemplo.br`;
    criados.push(email);
    await garantirAdmin(email, "adminSenha123", "Admin Dois");
    const admin2 = new Cliente();
    await admin2.post("/api/auth/entrar", { email, senha: "adminSenha123" }, ipTeste());
    expect((await admin2.get("/api/admin/resumo")).status).toBe(200);

    const lista = await admin.get("/api/admin/usuarios");
    const alvo = lista.dados.usuarios.find((x: { email: string }) => x.email === email);
    await admin.patch(`/api/admin/usuarios/${alvo.id}`, { papel: "professor" });
    expect((await admin2.get("/api/admin/resumo")).status, "deixa de ser admin").toBe(403);
  });

  it("revogar sessões derruba o refresh", async () => {
    const email = `sessoes_${suf}@exemplo.br`;
    criados.push(email);
    const { cliente } = await criarProfessor(admin, { nome: "Sessões", email, senha: "senha123" });
    expect((await cliente.post("/api/auth/renovar", {})).status).toBe(200);

    const lista = await admin.get("/api/admin/usuarios");
    const alvo = lista.dados.usuarios.find((x: { email: string }) => x.email === email);
    const r = await admin.del(`/api/admin/usuarios/${alvo.id}/sessoes`);
    expect(r.status).toBe(200);
    expect((await cliente.post("/api/auth/renovar", {})).status, "sem refresh válido").toBe(401);
  });

  it("impede excluir, desativar ou rebaixar a própria conta", async () => {
    const lista = await admin.get("/api/admin/usuarios");
    const eu = lista.dados.usuarios.find((x: { nome: string }) => x.nome === "Admin Principal");
    expect(eu).toBeTruthy();
    expect((await admin.del(`/api/admin/usuarios/${eu.id}`)).status).toBe(400);
    expect((await admin.patch(`/api/admin/usuarios/${eu.id}`, { ativado: false })).status).toBe(
      400,
    );
    expect((await admin.patch(`/api/admin/usuarios/${eu.id}`, { papel: "professor" })).status).toBe(
      400,
    );
  });
});
