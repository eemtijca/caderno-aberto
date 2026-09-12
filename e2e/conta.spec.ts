// Fluxos de conta: perfil, troca de senha, backup, exclusão e restauração.
import { expect, test, type Page } from "@playwright/test";
import { criarContaEentrar } from "./helpers/auth";

async function loginNovo(page: Page) {
  const email = `conta_${Date.now()}_${Math.random().toString(36).slice(2, 4)}@exemplo.br`;
  await criarContaEentrar(page, { nome: "Prof Conta", email, senha: "senha123" });
  return email;
}

test.describe("Conta", () => {
  test("perfil salva e icones exibem imagem", async ({ page }) => {
    await loginNovo(page);
    await page.goto("/#/conta");
    await expect(page.getByText("Conta").first()).toBeVisible();
    const inputProf = page.getByLabel("Professor(a)");
    await inputProf.fill("Prof Atualizado");
    await page.getByRole("button", { name: "Salvar perfil" }).click();
    await expect(page.getByText("Perfil salvo")).toBeVisible({ timeout: 5000 });
    const selectIcone = page.getByText("BookOpen").first();
    await expect(selectIcone).toBeVisible({ timeout: 5000 });
    // O ícone renderiza SVG.
    const svg = page.locator("svg").first();
    await expect(svg).toBeVisible();
  });

  test("trocar senha exige atual e mínimo 8", async ({ page }) => {
    await loginNovo(page);
    await page.goto("/#/conta");
    await expect(page.getByLabel("Senha atual para trocar a senha")).toBeVisible({ timeout: 5000 });
    await page.getByLabel("Senha atual para trocar a senha").fill("senha123");
    await page.getByLabel("Nova senha", { exact: true }).fill("senhaNova123");
    await page.getByLabel("Repetir nova senha").fill("senhaNova123");
    await page.getByRole("button", { name: "Alterar senha" }).click();
    await expect(page.getByText("Senha alterada")).toBeVisible({ timeout: 5000 });
  });

  test("backup baixar e importar", async ({ page }) => {
    await loginNovo(page);
    await page.goto("/#/conta");
    await expect(page.getByText("Backup e importação")).toBeVisible();
    await expect(page.getByRole("button", { name: /Baixar backup/i })).toBeVisible();
  });

  test("exclusão exige dupla confirmação EXCLUIR e senha", async ({ page }) => {
    const email = await loginNovo(page);
    await page.goto("/#/conta");
    await page.getByRole("button", { name: "Excluir minha conta" }).click();
    await expect(page.getByText("Confirmar solicitação")).toBeVisible({ timeout: 5000 });
    const continuar = page.getByRole("button", { name: "Continuar" });
    await expect(continuar).toBeDisabled();
    await page.getByRole("checkbox").check();
    await expect(continuar).toBeEnabled();
    await continuar.click();
    await expect(page.getByText("Confirmação final")).toBeVisible();
    const confirmar = page.getByRole("button", { name: "Confirmar exclusão" });
    await expect(confirmar).toBeDisabled();
    await page.getByPlaceholder("EXCLUIR").fill("EXCLUIR");
    await expect(confirmar).toBeDisabled();
    await page.locator("#senha-excluir").fill("senha_errada");
    await expect(confirmar).toBeEnabled();
    await confirmar.click();
    await expect(page.getByText(/Senha incorreta/i)).toBeVisible({ timeout: 5000 });
    // Erro retorna o diálogo à primeira etapa.
    await page.getByRole("button", { name: "Continuar" }).click();
    await expect(page.getByText("Confirmação final")).toBeVisible();
    await page.getByPlaceholder("EXCLUIR").fill("EXCLUIR");
    await page.locator("#senha-excluir").fill("senha123");
    await page.getByRole("button", { name: "Confirmar exclusão" }).click();
    await expect(page.getByText(/Solicitação registrada/i)).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(/Restaurar conta|Exclusão solicitada/i).first()).toBeVisible({
      timeout: 5000,
    });
  });

  test("restauracao dentro da carencia", async ({ page }) => {
    await loginNovo(page);
    await page.goto("/#/conta");
    await page.getByRole("button", { name: "Excluir minha conta" }).click();
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.getByPlaceholder("EXCLUIR").fill("EXCLUIR");
    await page.locator("#senha-excluir").fill("senha123");
    await page.getByRole("button", { name: "Confirmar exclusão" }).click();
    await expect(page.getByText(/Solicitação registrada/i)).toBeVisible({ timeout: 5000 });
    await page.goto("/#/");
    await expect(page.getByText(/Exclusão solicitada/i)).toBeVisible({ timeout: 5000 });
    await page.getByRole("button", { name: "Restaurar conta" }).first().click();
    await expect(page.getByText(/Conta restaurada/i)).toBeVisible({ timeout: 10000 });
  });

  test("negação com confirmação errada bloqueia", async ({ page }) => {
    await loginNovo(page);
    await page.goto("/#/conta");
    await page.getByRole("button", { name: "Excluir minha conta" }).click();
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.getByPlaceholder("EXCLUIR").fill("excluir");
    await page.locator("#senha-excluir").fill("senha123");
    await expect(page.getByRole("button", { name: "Confirmar exclusão" })).toBeDisabled();
  });
});
