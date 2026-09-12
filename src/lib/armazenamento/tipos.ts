// Armazenamento de imagens atrás de interface única.
export interface ArquivoGuardado {
  bytes: Buffer
  mime: string
}

export interface ProvedorArmazenamento {
  readonly nome: "disk" | "s3"
  salvar(caminho: string, bytes: Buffer, mime: string): Promise<void>
  ler(caminho: string): Promise<ArquivoGuardado | null>
  remover(caminho: string): Promise<void>
  listar(prefixo: string): Promise<{ caminho: string; mime: string }[]>
}
