// Fluxos de autenticação: login como porta de entrada, código e solicitações.
import { test, expect } from "@playwright/test";
import { criarContaEentrar, criarProfessorUnico } from "./helpers/auth";
import {
  criarUsuarioAtivo,
  criarUsuarioInativo,
  emitirCodigo,
  removerUsuarios,
} from "./helpers/db";

test.describe("Autenticação", () => {
  test("a raiz anônima é a tela de login, sem landing", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(/abertas para os alunos/i)).toHaveCount(0);
  });

  test("menu de ajuda reúne os acessos alternativos", async ({ page }) => {
    await page.goto("/#/entrar");
    const ajuda = page.getByRole("button", { name: "Outras formas de acesso" });
    await expect(ajuda).toBeVisible({ timeout: 8000 });
    await ajuda.click();
    await expect(page.getByRole("menuitem", { name: "Tenho um código" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Esqueci minha senha" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Solicitar acesso" })).toBeVisible();

    await page.getByRole("menuitem", { name: "Tenho um código" }).click();
    await expect(page).toHaveURL(/#\/codigo/, { timeout: 8000 });
  });

  test("login válido entra no app", async ({ page }) => {
    const { email, nome } = criarProfessorUnico();
    await criarContaEentrar(page, { nome, email, senha: "senha123" });
    await expect(page.getByText("Caderno Aberto").first()).toBeVisible();
  });

  test("login inválido mostra erro genérico", async ({ page }) => {
    await page.goto("/#/entrar");
    await page.getByLabel("E-mail").fill("ninguem@exemplo.br");
    await page.getByLabel("Senha", { exact: true }).fill("senhaErrada123");
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByText(/E-mail ou senha incorretos/i)).toBeVisible({ timeout: 8000 });
  });

  test("solicitar acesso confirma o pedido", async ({ page }) => {
    await page.goto("/#/solicitar");
    await page.getByLabel("Seu nome").fill("Prof Solicitante");
    await page.getByLabel("E-mail").fill(`solic_${Date.now()}@exemplo.br`);
    await page.getByRole("button", { name: "Enviar solicitação" }).click();
    await expect(page.getByText(/Solicitação enviada/i)).toBeVisible({ timeout: 8000 });
  });

  test("esqueci a senha responde de forma genérica", async ({ page }) => {
    await page.goto("/#/solicitar?recuperacao=1");
    await page.getByLabel("E-mail").fill("naoexiste_12345@exemplo.br");
    await page.getByRole("button", { name: "Enviar solicitação" }).click();
    await expect(page.getByText(/administração será avisada|Se existir conta/i)).toBeVisible({
      timeout: 8000,
    });
  });

  test("tenho um código ativa a conta e entra", async ({ page }) => {
    const email = `codigo_e2e_${Date.now()}@exemplo.br`;
    await criarUsuarioInativo(email, "Prof Código");
    await emitirCodigo(email, "ABCD2345", "primeiro_acesso");

    await page.goto("/#/codigo");
    await page.getByLabel("E-mail").fill(email);
    await page.locator('input[autocomplete="one-time-code"]').fill("ABCD2345");
    await page.getByLabel("Nova senha").fill("senha123");
    await page.getByLabel("Confirmar senha").fill("senha123");
    await page.getByRole("button", { name: "Definir senha" }).click();
    await expect(page.getByText("Caderno Aberto").first()).toBeVisible({ timeout: 15000 });
    await removerUsuarios([email]);
  });

  test("autenticado não vê telas de auth", async ({ page }) => {
    const { email, nome } = criarProfessorUnico();
    await criarContaEentrar(page, { nome, email, senha: "senha123" });
    await page.goto("/#/entrar");
    await expect(page).not.toHaveURL(/#\/entrar/, { timeout: 8000 });
  });

  test("manter conectado controla a persistência do cookie", async ({ page, context }) => {
    const email = `pers_${Date.now()}@exemplo.br`;
    await criarUsuarioAtivo(email, "Prof Persistente", "senha123");
    const caixa = page.getByRole("checkbox", { name: "Manter conectado neste dispositivo" });

    // Desmarcado: cookie de sessão (expires -1).
    await page.goto("/#/entrar");
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Senha", { exact: true }).fill("senha123");
    await caixa.uncheck();
    await page.getByRole("button", { name: "Entrar" }).click();
    await page.waitForURL((url) => !url.hash.startsWith("#/entrar"), { timeout: 15000 });
    const sessao = (await context.cookies()).find((c) => c.name === "sessao_refresh");
    expect(sessao?.expires, "cookie de sessão").toBe(-1);

    // Marcado: cookie persistente.
    await page.getByRole("button", { name: "Sair da conta" }).first().click();
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Senha", { exact: true }).fill("senha123");
    await caixa.check();
    await page.getByRole("button", { name: "Entrar" }).click();
    await page.waitForURL((url) => !url.hash.startsWith("#/entrar"), { timeout: 15000 });
    const persistente = (await context.cookies()).find((c) => c.name === "sessao_refresh");
    expect(persistente?.expires ?? -1, "cookie persistente").toBeGreaterThan(0);

    await removerUsuarios([email]);
  });
});
