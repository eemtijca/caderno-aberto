// Ponte entre a AST (texto inline em formato próprio) e o Lexical.
// O editor WYSIWYG guarda a mesma string `texto` no banco, portanto
// nenhum renderizador (React/KaTeX, LaTeX, Markdown) muda de schema.
// Duas direções: texto para estado serializado (abrir a nota) e estado serializado para texto (salvar a edição).

/** Nó serializado do Lexical (shape mínimo para a ponte). */
export interface NoSerializado {
  type: string
  text?: string
  format?: number
  url?: string
  equation?: string
  inline?: boolean
  children?: NoSerializado[]
  version?: number
}

/** Estado serializado do Lexical (shape compatível com parseEditorState). */
export interface EstadoLexical {
  root: {
    type: "root"
    format: string
    indent: number
    version: number
    direction: string | null
    children: NoSerializado[]
  }
}

// Formato bitmask de TextNode do Lexical
export const FORMATO_BOLD = 1
export const FORMATO_ITALICO = 2
export const FORMATO_UNDERLINE = 4
export const FORMATO_RISCADO = 8
export const FORMATO_CODIGO = 16

// ============================================================
// Serialização: estado serializado para texto
// ============================================================

interface SerializadoTexto {
  text?: string
  format?: number
  type?: string
  url?: string
  equation?: string
  inline?: boolean
  children?: SerializadoTexto[]
}

/** Serializa os filhos de um nó para a marcação inline do app. */
function filhosParaTexto(children: SerializadoTexto[] = []): string {
  return children.map(serializarNo).join("")
}

/** Aplica a formatação de um TextNode (bitmask) em volta do texto. */
function formatarTexto(texto: string, format: number): string {
  let r = texto
  if (format & FORMATO_CODIGO) r = `\`${r}\``
  if (format & FORMATO_BOLD) r = `**${r}**`
  if (format & FORMATO_ITALICO) r = `*${r}*`
  if (format & FORMATO_RISCADO) r = `~~${r}~~`
  return r
}

function serializarNo(no: SerializadoTexto): string {
  switch (no.type) {
    case "text":
      // junta formatação sobreposta (ex.: negrito+itálico) de forma aninhada
      if (no.text !== undefined) return formatarTexto(no.text, no.format ?? 0)
      return ""
    case "link":
      // [texto](url) — o texto interno pode ter marcação própria
      return `[${filhosParaTexto(no.children)}](${no.url ?? ""})`
    case "equation":
      // $...$ inline e $$...$$ em destaque
      return no.inline ? `$${no.equation ?? ""}$` : `$$${no.equation ?? ""}$$`
    case "linebreak":
      // quebra de linha dentro do bloco (Shift+Enter)
      return "\n"
    case "resultado":
      // \resultado{...} — coral (pode conter $matemática$ por dentro)
      return `\\resultado{${filhosParaTexto(no.children)}}`
    case "dest":
      // \dest{...} — palavra-chave em negrito
      return `\\dest{${filhosParaTexto(no.children)}}`
    default:
      // nós de contêiner (paragraph, heading...) só encadeiam filhos
      return filhosParaTexto(no.children)
  }
}

/**
 * Converte um estado serializado do Lexical de volta para a string
 * `texto` da AST. Usado no OnChange do editor para salvar.
 */
export function estadoParaTexto(estado: EstadoLexical): string {
  const raiz = estado?.root as unknown as SerializadoTexto | undefined
  const filhos = raiz?.children ?? []
  // o editor de um bloco tem UM parágrafo (ou fórmula display); remove
  // a borda de cada contêiner e concatena o conteúdo inline
  return filhos.map(serializarNo).join("").trim()
}

/** Serializa uma lista de nós (shape exportJSON do Lexical) para texto. */
export function serializarLista(nos: NoSerializado[]): string {
  return nos
    .map((n) => serializarNo(n as unknown as SerializadoTexto))
    .join("")
    .trim()
}

// ============================================================
// Parsing: texto para estado serializado
// ============================================================

function noTexto(texto: string, format = 0): NoSerializado {
  return { type: "text", text: texto, format, version: 1 }
}

