"use client";

// Cliente das rotas administrativas.

import { mapearErro } from "@/lib/api/erro";

export type TipoCodigo = "primeiro_acesso" | "recuperacao";

export interface Solicitacao {
  id: string;
  nome: string;
  email: string;
  tipo: TipoCodigo;
  status: "pendente" | "atendida" | "cancelada";
  criadoEm: string;
  atendidaEm: string | null;
}

export interface Codigo {
  id: string;
  email: string;
  tipo: TipoCodigo;
  criadoEm: string;
  expiraEm: string;
  usadoEm: string | null;
  status: "ativo" | "usado" | "expirado";
}

export interface CodigoEmitido {
  codigo: string;
  expiraEm: string;
  email: string;
  tipo: TipoCodigo;
}

export type StatusConta = "ativo" | "suspenso" | "excluindo";

export interface UsuarioAdmin {
  id: string;
  email: string;
  nome: string;
  papel: "admin" | "professor";
  ativado: boolean;
  statusConta: StatusConta;
  motivo: string;
  suspensoEm: string | null;
  criadoEm: string;
}

export interface Evento {
  id: string;
  acao: string;
  email: string;
  ip: string;
  criadoEm: string;
  detalhe: Record<string, unknown>;
}

export interface Resumo {
  solicitacoesPendentes: number;
  codigosAtivos: number;
  usuarios: number;
  usuariosInativos: number;
}

export interface AprovacaoAcao {
  id: string;
  tipo: string;
  alvoEmail: string;
  motivo: string;
  solicitadoPor: string;
  expiraEm: string;
  criadoEm: string;
}

async function pedir<T>(url: string, init?: RequestInit): Promise<T> {
  let r: Response;
  try {
    r = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
      cache: "no-store",
    });
  } catch {
    throw new Error("Não foi possível falar com o servidor. Verifique sua conexão.");
  }
  const corpo = await r.json().catch(() => ({}));
  if (!r.ok) {
    const erro = mapearErro(r.status, corpo, "Falha na operação.");
    if (r.status === 401 && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("caderno:sessao-expirada"));
    }
    throw erro;
  }
  return corpo as T;
}

export const adminApi = {
  resumo: () => pedir<Resumo>("/api/admin/resumo"),

  solicitacoes: (status?: string) =>
    pedir<{ solicitacoes: Solicitacao[] }>(
      `/api/admin/solicitacoes${status ? `?status=${status}` : ""}`,
    ),
  atender: (id: string) =>
    pedir<CodigoEmitido>(`/api/admin/solicitacoes/${id}/atender`, { method: "POST" }),
  cancelar: (id: string) =>
    pedir<{ ok: true }>(`/api/admin/solicitacoes/${id}/cancelar`, { method: "POST" }),

  codigos: () => pedir<{ codigos: Codigo[] }>("/api/admin/codigos"),
  emitirCodigo: (email: string, tipo: TipoCodigo, nome?: string) =>
    pedir<CodigoEmitido>("/api/admin/codigos", {
      method: "POST",
      body: JSON.stringify({ email, tipo, nome }),
    }),
  revogarCodigo: (id: string) =>
    pedir<{ ok: true }>(`/api/admin/codigos/${id}`, { method: "DELETE" }),

  usuarios: () => pedir<{ usuarios: UsuarioAdmin[] }>("/api/admin/usuarios"),
  criarUsuario: (dados: { nome: string; email: string; papel: string }) =>
    pedir<{ usuario: UsuarioAdmin; codigo: string; expiraEm: string }>("/api/admin/usuarios", {
      method: "POST",
      body: JSON.stringify(dados),
    }),
  editarUsuario: (
    id: string,
    dados: {
      nome?: string;
      email?: string;
      papel?: string;
      ativado?: boolean;
      statusConta?: StatusConta;
      motivo?: string;
      senha?: string;
    },
  ) =>
    pedir<{ ok: true; pendente?: boolean }>(`/api/admin/usuarios/${id}`, {
      method: "PATCH",
      body: JSON.stringify(dados),
    }),
  excluirUsuario: (id: string, dados: { motivo: string; senha: string }) =>
    pedir<{ ok: true; pendente?: boolean }>(`/api/admin/usuarios/${id}`, {
      method: "DELETE",
      body: JSON.stringify(dados),
    }),
  reemitirCodigo: (id: string, tipo?: TipoCodigo) =>
    pedir<CodigoEmitido>(`/api/admin/usuarios/${id}/codigo`, {
      method: "POST",
      body: JSON.stringify({ tipo }),
    }),
  revogarSessoes: (id: string) =>
    pedir<{ ok: true; removidas: number }>(`/api/admin/usuarios/${id}/sessoes`, {
      method: "DELETE",
    }),

  aprovacoes: () => pedir<{ aprovacoes: AprovacaoAcao[] }>("/api/admin/aprovacoes"),
  decidirAprovacao: (id: string, acao: "aprovar" | "recusar", senha: string) =>
    pedir<{ ok: true }>(`/api/admin/aprovacoes/${id}`, {
      method: "POST",
      body: JSON.stringify({ acao, senha }),
    }),

  auditoria: () => pedir<{ eventos: Evento[] }>("/api/admin/auditoria"),
};
