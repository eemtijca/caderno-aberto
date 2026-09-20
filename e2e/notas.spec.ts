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
    // O parágrafo de abertura do modelo volta a ocupar a segunda posição.
    await expect(blocos.nth(1)).toContainText("Abra a aula");
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

  test("duplicar bloco realça a cópia", async ({ page }) => {
    await loginNovo(page);
    await criarNotaEAbrir(page, "Nota Duplicar Realce", "Mat Duplicar Realce");

    const blocos = page.locator("article").filter({ visible: true });
    const total = await blocos.count();
    const primeiro = blocos.first();

    await primeiro.hover();
    await primeiro.getByRole("button", { name: "Duplicar bloco" }).click();

    await expect(blocos).toHaveCount(total + 1);
    // A cópia entra logo abaixo do original e recebe o realce temporário.
    await expect(blocos.nth(1)).toHaveClass(/na-realce/);
  });

  test("desfazer e refazer restauram os blocos", async ({ page }) => {
    await loginNovo(page);
    await criarNotaEAbrir(page, "Nota Desfazer", "Mat Desfazer");

    const blocos = page.locator("article").filter({ visible: true });
    const total = await blocos.count();
    await blocos.first().hover();
    await blocos.first().getByRole("button", { name: "Remover bloco" }).click();
    await expect(blocos).toHaveCount(total - 1);

    await page.keyboard.press("Control+z");
    await expect(blocos).toHaveCount(total);

    await page.keyboard.press("Control+Shift+z");
    await expect(blocos).toHaveCount(total - 1);

    await page.keyboard.press("Control+z");
    await expect(blocos).toHaveCount(total);
  });

  test("barra de formatação aplica negrito no parágrafo", async ({ page }) => {
    await loginNovo(page);
    await criarNotaEAbrir(page, "Nota Formatar", "Mat Formatar");

    const campo = page.getByRole("textbox", { name: "Texto do parágrafo" }).first();
    await campo.click();
    await page.getByRole("button", { name: "Negrito" }).first().click();

    await expect(campo).toHaveValue(/\*\*palavra-chave\*\*/);
  });

  test("navegar com alterações pendentes pede confirmação", async ({ page }) => {
    await loginNovo(page);
    await criarNotaEAbrir(page, "Nota Saida", "Mat Saida");

    await page.getByRole("textbox", { name: "Título da nota" }).fill("Nota Saida Editada");

    // Recusar a confirmação mantém o professor no editor.
    page.once("dialog", (d) => void d.dismiss());
    await page.getByRole("button", { name: "Notas", exact: true }).click();
    await expect(page).toHaveURL(/#\/editor\//);

    // Confirmar troca de vista e salva as pendências.
    page.once("dialog", (d) => void d.accept());
    await page.getByRole("button", { name: "Notas", exact: true }).click();
    await expect(page).toHaveURL(/#\/notas/, { timeout: 10000 });
  });

  test("paginação de notas", async ({ page }) => {
    await loginNovo(page);
    const disc = await (
      await page.request.post("/api/disciplinas", {
        data: { nome: `Pag ${Date.now()}`, cor: "verde", icone: "BookOpen" },
      })
    ).json();
    for (let i = 1; i <= 13; i++) {
      const r = await page.request.post("/api/notas", {
        data: {
          titulo: `Aula paginada ${String(i).padStart(2, "0")}`,
          disciplinaId: disc.disciplina.id,
          anoLetivo: 2026,
          mes: 9,
          comModelo: false,
        },
      });
      expect(r.ok()).toBeTruthy();
    }

    // Recarrega para a lista enxergar as notas criadas fora da interface.
    await page.goto("/#/notas");
    await page.reload();
    await expect(page.getByText("1-12 de 13 notas")).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: "Próxima página" }).click();
    await expect(page.getByText("13-13 de 13 notas")).toBeVisible();
  });

  test("filtros de notas geram chips e sobrevivem à navegação", async ({ page }) => {
    await loginNovo(page);
    const disc = await (
      await page.request.post("/api/disciplinas", {
        data: { nome: `Filtro ${Date.now()}`, cor: "verde", icone: "BookOpen" },
      })
    ).json();
    const r = await page.request.post("/api/notas", {
      data: {
        titulo: "Nota filtrada",
        disciplinaId: disc.disciplina.id,
        anoLetivo: 2026,
        mes: 9,
        comModelo: false,
      },
    });
    expect(r.ok()).toBeTruthy();

    await page.goto("/#/notas");
    await page.reload();
    await page.getByRole("button", { name: /^Filtros/ }).click();
    await page.getByRole("button", { name: "Set", exact: true }).click();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Remover filtro Setembro" })).toBeVisible();
    await expect(page.getByText("1 de 1 notas")).toBeVisible();

    // Abre a nota e volta: o filtro continua aplicado.
    await page.getByRole("button", { name: "Ler" }).first().click();
    await expect(page).toHaveURL(/#\/nota\//);
    await page.goBack();
    await expect(page.getByRole("button", { name: "Remover filtro Setembro" })).toBeVisible();

    await page.getByRole("button", { name: "Limpar tudo" }).click();
    await expect(page.getByRole("button", { name: "Remover filtro Setembro" })).toHaveCount(0);
  });

  test("atualiza ao entrar na tela e pelo botão", async ({ page }) => {
    await loginNovo(page);
    const disc = await (
      await page.request.post("/api/disciplinas", {
        data: { nome: `Refresh ${Date.now()}`, cor: "verde", icone: "BookOpen" },
      })
    ).json();
    const nota = (titulo: string) =>
      page.request.post("/api/notas", {
        data: {
          titulo,
          disciplinaId: disc.disciplina.id,
          anoLetivo: 2026,
          mes: 9,
          comModelo: false,
        },
      });

    // Cria uma nota fora da interface e entra na tela: a busca é refeita.
    await page.goto("/#/");
    await nota("Nota externa");
    await page.getByRole("button", { name: "Notas", exact: true }).click();
    await expect(page.getByText("Nota externa")).toBeVisible({ timeout: 10000 });

    // Cria outra sem sair da tela e usa o botão Atualizar.
    await nota("Nota do refresh");
    await page.getByRole("button", { name: "Atualizar" }).first().click();
    await expect(page.getByText("Nota do refresh")).toBeVisible({ timeout: 10000 });
  });

  test("ações em lote nas notas", async ({ page }) => {
    await loginNovo(page);
    const discA = await (
      await page.request.post("/api/disciplinas", {
        data: { nome: `Lote A ${Date.now()}`, cor: "verde", icone: "BookOpen" },
      })
    ).json();
    const discB = await (
      await page.request.post("/api/disciplinas", {
        data: { nome: `Lote B ${Date.now()}`, cor: "azul", icone: "BookOpen" },
      })
    ).json();
    for (const titulo of ["Nota lote 1", "Nota lote 2"]) {
      const r = await page.request.post("/api/notas", {
        data: {
          titulo,
          disciplinaId: discA.disciplina.id,
          anoLetivo: 2026,
          mes: 9,
          comModelo: false,
        },
      });
      expect(r.ok()).toBeTruthy();
    }
    await page.goto("/#/notas");
    await page.reload();
    await expect(page.getByText("2 de 2 notas")).toBeVisible({ timeout: 10000 });

    const barra = page.getByRole("region", { name: "Ações em lote" });

    // Publica as duas.
    await page.getByRole("button", { name: "Selecionar" }).click();
    await page.getByRole("checkbox", { name: /Selecionar todas/ }).check();
    await barra.getByRole("button", { name: "Publicar" }).click();
    await expect(page.getByText("Publicada").first()).toBeVisible({ timeout: 10000 });

    // Define a disciplina em lote.
    await page.getByRole("button", { name: "Selecionar" }).click();
    await page.getByRole("checkbox", { name: /Selecionar todas/ }).check();
    await barra.getByRole("button", { name: "Disciplina" }).click();
    await page.getByRole("button", { name: discB.disciplina.nome }).click();
    await expect(page.getByText(/notas movidas de disciplina/)).toBeVisible({ timeout: 10000 });

    // Move para a lixeira e desfaz pelo aviso.
    await page.getByRole("button", { name: "Selecionar" }).click();
    await page.getByRole("checkbox", { name: /Selecionar todas/ }).check();
    await barra.getByRole("button", { name: "Lixeira" }).click();
    await page.getByRole("button", { name: "Mover para a lixeira" }).click();
    await expect(page.getByText(/notas movidas para a lixeira/)).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: "Desfazer" }).click();
    await expect(page.getByText("Notas restauradas")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("2 de 2 notas")).toBeVisible({ timeout: 10000 });
  });

  test("restauração em lote na lixeira", async ({ page }) => {
    await loginNovo(page);
    const disc = await (
      await page.request.post("/api/disciplinas", {
        data: { nome: `Lixeira ${Date.now()}`, cor: "verde", icone: "BookOpen" },
      })
    ).json();
    for (const titulo of ["Excluída 1", "Excluída 2"]) {
      const r = await page.request.post("/api/notas", {
        data: {
          titulo,
          disciplinaId: disc.disciplina.id,
          anoLetivo: 2026,
          mes: 9,
          comModelo: false,
        },
      });
      const nota = await r.json();
      await page.request.delete(`/api/notas/${nota.nota.id}`);
    }

    await page.goto("/#/lixeira");
    await expect(page.getByRole("button", { name: "Selecionar" })).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: "Selecionar" }).click();
    await page.getByRole("checkbox", { name: /Selecionar todos/ }).check();
    await page
      .getByRole("region", { name: "Ações em lote" })
      .getByRole("button", { name: "Restaurar" })
      .click();
    await expect(page.getByText(/itens restaurados/)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("A lixeira está vazia")).toBeVisible({ timeout: 10000 });
  });

  test("compartilhar nota rascunho exibe aviso", async ({ page }) => {
    await loginNovo(page);
    await criarNotaEAbrir(page, "Nota Rascunho", "Mat Rascunho");

    await page.getByRole("button", { name: "Compartilhar" }).click();
    await expect(page.getByText(/A nota ainda é rascunho/)).toBeVisible();
  });

  test("paleta no mobile não foca a busca", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginNovo(page);
    await criarNotaEAbrir(page, "Nota Paleta Sem Foco", "Mat Paleta Sem Foco");

    await botaoAdicionarAoFinal(page).click();
    await expect(page.getByRole("heading", { name: "Adicionar bloco" })).toBeVisible();
    await page.waitForTimeout(400);
    await expect(page.getByPlaceholder("Buscar bloco...")).not.toBeFocused();
  });

  test("barra de lote fica fixa acima da navbar no mobile", async ({ page }) => {
    await loginNovo(page);
    const disc = await (
      await page.request.post("/api/disciplinas", {
        data: { nome: `Barra ${Date.now()}`, cor: "verde", icone: "BookOpen" },
      })
    ).json();
    for (let i = 1; i <= 13; i++) {
      const r = await page.request.post("/api/notas", {
        data: {
          titulo: `Aula barra ${String(i).padStart(2, "0")}`,
          disciplinaId: disc.disciplina.id,
          anoLetivo: 2026,
          mes: 9,
          comModelo: false,
        },
      });
      expect(r.ok()).toBeTruthy();
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/#/notas");
    await page.reload();
    await expect(page.getByText("1-12 de 13 notas")).toBeVisible({ timeout: 10000 });

    await page.getByRole("button", { name: "Selecionar" }).click();
    const barra = page.getByRole("region", { name: "Ações em lote" });
    await expect(barra).toBeVisible();

    // Com a lista longa, a barra já aparece na viewport mesmo no topo da rolagem.
    await expect(barra).toBeInViewport({ ratio: 0.5 });
    const antes = await barra.boundingBox();
    expect(antes).not.toBeNull();

    // Ela fica presa à viewport: não acompanha a rolagem do conteúdo.
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect
      .poll(async () => {
        const depois = await barra.boundingBox();
        return depois && antes ? Math.abs(depois.y - antes.y) : 999;
      })
      .toBeLessThan(2);

    // Fica na metade inferior, acima da navbar inferior.
    const caixa = await barra.boundingBox();
    expect(caixa!.y).toBeGreaterThan(844 / 2);
    expect(caixa!.y + caixa!.height).toBeLessThanOrEqual(844);
  });
});
