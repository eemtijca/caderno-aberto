import { test, expect } from "@playwright/test"

test.describe("Pública", () => {
  test("token inválido mostra mensagem formal", async ({ page }) => {
    await page.goto("/")
    await page.evaluate(() => {
      window.location.hash = "#/l/abcdef12345678901234"
    })
    await page.waitForTimeout(2500)
    await expect(page.locator("body")).not.toBeEmpty()
    await expect(page.getByText("—")).toHaveCount(0)
  })

  test("busca e impressão sem travessão", async ({ page }) => {
    await page.goto("/")
    await page.evaluate(() => {
      window.location.hash = "#/l/invalido"
    })
    await page.waitForTimeout(1500)
    await expect(page.getByText("—")).toHaveCount(0)
  })
})
