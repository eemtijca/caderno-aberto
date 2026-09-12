// Vitest: aliases e ambiente dos testes.
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Variáveis mínimas para importar módulos que validam o ambiente.
    env: {
      DATABASE_URL:
        process.env.DATABASE_URL || "postgresql://caderno:caderno@localhost:5432/caderno",
      AUTH_SECRET: process.env.AUTH_SECRET || "segredo-de-teste-com-32-bytes-ok-000",
    },
    // Testes de API tocam banco e rede; teto alto evita falso negativo.
    testTimeout: 120_000,
    hookTimeout: 60_000,
  },
});
