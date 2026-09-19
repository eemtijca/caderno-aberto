// Códigos de erro da API e conversão para exceções tipadas no cliente.

export type CodigoErro =
  | "VALIDACAO"
  | "NAO_AUTENTICADO"
  | "SEM_PERMISSAO"
  | "NAO_ENCONTRADO"
  | "CONFLITO"
  | "LIMITE"
  | "CARENCIA"
  | "EXTRAVIOU_PRAZO"
  | "INDISPONIVEL"
  | "CSRF"
  | "CONTA_PENDENTE"
  | "CONTA_SUSPENSA"
  | "ERRO_INTERNO";

export interface CorpoErro {
  erro: string;
  codigo?: CodigoErro;
  detalhe?: Record<string, unknown>;
}

/** Exceção tipada devolvida pelas chamadas de API. */
export class ErroApi extends Error {
  status: number;
  codigo?: CodigoErro;
  detalhe?: Record<string, unknown>;

  constructor(
    mensagem: string,
    status = 400,
    codigo?: CodigoErro,
    detalhe?: Record<string, unknown>,
  ) {
    super(mensagem);
    this.name = "ErroApi";
    this.status = status;
    this.codigo = codigo;
    this.detalhe = detalhe;
  }
}

/** Converte status e corpo de uma resposta em ErroApi. */
export function mapearErro(status: number, corpo: unknown, padrao = "Erro inesperado."): ErroApi {
  const c = (corpo ?? {}) as CorpoErro;
  const codigo = c.codigo ?? codigoPorStatus(status);
  return new ErroApi(c.erro ?? padrao, status, codigo, c.detalhe);
}

export function codigoPorStatus(status: number): CodigoErro {
  if (status === 401) return "NAO_AUTENTICADO";
  if (status === 403) return "SEM_PERMISSAO";
  if (status === 404) return "NAO_ENCONTRADO";
  if (status === 409) return "CONFLITO";
  if (status === 410) return "EXTRAVIOU_PRAZO";
  if (status === 429) return "LIMITE";
  if (status >= 500) return "ERRO_INTERNO";
  return "VALIDACAO";
}

/** Código de erro do Prisma, quando houver (ex.: P2025 para registro ausente). */
export function codigoPrisma(erro: unknown): string | undefined {
  if (erro && typeof erro === "object" && "code" in erro) {
    const codigo = (erro as { code?: unknown }).code;
    if (typeof codigo === "string") return codigo;
  }
  return undefined;
}
