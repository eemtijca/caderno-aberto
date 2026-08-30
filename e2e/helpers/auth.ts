// Helpers de autenticação para Playwright.
import { expect, type Page } from "@playwright/test"

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
