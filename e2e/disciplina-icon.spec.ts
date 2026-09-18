// Disciplinas e seletor de ícones nas configurações.
import { expect, test, type Page } from "@playwright/test";
import { criarContaEentrar } from "./helpers/auth";

async function loginNovo(page: Page) {
  const email = `disc_${Date.now()}@exemplo.br`;
  await criarContaEentrar(page, { nome: "Prof Disc", email, senha: "senha123" });
}

test.describe("Disciplina e ícones", () => {
  test("seletor de ícone em menu suspenso", async ({ page }) => {
    await loginNovo(page);
    await page.goto("/#/configuracoes/disciplinas");
    await expect(page.getByRole("heading", { name: "Disciplinas", level: 1 })).toBeVisible();
    const combo = page.getByRole("combobox", { name: "Ícone da disciplina" }).first();
    await expect(combo).toBeVisible({ timeout: 5000 });
    await combo.click();
    const lista = page.getByRole("listbox");
    await expect(lista.getByRole("option")).toHaveCount(16);
    await lista.getByRole("option", { name: "Química" }).click();
    await expect(combo).toContainText("Química");
  });

  test("criacao de disciplina com icone e cor", async ({ page }) => {
    await loginNovo(page);
    await page.goto("/#/configuracoes/disciplinas");
    await page.getByPlaceholder("Nova disciplina (ex.: Química)").fill("História");
    await page.getByRole("combobox", { name: "Ícone da disciplina" }).first().click();
    await page.getByRole("option", { name: "História" }).click();
    await page.getByRole("button", { name: "Criar" }).first().click();
    await expect(page.getByText("Disciplina criada")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("História").first()).toBeVisible();
  });

  test("edicao permite alterar nome, cor e icone", async ({ page }) => {
    await loginNovo(page);
    await page.goto("/#/configuracoes/disciplinas");
    await page.getByPlaceholder("Nova disciplina (ex.: Química)").fill("Biologia");
    await page.getByRole("button", { name: "Criar" }).first().click();
    await expect(page.getByText("Disciplina criada")).toBeVisible({ timeout: 5000 });

    await page.getByRole("button", { name: "Editar Biologia" }).click();
    await page.getByLabel("Novo nome da disciplina").fill("Ciências");
    await page.getByRole("combobox", { name: "Ícone da disciplina" }).first().click();
    await page.getByRole("option", { name: "Física", exact: true }).click();
    await page.getByRole("button", { name: "Salvar" }).first().click();
    await expect(page.getByText("Disciplina atualizada")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Ciências").first()).toBeVisible();
  });
});
