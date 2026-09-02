import { randomBytes } from "crypto"

// Alfabeto sem caracteres ambíguos (l, I, 1, 0, O) . Links
// digitados à mão em sala de aula não podem dar margem a erro.
const ALFABETO = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"

/** Gera um token curto e ilegível de adivinhar p/ links de alunos. */
export function gerarToken(tamanho = 22): string {
  const base = ALFABETO.length
  const limite = Math.floor(256 / base) * base
  let saida = ""

  while (saida.length < tamanho) {
    const bytes = randomBytes(tamanho - saida.length)
    for (let i = 0; i < bytes.length && saida.length < tamanho; i++) {
      const byte = bytes[i]
      if (byte === undefined || byte >= limite) continue
      saida += ALFABETO[byte % base] ?? ""
    }
  }

  return saida
}
