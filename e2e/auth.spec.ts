// Fluxos de autenticação: cadastro, confirmação por e-mail, login e redefinição.
import { test, expect } from "@playwright/test"
import { buscarEmail, corrigirRedirect } from "./helpers/outbox"
import { entrarSeNecessario, confirmarEEntrar } from "./helpers/auth"

test.describe("Autenticação", () => {
  test("cadastro exige confirmação e bloqueia login até confirmar", async ({ page, baseURL }) => {
    const email = `auth_${Date.now()}@exemplo.br`
    const senha = "senha123"
    await page.goto("/#/cadastro")
    await page.getByLabel("Seu nome").fill("Prof Teste")
    await page.getByLabel("E-mail").fill(email)
    await page.getByLabel("Senha", { exact: true }).fill(senha)
    await page.getByLabel("Confirmar senha").fill(senha)
    await page.getByRole("button", { name: "Criar conta" }).click()
    await expect(page.getByText("Conta criada. Confirme o e-mail")).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole("button", { name: "Reenviar e-mail de confirmação" })).toBeVisible()
    await page.goto("/#/entrar")
    await page.getByLabel("E-mail").fill(email)
    await page.getByLabel("Senha", { exact: true }).fill(senha)
    await page.getByRole("button", { name: "Entrar" }).click()
    await expect(page.getByText(/E-mail ou senha incorretos/i)).toBeVisible({ timeout: 10000 })
    const mail = await buscarEmail(email, "Confirme", 20000)
    expect(mail.href).toContain("/api/auth/verificar?token=")
    const link = corrigirRedirect(mail.href, baseURL!)
    await page.goto(link)
    await page.waitForTimeout(2000)
    await entrarSeNecessario(page, email, senha)
    await expect(page.getByText("Caderno Aberto").first()).toBeVisible()
  })

  test("reenviar e-mail funciona", async ({ page }) => {
    const email = `reenvio_${Date.now()}@exemplo.br`
    await page.goto("/#/cadastro")
    await page.getByLabel("Seu nome").fill("Prof Reenvio")
    await page.getByLabel("E-mail").fill(email)
    await page.getByLabel("Senha", { exact: true }).fill("senha123")
    await page.getByLabel("Confirmar senha").fill("senha123")
    await page.getByRole("button", { name: "Criar conta" }).click()
    await expect(page.getByText("Conta criada.")).toBeVisible()
    await page.getByRole("button", { name: "Reenviar e-mail de confirmação" }).click()
    await expect(page.getByText("E-mail de confirmação reenviado")).toBeVisible({ timeout: 10000 })
  })

  test("validações de cadastro", async ({ page }) => {
    await page.goto("/#/cadastro")
    await page.getByLabel("Seu nome").fill("Prof")
    await page.getByLabel("E-mail").fill("invalido")
    await page.getByLabel("Senha", { exact: true }).fill("123")
    await page.getByLabel("Confirmar senha").fill("321")
    await page.getByRole("button", { name: "Criar conta" }).click()
    await expect(page.getByText(/8 caracteres|não conferem/i)).toBeVisible({ timeout: 5000 })
  })

  test("login pós cadastro vai para início não conta", async ({ page, baseURL }) => {
    const email = `inicio_${Date.now()}@exemplo.br`
    await page.goto("/#/cadastro")
    await page.getByLabel("Seu nome").fill("Prof Inicio")
    await page.getByLabel("E-mail").fill(email)
    await page.getByLabel("Senha", { exact: true }).fill("senha123")
    await page.getByLabel("Confirmar senha").fill("senha123")
    await page.getByRole("button", { name: "Criar conta" }).click()
    await expect(page.getByText("Conta criada.")).toBeVisible()
    await confirmarEEntrar(page, baseURL, email, "senha123")
    expect(page.url()).not.toContain("#/conta")
    await expect(page.getByRole("heading", { name: /Turmas|Notas|Inicio/i }).first()).toBeVisible({
      timeout: 5000,
    })
  })

  test("redefinição de senha envia link", async ({ page }) => {
    await page.goto("/#/redefinir")
    await page.getByLabel("E-mail").fill("naoexiste_12345@exemplo.br")
    await page.getByRole("button", { name: "Enviar link de redefini" }).click()
    await expect(page.getByText(/Se existir conta/i)).toBeVisible({ timeout: 5000 })
  })

  test("autenticado não vê telas de auth e redireciona para início", async ({ page, baseURL }) => {
    const email = `redir_${Date.now()}@exemplo.br`
    await page.goto("/#/cadastro")
    await page.getByLabel("Seu nome").fill("Prof Redir")
    await page.getByLabel("E-mail").fill(email)
    await page.getByLabel("Senha", { exact: true }).fill("senha123")
    await page.getByLabel("Confirmar senha").fill("senha123")
    await page.getByRole("button", { name: "Criar conta" }).click()
    await confirmarEEntrar(page, baseURL, email, "senha123")
    await page.goto("/#/cadastro")
    await expect(page).toHaveURL(/#\//, { timeout: 5000 })
  })
})
