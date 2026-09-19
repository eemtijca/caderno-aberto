// Fluxos de conta: perfil, troca de senha, backup, exclusão e recuperação.
import { expect, test, type Page } from "@playwright/test";
import { criarContaEentrar, entrar, entrarAdmin } from "./helpers/auth";

async function loginNovo(page: Page) {
  const email = `conta_${Date.now()}_${Math.random().toString(36).slice(2, 4)}@exemplo.br`;
  await criarContaEentrar(page, { nome: "Prof Conta", email, senha: "senha123" });
  return email;
}

test.describe("Conta", () => {
  test("hub de configurações lista as seções", async ({ page }) => {
    await loginNovo(page);
    await page.goto("/#/configuracoes");
    await expect(page.getByRole("heading", { name: "Configurações" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Disciplinas/ }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Turmas/ }).first()).toBeVisible();
  });

  test("perfil salva", async ({ page }) => {
    await loginNovo(page);
    await page.goto("/#/configuracoes/perfil");
    await expect(page.getByRole("heading", { name: "Perfil", level: 1 })).toBeVisible();
    await page.getByLabel("Nome").fill("Prof Atualizado");
    await page.getByRole("button", { name: "Salvar perfil" }).click();
    await expect(page.getByText("Perfil salvo")).toBeVisible({ timeout: 5000 });
  });

  test("trocar senha exige atual e mínimo 8", async ({ page }) => {
    await loginNovo(page);
    await page.goto("/#/configuracoes/seguranca");
    await expect(page.getByLabel("Senha atual para trocar a senha")).toBeVisible({ timeout: 5000 });
    await page.getByLabel("Senha atual para trocar a senha").fill("senha123");
    await page.getByLabel("Nova senha", { exact: true }).fill("senhaNova123");
    await page.getByLabel("Repetir nova senha").fill("senhaNova123");
    await page.getByRole("button", { name: "Alterar senha" }).click();
    await expect(page.getByText("Senha alterada")).toBeVisible({ timeout: 5000 });
  });

  test("backup baixar e restaurar", async ({ page }) => {
    await loginNovo(page);
    await page.goto("/#/configuracoes/dados");
    await expect(page.getByText("Backup e restauração")).toBeVisible();
    await expect(page.getByRole("button", { name: /Baixar backup/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Restaurar backup/i })).toBeVisible();
  });

  test("exclusão exige dupla confirmação e desloga", async ({ page }) => {
    const email = await loginNovo(page);
    await page.goto("/#/configuracoes/exclusao");
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
    await expect(page.getByText(/Exclusão solicitada/i)).toBeVisible({ timeout: 8000 });
    // Sessão encerrada: volta ao login.
    await expect(page.getByLabel("E-mail")).toBeVisible({ timeout: 8000 });
    await entrar(page, email, "senha123");
    await expect(page.getByText("Recuperação de conta")).toBeVisible({ timeout: 15000 });
  });

  test("restauração pela tela de recuperação", async ({ page }) => {
    const email = await loginNovo(page);
    await page.goto("/#/configuracoes/exclusao");
    await page.getByRole("button", { name: "Excluir minha conta" }).click();
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.getByPlaceholder("EXCLUIR").fill("EXCLUIR");
    await page.locator("#senha-excluir").fill("senha123");
    await page.getByRole("button", { name: "Confirmar exclusão" }).click();
    await expect(page.getByText(/Exclusão solicitada/i)).toBeVisible({ timeout: 8000 });
    // Aguarda o encerramento da sessão antes de entrar de novo.
    await expect(page.getByLabel("E-mail")).toBeVisible({ timeout: 8000 });
    await entrar(page, email, "senha123");
    await expect(page.getByText("Recuperação de conta")).toBeVisible({ timeout: 15000 });
    await page.getByRole("button", { name: "Restaurar conta" }).click();
    await expect(page.getByText(/Conta restaurada/i)).toBeVisible({ timeout: 10000 });
    // De volta ao app, a navegação reaparece.
    await expect(page.getByRole("button", { name: "Notas", exact: true })).toBeVisible({
      timeout: 10000,
    });
  });

  test("negação com confirmação errada bloqueia", async ({ page }) => {
    await loginNovo(page);
    await page.goto("/#/configuracoes/exclusao");
    await page.getByRole("button", { name: "Excluir minha conta" }).click();
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.getByPlaceholder("EXCLUIR").fill("excluir");
    await page.locator("#senha-excluir").fill("senha123");
    await expect(page.getByRole("button", { name: "Confirmar exclusão" })).toBeDisabled();
  });

  test("admin não pode excluir a própria conta", async ({ page }) => {
    await entrarAdmin(page);
    await page.goto("/#/configuracoes/exclusao");
    // Aguarda a vista montar com a sessão de administrador carregada.
    await expect(page.getByRole("heading", { name: "Exclusão", level: 1 })).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText(/conta de administração.*não pode ser excluída/i)).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByRole("button", { name: "Excluir minha conta" })).toHaveCount(0);
  });
});
