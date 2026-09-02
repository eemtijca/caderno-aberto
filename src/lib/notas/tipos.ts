// Tipos da AST de blocos. O coração do editor visual. A mesma AST alimenta três renderizadores: 1. Web (React + KaTeX). Vista de leitura responsiva 2. Arquivo para impressão. Compatível com a classe notaaula.cls 3. Arquivo de texto. Intercâmbio, backup e leitura

/** Rótulo azul de abertura de parágrafo (\definicao, \rotulo{...}...) */
export type RotuloTipo = "definicao" | "formulas" | "relacoes" | "modelo" | "resolucao" | "livre"

export interface Rotulo {
  tipo: RotuloTipo
  /** texto livre, usado quando tipo === "livre" */
  texto?: string
}

/** Chamadas curtas destacadas (\atencao, \diaadia, \simbolos) */
export type EstiloChamada = "atencao" | "diaadia" | "simbolos"

export interface BlocoBase {
  id: string
}

export interface BlocoSecao extends BlocoBase {
  tipo: "secao"
  titulo: string
}

export interface BlocoParagrafo extends BlocoBase {
  tipo: "paragrafo"
// Texto com marcação inline: $matemática$, **negrito**, *itálico*,
// `código`, \resultado{...} (destaque coral) e \dest{...} (palavra-chave).
  texto: string
  rotulo?: Rotulo | null
}

export interface BlocoFormula extends BlocoBase {
  tipo: "formula"
  /** LaTeX puro (suporta \dec{}, \un{}, \resultado{}, \sen, \ce{}...) */
  latex: string
}

export interface BlocoLista extends BlocoBase {
  tipo: "lista"
  itens: string[]
}

export interface BlocoTabela extends BlocoBase {
  tipo: "tabela"
  comCabecalho: boolean
  /** linhas[0] é o cabeçalho quando comCabecalho */
  linhas: string[][]
}

export interface BlocoChamada extends BlocoBase {
  tipo: "chamada"
  estilo: EstiloChamada
  texto: string
}

export interface BlocoFigura extends BlocoBase {
  tipo: "figura"
  /** URL externa ou /api/imagens/<id> */
  url: string
  legenda: string
}

export interface BlocoTikz extends BlocoBase {
  tipo: "tikz"
  /** Código TikZ bruto. Pode ser só o corpo \draw... ou completo \begin{tikzpicture}...\end{tikzpicture} */
  codigo: string
  /** Legenda opcional exibida abaixo (suporta inline **, $math$, \resultado) */
  legenda: string
}

/** Blocos aceitos dentro das caixas (copiar/exemplo/dica) */
export type BlocoFilho = BlocoParagrafo | BlocoFormula | BlocoLista | BlocoTabela | BlocoChamada

export type TipoCaixa = "copiar" | "exemplo" | "dica"

export interface BlocoCaixa extends BlocoBase {
  tipo: TipoCaixa
  /** "Taxa de transformação" (copiar), "Exemplo resolvido", "Dica / erro comum"... */
  rotulo: string
  filhos: BlocoFilho[]
}

export interface Questao {
  id: string
  enunciado: string
  /** vazio => questão aberta (discursiva) */
  alternativas: string[]
  /** índice (0-based) da alternativa correta; null = não marcada */
  correta: number | null
}

export interface Nivel {
  numero: 1 | 2 | 3
  titulo: string
  questoes: Questao[]
}

export interface BlocoExercicios extends BlocoBase {
  tipo: "exercicios"
  /** "Exercícios propostos" */
  rotulo: string
  niveis: Nivel[]
  /** gabarito livre para as questões abertas */
  gabarito: string
}

export type Bloco =
  | BlocoSecao
  | BlocoParagrafo
  | BlocoFormula
  | BlocoLista
  | BlocoTabela
  | BlocoChamada
  | BlocoFigura
  | BlocoTikz
  | BlocoCaixa
  | BlocoExercicios

export const TIPOS_CAIXA: TipoCaixa[] = ["copiar", "exemplo", "dica"]

export const ROTULOS_FIXOS: { tipo: RotuloTipo; texto: string }[] = [
  { tipo: "definicao", texto: "Definição." },
  { tipo: "formulas", texto: "Fórmulas." },
  { tipo: "relacoes", texto: "Relações." },
  { tipo: "modelo", texto: "Modelo básico." },
  { tipo: "resolucao", texto: "Resolução." },
]

/** Texto exibido de um rótulo */
export function textoRotulo(rotulo: Rotulo | null | undefined): string {
  if (!rotulo) return ""
  if (rotulo.tipo === "livre") return rotulo.texto?.trim() || ""
  return ROTULOS_FIXOS.find((r) => r.tipo === rotulo.tipo)?.texto ?? ""
}

export const ESTILOS_CHAMADA: { estilo: EstiloChamada; nome: string }[] = [
  { estilo: "atencao", nome: "Atenção" },
  { estilo: "diaadia", nome: "No dia a dia" },
  { estilo: "simbolos", nome: "Símbolos e unidades" },
]

