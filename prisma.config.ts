// Configuração do Prisma (CLI e migrações).
import "dotenv/config"
import { defineConfig } from "prisma/config"

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // CLI usa DIRECT_URL (pooler de sessão :5432) com fallback em DATABASE_URL.
    // Runtime usa DATABASE_URL, ver src/lib/banco.ts.
    // process.env permite o fallback. env() lançaria exceção se faltar.
    url:
      process.env.DIRECT_URL ??
      process.env.DATABASE_URL ??
      "postgresql://generate:generate@localhost:5432/generate",
  },
})
