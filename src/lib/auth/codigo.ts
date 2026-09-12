// Códigos de acesso de 8 caracteres, guardados apenas como HMAC.
import { createHmac, randomInt, timingSafeEqual } from "crypto";
import { AUTH_SECRET } from "@/lib/ambiente";

// Alfabeto sem caracteres ambíguos (0, 1, I, O).
const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const TAMANHO = 8;

/** Gera um código de 8 caracteres usando aleatoriedade criptográfica. */
export function gerarCodigo(): string {
  let codigo = "";
  for (let i = 0; i < TAMANHO; i += 1) codigo += ALFABETO[randomInt(ALFABETO.length)];
  return codigo;
}

/** Normaliza o código digitado (maiúsculas, sem espaços). */
export function normalizarCodigo(valor: unknown): string | null {
  if (typeof valor !== "string") return null;
  const codigo = valor.trim().toUpperCase().replace(/\s+/g, "");
  return new RegExp(`^[${ALFABETO}]{${TAMANHO}}$`).test(codigo) ? codigo : null;
}

/** HMAC com o segredo da aplicação; protege contra vazamento de dump. */
export function hashCodigo(email: string, tipo: string, codigo: string): string {
  return createHmac("sha256", AUTH_SECRET)
    .update(`${email.toLowerCase()}:${tipo}:${codigo.toUpperCase()}`)
    .digest("hex");
}

/** Confere o código em tempo constante. */
export function confereCodigo(email: string, tipo: string, codigo: string, hash: string): boolean {
  const calculado = Buffer.from(hashCodigo(email, tipo, codigo));
  const esperado = Buffer.from(hash);
  return calculado.length === esperado.length && timingSafeEqual(calculado, esperado);
}
