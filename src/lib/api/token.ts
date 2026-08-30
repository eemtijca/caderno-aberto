import { randomBytes } from "crypto"

// Alfabeto sem caracteres ambíguos (l, I, 1, 0, O) . Links
// digitados à mão em sala de aula não podem dar margem a erro.
const ALFABETO = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"

/** Gera um token curto e ilegível de adivinhar p/ links de alunos. */
export function gerarToken(tamanho = 22): string {
  const bytes = randomBytes(tamanho)
  let saida = ""
  for (let i = 0; i < tamanho; i++) {
    saida += ALFABETO[bytes[i] % ALFABETO.length]
  }
  return saida
}
