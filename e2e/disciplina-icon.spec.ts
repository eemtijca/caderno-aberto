// Disciplinas e seletor de ícones na página de conta.
import { expect, test, type Page } from "@playwright/test";
import { criarContaEentrar } from "./helpers/auth";

async function loginNovo(page: Page) {
  const email = `disc_${Date.now()}@exemplo.br`;
  await criarContaEentrar(page, { nome: "Prof Disc", email, senha: "senha123" });
}

test.describe("Disciplina e ícones", () => {
  test("seletor de ícone exibe ícone gráfico não só texto", async ({ page }) => {
    await loginNovo(page);
    await page.goto("/#/conta");
    await expect(page.getByText("Disciplinas").first()).toBeVisible();
    const trigger = page.locator("button").filter({ hasText: "BookOpen" }).first();
    await expect(trigger).toBeVisible({ timeout: 5000 });
    await trigger.click();
    const opcao = page.getByRole("option").filter({ hasText: "FlaskConical" }).first();
    await expect(opcao).toBeVisible({ timeout: 5000 });
    const svgInOption = opcao.locator("svg");
    await expect(svgInOption).toBeVisible();
  });

  test("criacao de disciplina com icone e cor", async ({ page }) => {
    await loginNovo(page);
    await page.goto("/#/conta");
    await page.getByPlaceholder("Nova disciplina (ex.: Química)").fill("História");
    await page.getByRole("button", { name: "Criar" }).first().click();
    await expect(page.getByText("Disciplina criada")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("História").first()).toBeVisible();
  });
});
