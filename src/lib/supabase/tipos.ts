// Tipos do banco. Espelha migrations. Manter sincronizado.

export type PerfilLinha = {
  id: string
  nome: string
  email: string
  escola: string
  preferencias: Record<string, unknown>
  criado_em: string
  atualizado_em: string
  exclusao_solicitada_em?: string | null
  expira_em?: string | null
}

export type DisciplinaLinha = {
  id: string
  professor_id: string
  nome: string
  cor: string
  icone: string
  ordem: number
  criado_em: string
  atualizado_em: string
}

export type TurmaLinha = {
  id: string
  professor_id: string
  nome: string
  serie: string
  ano_letivo: number
  criado_em: string
  atualizado_em: string
}

export type NotaLinha = {
  id: string
  professor_id: string
  titulo: string
  disciplina_id: string | null
  disciplina_nome: string
  disciplina_cor: string
  turmas_ids: string[]
  turmas_nomes: string[]
  ano_letivo: number
  mes: number
  sobre: string
  habilidades: string
  status: "rascunho" | "publicada"
  blocos: unknown
  busca: string
  criado_em: string
  atualizado_em: string
}

export type LinkLinha = {
  id: string
  professor_id: string
  tipo: "nota" | "turma" | "disciplina"
  nota_id: string | null
  turma_id: string | null
  disciplina_id: string | null
  token: string
  professor_nome: string
  nome: string
  ativo: boolean
  expira_em: string | null
  acessos: number
  criado_em: string
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: PerfilLinha
        Insert: Partial<PerfilLinha> & { id: string }
        Update: Partial<Omit<PerfilLinha, "id">>
        Relationships: []
      }
      disciplinas: {
        Row: DisciplinaLinha
        Insert: Partial<DisciplinaLinha> & { professor_id: string; nome: string }
        Update: Partial<Omit<DisciplinaLinha, "id">>
        Relationships: []
      }
      turmas: {
        Row: TurmaLinha
        Insert: Partial<TurmaLinha> & { professor_id: string; nome: string }
        Update: Partial<Omit<TurmaLinha, "id">>
        Relationships: []
      }
      notas: {
        Row: NotaLinha
        Insert: Partial<NotaLinha> & { professor_id: string }
        Update: Partial<Omit<NotaLinha, "id">>
        Relationships: [
          {
            foreignKeyName: "notas_disciplina_id_fkey"
            columns: ["disciplina_id"]
            isOneToOne: false
            referencedRelation: "disciplinas"
            referencedColumns: ["id"]
          },
        ]
      }
      links: {
        Row: LinkLinha
        Insert: Partial<LinkLinha> & {
          professor_id: string
          tipo: LinkLinha["tipo"]
          token: string
        }
        Update: Partial<Omit<LinkLinha, "id">>
        Relationships: [
          {
            foreignKeyName: "links_nota_id_fkey"
            columns: ["nota_id"]
            isOneToOne: false
            referencedRelation: "notas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "links_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "links_disciplina_id_fkey"
            columns: ["disciplina_id"]
            isOneToOne: false
            referencedRelation: "disciplinas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      registrar_acesso: { Args: { p_token: string }; Returns: boolean }
      purge_exclusoes_expiradas: { Args: Record<string, never>; Returns: number }
      is_excluido: { Args: { p_id: string }; Returns: boolean }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