// Nota completa (serializada da API)

export interface TurmaInfo {
  id: string
  nome: string
  serie: string
  anoLetivo: number
}

export interface DisciplinaInfo {
  id: string
  nome: string
  cor: string
  icone: string
  ordem: number
}

export interface NotaDados {
  id: string
  slug: string
  titulo: string
  disciplinaId: string
  disciplina: DisciplinaInfo | null
  anoLetivo: number
  mes: number
  sobre: string
  habilidades: string
  status: "rascunho" | "publicada"
  blocos: Bloco[]
  criadoEm: string
  atualizadoEm: string
  turmas: TurmaInfo[]
  /** Aparência da leitura definida pelo professor (ausente = padrão do app). */
  aparencia?: AparenciaNota
}

// Aparência da leitura, por nota. Escolhida no editor e aplicada na leitura
// do professor, na vista pública dos alunos, na prévia e na impressão.

export type FonteNota = "corpo" | "serifada" | "legivel" | "lexend" | "mono"
export type EscalaNota = "p" | "m" | "g" | "gg"
export type EntrelinhaNota = "compacta" | "normal" | "ampla"

export interface AparenciaNota {
  fonte?: FonteNota
  escala?: EscalaNota
  entrelinha?: EntrelinhaNota
}

export const APARENCIA_PADRAO: Required<AparenciaNota> = {
  fonte: "corpo",
  escala: "m",
  entrelinha: "normal",
}

/** Catálogo de fontes exibido no editor (familia é a CSS var aplicada). */
export const FONTES_NOTA: { chave: FonteNota; nome: string; familia: string }[] = [
  { chave: "corpo", nome: "Padrão", familia: "var(--font-corpo)" },
  { chave: "serifada", nome: "Serifada", familia: "var(--font-serifada)" },
  { chave: "legivel", nome: "Alta legibilidade", familia: "var(--font-legivel)" },
  { chave: "lexend", nome: "Leitura fluida", familia: "var(--font-lexend)" },
  { chave: "mono", nome: "Monoespaçada", familia: "var(--font-mono-latex)" },
]

/** Escalas do texto de leitura (fator multiplicado no tamanho base). */
export const ESCALAS_NOTA: { chave: EscalaNota; nome: string; fator: number }[] = [
  { chave: "p", nome: "Pequena", fator: 0.94 },
  { chave: "m", nome: "Média", fator: 1 },
  { chave: "g", nome: "Grande", fator: 1.08 },
  { chave: "gg", nome: "Muito grande", fator: 1.16 },
]

/** Entrelinha (altura de linha relativa) da leitura. */
export const ENTRELINHAS_NOTA: { chave: EntrelinhaNota; nome: string; altura: number }[] = [
  { chave: "compacta", nome: "Compacta", altura: 1.45 },
  { chave: "normal", nome: "Normal", altura: 1.65 },
  { chave: "ampla", nome: "Ampla", altura: 1.85 },
]

/** Garante um objeto de aparência válido a partir de JSON desconhecido. */
export function normalizarAparencia(entrada: unknown): AparenciaNota {
  if (!entrada || typeof entrada !== "object") return {}
  const a = entrada as Record<string, unknown>
  const saida: AparenciaNota = {}
  if (typeof a.fonte === "string" && FONTES_NOTA.some((f) => f.chave === a.fonte)) {
    saida.fonte = a.fonte as FonteNota
  }
  if (typeof a.escala === "string" && ESCALAS_NOTA.some((e) => e.chave === a.escala)) {
    saida.escala = a.escala as EscalaNota
  }
  if (typeof a.entrelinha === "string" && ENTRELINHAS_NOTA.some((e) => e.chave === a.entrelinha)) {
    saida.entrelinha = a.entrelinha as EntrelinhaNota
  }
  return saida
}

// Variáveis CSS do contêiner de leitura, prontas para spread em `style`.
// Aparencia ausente devolve o objeto vazio (o CSS aplica os padrões).
export function variaveisAparencia(ap: AparenciaNota | null | undefined): Record<string, string> {
  const fonte = ap?.fonte ?? APARENCIA_PADRAO.fonte
  const escala = ap?.escala ?? APARENCIA_PADRAO.escala
  const entrelinha = ap?.entrelinha ?? APARENCIA_PADRAO.entrelinha
  const familia = FONTES_NOTA.find((f) => f.chave === fonte)?.familia ?? "var(--font-corpo)"
  const fator = ESCALAS_NOTA.find((e) => e.chave === escala)?.fator ?? 1
  const altura = ENTRELINHAS_NOTA.find((e) => e.chave === entrelinha)?.altura ?? 1.65
  return {
    "--na-fonte": familia,
    "--na-escala": String(fator),
    "--na-entrelinha": String(altura),
  }
}

// Normalização defensiva de JSON desconhecido (imports, API)

function comoTexto(v: unknown, padrao = ""): string {
  return typeof v === "string" ? v : padrao
}

