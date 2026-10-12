// Capturas do README: gera as imagens de docs/imagens a partir da semente de desenvolvimento.
// Pré-requisito: banco migrado e `pnpm run seed` aplicado (a massa vem de scripts/seed.mjs).
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

const pastaImagens = path.resolve(process.cwd(), "docs/imagens");

// Valores definidos em scripts/seed.mjs e scripts/seed-dados.mjs.
const PROFESSOR_SEMENTE = { email: "helena.duarte@exemplo.br", senha: "semente123" };
const NOTA_DESTAQUE = "Leis de Newton";
const TOKEN_ALUNO = "semente-nota-leis-de-newton";
const NOME_LINK_TURMA = "Turma 1A";

const ORIENTACAO_SEMENTE =
  "Massa da semente ausente. Rode pnpm run seed com o banco migrado e o aplicativo no ar.";

/** Entra com a professora da semente via API e falha com orientação clara se a massa faltar. */
async function entrarSemente(page: Page) {
  // O login pela interface depende da hidratação do formulário; a captura só
  // precisa da sessão, então a API evita a corrida do clique antes do React.
  const resposta = await page.request.post("/api/auth/entrar", {
    data: { email: PROFESSOR_SEMENTE.email, senha: PROFESSOR_SEMENTE.senha },
  });
  if (!resposta.ok()) {
    throw new Error(`${ORIENTACAO_SEMENTE} O login respondeu ${resposta.status()}.`);
  }
  await page.goto("/");
  await expect(page.getByLabel("E-mail")).toHaveCount(0);
}

/** Descobre o id de uma nota semeada pelo título. */
async function idDaNotaSemeada(page: Page, titulo: string): Promise<string> {
  const resposta = await page.request.get("/api/notas");
  const corpo = resposta.ok() ? await resposta.json() : null;
  const nota = (corpo?.notas ?? []).find((item: { titulo?: string }) => item.titulo === titulo);
  if (!nota?.id) {
    throw new Error(`${ORIENTACAO_SEMENTE} Nota esperada: ${titulo}.`);
  }
  return nota.id as string;
}

test.describe("Capturas do README", () => {
  test.beforeEach(({ browserName }) => {
    test.skip(browserName !== "chromium", "Capturas apenas no Chromium.");
  });

  test("lista de Notas no desktop", async ({ page }) => {
    await mkdir(pastaImagens, { recursive: true });
    await page.setViewportSize({ width: 1440, height: 900 });
    await entrarSemente(page);
    await page.goto("/#/notas");
    await expect(page.getByRole("heading", { name: "Notas", exact: true })).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator("article").first()).toBeVisible({ timeout: 10000 });
    await page.evaluate(() => document.fonts.ready);
    await page.emulateMedia({ colorScheme: "light" });
    await page.screenshot({
      path: path.join(pastaImagens, "notas-desktop-claro.png"),
      animations: "disabled",
    });
  });

  test("lista de Links no desktop", async ({ page }) => {
    await mkdir(pastaImagens, { recursive: true });
    await page.setViewportSize({ width: 1440, height: 900 });
    await entrarSemente(page);
    await page.goto("/#/links");
    await expect(page.getByRole("heading", { name: "Links para os alunos" })).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText(NOME_LINK_TURMA).first()).toBeVisible({ timeout: 10000 });
    await page.evaluate(() => document.fonts.ready);
    await page.emulateMedia({ colorScheme: "light" });
    await page.screenshot({
      path: path.join(pastaImagens, "links-desktop-claro.png"),
      animations: "disabled",
    });
  });

  test("editor de blocos no desktop, claro e escuro", async ({ page }) => {
    await mkdir(pastaImagens, { recursive: true });
    await page.setViewportSize({ width: 1440, height: 900 });
    await entrarSemente(page);
    const id = await idDaNotaSemeada(page, NOTA_DESTAQUE);
    await page.goto(`/#/editor/${id}`);
    await expect(page.getByLabel("Título da nota")).toHaveValue(NOTA_DESTAQUE, {
      timeout: 15000,
    });
    await expect(page.locator("[data-bloco-id]").first()).toBeVisible({ timeout: 15000 });
    await page.evaluate(() => document.fonts.ready);
    await page.emulateMedia({ colorScheme: "light" });
    await page.screenshot({
      path: path.join(pastaImagens, "editor-desktop-claro.png"),
      animations: "disabled",
    });
    await page.emulateMedia({ colorScheme: "dark" });
    await expect(page.locator("html")).toHaveClass(/dark/, { timeout: 5000 });
    await page.screenshot({
      path: path.join(pastaImagens, "editor-desktop-escuro.png"),
      animations: "disabled",
    });
  });

  test("vista do aluno no celular, claro e escuro", async ({ page }) => {
    await mkdir(pastaImagens, { recursive: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/l/${TOKEN_ALUNO}`);
    const titulo = page.getByRole("heading", { level: 1 });
    await expect(titulo).toContainText(NOTA_DESTAQUE, { timeout: 15000 });
    await page.waitForTimeout(1000);
    await page.emulateMedia({ colorScheme: "light" });
    await page.screenshot({
      path: path.join(pastaImagens, "aluno-mobile-claro.png"),
      animations: "disabled",
    });
    await page.emulateMedia({ colorScheme: "dark" });
    await expect(page.locator("html")).toHaveClass(/dark/, { timeout: 5000 });
    await page.screenshot({
      path: path.join(pastaImagens, "aluno-mobile-escuro.png"),
      animations: "disabled",
    });
  });
});
