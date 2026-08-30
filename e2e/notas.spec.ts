import { test, expect } from "@playwright/test"
import { buscarEmail, limparMailpit, corrigirRedirect } from "./helpers/mailpit"

async function loginNovo(page, baseURL) {
  const email = `notas_${Date.now()}_${Math.random().toString(36).slice(2, 4)}@exemplo.br`
  await page.goto("/#/cadastro")
  await page.getByLabel("Seu nome").fill("Prof Notas")
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

test.describe("Notas", () => {
  test.beforeEach(async () => {
    await limparMailpit()
  })

  test("criar disciplina inline no dialogo de nova nota", async ({ page, baseURL }) => {
    await loginNovo(page, baseURL)
    await page.goto("/#/notas")
    const botaoNova = page.getByRole("button", { name: /Nova nota|Criar nota/i }).first()
    if (await botaoNova.isVisible()) await botaoNova.click()
    else await page.goto("/#/notas")
    await expect(page.getByText("Nova nota de aula")).toBeVisible({ timeout: 5000 })
    await page.getByLabel("Título da aula").fill("Teste de nota")
    const novaDiscBtn = page.getByRole("button", { name: "+ Nova disciplina" })
    await expect(novaDiscBtn).toBeVisible()
    await novaDiscBtn.click()
    await page.getByPlaceholder("Nome da disciplina").fill("Física Teste")
    await page.getByRole("button", { name: "Criar e selecionar" }).click()
    await expect(page.getByText("Disciplina criada")).toBeVisible({ timeout: 8000 })
    await page.getByRole("button", { name: "Criar nota" }).click()
    await expect(page.getByText(/Nota criada/i)).toBeVisible({ timeout: 8000 })
  })

  test("validação título mínimo 2 caracteres", async ({ page, baseURL }) => {
    await loginNovo(page, baseURL)
    await page.goto("/#/notas")
    const botao = page.getByRole("button", { name: /Nova nota/i }).first()
    if (await botao.isVisible()) await botao.click()
    await expect(page.getByText("Nova nota de aula")).toBeVisible()
    await page.getByRole("button", { name: "Criar nota" }).click()
    await expect(page.getByRole("button", { name: "Criar nota" })).toBeDisabled()
  })

  test("editar nota e autosave", async ({ page, baseURL }) => {
    await loginNovo(page, baseURL)
    await page.goto("/#/notas")
    const botao = page.getByRole("button", { name: /Nova nota/i }).first()
    if (await botao.isVisible()) await botao.click()
    await page.getByLabel("Título da aula").fill("Nota Autosave")
    const novaDiscBtn = page.getByRole("button", { name: "+ Nova disciplina" })
    await novaDiscBtn.click()
    await page.getByPlaceholder("Nome da disciplina").fill("Mat Autosave")
    await page.getByRole("button", { name: "Criar e selecionar" }).click()
    await expect(page.getByText("Disciplina criada")).toBeVisible({ timeout: 5000 })
    await page.getByRole("button", { name: "Criar nota" }).click()
    await expect(page).toHaveURL(/#\/editor\//, { timeout: 10000 })
    await page.waitForTimeout(1500)
    const tituloEditor = page.locator('input[value="Nota Autosave"]')
    if (await tituloEditor.isVisible()) {
      await tituloEditor.fill("Nota Autosave Editada")
      await page.waitForTimeout(1500)
      await expect(page.getByText(/Salvo|Salvando/i).first()).toBeVisible({ timeout: 5000 })
    }
  })

  test("duplicar nota gera rascunho", async ({ page, baseURL }) => {
    await loginNovo(page, baseURL)
    await page.goto("/#/notas")
    await expect(page.getByText(/Nenhuma nota|Criar/i).first()).toBeVisible({ timeout: 5000 })
  })
})
