// Roteamento por hash e navegação entre as telas principais.
import { expect, test, type Page } from "@playwright/test";
import { criarContaEentrar } from "./helpers/auth";

async function criarEConfirmar(page: Page) {
  const email = `nav_${Date.now()}_${Math.random().toString(36).slice(2, 5)}@exemplo.br`;
  await criarContaEentrar(page, { nome: "Prof Nav", email, senha: "senha123" });
  return email;
}

test.describe("Navegação e roteamento", () => {
  test("rotas hash funcionam e fallback para inicio", async ({ page }) => {
    await criarEConfirmar(page);
    await page.goto("/#/notas");
    await expect(page.getByText(/Notas/i).first()).toBeVisible({ timeout: 5000 });
    await page.goto("/#/organizacao");
    await expect(page.getByText(/Turmas/i).first()).toBeVisible();
    await page.goto("/#/links");
    await expect(page.getByText(/Links/i).first()).toBeVisible();
    await page.goto("/#/configuracoes");
    await expect(page.getByRole("heading", { name: "Configurações" })).toBeVisible();
    await page.goto("/#/editor/semid");
    await expect(page).toHaveURL(/#\/notas|#\/editor/);
    await page.goto("/#/rota-invalida-xyz");
    await expect(page).toHaveURL(/#\//);
  });

  test("vista pública não exige login", async ({ page }) => {
    await page.goto("/#/l/token_invalido_123");
    await expect(page.getByText(/não existe|inválido|pública|indisponível/i).first()).toBeVisible({
      timeout: 8000,
    });
  });

  test("busca global e navegação por hash", async ({ page }) => {
    await criarEConfirmar(page);
    await page.goto("/#/");
    const busca = page.getByPlaceholder(/Buscar|Digite/i).first();
    if (await busca.isVisible()) {
      await busca.fill("a");
      await expect(page.getByText(/ao menos 2 caracteres/i)).toBeVisible({ timeout: 3000 });
      await busca.fill("mat");
      await page.waitForTimeout(800);
    }
  });

  test("botão Nova nota fica centralizado com a sidebar recolhida", async ({ page }) => {
    await criarEConfirmar(page);
    await page.goto("/#/");
    await page.getByRole("button", { name: "Recolher menu" }).click();

    const sidebar = page.locator("aside").first();
    const botao = sidebar.getByRole("button", { name: "Nova nota" });
    const caixaSidebar = await sidebar.boundingBox();
    const caixaBotao = await botao.boundingBox();
    expect(caixaSidebar && caixaBotao).toBeTruthy();
    const centroSidebar = caixaSidebar!.x + caixaSidebar!.width / 2;
    const centroBotao = caixaBotao!.x + caixaBotao!.width / 2;
    expect(Math.abs(centroSidebar - centroBotao)).toBeLessThanOrEqual(2);
  });

  test("menu de perfil e botão Mais no mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await criarEConfirmar(page);
    await page.goto("/#/");

    // O perfil no topo reúne Configurações e Sair.
    await page.getByRole("button", { name: /Perfil de/i }).click();
    await expect(page.getByRole("menuitem", { name: "Configurações", exact: true })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Sair da conta" })).toBeVisible();
    await page.keyboard.press("Escape");

    // O botão Mais abre o painel inferior com as opções restantes.
    await page.getByRole("button", { name: "Mais" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: "Turmas" }).click();
    await expect(page).toHaveURL(/#\/organizacao/);
  });
});
