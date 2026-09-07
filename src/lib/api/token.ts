import { randomInt } from "crypto"

// Alfabeto sem caracteres ambíguos (l, I, 1, 0, O) . Links
// digitados à mão em sala de aula não podem dar margem a erro.
const ALFABETO = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"

/** Gera um token curto e ilegível de adivinhar p/ links de alunos. */
export function gerarToken(tamanho = 22): string {
  let saida = ""
  for (let i = 0; i < tamanho; i++) {
    // randomInt gera um índice uniforme em [0, ALFABETO.length),
    // sem o viés que `randomBytes(x) % N` introduz quando N não divide 256.
    saida += ALFABETO[randomInt(ALFABETO.length)]
  }
  return saida
}
