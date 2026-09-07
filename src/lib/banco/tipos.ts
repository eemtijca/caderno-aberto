// Linhas do banco. Espelham src/prisma/contract.prisma.

import type { AparenciaNota } from "@/lib/notas/tipos"

export type UsuarioLinha = {
  id: string
  email: string
  senhaHash: string
  emailVerificadoEm: string | null
  criadoEm: string
  atualizadoEm: string
}

export type PerfilLinha = {
  id: string
  nome: string
  email: string
  escola: string
  preferencias: Record<string, unknown>
  criadoEm: string
  atualizadoEm: string
  exclusaoSolicitadaEm?: string | null
  expiraEm?: string | null
}

export type DisciplinaLinha = {
  id: string
  professorId: string
  nome: string
  cor: string
  icone: string
  ordem: number
  criadoEm: string
  atualizadoEm: string
}

export type TurmaLinha = {
  id: string
  professorId: string
  nome: string
  serie: string
  anoLetivo: number
  criadoEm: string
  atualizadoEm: string
}

export type NotaLinha = {
  id: string
  professorId: string
  titulo: string
  disciplinaId: string | null
  disciplinaNome: string
  disciplinaCor: string
  turmasIds: string[]
  turmasNomes: string[]
  anoLetivo: number
  mes: number
  sobre: string
  habilidades: string
  status: "rascunho" | "publicada"
  blocos: unknown
  /** Aparência da leitura (fonte/escala/entrelinha). Vazio = padrão do app. */
  aparencia: AparenciaNota
  busca: string
  criadoEm: string
  atualizadoEm: string
}

export type LinkLinha = {
  id: string
  professorId: string
  tipo: "nota" | "turma" | "disciplina"
  notaId: string | null
  turmaId: string | null
  disciplinaId: string | null
  token: string
  professorNome: string
  nome: string
  ativo: boolean
  expiraEm: string | null
  acessos: number
  criadoEm: string
}

export type SessaoLinha = {
  id: string
  usuarioId: string
  tokenHash: string
  criadoEm: string
  expiraEm: string
  ultimoUsoEm: string
  ip: string
  agente: string
}
