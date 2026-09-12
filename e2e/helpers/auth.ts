// Helpers de autenticação para Playwright.
import { expect, type Page } from "@playwright/test";
import { ADMIN_PADRAO, criarUsuarioAtivo, sufixo } from "./db";

export async function entrar(page: Page, email: string, senha: string) {
  await page.goto("/#/entrar");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(senha);
  await page.getByRole("button", { name: "Entrar" }).click();
}

export async function entrarAdmin(page: Page) {
  await entrar(page, ADMIN_PADRAO.email, ADMIN_PADRAO.senha);
  await page.waitForURL((url) => !url.hash.startsWith("#/entrar"), { timeout: 30000 });
}

export function criarProfessorUnico() {
  const suf = sufixo();
  return { email: `teste_${suf}@exemplo.br`, senha: "senha123", nome: `Prof ${suf}` };
}

/** Cria a conta no banco e faz login pela interface. */
export async function criarContaEentrar(
  page: Page,
  dados: { nome: string; email: string; senha?: string },
) {
  const senha = dados.senha ?? "senha123";
  await criarUsuarioAtivo(dados.email, dados.nome, senha);
  await entrar(page, dados.email, senha);
  await page.waitForURL((url) => !url.hash.startsWith("#/entrar"), { timeout: 30000 });
  await expect(page.getByLabel("E-mail")).toHaveCount(0);
}

// Preenche o login apenas se o formulário estiver visível.
export async function entrarSeNecessario(page: Page, email: string, senha: string) {
  await page.goto("/#/entrar");
  const campoEmail = page.getByLabel("E-mail");
  if (await campoEmail.isVisible({ timeout: 8000 })) {
    await campoEmail.fill(email);
    await page.getByLabel("Senha", { exact: true }).fill(senha);
    await page.getByRole("button", { name: "Entrar" }).click();
  }
  await page.waitForURL((url) => !url.hash.startsWith("#/entrar"), { timeout: 30000 });
  await expect(page.getByLabel("E-mail")).toHaveCount(0);
}