function noEquation(equation: string, inline: boolean): NoSerializado {
  return { type: "equation", equation, inline, version: 1 }
}

function noLink(children: NoSerializado[], url: string): NoSerializado {
  return { type: "link", children, url, version: 1 }
}

function noContudo(type: "resultado" | "dest", children: NoSerializado[]): NoSerializado {
  return { type, children, version: 1 }
}

/** Encontra o `}` de fechamento respeitando chaves aninhadas e \$..\$. */
function fimArgumento(s: string, inicio: number): number {
  let prof = 0
  for (let i = inicio; i < s.length; i++) {
    const c = s[i]
    if (c === "\\") {
      i++
      continue
    }
    if (c === "{") prof++
    else if (c === "}") {
      prof--
      if (prof === 0) return i
    }
  }
  return -1
}

/** Aplica formatação de TextNode a uma lista de nós já construídos. */
function aplicarFormato(nos: NoSerializado[], format: number): NoSerializado[] {
  // funde text nodes adjacentes antes de aplicar o formato
  const fundidos: NoSerializado[] = []
  for (const n of nos) {
    const ultimo = fundidos[fundidos.length - 1]
    if (
      n.type === "text" &&
      ultimo &&
      ultimo.type === "text" &&
      (ultimo.format ?? 0) === (n.format ?? 0)
    ) {
      ultimo.text = `${ultimo.text ?? ""}${n.text ?? ""}`
    } else {
      fundidos.push({ ...n })
    }
  }
  return fundidos.map((n) => {
    if (n.type === "text" && n.text !== undefined) {
      return { ...n, format: (n.format ?? 0) | format }
    }
    return n
  })
}

/**
 * Analisa a string inline do app e devolve os nós Lexical serializados
 * de um parágrafo. Reconhece $math$, **negrito**, *itálico*,
 * `código`, ~~riscado~~, [link](url), \resultado{}, \dest{},
 * \textbf{}, \textit{} e quebras de linha (\n).
 */
