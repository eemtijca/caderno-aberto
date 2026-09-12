// Configuração do Playwright: 3 navegadores, execução serial e servidor local.
import { defineConfig, devices } from "@playwright/test";

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
// Playwright com 3 browsers, headless, baseURL dinâmica e servidor local.
export default defineConfig({
  testDir: "./e2e",
  // Serial: o servidor de desenvolvimento não aguenta navegadores em paralelo.
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1,
  reporter: [["html"], ["list"]],
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL: process.env.TEST_BASE_URL || "http://127.0.0.1:3000",
    trace: "on-first-retry",
    headless: true,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },

    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },

    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  // Em CI o app já sobe pelo Compose; a variável evita um segundo servidor.
  webServer:
    process.env.PLAYWRIGHT_SKIP_WEBSERVER === "1"
      ? undefined
      : {
          command: "npm run dev",
          url: "http://127.0.0.1:3000",
          reuseExistingServer: !process.env.CI,
          timeout: 120 * 1000,
          // Ambiente completo para quando o próprio Playwright sobe o app.
          env: {
            DATABASE_URL:
              process.env.DATABASE_URL || "postgresql://caderno:caderno@localhost:5432/caderno",
            AUTH_SECRET: process.env.AUTH_SECRET || "segredo-dummy-de-32-bytes-para-testes-00",
            CRON_SECRET: process.env.CRON_SECRET || "segredo-cron-dummy-de-32-bytes-para-ci00",
            AUTH_LIMITE_TENTATIVAS: "1000",
            AUTH_LIMITE_CODIGO: "1000",
            CODIGO_EXPIRA_MINUTOS: "60",
            UPLOAD_DIR: process.env.UPLOAD_DIR || "./.tmp/imagens-teste",
          },
        },
});
