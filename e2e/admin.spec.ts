// Console de administração: acesso, fila, geração de código e ciclo de vida.
import { test, expect } from "@playwright/test";
import { criarContaEentrar, criarProfessorUnico, entrarAdmin } from "./helpers/auth";
import { criarUsuarioAtivo } from "./helpers/db";

test.describe("Administração", () => {
  test("admin acessa o console e vê as abas", async ({ page }) => {
    await entrarAdmin(page);
    await page.goto("/#/admin");
    await expect(page.getByRole("heading", { name: "Administração" })).toBeVisible({
      timeout: 8000,
    });
    await expect(page.getByRole("tab", { name: /Solicita/ })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Códigos" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Usuários" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Aprovações" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Auditoria" })).toBeVisible();
  });

  test("criar conta gera código exibido uma vez", async ({ page }) => {
    await entrarAdmin(page);
    await page.goto("/#/admin");
    await page.getByRole("tab", { name: "Usuários" }).click();
    await page.getByRole("button", { name: "Nova conta" }).click();
    const email = `admin_cria_${Date.now()}@exemplo.br`;
    await page.getByLabel("Nome").fill("Prof Criado");
    await page.getByLabel("E-mail").fill(email);
    await page.getByRole("button", { name: "Criar conta" }).click();
    await expect(page.getByText("Código gerado")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/^[A-Z2-9]{8}$/)).toBeVisible();
    await expect(page.getByRole("button", { name: /Copiar código/i })).toBeVisible();
  });

  test("professor não acessa o console", async ({ page }) => {
    const { email, nome } = criarProfessorUnico();
    await criarContaEentrar(page, { nome, email, senha: "senha123" });
    await page.goto("/#/admin");
    await expect(page.getByText("Acesso restrito")).toBeVisible({ timeout: 8000 });
  });

  test("admin desativa professor e o login mostra o status", async ({ page }) => {
    const { email, nome } = criarProfessorUnico();
    await criarUsuarioAtivo(email, nome, "senha123");

    await entrarAdmin(page);
    await page.goto("/#/admin");
    await page.getByRole("tab", { name: "Usuários" }).click();

    const linha = page.getByRole("listitem").filter({ hasText: email });
    await linha.getByRole("button", { name: /Ações para/ }).click();
    await page.getByRole("menuitem", { name: "Desativar" }).click();

    await page.getByLabel("Digite o e-mail para confirmar").fill(email);
    await page.getByLabel("Motivo").fill("Afastamento solicitado pelo professor");
    await page.getByLabel("Sua senha").fill("adminSenha123");
    await page.getByRole("button", { name: "Desativar conta" }).click();
    await expect(page.getByText("Conta desativada")).toBeVisible({ timeout: 8000 });

    // Sai do admin e tenta entrar com a conta suspensa.
    await page.getByRole("button", { name: "Sair da conta" }).first().click();
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Senha", { exact: true }).fill("senha123");
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByText("Conta desativada")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Afastamento solicitado/i)).toBeVisible();
  });

  test("lista de usuários pagina no servidor e mostra o total", async ({ page }) => {
    await entrarAdmin(page);
    // Cria contas fora da interface para passar de uma página.
    for (let i = 0; i < 25; i++) {
      const r = await page.request.post("/api/admin/usuarios", {
        data: {
          nome: `Conta Paginada ${i}`,
          email: `admin_pag_${Date.now()}_${i}@exemplo.br`,
          papel: "professor",
        },
      });
      expect(r.ok()).toBeTruthy();
    }

    await page.goto("/#/admin");
    await page.getByRole("tab", { name: "Usuários" }).click();
    await expect(page.getByText(/1-20 de \d+ contas/)).toBeVisible({ timeout: 10000 });

    await page.getByRole("button", { name: "Próxima página" }).click();
    await expect(page.getByText(/21-\d+ de \d+ contas/)).toBeVisible({ timeout: 10000 });
  });
});
