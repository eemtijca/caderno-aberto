// Limite de tentativas por IP com tetos configuráveis.
const TETO_TENTATIVAS = Number(process.env.AUTH_LIMITE_TENTATIVAS ?? 30)
const TETO_EMAIL = Number(process.env.AUTH_LIMITE_EMAIL ?? 10)
const JANELA_MS = 5 * 60 * 1000

export const LIMITE_TENTATIVAS = Number.isFinite(TETO_TENTATIVAS) ? TETO_TENTATIVAS : 30
export const LIMITE_EMAIL = Number.isFinite(TETO_EMAIL) ? TETO_EMAIL : 10
interface Janela {
  tentativas: number[]
}

const janelas = new Map<string, Janela>()

function limparAntigas(lista: number[], agora: number, janelaMs: number): number[] {
  return lista.filter((t) => agora - t < janelaMs)
}

/** Registra tentativa e indica disponibilidade na janela. */
export function cabeNoLimite(
  chave: string,
  maximo = LIMITE_TENTATIVAS,
  janelaMs = JANELA_MS,
): { permitido: boolean; esperaSegundos: number } {
  const agora = Date.now()
  const atual = janelas.get(chave) ?? { tentativas: [] }
  atual.tentativas = limparAntigas(atual.tentativas, agora, janelaMs)
  if (atual.tentativas.length >= maximo) {
    const espera = Math.ceil((atual.tentativas[0] + janelaMs - agora) / 1000)
    return { permitido: false, esperaSegundos: Math.max(1, espera) }
  }
  atual.tentativas.push(agora)
  janelas.set(chave, atual)
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