export function textoParaNos(texto: string): NoSerializado[] {
  const nos: NoSerializado[] = []
  let i = 0
  let buffer = ""
  const pushTexto = () => {
    if (buffer) {
      nos.push(noTexto(buffer))
      buffer = ""
    }
  }

  while (i < texto.length) {
    const c = texto[i]
    const resto = texto.slice(i)

    // \resultado{...} — destaque coral (pode conter $math$)
    if (resto.startsWith("\\resultado{")) {
      const fim = fimArgumento(texto, i + 10)
      if (fim !== -1) {
        pushTexto()
        const interior = texto.slice(i + 11, fim)
        nos.push(noContudo("resultado", textoParaNos(interior)))
        i = fim + 1
        continue
      }
    }
    // \dest{...} — palavra-chave em negrito
    if (resto.startsWith("\\dest{")) {
      const fim = fimArgumento(texto, i + 5)
      if (fim !== -1) {
        pushTexto()
        nos.push(noContudo("dest", textoParaNos(texto.slice(i + 6, fim))))
        i = fim + 1
        continue
      }
    }
    // \textbf{...} — negrito
    if (resto.startsWith("\\textbf{")) {
      const fim = fimArgumento(texto, i + 7)
      if (fim !== -1) {
        pushTexto()
        nos.push(...aplicarFormato(textoParaNos(texto.slice(i + 8, fim)), FORMATO_BOLD))
        i = fim + 1
        continue
      }
    }
    // \textit{...} — itálico
    if (resto.startsWith("\\textit{")) {
      const fim = fimArgumento(texto, i + 7)
      if (fim !== -1) {
        pushTexto()
        nos.push(...aplicarFormato(textoParaNos(texto.slice(i + 8, fim)), FORMATO_ITALICO))
        i = fim + 1
        continue
      }
    }
    // $$...$$ — fórmula em destaque (bloco)
    if (resto.startsWith("$$")) {
      const fim = texto.indexOf("$$", i + 2)
      if (fim !== -1) {
        pushTexto()
        nos.push(noEquation(texto.slice(i + 2, fim), false))
        i = fim + 2
        continue
      }
    }
    // $...$ — fórmula inline
    if (c === "$") {
      let j = i + 1
      while (j < texto.length && texto[j] !== "$") {
        if (texto[j] === "\\") j++
        j++
      }
      if (j < texto.length) {
        pushTexto()
        nos.push(noEquation(texto.slice(i + 1, j), true))
        i = j + 1
        continue
      }
    }
    // **negrito**
    if (resto.startsWith("**")) {
      const fim = texto.indexOf("**", i + 2)
      if (fim !== -1) {
        pushTexto()
        nos.push(...aplicarFormato(textoParaNos(texto.slice(i + 2, fim)), FORMATO_BOLD))
        i = fim + 2
        continue
      }
    }
    // *itálico*
    if (c === "*" && texto[i + 1] !== "*") {
      const fim = texto.indexOf("*", i + 1)
      if (fim !== -1 && texto[fim + 1] !== "*") {
        pushTexto()
        nos.push(...aplicarFormato(textoParaNos(texto.slice(i + 1, fim)), FORMATO_ITALICO))
        i = fim + 1
        continue
      }
    }
    // ~~riscado~~
    if (resto.startsWith("~~")) {
      const fim = texto.indexOf("~~", i + 2)
      if (fim !== -1) {
        pushTexto()
        nos.push(...aplicarFormato(textoParaNos(texto.slice(i + 2, fim)), FORMATO_RISCADO))
        i = fim + 2
        continue
      }
    }
    // `código`
    if (c === "`") {
      const fim = texto.indexOf("`", i + 1)
      if (fim !== -1) {
        pushTexto()
        nos.push(noTexto(texto.slice(i + 1, fim), FORMATO_CODIGO))
        i = fim + 1
        continue
      }
    }
    // [texto](url)
    if (c === "[") {
      const fimColchete = texto.indexOf("]", i + 1)
      if (fimColchete !== -1 && texto[fimColchete + 1] === "(") {
        const fimParen = texto.indexOf(")", fimColchete + 2)
        if (fimParen !== -1) {
          pushTexto()
          const rotulo = texto.slice(i + 1, fimColchete)
          const url = texto.slice(fimColchete + 2, fimParen)
          nos.push(noLink(textoParaNos(rotulo), url))
          i = fimParen + 1
          continue
        }
      }
    }
    // \n — quebra de linha (Shift+Enter)
    if (c === "\n") {
      pushTexto()
      nos.push({ type: "linebreak", version: 1 })
      i++
      continue
    }
    buffer += c
    i++
  }
  pushTexto()
  return nos
}

/**
 * Converte a string `texto` de um bloco de parágrafo num estado
 * serializado do Lexical (um parágrafo). Usado como `editorState`
 * inicial do editor WYSIWYG.
 */
export function textoParaEstado(texto: string): EstadoLexical {
  const children = textoParaNos(texto)
  return estadoComParagrafo(children)
}

/** Converte o `latex` de uma fórmula em destaque num estado do Lexical. */
export function formulaParaEstado(latex: string): EstadoLexical {
  return estadoComParagrafo([noEquation(latex, false)])
}

/** Estado do Lexical com um único parágrafo contendo os nós dados. */
function estadoComParagrafo(children: NoSerializado[]): EstadoLexical {
  return {
    root: {
      type: "root",
      format: "",
      indent: 0,
      version: 1,
      direction: null,
      children: [
        {
          type: "paragraph",
          format: "",
          indent: 0,
          version: 1,
          direction: null,
          textFormat: 0,
          textStyle: "",
          children,
        },
      ],
    },
  } as unknown as EstadoLexical
}

/** Extrai o LaTeX de um estado de fórmula (remove $$...$$). */
export function estadoParaFormula(estado: EstadoLexical): string {
  const raiz = estado?.root as unknown as SerializadoTexto | undefined
  const direto = raiz?.children?.[0] as SerializadoTexto | undefined
  const conteudo = (direto?.children ?? raiz?.children ?? []) as SerializadoTexto[]
  const semLatex = conteudo
    .map((n) => {
      if (n.type === "equation") return n.equation ?? ""
      return serializarNo(n)
    })
    .join("")
  return semLatex.trim()
}
