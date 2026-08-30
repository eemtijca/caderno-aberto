import { test, expect } from "@playwright/test"
import { buscarEmail, limparMailpit, corrigirRedirect } from "./helpers/mailpit"

async function loginNovo(page, baseURL) {
  const email = `links_${Date.now()}_${Math.random().toString(36).slice(2, 4)}@exemplo.br`
  await page.goto("/#/cadastro")
  await page.getByLabel("Seu nome").fill("Prof Links")
  await page.getByLabel("E-mail").fill(email)
  await page.getByLabel("Senha", { exact: true }).fill("senha123")
  await page.getByLabel("Confirmar senha").fill("senha123")
  await page.getByRole("button", { name: "Criar conta" }).click()
  const mail = await buscarEmail(email, "Confirm", 20000)
  await page.goto(corrigirRedirect(mail.href, baseURL))
  await page.waitForTimeout(1000)
  await page.goto("/#/entrar")
  await page.getByLabel("E-mail").fill(email)
  await page.getByLabel("Senha", { exact: true }).fill("senha123")
  await page.getByRole("button", { name: "Entrar" }).click()
  await page.waitForURL(/#\//)
  return email
}

test.describe("Links", () => {
  test.beforeEach(async () => {
    await limparMailpit()
  })

  test("mensagem de rascunho formal sem travessão", async ({ page, baseURL }) => {
    await loginNovo(page, baseURL)
    await page.goto("/#/links")
    await expect(page.getByText(/Links/i).first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/rascunho/i).first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByText("—")).toHaveCount(0)
  })

  test("criar link exige nota publicada", async ({ page, baseURL }) => {
    await loginNovo(page, baseURL)
    await page.goto("/#/links")
    await expect(page.getByText(/Nenhum link|Crie o primeiro/i).first()).toBeVisible({
      timeout: 5000,
    })
  })
})
