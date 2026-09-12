// Registro de eventos de segurança para auditoria.
import { banco } from "@/lib/banco";
import { paraJson } from "@/lib/api/serializacao";

export interface EventoEntrada {
  atorId?: string | null;
  acao: string;
  email?: string;
  detalhe?: Record<string, unknown>;
  req?: Request;
}

/** Grava o evento sem nunca interromper o fluxo principal. */
export async function registrarEvento(entrada: EventoEntrada): Promise<void> {
  const cabecalhos = entrada.req?.headers;
  const ip =
    cabecalhos?.get("x-forwarded-for")?.split(",")[0]?.trim() ?? cabecalhos?.get("x-real-ip") ?? "";
  try {
    await banco().eventosSeguranca.create({
      data: {
        atorId: entrada.atorId ?? null,
        acao: entrada.acao,
        email: entrada.email?.toLowerCase() ?? "",
        ip,
        agente: cabecalhos?.get("user-agent")?.slice(0, 300) ?? "",
        detalhe: paraJson(entrada.detalhe ?? {}),
      },
    });
  } catch {
    // Auditoria nunca bloqueia a operação.
  }
}
