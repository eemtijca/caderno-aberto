// Linhas do banco. Espelham prisma/schema.prisma.

import type { AparenciaNota } from "@/lib/notas/tipos";

export type Papel = "admin" | "professor";

export type UsuarioLinha = {
  id: string;
  email: string;
  senhaHash: string;
  papel: Papel;
  ativadoEm: Date | null;
  criadoEm: Date;
  atualizadoEm: Date;
};

export type PerfilLinha = {
  id: string;
  nome: string;
  email: string;
  escola: string;
  preferencias: Record<string, unknown>;
  criadoEm: Date;
  atualizadoEm: Date;
  exclusaoSolicitadaEm?: Date | null;
  expiraEm?: Date | null;
};

export type DisciplinaLinha = {
  id: string;
  professorId: string;
  nome: string;
  cor: string;
  icone: string;
  ordem: number;
  criadoEm: Date;
  atualizadoEm: Date;
};

export type TurmaLinha = {
  id: string;
  professorId: string;
  nome: string;
  serie: string;
  anoLetivo: number;
  criadoEm: Date;
  atualizadoEm: Date;
};

export type NotaLinha = {
  id: string;
  professorId: string;
  titulo: string;
  disciplinaId: string | null;
  disciplinaNome: string;
  disciplinaCor: string;
  turmasIds: string[];
  turmasNomes: string[];
  anoLetivo: number;
  mes: number;
  sobre: string;
  habilidades: string;
  status: "rascunho" | "publicada";
  blocos: unknown;
  /** Aparência da leitura (fonte/escala/entrelinha). Vazio = padrão do app. */
  aparencia: AparenciaNota;
  busca: string;
  criadoEm: Date;
  atualizadoEm: Date;
};

export type LinkLinha = {
  id: string;
  professorId: string;
  tipo: "nota" | "turma" | "disciplina";
  notaId: string | null;
  turmaId: string | null;
  disciplinaId: string | null;
  token: string;
  professorNome: string;
  nome: string;
  ativo: boolean;
  pausadoNaExclusao: boolean;
  expiraEm: Date | null;
  acessos: number;
  criadoEm: Date;
};

export type SessaoLinha = {
  id: string;
  usuarioId: string;
  tokenHash: string;
  criadoEm: Date;
  expiraEm: Date;
  ultimoUsoEm: Date;
  ip: string;
  agente: string;
};

export type CodigoAcessoLinha = {
  id: string;
  usuarioId: string;
  email: string;
  tipo: "primeiro_acesso" | "recuperacao";
  codigoHash: string;
  criadoPor: string | null;
  expiraEm: Date;
  usadoEm: Date | null;
  criadoEm: Date;
};

export type SolicitacaoAcessoLinha = {
  id: string;
  nome: string;
  email: string;
  tipo: "primeiro_acesso" | "recuperacao";
  status: "pendente" | "atendida" | "cancelada";
  atendidaPor: string | null;
  atendidaEm: Date | null;
  criadoEm: Date;
};

export type EventoSegurancaLinha = {
  id: string;
  atorId: string | null;
  acao: string;
  email: string;
  ip: string;
  agente: string;
  detalhe: Record<string, unknown>;
  criadoEm: Date;
};
