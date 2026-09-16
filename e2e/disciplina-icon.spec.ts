// Disciplinas e seletor de ícones na página de conta.
import { expect, test, type Page } from "@playwright/test";
import { criarContaEentrar } from "./helpers/auth";

async function loginNovo(page: Page) {
  const email = `disc_${Date.now()}@exemplo.br`;
  await criarContaEentrar(page, { nome: "Prof Disc", email, senha: "senha123" });
}

test.describe("Disciplina e ícones", () => {
  test("seletor de ícone em grade, sem rótulos visíveis", async ({ page }) => {
    await loginNovo(page);
    await page.goto("/#/conta");
    await expect(page.getByText("Disciplinas").first()).toBeVisible();
    const grade = page.getByRole("radiogroup", { name: "Ícone da disciplina" }).first();
    await expect(grade).toBeVisible({ timeout: 5000 });
    await expect(grade.getByRole("radio")).toHaveCount(16);
    const quimica = grade.getByRole("radio", { name: "Química" });
    await expect(quimica.locator("svg")).toBeVisible();
    await quimica.click();
    await expect(quimica).toHaveAttribute("aria-checked", "true");
  });

  test("criacao de disciplina com icone e cor", async ({ page }) => {
    await loginNovo(page);
    await page.goto("/#/conta");
    await page.getByPlaceholder("Nova disciplina (ex.: Química)").fill("História");
    await page.getByRole("radio", { name: "História" }).first().click();
    await page.getByRole("button", { name: "Criar" }).first().click();
    await expect(page.getByText("Disciplina criada")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("História").first()).toBeVisible();
  });
});
