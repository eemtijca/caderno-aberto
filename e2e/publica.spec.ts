// Vista pública por token e mensagem de link indisponível.
import { test, expect, type Page } from "@playwright/test";
import { criarContaEentrar } from "./helpers/auth";

/** Cria professor, turma, disciplina, notas publicadas e link de turma. */
async function prepararTurmaPublicada(page: Page, quantidade = 1) {
  const email = `publica_${Date.now()}_${Math.random().toString(36).slice(2, 4)}@exemplo.br`;
  await criarContaEentrar(page, { nome: "Prof Pública", email, senha: "senha123" });

  const turmaResp = await page.request.post("/api/turmas", {
    data: { nome: "3A", serie: "3", anoLetivo: 2026 },
  });
  expect(turmaResp.ok()).toBeTruthy();
  const { turma } = await turmaResp.json();

  const disciplinaResp = await page.request.post("/api/disciplinas", {
    data: { nome: "Física Pública", cor: "verde", icone: "BookOpen" },
  });
  expect(disciplinaResp.ok()).toBeTruthy();
  const { disciplina } = await disciplinaResp.json();

  const titulos =
    quantidade === 1
      ? ["Aula de Ondas"]
      : Array.from({ length: quantidade }, (_, i) => `Aula ${i + 1}`);

  for (const titulo of titulos) {
    const notaResp = await page.request.post("/api/notas", {
      data: {
        titulo,
        disciplinaId: disciplina.id,
        anoLetivo: 2026,
        mes: 3,
        turmasIds: [turma.id],
        comModelo: false,
        sobre: `Resumo da ${titulo}.`,
        status: "publicada",
        blocos: [
          { id: `s-${titulo}`, tipo: "secao", titulo },
          {
            id: `e-${titulo}`,
            tipo: "exercicios",
            rotulo: "Exercícios",
            niveis: [
              {
                numero: 1,
                titulo: "Conceitos",
                questoes: [
                  {
                    id: `q-${titulo}`,
                    enunciado: "Qual?",
                    alternativas: ["Certa", "Errada"],
                    correta: 0,
                  },
                ],
              },
              { numero: 2, titulo: "Aplicação", questoes: [] },
              { numero: 3, titulo: "Síntese", questoes: [] },
            ],
            gabarito: "",
          },
        ],
      },
    });
    expect(notaResp.ok()).toBeTruthy();
  }

  const linkResp = await page.request.post("/api/links", {
    data: { tipo: "turma", turmaId: turma.id, nome: "Turma 3A" },
  });
  expect(linkResp.ok()).toBeTruthy();
  const { link } = await linkResp.json();
  return { token: link.token as string, titulo: titulos[0] };
}

test.describe("Pública", () => {
  test("token inválido mostra mensagem formal", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Caderno Aberto").first()).toBeVisible({ timeout: 15000 });
    await page.evaluate(() => {
      window.location.hash = "#/l/abcdef12345678901234";
    });
    await expect(page.getByText("Link indisponível")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("—")).toHaveCount(0);
  });

  test("busca e impressão sem travessão", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Caderno Aberto").first()).toBeVisible({ timeout: 15000 });
    await page.evaluate(() => {
      window.location.hash = "#/l/invalido";
    });
    await expect(page.getByText("Link indisponível")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("—")).toHaveCount(0);
  });

  test("link de turma abre a lista e só mostra a aula escolhida", async ({ page }) => {
    const { token, titulo } = await prepararTurmaPublicada(page);

    await page.goto(`/#/l/${token}`);
    await expect(page.getByRole("heading", { name: "Turma 3A" })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("1 aula")).toBeVisible();
    // Sem nota aberta junto da lista.
    await expect(page.getByText("Sobre esta nota")).toHaveCount(0);

    await page.getByRole("button", { name: new RegExp(titulo) }).click();
    await expect(page.getByRole("heading", { name: titulo, exact: true })).toBeVisible();
    await expect(page.getByText("Sobre esta nota").first()).toBeVisible();

    // A impressão usa somente a área dedicada, com o cabeçalho da nota.
    await page.emulateMedia({ media: "print" });
    const areaImpressao = page.locator(".area-impressao");
    await expect(areaImpressao).toBeVisible();
    await expect(areaImpressao.getByRole("heading", { name: titulo, exact: true })).toBeVisible();
    await expect(areaImpressao.getByText("Sobre esta nota")).toBeVisible();

    // Nota curta cabe em uma página: primeira seção sem linha e rodapé no fim.
    const medidas = await page.evaluate(() => {
      const area = document.querySelector(".area-impressao");
      const secao = document.querySelector(".area-impressao .na-secao");
      const rodape = document.querySelector(".na-rodape-impressao");
      return {
        altura: area?.getBoundingClientRect().height ?? 0,
        borda: secao ? getComputedStyle(secao).borderTopWidth : "",
        topoRodape: rodape?.getBoundingClientRect().top ?? -1,
      };
    });
    const alturaA4 = ((297 - 20) * 96) / 25.4;
    expect(medidas.borda).toBe("0px");
    expect(medidas.altura).toBeLessThanOrEqual(alturaA4);
    expect(medidas.topoRodape).toBeGreaterThan(0);
    expect(medidas.topoRodape).toBeLessThan(alturaA4);
    await page.emulateMedia({ media: "screen" });
  });

  test("coleção pública navega entre aulas e preserva o quiz", async ({ page }) => {
    const { token } = await prepararTurmaPublicada(page, 2);

    await page.goto(`/#/l/${token}`);
    await page.getByRole("button", { name: /Aula 1/ }).click();
    await expect(page).toHaveURL(new RegExp(`#/l/${token}/aula/`));
    await expect(page.getByText("Aula 1 de 2")).toBeVisible();

    const alternativa = page.getByRole("button", { name: /\(a\)/ }).first();
    await alternativa.click();
    await expect(alternativa).toHaveAttribute("aria-pressed", "true");

    await page.getByRole("button", { name: "Próxima" }).click();
    await expect(page.getByText("Aula 2 de 2")).toBeVisible();

    await page.getByRole("button", { name: "Anterior" }).click();
    await expect(page.getByText("Aula 1 de 2")).toBeVisible();
    await expect(page.getByRole("button", { name: /\(a\)/ }).first()).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await page.getByRole("button", { name: "Voltar para a lista" }).click();
    await expect(page).toHaveURL(new RegExp(`#/l/${token}$`));
  });
});
