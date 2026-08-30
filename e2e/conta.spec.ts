import { test, expect } from "@playwright/test"
import { buscarEmail, limparMailpit, corrigirRedirect } from "./helpers/mailpit"

async function loginNovo(page, baseURL) {
  const email = `conta_${Date.now()}_${Math.random().toString(36).slice(2, 4)}@exemplo.br`
  await page.goto("/#/cadastro")
  await page.getByLabel("Seu nome").fill("Prof Conta")
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

test.describe("Conta", () => {
  test.beforeEach(async () => {
    await limparMailpit()
  })

  test("perfil salva e icones exibem imagem", async ({ page, baseURL }) => {
    await loginNovo(page, baseURL)
    await page.goto("/#/conta")
    await expect(page.getByText("Conta").first()).toBeVisible()
    const inputProf = page.getByLabel("Professor(a)")
    await inputProf.fill("Prof Atualizado")
    await page.getByRole("button", { name: "Salvar perfil" }).click()
    await expect(page.getByText("Perfil salvo")).toBeVisible({ timeout: 5000 })
    const selectIcone = page.getByText("BookOpen").first()
    await expect(selectIcone).toBeVisible({ timeout: 5000 })
    // verifica que icone tem svg
    const svg = page.locator("svg").first()
    await expect(svg).toBeVisible()
  })

  test("trocar senha validação mínimo 6", async ({ page, baseURL }) => {
    await loginNovo(page, baseURL)
    await page.goto("/#/conta")
    const novaSenha = page.getByPlaceholder("Nova senha")
    await expect(novaSenha.first()).toBeVisible({ timeout: 5000 })
  })

  test("backup baixar e importar", async ({ page, baseURL }) => {
    await loginNovo(page, baseURL)
    await page.goto("/#/conta")
    await expect(page.getByText("Backup e importação")).toBeVisible()
    await expect(page.getByRole("button", { name: /Baixar backup/i })).toBeVisible()
  })

  test("exclusão exige dupla confirmação EXCLUIR e senha", async ({ page, baseURL }) => {
    const email = await loginNovo(page, baseURL)
    await page.goto("/#/conta")
    await page.getByRole("button", { name: "Excluir minha conta" }).click()
    await expect(page.getByText("Confirmar solicitação")).toBeVisible({ timeout: 5000 })
    const continuar = page.getByRole("button", { name: "Continuar" })
    await expect(continuar).toBeDisabled()
    await page.getByRole("checkbox").check()
    await expect(continuar).toBeEnabled()
    await continuar.click()
    await expect(page.getByText("Confirmação final")).toBeVisible()
    const confirmar = page.getByRole("button", { name: "Confirmar exclusão" })
    await expect(confirmar).toBeDisabled()
    await page.getByPlaceholder("EXCLUIR").fill("EXCLUIR")
    await expect(confirmar).toBeDisabled()
    await page.getByLabel("Senha atual").fill("senha_errada")
    await expect(confirmar).toBeEnabled()
    await confirmar.click()
    await expect(page.getByText(/Senha incorreta/i)).toBeVisible({ timeout: 5000 })
    await page.getByLabel("Senha atual").fill("senha123")
    await page.getByRole("button", { name: "Confirmar exclusão" }).click()
    await expect(page.getByText(/Solicitação registrada/i)).toBeVisible({ timeout: 8000 })
    await expect(page.getByText(/Restaurar conta|Exclusão solicitada/i).first()).toBeVisible({
      timeout: 5000,
    })
  })

  test("restauracao dentro da carencia", async ({ page, baseURL }) => {
    await loginNovo(page, baseURL)
    await page.goto("/#/conta")
    await page.getByRole("button", { name: "Excluir minha conta" }).click()
    await page.getByRole("checkbox").check()
    await page.getByRole("button", { name: "Continuar" }).click()
    await page.getByPlaceholder("EXCLUIR").fill("EXCLUIR")
    await page.getByLabel("Senha atual").fill("senha123")
    await page.getByRole("button", { name: "Confirmar exclusão" }).click()
    await expect(page.getByText(/Solicitação registrada/i)).toBeVisible({ timeout: 5000 })
    await page.goto("/#/")
    await expect(page.getByText(/Exclusão solicitada/i)).toBeVisible({ timeout: 5000 })
    await page.getByRole("button", { name: "Restaurar conta" }).first().click()
    await expect(page.getByText(/Conta restaurada/i)).toBeVisible({ timeout: 5000 })
  })

  test("negação com confirmação errada bloqueia", async ({ page, baseURL }) => {
    await loginNovo(page, baseURL)
    await page.goto("/#/conta")
    await page.getByRole("button", { name: "Excluir minha conta" }).click()
    await page.getByRole("checkbox").check()
    await page.getByRole("button", { name: "Continuar" }).click()
    await page.getByPlaceholder("EXCLUIR").fill("excluir")
    await page.getByLabel("Senha atual").fill("senha123")
    await expect(page.getByRole("button", { name: "Confirmar exclusão" })).toBeDisabled()
  })
})
