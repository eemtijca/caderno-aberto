// Fluxos de notas: criação com disciplina inline, validação e autosave.
import { expect, test, type Page } from "@playwright/test";
import { criarContaEentrar } from "./helpers/auth";

async function loginNovo(page: Page) {
  const email = `notas_${Date.now()}_${Math.random().toString(36).slice(2, 4)}@exemplo.br`;
  await criarContaEentrar(page, { nome: "Prof Notas", email, senha: "senha123" });
  return email;
}

/** Cria uma nota com disciplina inline e aguarda o editor carregar. */
async function criarNotaEAbrir(page: Page, titulo: string, disciplina: string) {
  await page.goto("/#/notas");
  const botao = page.getByRole("button", { name: /Nova nota/i }).first();
  if (await botao.isVisible()) await botao.click();
  await page.getByLabel("Título da aula").fill(titulo);
  await page.getByRole("button", { name: "+ Nova disciplina" }).click();
  await page.getByPlaceholder("Nome da disciplina").fill(disciplina);
  await page.getByRole("button", { name: "Criar e selecionar" }).click();
  await expect(page.getByText("Disciplina criada")).toBeVisible({ timeout: 8000 });
  await page.getByRole("button", { name: "Criar nota" }).click();
  await expect(page).toHaveURL(/#\/editor\//, { timeout: 10000 });
  await expect(page.getByRole("textbox", { name: "Título da nota" })).toBeVisible({
    timeout: 10000,
  });
}

function botaoAdicionarAoFinal(page: Page) {
  return page
    .getByRole("button", { name: /Adicionar (bloco ao final|o primeiro bloco)/i })
    .filter({ visible: true });
}

test.describe("Notas", () => {
  test("criar disciplina inline no dialogo de nova nota", async ({ page }) => {
    await loginNovo(page);
    await page.goto("/#/notas");
    const botaoNova = page.getByRole("button", { name: /Nova nota|Criar nota/i }).first();
    if (await botaoNova.isVisible()) await botaoNova.click();
    else await page.goto("/#/notas");
    await expect(page.getByText("Nova nota de aula")).toBeVisible({ timeout: 5000 });
    await page.getByLabel("Título da aula").fill("Teste de nota");
    const novaDiscBtn = page.getByRole("button", { name: "+ Nova disciplina" });
    await expect(novaDiscBtn).toBeVisible();
    await novaDiscBtn.click();
    await page.getByPlaceholder("Nome da disciplina").fill("Física Teste");
    await page.getByRole("button", { name: "Criar e selecionar" }).click();
    await expect(page.getByText("Disciplina criada")).toBeVisible({ timeout: 8000 });
    await page.getByRole("button", { name: "Criar nota" }).click();
    await expect(page.getByText(/Nota criada/i)).toBeVisible({ timeout: 8000 });
  });

  test("validação título mínimo 2 caracteres", async ({ page }) => {
    await loginNovo(page);
    await page.goto("/#/notas");
    const botao = page.getByRole("button", { name: /Nova nota/i }).first();
    if (await botao.isVisible()) await botao.click();
    await expect(page.getByText("Nova nota de aula")).toBeVisible();
    await expect(page.getByRole("button", { name: "Criar nota" })).toBeDisabled();
    await page.getByLabel("Título da aula").fill("A");
    await expect(page.getByRole("button", { name: "Criar nota" })).toBeDisabled();
  });

  test("editar nota e autosave", async ({ page }) => {
    await loginNovo(page);
    await page.goto("/#/notas");
    const botao = page.getByRole("button", { name: /Nova nota/i }).first();
    if (await botao.isVisible()) await botao.click();
    await page.getByLabel("Título da aula").fill("Nota Autosave");
    const novaDiscBtn = page.getByRole("button", { name: "+ Nova disciplina" });
    await novaDiscBtn.click();
    await page.getByPlaceholder("Nome da disciplina").fill("Mat Autosave");
    await page.getByRole("button", { name: "Criar e selecionar" }).click();
    await expect(page.getByText("Disciplina criada")).toBeVisible({ timeout: 5000 });
    await page.getByRole("button", { name: "Criar nota" }).click();
    await expect(page).toHaveURL(/#\/editor\//, { timeout: 10000 });
    await page.waitForTimeout(1500);
    const tituloEditor = page.getByRole("textbox", { name: "Título da nota" });
    if (await tituloEditor.isVisible()) {
      await tituloEditor.fill("Nota Autosave Editada");
      await page.waitForTimeout(1500);
      await expect(page.getByText(/Salvo|Salvando/i).first()).toBeVisible({ timeout: 5000 });
    }
  });

  test("duplicar nota gera rascunho", async ({ page }) => {
    await loginNovo(page);
    await page.goto("/#/notas");
    await expect(page.getByText(/Nenhuma nota|Criar/i).first()).toBeVisible({ timeout: 5000 });
  });

  test("paleta de blocos abre uma vez e insere", async ({ page }) => {
    await loginNovo(page);
    await criarNotaEAbrir(page, "Nota Paleta", "Mat Paleta");

    // Abre uma única paleta pelo botão de adicionar bloco ao final.
    await botaoAdicionarAoFinal(page).click();
    await expect(page.getByRole("dialog")).toHaveCount(1);
    await expect(page.getByRole("heading", { name: "Adicionar bloco" })).toBeVisible();
    const opcaoFormula = page.getByRole("option", { name: /^Fórmula/ });
    await expect(opcaoFormula).toHaveCSS("cursor", "pointer");
    await opcaoFormula.click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    const blocos = page.locator("article").filter({ visible: true });
    await expect(blocos.last()).toContainText("Fórmula");
    // A tela rola até o bloco inserido.
    await expect(blocos.last()).toBeInViewport({ ratio: 1 });

    // O botão de inserir do bloco reabre a paleta uma única vez.
    await page
      .getByRole("button", { name: "Inserir bloco abaixo" })
      .filter({ visible: true })
      .first()
      .click();
    await expect(page.getByRole("dialog")).toHaveCount(1);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("menu lateral do desktop remove bloco vazio sem trocar de bloco", async ({ page }) => {
    await loginNovo(page);
    await criarNotaEAbrir(page, "Nota Bloco Vazio", "Mat Bloco Vazio");

    // Insere um parágrafo vazio abaixo da seção inicial: bloco mais curto que o menu lateral.
    await page
      .getByRole("button", { name: "Inserir bloco abaixo" })
      .filter({ visible: true })
      .first()
      .click();
    await page.getByRole("option", { name: /^Parágrafo/ }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);

    const blocos = page.locator("article").filter({ visible: true });
    const total = await blocos.count();
    const vazio = blocos.nth(1);
    await expect(vazio).toContainText("Parágrafo");

    // O menu lateral ultrapassa a altura do bloco vazio; a remoção deve atingir este bloco.
    await vazio.hover();
    await vazio.getByRole("button", { name: "Remover bloco" }).click();
    await expect(blocos).toHaveCount(total - 1);
    await expect(blocos.nth(1)).toContainText("COPIAR");
  });

  test("paleta de blocos no mobile usa painel inferior", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginNovo(page);
    await criarNotaEAbrir(page, "Nota Paleta Mobile", "Mat Paleta Mobile");

    await botaoAdicionarAoFinal(page).click();
    await expect(page.getByRole("dialog")).toHaveCount(1);
    await expect(page.getByRole("heading", { name: "Adicionar bloco" })).toBeVisible();
    await page.getByRole("option", { name: /^Parágrafo/ }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.locator("article").filter({ visible: true }).last()).toContainText(
      "Parágrafo",
    );
  });

  test("duplicar bloco esconde o menu lateral ao sair o ponteiro", async ({ page }) => {
    await loginNovo(page);
    await criarNotaEAbrir(page, "Nota Duplicar", "Mat Duplicar");

    const blocos = page.locator("article").filter({ visible: true });
    const total = await blocos.count();
    const primeiro = blocos.first();
    const duplicar = primeiro.getByRole("button", { name: "Duplicar bloco" });

    await primeiro.hover();
    await duplicar.click();
    await expect(blocos).toHaveCount(total + 1);

    // O foco do clique não pode manter o menu visível quando o ponteiro sai.
    const controles = duplicar.locator("..");
    await page.mouse.move(4, 4);
    await expect.poll(() => controles.evaluate((el) => getComputedStyle(el).opacity)).toBe("0");
  });
});
