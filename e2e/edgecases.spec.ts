// Casos limite de interface: textos formais, tokens inválidos e confirmações.
import { test, expect } from "@playwright/test";
import { criarContaEentrar, criarProfessorUnico } from "./helpers/auth";

test.describe("Edge cases", () => {
  test("strings formais sem travessão", async ({ page }) => {
    await page.goto("/#/entrar");
    await expect(page.getByText(/—/)).toHaveCount(0);
    await page.goto("/#/solicitar");
    await expect(page.getByText(/—/)).toHaveCount(0);
  });

  test("badge status capitalizado", async ({ page }) => {
    const { email, nome } = criarProfessorUnico();
    await criarContaEentrar(page, { nome, email, senha: "senha123" });
    await page.goto("/#/notas");
    await expect(page.getByText("rascunho")).toHaveCount(0);
  });

  test("placeholder sem travessão e sem você", async ({ page }) => {
    await page.goto("/#/");
    await expect(page.getByText(/você/i)).toHaveCount(0);
  });

  test("exclusão sem EXCLUIR bloqueada", async ({ page }) => {
    const { email, nome } = criarProfessorUnico();
    await criarContaEentrar(page, { nome, email, senha: "senha123" });
    await page.goto("/#/conta");
    await page.getByRole("button", { name: "Excluir minha conta" }).click();
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.getByPlaceholder("EXCLUIR").fill("ERRADO");
    await page.locator("#senha-excluir").fill("senha123");
    await expect(page.getByRole("button", { name: "Confirmar exclusão" })).toBeDisabled();
  });

  test("links com token inválido retorna erro formal", async ({ page }) => {
    await page.goto("/#/l/invalido1234567890");
    await expect(page.getByText(/indisponível|não existe|revogado|expirou/i).first()).toBeVisible({
      timeout: 5000,
    });
  });

  test("importação de nota inexistente", async ({ page }) => {
    const { email, nome } = criarProfessorUnico();
    await criarContaEentrar(page, { nome, email, senha: "senha123" });
    await page.goto("/#/conta");
    await expect(page.getByText("Backup e importação")).toBeVisible();
  });
});
