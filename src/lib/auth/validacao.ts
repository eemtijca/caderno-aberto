// Validação e normalização de e-mail e nome.

/** Normaliza o e-mail (minúsculas, sem espaços) ou responde null. */
export function normalizarEmail(valor: unknown): string | null {
  if (typeof valor !== "string") return null;
  const email = valor.trim().toLowerCase();
  if (email.length < 5 || email.length > 254) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return null;
  return email;
}

/** Normaliza o nome do professor ou responde null. */
export function normalizarNome(valor: unknown): string | null {
  if (typeof valor !== "string") return null;
  const nome = valor.trim().replace(/\s+/g, " ").slice(0, 120);
  return nome.length >= 2 ? nome : null;
}

/** Mascara o e-mail para logs e listagens, preservando domínio. */
export function mascararEmail(email: string): string {
  const [local, dominio] = email.split("@");
  if (!dominio) return "***";
  const visivel = local.slice(0, 1);
  return `${visivel}***@${dominio}`;
}
