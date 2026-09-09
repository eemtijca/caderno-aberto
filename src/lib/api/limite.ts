// Limite de tentativas por IP com tetos configuráveis.
// Guarda a janela no banco para valer entre instâncias e reinícios.
import { LIMITE_TENTATIVAS_LOGIN, LIMITE_ENVIOS_EMAIL } from "@/lib/ambiente"
import { banco } from "@/lib/banco"

const JANELA_MS = 5 * 60 * 1000

export const LIMITE_TENTATIVAS = LIMITE_TENTATIVAS_LOGIN
export const LIMITE_EMAIL = LIMITE_ENVIOS_EMAIL

/** Registra tentativa e indica disponibilidade na janela. */
export async function cabeNoLimite(
  chave: string,
  maximo = LIMITE_TENTATIVAS,
  janelaMs = JANELA_MS,
): Promise<{ permitido: boolean; esperaSegundos: number }> {
  const db = banco()
  const agora = new Date()
  const inicio = new Date(agora.getTime() - janelaMs)
  try {
    await db.tentativasLimite.deleteMany({ where: { feitaEm: { lt: inicio } } })
  } catch {
    // Limpeza oportunista: nunca bloqueia o pedido.
  }
  let usadas = 0
  try {
    usadas = await db.tentativasLimite.count({
      where: { chave, feitaEm: { gte: inicio } },
    })
  } catch {
    // Banco inacessível: permite para não travar o login.
    return { permitido: true, esperaSegundos: 0 }
  }
  if (usadas >= maximo) {
    const antiga = await db.tentativasLimite
      .findFirst({ where: { chave, feitaEm: { gte: inicio } }, orderBy: { feitaEm: "asc" } })
      .catch(() => null)
    const espera = antiga
      ? Math.max(1, Math.ceil((antiga.feitaEm.getTime() + janelaMs - agora.getTime()) / 1000))
      : Math.ceil(janelaMs / 1000)
    return { permitido: false, esperaSegundos: espera }
  }
  try {
    await db.tentativasLimite.create({ data: { chave } })
  } catch {
    // Concorrência na chave: ignora, a contagem já valeu.
  }
  return { permitido: true, esperaSegundos: 0 }
}

/** Chave por IP (atrás de proxy, usa x-forwarded-for). */
export function chavePorIp(req: Request, rota: string): string {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "desconhecido"
  return `${rota}:${ip}`
}
