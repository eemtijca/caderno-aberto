import { test, expect } from "@playwright/test"
import { buscarEmail, limparMailpit, corrigirRedirect } from "./helpers/mailpit"

test.describe("Edge cases", () => {
  test.beforeEach(async () => {
    await limparMailpit()
  })

  test("strings formais sem travessão", async ({ page }) => {
    await page.goto("/#/entrar")
    await expect(page.getByText(/—/)).toHaveCount(0)
    await page.goto("/#/cadastro")
    await expect(page.getByText(/—/)).toHaveCount(0)
  })

  test("badge status capitalizado", async ({ page, baseURL }) => {
    const email = `edge_${Date.now()}@exemplo.br`
    await page.goto("/#/cadastro")
    await page.getByLabel("Seu nome").fill("Prof Edge")
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
    await page.goto("/#/notas")
    await expect(page.getByText("rascunho")).toHaveCount(0)
  })

  test("placeholder sem travessão e sem você", async ({ page }) => {
    await page.goto("/#/")
    await expect(page.getByText(/você/i)).toHaveCount(0)
  })

  test("exclusão sem EXCLUIR bloqueada", async ({ page, baseURL }) => {
    const email = `edge2_${Date.now()}@exemplo.br`
    await page.goto("/#/cadastro")
    await page.getByLabel("Seu nome").fill("Prof Edge2")
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
    await page.goto("/#/conta")
    await page.getByRole("button", { name: "Excluir minha conta" }).click()
    await page.getByRole("checkbox").check()
    await page.getByRole("button", { name: "Continuar" }).click()
    await page.getByPlaceholder("EXCLUIR").fill("ERRADO")
    await page.getByLabel("Senha atual").fill("senha123")
    await expect(page.getByRole("button", { name: "Confirmar exclusão" })).toBeDisabled()
  })

  test("links com token inválido retorna erro formal", async ({ page }) => {
    await page.goto("/#/l/invalido1234567890")
    await expect(page.getByText(/indisponível|não existe|revogado|expirou/i).first()).toBeVisible({
      timeout: 5000,
    })
  })

  test("importação de nota inexistente", async ({ page, baseURL }) => {
    const email = `edge3_${Date.now()}@exemplo.br`
    await page.goto("/#/cadastro")
    await page.getByLabel("Seu nome").fill("Prof Edge3")
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
    await page.goto("/#/conta")
    await expect(page.getByText("Backup e importação")).toBeVisible()
  })
})
