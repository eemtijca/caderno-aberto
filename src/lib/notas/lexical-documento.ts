// Ponte de documento: converte a lista de blocos da AST em um estado
// serializado do Lexical (um único documento com todos os blocos como
// nós) e de volta. Complementa a lexical-bridge (que lida com o texto
// inline de um bloco). Mantém o round-trip exato: ordem, ids e campos.

import type { Bloco, BlocoFilho, Nivel, Rotulo } from "./tipos"
import {
  serializarNo,
  textoParaNos,
  type EstadoLexical,
  type NoSerializado,
} from "./lexical-bridge"

// Bloco → nó serializado

/** Converte um parágrafo (filho ou nível superior) para nó inline. */
function paragrafoParaNo(
  texto: string,
  rotulo: Rotulo | null | undefined,
  id: string,
): NoSerializado {
  return {
    type: "paragrafo-nota",
    version: 1,
    id,
    rotulo: rotulo ?? null,
    format: "",
    indent: 0,
    direction: null,
    textFormat: 0,
    textStyle: "",
    children: textoParaNos(texto),
  }
}

/** Converte um BlocoFilho (paragrafo, formula, lista, tabela, chamada) para nó. */
function filhoParaNo(filho: BlocoFilho): NoSerializado {
  switch (filho.tipo) {
    case "paragrafo":
      return paragrafoParaNo(filho.texto, filho.rotulo, filho.id)
    case "formula":
      return { type: "equation", version: 1, id: filho.id, equation: filho.latex, inline: false }
    case "lista":
      return listaParaNo(filho.itens, filho.id)
    case "tabela":
      return tabelaParaNo(filho.comCabecalho, filho.linhas, filho.id)
    case "chamada":
      return {
        type: "chamada",
        version: 1,
        id: filho.id,
        estilo: filho.estilo,
        format: "",
        indent: 0,
        direction: null,
        textFormat: 0,
        textStyle: "",
        children: textoParaNos(filho.texto),
      }
  }
}

/** Lista de itens (string[] inline) para nó de lista do Lexical. */
function listaParaNo(itens: string[], id: string): NoSerializado {
  return {
    type: "lista-nota",
    version: 1,
    id,
    tag: "ul",
    listType: "bullet",
    start: 1,
    children: itens.map((item, i) => ({
      type: "item-lista-nota",
      version: 1,
      value: i,
      format: "",
      indent: 0,
      direction: null,
      textFormat: 0,
      textStyle: "",
      children: textoParaNos(item),
    })),
  }
}

/** Grade de células (string[][]) para nó de tabela do Lexical. */
function tabelaParaNo(comCabecalho: boolean, linhas: string[][], id: string): NoSerializado {
  return {
    type: "tabela",
    version: 1,
    id,
    comCabecalho,
    children: linhas.map((linha) => ({
      type: "linha-tabela-nota",
      version: 1,
      children: linha.map((celula) => ({
        type: "celula-tabela-nota",
        version: 1,
        format: "",
        indent: 0,
        direction: null,
        textFormat: 0,
        textStyle: "",
        children: textoParaNos(celula),
      })),
    })),
  }
}

/** Converte um Bloco de nível superior para nó do documento. */
function blocoParaNo(bloco: Bloco): NoSerializado {
  switch (bloco.tipo) {
    case "secao":
      return {
        type: "secao",
        version: 1,
        id: bloco.id,
        tag: "h2",
        format: "",
        indent: 0,
        direction: null,
        textFormat: 0,
        textStyle: "",
        children: textoParaNos(bloco.titulo),
      }
    case "paragrafo":
      return paragrafoParaNo(bloco.texto, bloco.rotulo, bloco.id)
    case "formula":
      return { type: "equation", version: 1, id: bloco.id, equation: bloco.latex, inline: false }
    case "lista":
      return listaParaNo(bloco.itens, bloco.id)
    case "tabela":
      return tabelaParaNo(bloco.comCabecalho, bloco.linhas, bloco.id)
    case "chamada":
      return {
        type: "chamada",
        version: 1,
        id: bloco.id,
        estilo: bloco.estilo,
        format: "",
        indent: 0,
        direction: null,
        textFormat: 0,
        textStyle: "",
        children: textoParaNos(bloco.texto),
      }
    case "figura":
      return { type: "figura", version: 1, id: bloco.id, url: bloco.url, legenda: bloco.legenda }
    case "tikz":
      return {
        type: "tikz",
        version: 1,
        id: bloco.id,
        codigo: bloco.codigo,
        legenda: bloco.legenda,
      }
    case "copiar":
    case "exemplo":
    case "dica":
      return {
        type: "caixa",
        version: 1,
        id: bloco.id,
        tipoCaixa: bloco.tipo,
        rotulo: bloco.rotulo,
        children: [
          { type: "caixa-cabecalho", version: 1, rotulo: bloco.rotulo },
          ...bloco.filhos.map(filhoParaNo),
        ],
      }
    case "exercicios":
      return {
        type: "exercicios",
        version: 1,
        id: bloco.id,
        rotulo: bloco.rotulo,
        niveis: bloco.niveis,
        gabarito: bloco.gabarito,
      }
  }
}

