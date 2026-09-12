// Vitest: aliases e ambiente dos testes.
import path from "node:path"
import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Testes de API tocam banco e rede; teto alto evita falso negativo.
    testTimeout: 120_000,
    hookTimeout: 60_000,
  },
})
