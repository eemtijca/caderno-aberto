// Limite de tentativas por IP ou por e-mail com tetos configuráveis.
// Guarda a janela no banco para valer entre instâncias e reinícios.
import { LIMITE_TENTATIVAS_LOGIN, LIMITE_CODIGO } from "@/lib/ambiente";
import { banco } from "@/lib/banco";

export const JANELA_LIMITE_MS = 5 * 60 * 1000;

export const LIMITE_TENTATIVAS = LIMITE_TENTATIVAS_LOGIN;
export const LIMITE_VERIFICACAO_CODIGO = LIMITE_CODIGO;

/** Milissegundos restantes até a tentativa mais antiga sair da janela. */
export function restaDaJanelaMs(maisAntigaMs: number, agoraMs: number, janelaMs: number): number {
  return Math.max(0, maisAntigaMs + janelaMs - agoraMs);
}

/** Registra uma tentativa e indica disponibilidade na janela. */
export async function cabeNoLimite(
  chave: string,
  maximo = LIMITE_TENTATIVAS,
  janelaMs = JANELA_LIMITE_MS,
): Promise<{ permitido: boolean; esperaSegundos: number }> {
  const db = banco();
  const agora = new Date();
  const inicio = new Date(agora.getTime() - janelaMs);
  try {
    await db.tentativasLimite.deleteMany({ where: { feitaEm: { lt: inicio } } });
  } catch {
    // Limpeza oportunista: nunca bloqueia o pedido.
  }
  let usadas = 0;
  try {
    usadas = await db.tentativasLimite.count({
      where: { chave, feitaEm: { gte: inicio } },
    });
  } catch {
    // Banco inacessível: permite para não travar o login.
    return { permitido: true, esperaSegundos: 0 };
  }
  if (usadas >= maximo) {
    const antiga = await db.tentativasLimite
      .findFirst({ where: { chave, feitaEm: { gte: inicio } }, orderBy: { feitaEm: "asc" } })
      .catch(() => null);
    const espera = antiga
      ? Math.max(
          1,
          Math.ceil(restaDaJanelaMs(antiga.feitaEm.getTime(), agora.getTime(), janelaMs) / 1000),
        )
      : Math.ceil(janelaMs / 1000);
    return { permitido: false, esperaSegundos: espera };
  }
  try {
    await db.tentativasLimite.create({ data: { chave } });
  } catch {
    // Concorrência na chave: ignora, a contagem já valeu.
  }
  return { permitido: true, esperaSegundos: 0 };
}

/** Conta tentativas na janela sem registrar. Usado antes de validar o código. */
export async function excedeLimite(
  chave: string,
  maximo = LIMITE_VERIFICACAO_CODIGO,
  janelaMs = JANELA_LIMITE_MS,
): Promise<{ excedido: boolean; esperaSegundos: number }> {
  const db = banco();
  const agora = new Date();
  const inicio = new Date(agora.getTime() - janelaMs);
  try {
    const usadas = await db.tentativasLimite.count({ where: { chave, feitaEm: { gte: inicio } } });
    if (usadas < maximo) return { excedido: false, esperaSegundos: 0 };
    const antiga = await db.tentativasLimite.findFirst({
      where: { chave, feitaEm: { gte: inicio } },
      orderBy: { feitaEm: "asc" },
    });
    return {
      excedido: true,
      esperaSegundos: antiga
        ? Math.max(
            1,
            Math.ceil(restaDaJanelaMs(antiga.feitaEm.getTime(), agora.getTime(), janelaMs) / 1000),
          )
        : Math.ceil(janelaMs / 1000),
    };
  } catch {
    // Banco inacessível: não bloqueia.
    return { excedido: false, esperaSegundos: 0 };
  }
}

/** Registra uma falha de verificação de código. */
export async function registrarTentativa(chave: string): Promise<void> {
  await banco()
    .tentativasLimite.create({ data: { chave } })
    .catch(() => undefined);
}

/** Limpa as tentativas após um acerto. */
export async function limparTentativas(chave: string): Promise<void> {
  await banco()
    .tentativasLimite.deleteMany({ where: { chave } })
    .catch(() => undefined);
}

/** Chave por IP (atrás de proxy, usa x-forwarded-for). */
export function chavePorIp(req: Request, rota: string): string {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "desconhecido";
  return `${rota}:${ip}`;
}

/** Chave por e-mail normalizado, prefixada pela origem. */
export function chavePorEmail(origem: string, email: string): string {
  return `${origem}:${email.trim().toLowerCase()}`;
}
