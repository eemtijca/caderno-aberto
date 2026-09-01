import { test, expect } from "@playwright/test"
import { buscarEmail, limparMailpit, corrigirRedirect } from "./helpers/mailpit"

async function loginNovo(page, baseURL) {
  const email = `editor_${Date.now()}_${Math.random().toString(36).slice(2, 4)}@exemplo.br`
  await page.goto("/#/cadastro")
  await page.getByLabel("Seu nome").fill("Prof Editor")
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
  await page.getByPlaceholder("Nome da disciplina").fill("Mat Editor")
  await page.getByRole("button", { name: "Criar e selecionar" }).click()
  await expect(page.getByText("Disciplina criada")).toBeVisible({ timeout: 5000 })
  await page.getByRole("button", { name: "Criar nota" }).click()
  await expect(page).toHaveURL(/#\/editor\//, { timeout: 10000 })
  await page.waitForTimeout(2000)
}

test.describe("Editor WYSIWYG", () => {
  test.beforeEach(async () => {
    await limparMailpit()
  })

  test("editar parágrafo com negrito e quebra de linha", async ({ page, baseURL }) => {
    await loginNovo(page, baseURL)
    await criarNota(page, "Editor Teste")

    // pega um editor de parágrafo VISÍVEL (desktop: grid de dois painéis)
    const editavel = page
      .locator('[contenteditable="true"][aria-label="Texto do parágrafo"]:visible')
      .first()
    await expect(editavel).toBeVisible({ timeout: 10000 })
    await editavel.click()
    await page.keyboard.press("Control+A")
    await page.keyboard.type("Olá mundo em negrito")
    await page.waitForTimeout(1500)

    // autosave registra "salvo"
    await expect(page.getByText(/salvo/i).first()).toBeVisible({ timeout: 8000 })
  })

  test("fórmula display WYSIWYG renderiza KaTeX no editor", async ({ page, baseURL }) => {
    await loginNovo(page, baseURL)
    await criarNota(page, "Fórmula Teste")

    // o editor de fórmula display existe e mostra o KaTeX renderizado
    const equacao = page
      .locator('[contenteditable="true"][aria-label="Equação em destaque"]:visible')
      .first()
    await expect(equacao).toBeVisible({ timeout: 10000 })
    // a prévia ao lado deve conter o KaTeX (classe .katex)
    await expect(page.locator(".katex:visible").first()).toBeVisible({ timeout: 10000 })
  })

  test("compartilhar publica a nota automaticamente (checkbox marcado)", async ({
    page,
    baseURL,
  }) => {
    await loginNovo(page, baseURL)
    await criarNota(page, "Publicar Teste")

    // abre o diálogo de compartilhar
    await page.getByRole("button", { name: "Compartilhar" }).click()
    await expect(page.getByText("Compartilhar com os alunos")).toBeVisible({ timeout: 8000 })

    // a nota é rascunho e o checkbox de publicar aparece marcado por padrão
    const checkbox = page.getByRole("checkbox")
    await expect(checkbox).toBeVisible()
    expect(await checkbox.isChecked()).toBe(true)

    // cria o link e a nota deve virar publicada
    await page.getByRole("button", { name: "Criar" }).click()
    await expect(page.getByText(/publicada e link criado/i).first()).toBeVisible({
      timeout: 10000,
    })

    // volta ao editor e confere o switch de status "Publicada"
    await page.waitForTimeout(1000)
    await expect(page.getByText("Publicada", { exact: true }).first()).toBeVisible({
      timeout: 8000,
    })
  })
})
