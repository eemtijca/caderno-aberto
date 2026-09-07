// Cliente Prisma compartilhado. Uma ligação por processo.
import { db as cliente } from "@/prisma/db"

const globalComBanco = globalThis as unknown as {
  conectado?: Promise<unknown>
}

async function garantirLigacao(): Promise<void> {
  if (!globalComBanco.conectado) {
    globalComBanco.conectado = cliente.connect({ url: process.env.DATABASE_URL! })
  }
  await globalComBanco.conectado
}

// As rotas obtêm o cliente pronto via banco().
/** Cliente pronto. Conecta uma vez por processo. */
export async function banco() {
  await garantirLigacao()
  return cliente
}

export type Banco = typeof cliente
