// Configuração do Prisma (CLI e migrações).
import "dotenv/config"
import { defineConfig } from "prisma/config"

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // generate é offline e nunca conecta; sem URL usa fictícia.
    // migrate e app exigem a real (ambiente.ts valida no boot).
    url: process.env.DATABASE_URL ?? "postgresql://generate:generate@localhost:5432/generate",
  },
})
