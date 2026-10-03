// Capturas do README: gera as imagens de docs/imagens com massa sintética e sem dados reais.
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { criarContaEentrar } from "./helpers/auth";

const pastaImagens = path.resolve(process.cwd(), "docs/imagens");

async function criarNotaDeExemplo(page: Page) {
  await page.goto("/#/notas");
  const botaoNova = page.getByRole("button", { name: /Nova nota/i }).first();
  if (await botaoNova.isVisible()) await botaoNova.click();
  await page.getByLabel("Título da aula").fill("Equilíbrio químico no cotidiano");
  await page.getByRole("button", { name: "+ Nova disciplina" }).click();
  await page.getByPlaceholder("Nome da disciplina").fill("Química");
  await page.getByRole("button", { name: "Criar e selecionar" }).click();
  await expect(page.getByText("Disciplina criada")).toBeVisible({ timeout: 8000 });
  await page.getByRole("button", { name: "Criar nota" }).click();
  await expect(page).toHaveURL(/#\/editor\//, { timeout: 10000 });
  await expect(page.getByRole("textbox", { name: "Título da nota" })).toBeVisible({
    timeout: 10000,
  });
  await page
    .getByText("Nota criada")
    .waitFor({ state: "hidden", timeout: 8000 })
    .catch(() => {});
}

test.describe("Capturas do README", () => {
  test("editor de blocos no desktop, claro e escuro", async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "Capturas apenas no Chromium.");
    await mkdir(pastaImagens, { recursive: true });
    await page.setViewportSize({ width: 1440, height: 900 });
    const email = `captura_${Date.now()}@exemplo.br`;
    await criarContaEentrar(page, { nome: "Professora de Química", email, senha: "senha123" });
    await criarNotaDeExemplo(page);
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

  test("vista do aluno no celular, claro e escuro", async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "Capturas apenas no Chromium.");
    await mkdir(pastaImagens, { recursive: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/l/demo-landing");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Movimento Uniforme");
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
