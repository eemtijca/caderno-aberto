// Senhas com scrypt. O hash embute parâmetros, sal e chave.
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "crypto"
import { promisify } from "util"

const scryptAsync = promisify(scryptCb) as unknown as (
  senha: string,
  sal: Buffer,
  tamanho: number,
  opcoes?: Record<string, number>,
) => Promise<Buffer>

// Parâmetros atuais: N=131072, r=8, p=1 (mínimo do OWASP).
// Hashes antigos (N=16384) continuam válidos e sobem no login.
const N_ATUAL = 131072
const R_ATUAL = 8
const P_ATUAL = 1
const MEMORIA_MAXIMA = 256 * 1024 * 1024

// Formato: scrypt$N$r$p$salHex$chaveHex
export async function hashSenha(senha: string): Promise<string> {
  const sal = randomBytes(16)
  const chave = (await scryptAsync(senha, sal, 64, {
    N: N_ATUAL,
    r: R_ATUAL,
    p: P_ATUAL,
    maxmem: MEMORIA_MAXIMA,
  })) as Buffer
  return `scrypt$${N_ATUAL}$${R_ATUAL}$${P_ATUAL}$${sal.toString("hex")}$${chave.toString("hex")}`
}

export async function confereSenha(senha: string, hash: string): Promise<boolean> {
  const partes = hash.split("$")
  if (partes.length !== 6 || partes[0] !== "scrypt") return false
  const [, nStr, rStr, pStr, salHex, chaveHex] = partes
  try {
    const chaveEsperada = Buffer.from(chaveHex, "hex")
    const chave = await scryptAsync(senha, Buffer.from(salHex, "hex"), chaveEsperada.length, {
      N: Number(nStr),
      r: Number(rStr),
      p: Number(pStr),
      maxmem: MEMORIA_MAXIMA,
    })
    return chave.length === chaveEsperada.length && timingSafeEqual(chave, chaveEsperada)
  } catch {
    return false
  }
}

/** Indica hash com parâmetros antigos, para subir no login. */
export function hashDesatualizado(hash: string): boolean {
  const partes = hash.split("$")
  return partes.length !== 6 || partes[0] !== "scrypt" || partes[1] !== String(N_ATUAL)
}

/** Mínimo de 8 caracteres. */
export function senhaValida(senha: string): boolean {
  return senha.length >= 8 && senha.length <= 256
}
