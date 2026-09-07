import { test, expect } from "@playwright/test"

test.describe("Pública", () => {
  test("token inválido mostra mensagem formal", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByText("Caderno Aberto").first()).toBeVisible({ timeout: 15000 })
    await page.evaluate(() => {
      window.location.hash = "#/l/abcdef12345678901234"
    })
    await expect(page.getByText("Link indisponível")).toBeVisible({ timeout: 10000 })
    await expect(page.getByText("—")).toHaveCount(0)
  })

  test("busca e impressão sem travessão", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByText("Caderno Aberto").first()).toBeVisible({ timeout: 15000 })
    await page.evaluate(() => {
      window.location.hash = "#/l/invalido"
    })
    await expect(page.getByText("Link indisponível")).toBeVisible({ timeout: 10000 })
    await expect(page.getByText("—")).toHaveCount(0)
  })
})
