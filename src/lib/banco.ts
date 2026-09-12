// Cliente Prisma compartilhado. Uma ligação por processo.
import { PrismaClient } from "../../generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { DATABASE_URL } from "./ambiente"

const globalComBanco = globalThis as unknown as {
  prisma?: PrismaClient
}

function criarCliente(): PrismaClient {
  const adaptador = new PrismaPg({ connectionString: DATABASE_URL })
  return new PrismaClient({ adapter: adaptador })
}

/** Cliente pronto. Reaproveita a ligação por processo. */
export function banco(): PrismaClient {
  globalComBanco.prisma ??= criarCliente()
  return globalComBanco.prisma
}

export type Banco = PrismaClient
