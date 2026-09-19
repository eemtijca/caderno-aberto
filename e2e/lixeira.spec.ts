// Lixeira: exclusão reversível de notas com restauração.
import { expect, test, type Page } from "@playwright/test";
import { criarContaEentrar } from "./helpers/auth";

async function loginNovo(page: Page) {
  const email = `lixeira_${Date.now()}_${Math.random().toString(36).slice(2, 4)}@exemplo.br`;
  await criarContaEentrar(page, { nome: "Prof Lixeira", email, senha: "senha123" });
  return email;
}

async function criarNotaEAbrir(page: Page, titulo: string, disciplina: string) {
  await page.goto("/#/notas");
  const botao = page.getByRole("button", { name: /Nova nota/i }).first();
  if (await botao.isVisible()) await botao.click();
  await expect(page.getByText("Nova nota de aula")).toBeVisible({ timeout: 8000 });
  await page.getByLabel("Título da aula").fill(titulo);
  await page.getByRole("button", { name: "+ Nova disciplina" }).click();
  await page.getByPlaceholder("Nome da disciplina").fill(disciplina);
  await page.getByRole("button", { name: "Criar e selecionar" }).click();
  await expect(page.getByText("Disciplina criada")).toBeVisible({ timeout: 8000 });
  await page.getByRole("button", { name: "Criar nota" }).click();
  await expect(page).toHaveURL(/#\/editor\//, { timeout: 10000 });
  await expect(page.getByRole("textbox", { name: "Título da nota" })).toBeVisible({
    timeout: 10000,
  });
}

test.describe("Lixeira", () => {
  test("nota excluída vai para a lixeira e pode ser restaurada", async ({ page }) => {
    await loginNovo(page);
    await criarNotaEAbrir(page, "Nota Lixeira", "Química Teste");

    await page.getByRole("button", { name: "Excluir nota" }).click();
    await page.getByRole("button", { name: "Mover para a lixeira" }).click();
    await expect(page.getByText(/movida para a lixeira/i)).toBeVisible({ timeout: 8000 });

    await page.goto("/#/lixeira");
    await expect(page.getByRole("heading", { name: "Lixeira", level: 1 })).toBeVisible();
    await expect(page.getByText("Nota Lixeira", { exact: true }).first()).toBeVisible();

    await page.getByRole("button", { name: "Restaurar" }).first().click();
    await expect(page.getByText(/Item restaurado/i)).toBeVisible({ timeout: 8000 });

    await page.goto("/#/notas");
    await expect(page.getByText("Nota Lixeira", { exact: true }).first()).toBeVisible();
  });
});
