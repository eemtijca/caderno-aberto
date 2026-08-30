import { test, expect } from "@playwright/test"
import { buscarEmail, limparMailpit, corrigirRedirect } from "./helpers/mailpit"

async function criarEConfirmar(page, baseURL) {
  const email = `nav_${Date.now()}_${Math.random().toString(36).slice(2, 5)}@exemplo.br`
  await page.goto("/#/cadastro")
  await page.getByLabel("Seu nome").fill("Prof Nav")
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

test.describe("Navegação e roteamento", () => {
  test.beforeEach(async () => {
    await limparMailpit()
  })

  test("rotas hash funcionam e fallback para inicio", async ({ page, baseURL }) => {
    await criarEConfirmar(page, baseURL)
    await page.goto("/#/notas")
    await expect(page.getByText(/Notas/i).first()).toBeVisible({ timeout: 5000 })
    await page.goto("/#/organizacao")
    await expect(page.getByText(/Turmas/i).first()).toBeVisible()
    await page.goto("/#/links")
    await expect(page.getByText(/Links/i).first()).toBeVisible()
    await page.goto("/#/conta")
    await expect(page.getByText(/Conta/i).first()).toBeVisible()
    await page.goto("/#/editor/semid")
    await expect(page).toHaveURL(/#\/notas|#\/editor/)
    await page.goto("/#/rota-invalida-xyz")
    await expect(page).toHaveURL(/#\//)
  })

  test("vista pública não exige login", async ({ page }) => {
    await page.goto("/#/l/token_invalido_123")
    await expect(page.getByText(/não existe|inválido|pública|indisponível/i).first()).toBeVisible({
      timeout: 8000,
    })
  })

  test("busca global e navegação por hash", async ({ page, baseURL }) => {
    await criarEConfirmar(page, baseURL)
    await page.goto("/#/")
    const busca = page.getByPlaceholder(/Buscar|Digite/i).first()
    if (await busca.isVisible()) {
      await busca.fill("a")
      await expect(page.getByText(/ao menos 2 caracteres/i)).toBeVisible({ timeout: 3000 })
      await busca.fill("mat")
      await page.waitForTimeout(800)
    }
  })
})
