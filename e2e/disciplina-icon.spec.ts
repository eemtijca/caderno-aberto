import { test, expect } from "@playwright/test"
import { buscarEmail, limparMailpit, corrigirRedirect } from "./helpers/mailpit"

async function loginNovo(page, baseURL) {
  const email = `disc_${Date.now()}@exemplo.br`
  await page.goto("/#/cadastro")
  await page.getByLabel("Seu nome").fill("Prof Disc")
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
}

test.describe("Disciplina e ícones", () => {
  test.beforeEach(async () => {
    await limparMailpit()
  })

  test("seletor de ícone exibe ícone gráfico não só texto", async ({ page, baseURL }) => {
    await loginNovo(page, baseURL)
    await page.goto("/#/conta")
    await expect(page.getByText("Disciplinas").first()).toBeVisible()
    const trigger = page.locator("button").filter({ hasText: "BookOpen" }).first()
    await expect(trigger).toBeVisible({ timeout: 5000 })
    await trigger.click()
    const opcao = page.getByRole("option").filter({ hasText: "FlaskConical" }).first()
    await expect(opcao).toBeVisible({ timeout: 5000 })
    const svgInOption = opcao.locator("svg")
    await expect(svgInOption).toBeVisible()
  })

  test("criacao de disciplina com icone e cor", async ({ page, baseURL }) => {
    await loginNovo(page, baseURL)
    await page.goto("/#/conta")
    await page.getByPlaceholder("Nova disciplina (ex.: Química)").fill("História")
    await page.getByRole("button", { name: "Criar" }).click()
    await expect(page.getByText("Disciplina criada")).toBeVisible({ timeout: 5000 })
    await expect(page.getByText("História").first()).toBeVisible()
  })
})
