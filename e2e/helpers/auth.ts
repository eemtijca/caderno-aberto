// Helpers de autenticação para Playwright.
import { expect, type Page } from "@playwright/test"
import { buscarEmail, corrigirRedirect } from "./outbox"

export async function cadastrar(page: Page, nome: string, email: string, senha: string) {
  await page.goto("/#/cadastro")
  await page.getByLabel("Seu nome").fill(nome)
  await page.getByLabel("E-mail").fill(email)
  await page.getByLabel("Senha", { exact: true }).fill(senha)
  await page.getByLabel("Confirmar senha").fill(senha)
  await page.getByRole("button", { name: "Criar conta" }).click()
}

export async function entrar(page: Page, email: string, senha: string) {
  await page.goto("/#/entrar")
  await page.getByLabel("E-mail").fill(email)
  await page.getByLabel("Senha", { exact: true }).fill(senha)
  await page.getByRole("button", { name: "Entrar" }).click()
}

export async function criarProfessorUnico(page: Page) {
  const sufixo = Math.random().toString(36).slice(2, 8)
  const email = `teste_${sufixo}@exemplo.br`
  const senha = "senha123"
  const nome = `Prof ${sufixo}`
  return { email, senha, nome }
}

// Confirma o e-mail pelo link e efetua login.
export async function confirmarEEntrar(
  page: Page,
  baseURL: string | undefined,
  email: string,
  senha: string,
) {
  const mail = await buscarEmail(email, "Confirme", 20000)
  await page.goto(corrigirRedirect(mail.href, baseURL ?? "http://127.0.0.1:3000"))
  await page.waitForTimeout(1000)
  await entrarSeNecessario(page, email, senha)
}

// Preenche o login apenas se o formulário estiver visível.
export async function entrarSeNecessario(page: Page, email: string, senha: string) {
  await page.goto("/#/entrar")
  const campoEmail = page.getByLabel("E-mail")
  if (await campoEmail.isVisible({ timeout: 8000 })) {
    await campoEmail.fill(email)
    await page.getByLabel("Senha", { exact: true }).fill(senha)
    await page.getByRole("button", { name: "Entrar" }).click()
  }
  await page.waitForURL(
    (url) => !url.hash.startsWith("#/entrar") && !url.hash.startsWith("#/cadastro"),
    { timeout: 30000 },
  )
  await expect(page.getByLabel("E-mail")).toHaveCount(0)
}
