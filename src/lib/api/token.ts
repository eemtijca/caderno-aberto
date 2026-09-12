import { randomInt } from "crypto"

// Alfabeto sem caracteres ambíguos para digitação manual.
const ALFABETO = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"

/** Gera um token curto e imprevisível para links de alunos. */
export function gerarToken(tamanho = 22): string {
  let saida = ""
  for (let i = 0; i < tamanho; i++) {
    saida += ALFABETO[randomInt(ALFABETO.length)]
  }
  return saida
}