function novoId(prefixo: string): string {
  return `${prefixo}-${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`
}

function normalizarFilho(v: unknown): BlocoFilho | null {
  if (!v || typeof v !== "object") return null
  const b = v as Record<string, unknown>
  const id = comoTexto(b.id) || novoId("f")
  switch (b.tipo) {
    case "paragrafo": {
      const rotulo = b.rotulo as Record<string, unknown> | null | undefined
      const rotuloOk: Rotulo | null =
        rotulo && typeof rotulo === "object" && typeof rotulo.tipo === "string"
          ? {
              tipo: rotulo.tipo as RotuloTipo,
              texto: comoTexto(rotulo.texto, undefined),
            }
          : null
      return { id, tipo: "paragrafo", texto: comoTexto(b.texto), rotulo: rotuloOk }
    }
    case "formula":
      return { id, tipo: "formula", latex: comoTexto(b.latex) }
    case "lista":
      return {
        id,
        tipo: "lista",
        itens: Array.isArray(b.itens) ? b.itens.map((i) => comoTexto(i)) : [],
      }
    case "tabela": {
      const linhas = Array.isArray(b.linhas)
        ? b.linhas.map((l) => (Array.isArray(l) ? l.map((c) => comoTexto(c)) : []) as string[])
        : []
      return { id, tipo: "tabela", comCabecalho: b.comCabecalho === true, linhas }
    }
    case "chamada": {
      const estilo = b.estilo === "diaadia" || b.estilo === "simbolos" ? b.estilo : "atencao"
      return { id, tipo: "chamada", estilo, texto: comoTexto(b.texto) }
    }
    default:
      return null
  }
}

function normalizarQuestao(v: unknown): Questao {
  const q = (v && typeof v === "object" ? v : {}) as Record<string, unknown>
  const alternativas = Array.isArray(q.alternativas) ? q.alternativas.map((a) => comoTexto(a)) : []
  const correta = typeof q.correta === "number" ? q.correta : null
  return {
    id: comoTexto(q.id) || novoId("q"),
    enunciado: comoTexto(q.enunciado),
    alternativas,
    correta: correta !== null && correta >= 0 && correta < alternativas.length ? correta : null,
  }
}

function normalizarNivel(v: unknown): Nivel {
  const n = (v && typeof v === "object" ? v : {}) as Record<string, unknown>
  const numero = n.numero === 2 ? 2 : n.numero === 3 ? 3 : 1
  return {
    numero,
    titulo: comoTexto(
      n.titulo,
      numero === 1 ? "Conceitos" : numero === 2 ? "Aplicação" : "Síntese",
    ),
    questoes: Array.isArray(n.questoes) ? n.questoes.map(normalizarQuestao) : [],
  }
}

/** Garante que qualquer JSON (backup antigo, editado à mão...) vire uma AST válida. */
export function normalizarBlocos(entrada: unknown): Bloco[] {
  if (!Array.isArray(entrada)) return []
  const resultado: Bloco[] = []
  for (const v of entrada) {
    if (!v || typeof v !== "object") continue
    const b = v as Record<string, unknown>
    const id = comoTexto(b.id) || novoId("b")
    switch (b.tipo) {
      case "secao":
        resultado.push({ id, tipo: "secao", titulo: comoTexto(b.titulo, "Seção") })
        break
      case "paragrafo": {
        const filho = normalizarFilho(v)
        if (filho && filho.tipo === "paragrafo") resultado.push({ ...filho, id })
        break
      }
      case "formula":
      case "lista":
      case "tabela":
      case "chamada": {
        const filho = normalizarFilho(v)
        if (filho) resultado.push({ ...filho, id })
        break
      }
      case "figura":
        resultado.push({
          id,
          tipo: "figura",
          url: comoTexto(b.url),
          legenda: comoTexto(b.legenda),
        })
        break
      case "tikz":
        resultado.push({
          id,
          tipo: "tikz",
          codigo: comoTexto(b.codigo ?? (b as Record<string, unknown>).latex ?? ""),
          legenda: comoTexto(b.legenda),
        })
        break
      case "copiar":
      case "exemplo":
      case "dica": {
        const filhos = Array.isArray(b.filhos)
          ? (b.filhos.map(normalizarFilho).filter(Boolean) as BlocoFilho[])
          : []
        resultado.push({
          id,
          tipo: b.tipo,
          rotulo: comoTexto(b.rotulo, b.tipo === "copiar" ? "Bloco" : ""),
          filhos,
        })
        break
      }
      case "exercicios":
        resultado.push({
          id,
          tipo: "exercicios",
          rotulo: comoTexto(b.rotulo, "Exercícios propostos"),
          niveis: Array.isArray(b.niveis) ? b.niveis.map(normalizarNivel) : [],
          gabarito: comoTexto(b.gabarito),
        })
        break
      default:
        break
    }
  }
  return resultado
}

/** Cria um id novo para blocos (usado pelo editor) */
export function idBloco(): string {
  return novoId("b")
}
