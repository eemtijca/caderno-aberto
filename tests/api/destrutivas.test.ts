// Salvaguardas destrutivas: suspensão com step-up, lixeira e dry-run do backup.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Cliente } from "./ajuda/cliente";
import { criarProfessor, garantirAdmin, ipTeste, removerUsuarios, sufixo } from "./ajuda/apoio";

const suf = sufixo();
let admin: Cliente;
const criados: string[] = [];

beforeAll(async () => {
  const email = `admin_dest_${suf}@exemplo.br`;
  criados.push(email);
  await garantirAdmin(email, "adminSenha123", "Admin Destrutivo");
  admin = new Cliente();
  const r = await admin.post("/api/auth/entrar", { email, senha: "adminSenha123" }, ipTeste());
  if (r.status !== 200) throw new Error(`falha ao entrar como admin: ${r.status}`);
});

afterAll(async () => {
  await removerUsuarios(criados);
});

describe("salvaguardas destrutivas", () => {
  it("suspende com motivo e senha e reflete no login", async () => {
    const email = `prof_dest_${suf}@exemplo.br`;
    criados.push(email);
    const { cliente: prof } = await criarProfessor(admin, {
      nome: "Prof Dest",
      email,
      senha: "senha123",
    });
    const lista = await admin.get("/api/admin/usuarios");
    const alvo = lista.dados.usuarios.find((u: { email: string }) => u.email === email);
    expect(alvo.statusConta).toBe("ativo");

    // Senha errada.
    expect(
      (
        await admin.patch(`/api/admin/usuarios/${alvo.id}`, {
          statusConta: "suspenso",
          motivo: "teste de suspensao",
          senha: "errada",
        })
      ).status,
    ).toBe(403);
    // Motivo curto.
    expect(
      (
        await admin.patch(`/api/admin/usuarios/${alvo.id}`, {
          statusConta: "suspenso",
          motivo: "x",
          senha: "adminSenha123",
        })
      ).status,
    ).toBe(400);
    // Suspensão válida.
    const patch = await admin.patch(`/api/admin/usuarios/${alvo.id}`, {
      statusConta: "suspenso",
      motivo: "afastamento médico",
      senha: "adminSenha123",
    });
    expect(patch.status).toBe(200);
    const lista2 = await admin.get("/api/admin/usuarios");
    const alvo2 = lista2.dados.usuarios.find((u: { email: string }) => u.email === email);
    expect(alvo2.statusConta, "status persistido").toBe("suspenso");

    // A sessão do professor deixa de valer.
    expect((await prof.get("/api/conta")).dados.usuario, "sessão encerrada").toBe(null);

    // O login revela o estado depois de a senha conferir.
    const outro = new Cliente();
    const login = await outro.post("/api/auth/entrar", { email, senha: "senha123" }, ipTeste());
    expect(login.status).toBe(403);
    expect(login.dados.codigo).toBe("CONTA_SUSPENSA");

    // Reativa e o login volta a funcionar.
    expect(
      (
        await admin.patch(`/api/admin/usuarios/${alvo.id}`, {
          statusConta: "ativo",
          senha: "adminSenha123",
        })
      ).status,
    ).toBe(200);
    const login2 = await outro.post("/api/auth/entrar", { email, senha: "senha123" }, ipTeste());
    expect(login2.status).toBe(200);
  });

  it("não exclui o último administrador", async () => {
    const lista = await admin.get("/api/admin/usuarios?porPagina=100");
    const admins = lista.dados.usuarios.filter((u: { papel: string }) => u.papel === "admin");
    if (admins.length === 1) {
      const eu = admins[0];
      expect(
        (
          await admin.del(`/api/admin/usuarios/${eu.id}`, {
            motivo: "tentativa de autoexclusao",
            senha: "adminSenha123",
          })
        ).status,
      ).toBe(400);
    }
  });

  it("nota vai para a lixeira e volta", async () => {
    const email = `prof_lix_${suf}@exemplo.br`;
    criados.push(email);
    const { cliente: prof } = await criarProfessor(admin, {
      nome: "Prof Lix",
      email,
      senha: "senha123",
    });
    const disc = await prof.post("/api/disciplinas", {
      nome: "Física",
      cor: "verde",
      icone: "Atom",
    });
    const nota = await prof.post("/api/notas", {
      titulo: "Nota Lixeira",
      disciplinaId: disc.dados.disciplina.id,
      anoLetivo: 2026,
      mes: 3,
      comModelo: false,
    });
    const id = nota.dados.nota.id;

    expect((await prof.del(`/api/notas/${id}`)).status).toBe(200);
    expect((await prof.get(`/api/notas/${id}`)).status, "some da listagem").toBe(404);

    const lix = await prof.get("/api/lixeira");
    expect(lix.status).toBe(200);
    expect(lix.dados.notas.some((n: { id: string }) => n.id === id)).toBe(true);

    expect((await prof.post(`/api/notas/${id}/restaurar`)).status).toBe(200);
    expect((await prof.get(`/api/notas/${id}`)).status, "volta a existir").toBe(200);
  });

  it("backup validar faz dry-run sem escrever", async () => {
    const email = `prof_bk_${suf}@exemplo.br`;
    criados.push(email);
    const { cliente: prof } = await criarProfessor(admin, {
      nome: "Prof Bk",
      email,
      senha: "senha123",
    });
    const invalido = await prof.post("/api/backup/validar", { foo: "bar" });
    expect(invalido.status).toBe(400);
    const ok = await prof.post("/api/backup/validar", { notas: [] });
    expect(ok.status).toBe(200);
    expect(ok.dados.backup.contagem.notas).toBe(0);
    expect(ok.dados.atual.notas).toBe(0);
  });
});