/** Converte a lista de blocos da nota em um estado serializado do Lexical. */
export function blocosParaEstado(blocos: Bloco[]): EstadoLexical {
  return {
    root: {
      type: "root",
      format: "",
      indent: 0,
      version: 1,
      direction: null,
      children: blocos.map(blocoParaNo),
    },
  } as unknown as EstadoLexical
}

// Nó serializado → bloco

/** Serializa os filhos inline (parágrafo/chamada/seção) de volta para texto. */
function filhosInlineParaTexto(children: NoSerializado[] = []): string {
  return children.map(serializarNo).join("").trim()
}

/** Extrai os itens de um nó de lista. */
function listaItens(no: NoSerializado): string[] {
  return (no.children ?? []).map((item) => filhosInlineParaTexto(item.children))
}

/** Extrai as linhas de um nó de tabela. */
function tabelaLinhas(no: NoSerializado): string[][] {
  return (no.children ?? []).map((linha) =>
    (linha.children ?? []).map((celula) => filhosInlineParaTexto(celula.children)),
  )
}

function novoId(prefixo: string): string {
  return `${prefixo}-${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`
}

/** Converte um nó serializado para um BlocoFilho. */
function noParaFilho(no: NoSerializado): BlocoFilho {
  const id = no.id ?? novoId("f")
  switch (no.type) {
    case "paragrafo-nota":
      return {
        id,
        tipo: "paragrafo",
        texto: filhosInlineParaTexto(no.children),
        rotulo: (no.rotulo as Rotulo | null | undefined) ?? null,
      }
    case "equation":
      return { id, tipo: "formula", latex: no.equation ?? "" }
    case "lista-nota":
      return { id, tipo: "lista", itens: listaItens(no) }
    case "tabela":
      return { id, tipo: "tabela", comCabecalho: no.comCabecalho ?? true, linhas: tabelaLinhas(no) }
    case "chamada":
      return {
        id,
        tipo: "chamada",
        estilo: (no.estilo ?? "atencao") as "atencao" | "diaadia" | "simbolos",
        texto: filhosInlineParaTexto(no.children),
      }
    default:
      return { id, tipo: "paragrafo", texto: filhosInlineParaTexto(no.children), rotulo: null }
  }
}

/** Converte um nó serializado do documento para um Bloco de nível superior. */
function noParaBloco(no: NoSerializado): Bloco {
  const id = no.id ?? novoId("b")
  switch (no.type) {
    case "secao":
      return { id, tipo: "secao", titulo: filhosInlineParaTexto(no.children) }
    case "paragrafo-nota":
      return {
        id,
        tipo: "paragrafo",
        texto: filhosInlineParaTexto(no.children),
        rotulo: (no.rotulo as Rotulo | null | undefined) ?? null,
      }
    case "equation":
      return { id, tipo: "formula", latex: no.equation ?? "" }
    case "lista-nota":
      return { id, tipo: "lista", itens: listaItens(no) }
    case "tabela":
      return { id, tipo: "tabela", comCabecalho: no.comCabecalho ?? true, linhas: tabelaLinhas(no) }
    case "chamada":
      return {
        id,
        tipo: "chamada",
        estilo: (no.estilo ?? "atencao") as "atencao" | "diaadia" | "simbolos",
        texto: filhosInlineParaTexto(no.children),
      }
    case "figura":
      return { id, tipo: "figura", url: no.url ?? "", legenda: no.legenda ?? "" }
    case "tikz":
      return { id, tipo: "tikz", codigo: no.codigo ?? "", legenda: no.legenda ?? "" }
    case "caixa": {
      const tipoCaixa =
        no.tipoCaixa === "exemplo" || no.tipoCaixa === "dica" ? no.tipoCaixa : "copiar"
      const filhos = (no.children ?? []).filter((c) => c.type !== "caixa-cabecalho")
      const cabecalho = (no.children ?? []).find((c) => c.type === "caixa-cabecalho")
      return {
        id,
        tipo: tipoCaixa,
        rotulo:
          (cabecalho?.rotulo as string | undefined) ?? (no.rotulo as string | undefined) ?? "",
        filhos: filhos.map(noParaFilho),
      }
    }
    case "exercicios":
      return {
        id,
        tipo: "exercicios",
        rotulo: (no.rotulo as string | undefined) ?? "Exercícios propostos",
        niveis: (no.niveis as Nivel[] | undefined) ?? [],
        gabarito: no.gabarito ?? "",
      }
    default:
      return { id, tipo: "paragrafo", texto: filhosInlineParaTexto(no.children), rotulo: null }
  }
}

/** Converte um estado serializado do Lexical de volta para a lista de blocos. */
export function estadoParaBlocos(estado: EstadoLexical): Bloco[] {
  const raiz = estado?.root as unknown as { children?: NoSerializado[] } | undefined
  return (raiz?.children ?? []).map(noParaBloco)
}
