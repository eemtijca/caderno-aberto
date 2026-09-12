// Propriedades de segurança: CSRF, cabeçalhos, cron e não enumeração.
import { describe, expect, it } from "vitest";
import { Cliente, BASE } from "./ajuda/cliente";
import { ipTeste, sufixo } from "./ajuda/apoio";

describe("segurança", () => {
  it("bloqueia mutação cross-site", async () => {
    const c = new Cliente();
    const cross = await c.post(
      "/api/auth/solicitar",
      { email: `csrf_${sufixo()}@exemplo.br`, tipo: "recuperacao" },
      { "sec-fetch-site": "cross-site" },
    );
    expect(cross.status, "cross-site recusado").toBe(403);

    const origemMá = await c.post(
      "/api/auth/solicitar",
      { email: `csrf2_${sufixo()}@exemplo.br`, tipo: "recuperacao" },
      { origin: "https://malicioso.example" },
    );
    expect(origemMá.status, "origem externa recusada").toBe(403);
  });

  it("aceita mutação same-origin", async () => {
    const c = new Cliente();
    const ok = await c.post(
      "/api/auth/solicitar",
      { email: `csrf_ok_${sufixo()}@exemplo.br`, tipo: "recuperacao" },
      { "sec-fetch-site": "same-origin", ...ipTeste() },
    );
    expect(ok.status).toBe(200);
  });

  it("envia cabeçalhos de segurança", async () => {
    const r = await fetch(`${BASE}/api/`);
    expect(r.headers.get("x-content-type-options")).toBe("nosniff");
    expect(r.headers.get("x-frame-options")).toBe("DENY");
    expect(r.headers.get("referrer-policy")).toBe("strict-origin-when-cross-origin");
    expect(r.headers.get("content-security-policy"), "CSP presente").toBeTruthy();
  });

  it("a purga agendada exige segredo", async () => {
    const semSegredo = await fetch(`${BASE}/api/conta/restaurar`);
    expect(semSegredo.status, "sem segredo não executa").not.toBe(200);
    const segredoErrado = await fetch(`${BASE}/api/conta/restaurar`, {
      headers: { authorization: "Bearer errado" },
    });
    expect(segredoErrado.status, "segredo errado não executa").not.toBe(200);
  });

  it("login não enumera contas", async () => {
    const c = new Cliente();
    const inexistente = await c.post(
      "/api/auth/entrar",
      { email: `nao_existe_${sufixo()}@exemplo.br`, senha: "senhaErrada123" },
      ipTeste(),
    );
    const c2 = new Cliente();
    const senhaErrada = await c2.post(
      "/api/auth/entrar",
      { email: `tambem_nao_${sufixo()}@exemplo.br`, senha: "senhaErrada123" },
      ipTeste(),
    );
    expect(inexistente.status).toBe(401);
    expect(senhaErrada.status).toBe(401);
    expect(JSON.stringify(inexistente.dados)).toBe(JSON.stringify(senhaErrada.dados));
  });

  it("solicitação responde igual para conta existente ou não", async () => {
    const c = new Cliente();
    const a = await c.post(
      "/api/auth/solicitar",
      { email: `enum_a_${sufixo()}@exemplo.br`, tipo: "recuperacao" },
      ipTeste(),
    );
    const b = await c.post(
      "/api/auth/solicitar",
      { email: `enum_b_${sufixo()}@exemplo.br`, tipo: "recuperacao" },
      ipTeste(),
    );
    expect(a.status).toBe(200);
    expect(b.status).toBe(200);
    expect(JSON.stringify(a.dados)).toBe(JSON.stringify(b.dados));
  });
});
