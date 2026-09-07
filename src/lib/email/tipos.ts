// Transporte de e-mail selecionado por configuração.
export interface PedidoEmail {
  para: string[]
  assunto: string
  html: string
  texto?: string
  /** Idempotência por evento/entidade (ex.: verificacao/<id>). */
  chaveIdempotencia?: string
  etiquetas?: { nome: string; valor: string }[]
}

export interface ProvedorEmail {
  readonly nome: "log" | "smtp" | "resend"
  enviar(pedido: PedidoEmail): Promise<{ id: string }>
}
