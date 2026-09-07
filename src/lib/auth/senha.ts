// Senhas com scrypt. O hash embute parâmetros, sal e chave.
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "crypto"
import { promisify } from "util"

const scryptAsync = promisify(scryptCb) as unknown as (
  senha: string,
  sal: Buffer,
  tamanho: number,
  opcoes?: Record<string, number>,
) => Promise<Buffer>

// Parâmetros scrypt: N=16384, r=8, p=1.
// Formato: scrypt$N$r$p$salHex$chaveHex
export async function hashSenha(senha: string): Promise<string> {
  const sal = randomBytes(16)
  // Padrões do scrypt já atendem aos parâmetros acima.
  const chave = (await scryptAsync(senha, sal, 64)) as Buffer
  return `scrypt$16384$8$1$${sal.toString("hex")}$${chave.toString("hex")}`
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
      maxmem: 64 * 1024 * 1024,
    })
    return chave.length === chaveEsperada.length && timingSafeEqual(chave, chaveEsperada)
  } catch {
    return false
  }
}

/** Mínimo de 6 caracteres. */
export function senhaValida(senha: string): boolean {
  return senha.length >= 6 && senha.length <= 256
}
