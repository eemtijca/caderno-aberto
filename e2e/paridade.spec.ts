import { test, expect } from "@playwright/test"
import { buscarEmail, limparMailpit, corrigirRedirect } from "./helpers/mailpit"

async function loginNovo(page, baseURL) {
  const email = `par_${Date.now()}_${Math.random().toString(36).slice(2, 4)}@exemplo.br`
  await page.goto("/#/cadastro")
  await page.getByLabel("Seu nome").fill("Prof Par")
  await page.getByLabel("E-mail").fill(email)
  await page.getByLabel("Senha", { exact: true }).fill("senha123")
  await page.getByLabel("Confirmar senha").fill("senha123")
  await page.getByRole("button", { name: "Criar conta" }).click()
  const mail = await buscarEmail(email, "Confirm", 20000)
  await page.goto(corrigirRedirect(mail.href, baseURL))
  await page.waitForTimeout(1500)
  await page.goto("/#/")
  await page.waitForTimeout(500)
  const campoEmail = page.getByLabel("E-mail")
  if (await campoEmail.isVisible().catch(() => false)) {
    await campoEmail.fill(email)
    await page.getByLabel("Senha", { exact: true }).fill("senha123")
    await page.getByRole("button", { name: "Entrar" }).click()
    await page.waitForURL(/#\//)
  }
  return email
}

async function criarNota(page, titulo) {
  await page.goto("/#/notas")
  await page
    .getByRole("button", { name: /Nova nota/i })
    .first()
    .click()
  await page.getByLabel("Título da aula").fill(titulo)
  const novaDiscBtn = page.getByRole("button", { name: "+ Nova disciplina" })
  await novaDiscBtn.click()
  await page.getByPlaceholder("Nome da disciplina").fill("Mat Par")
  await page.getByRole("button", { name: "Criar e selecionar" }).click()
  await expect(page.getByText("Disciplina criada")).toBeVisible({ timeout: 5000 })
  await page.getByRole("button", { name: "Criar nota" }).click()
  await expect(page).toHaveURL(/#\/editor\//, { timeout: 10000 })
  await page.waitForTimeout(2000)
}

test.describe("Paridade editor ↔ leitura", () => {
  test.beforeEach(async () => {
    await limparMailpit()
  })

  test("quebra de linha e link digitados no editor aparecem na leitura", async ({
    page,
    baseURL,
  }) => {
    await loginNovo(page, baseURL)
    await criarNota(page, "Paridade Teste")

    // edita o primeiro parágrafo visível: linha 1 + Shift+Enter + linha 2
    const editavel = page
      .locator('[contenteditable="true"][aria-label="Texto do parágrafo"]:visible')
      .first()
    await expect(editavel).toBeVisible({ timeout: 10000 })
    await editavel.click()
    await page.keyboard.press("Control+A")
    await page.keyboard.type("primeira linha")
    await page.keyboard.press("Shift+Enter")
    await page.keyboard.type("segunda linha")
    await page.waitForTimeout(2000)

    // abre a leitura e confere a quebra de linha renderizada (<br>)
    await page.goto("/#/notas")
    await page.getByText("Paridade Teste").first().click()
    await page.waitForTimeout(2000)
    // o conteúdo com \n deve aparecer como duas linhas (um <br>)
    const corpo = await page.locator("body").innerText()
    expect(corpo).toContain("primeira linha")
    expect(corpo).toContain("segunda linha")
  })
})
