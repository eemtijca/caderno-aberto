// Console de administração: acesso, fila e geração de código.
import { test, expect } from "@playwright/test";
import { criarContaEentrar, criarProfessorUnico, entrarAdmin } from "./helpers/auth";

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
    await expect(page).not.toHaveURL(/#\/admin/, { timeout: 8000 });
  });
});
