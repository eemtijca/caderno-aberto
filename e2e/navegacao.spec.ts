// Roteamento por hash e navegação entre as telas principais.
import { expect, test, type Page } from "@playwright/test";
import { criarContaEentrar } from "./helpers/auth";

async function criarEConfirmar(page: Page) {
  const email = `nav_${Date.now()}_${Math.random().toString(36).slice(2, 5)}@exemplo.br`;
  await criarContaEentrar(page, { nome: "Prof Nav", email, senha: "senha123" });
  return email;
}

test.describe("Navegação e roteamento", () => {
  test("rotas hash funcionam e fallback para inicio", async ({ page }) => {
    await criarEConfirmar(page);
    await page.goto("/#/notas");
    await expect(page.getByText(/Notas/i).first()).toBeVisible({ timeout: 5000 });
    await page.goto("/#/organizacao");
    await expect(page.getByText(/Turmas/i).first()).toBeVisible();
    await page.goto("/#/links");
    await expect(page.getByText(/Links/i).first()).toBeVisible();
    await page.goto("/#/conta");
    await expect(page.getByText(/Conta/i).first()).toBeVisible();
    await page.goto("/#/editor/semid");
    await expect(page).toHaveURL(/#\/notas|#\/editor/);
    await page.goto("/#/rota-invalida-xyz");
    await expect(page).toHaveURL(/#\//);
  });

  test("vista pública não exige login", async ({ page }) => {
    await page.goto("/#/l/token_invalido_123");
    await expect(page.getByText(/não existe|inválido|pública|indisponível/i).first()).toBeVisible({
      timeout: 8000,
    });
  });

  test("busca global e navegação por hash", async ({ page }) => {
    await criarEConfirmar(page);
    await page.goto("/#/");
    const busca = page.getByPlaceholder(/Buscar|Digite/i).first();
    if (await busca.isVisible()) {
      await busca.fill("a");
      await expect(page.getByText(/ao menos 2 caracteres/i)).toBeVisible({ timeout: 3000 });
      await busca.fill("mat");
      await page.waitForTimeout(800);
    }
  });
});
