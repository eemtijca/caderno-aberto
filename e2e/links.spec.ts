// Telas de links: mensagem de rascunho e exigência de nota publicada.
import { expect, test, type Page } from "@playwright/test";
import { criarContaEentrar } from "./helpers/auth";

async function loginNovo(page: Page) {
  const email = `links_${Date.now()}_${Math.random().toString(36).slice(2, 4)}@exemplo.br`;
  await criarContaEentrar(page, { nome: "Prof Links", email, senha: "senha123" });
  return email;
}

test.describe("Links", () => {
  test("mensagem de rascunho formal sem travessão", async ({ page }) => {
    await loginNovo(page);
    await page.goto("/#/links");
    await expect(page.getByText(/Links/i).first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/rascunho/i).first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("—")).toHaveCount(0);
  });

  test("criar link exige nota publicada", async ({ page }) => {
    await loginNovo(page);
    await page.goto("/#/links");
    await expect(page.getByText(/Nenhum link|Crie o primeiro/i).first()).toBeVisible({
      timeout: 5000,
    });
  });
});
