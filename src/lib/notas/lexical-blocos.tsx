"use client"

// Nós de bloco do Lexical para o editor de documento único. Cada bloco da
// AST vira um nó do documento: seção, parágrafo, fórmula (equation),
// lista, tabela, chamada, figura, tikz, caixas (copiar/exemplo/dica) e
// exercícios. Mantêm o round-trip com a ponte lexical-documento e a leitura.

import type {
  EditorConfig,
  EditorThemeClasses,
  LexicalNode,
  NodeKey,
  SerializedElementNode,
  SerializedLexicalNode,
  Spread,
} from "lexical"
import {
  $applyNodeReplacement,
  ElementNode,
  DecoratorNode,
  ParagraphNode,
  type SerializedParagraphNode,
} from "lexical"
import {
  ListNode,
  ListItemNode,
  type SerializedListItemNode,
  type SerializedListNode,
} from "@lexical/list"
import type { ReactNode } from "react"
import {
  FiguraComponent,
  TikzComponent,
  CaixaCabecalhoComponent,
  ExerciciosComponent,
} from "@/components/editor/decorators-blocos"

// ============================================================
// Seção (título numerado). O número é calculado pela ordem dos irmãos
// anteriores do tipo secao e aplicado como atributo para o CSS.
// ============================================================

export type SerializedSecaoNode = Spread<{ id?: string; tag: string }, SerializedElementNode>

export class SecaoNode extends ElementNode {
  __id?: string

  static getType(): string {
    return "secao"
  }

  static clone(node: SecaoNode): SecaoNode {
    const n = new SecaoNode(node.__key)
    n.__id = node.__id
    return n
  }

  constructor(key?: NodeKey) {
    super(key)
  }

  static importJSON(serialized: SerializedSecaoNode): SecaoNode {
    const n = $createSecaoNode()
    n.__id = serialized.id
    return n
  }

  exportJSON(): SerializedSecaoNode {
    return { ...super.exportJSON(), id: this.__id, tag: "h2" }
  }

  createDOM(config: EditorConfig): HTMLElement {
    const el = document.createElement("h2")
    el.className = "na-secao font-bold tracking-tight"
    return el
  }

  updateDOM(prevNode: this, dom: HTMLElement): boolean {
    // número da seção (1-based) entre os irmãos anteriores do mesmo tipo
    let numero = 1
    let irmao = this.getPreviousSibling()
    while (irmao) {
      if (irmao.getType() === "secao") numero++
      irmao = irmao.getPreviousSibling()
    }
    dom.setAttribute("data-numero", String(numero))
    return prevNode.__id !== this.__id
  }

  isInline(): boolean {
    return false
  }

  canBeEmpty(): boolean {
    return true
  }
}

export function $createSecaoNode(): SecaoNode {
  return $applyNodeReplacement(new SecaoNode())
}

export function $isSecaoNode(node: LexicalNode | null | undefined): node is SecaoNode {
  return node instanceof SecaoNode
}

// ============================================================
// Parágrafo com rótulo (Definição., Fórmulas., ...). Subclasse do
// ParagraphNode que guarda o rotulo e o id da AST.
// ============================================================

export type SerializedParagrafoNotaNode = Spread<
  { id?: string; rotulo?: unknown },
  SerializedParagraphNode
>

export class ParagrafoNotaNode extends ParagraphNode {
  __id?: string
  __rotulo?: unknown

  static getType(): string {
    return "paragrafo-nota"
  }

  static clone(node: ParagrafoNotaNode): ParagrafoNotaNode {
    const n = new ParagrafoNotaNode(node.__key)
    n.__id = node.__id
    n.__rotulo = node.__rotulo
    return n
  }

  constructor(key?: NodeKey) {
    super(key)
  }

  static importJSON(serialized: SerializedParagrafoNotaNode): ParagrafoNotaNode {
    const n = $createParagrafoNotaNode()
    n.__id = serialized.id
    n.__rotulo = serialized.rotulo
    return n
  }

  exportJSON(): SerializedParagrafoNotaNode {
    return { ...super.exportJSON(), id: this.__id, rotulo: this.__rotulo }
  }
}

export function $createParagrafoNotaNode(): ParagrafoNotaNode {
  return $applyNodeReplacement(new ParagrafoNotaNode())
}

export function $isParagrafoNotaNode(
  node: LexicalNode | null | undefined,
): node is ParagrafoNotaNode {
  return node instanceof ParagrafoNotaNode
}

// ============================================================
// Chamada (atenção, dia a dia, símbolos). Caixa colorida com texto.
// ============================================================

export type SerializedChamadaNode = Spread<{ id?: string; estilo: string }, SerializedElementNode>

export class ChamadaNode extends ElementNode {
  __id?: string
  __estilo: string

  static getType(): string {
    return "chamada"
  }

  static clone(node: ChamadaNode): ChamadaNode {
    const n = new ChamadaNode(node.__estilo, node.__key)
    n.__id = node.__id
    return n
  }

  constructor(estilo = "atencao", key?: NodeKey) {
    super(key)
    this.__estilo = estilo
  }

  static importJSON(serialized: SerializedChamadaNode): ChamadaNode {
    const n = $createChamadaNode(serialized.estilo)
    n.__id = serialized.id
    return n
  }

  exportJSON(): SerializedChamadaNode {
    return { ...super.exportJSON(), id: this.__id, estilo: this.__estilo }
  }

  createDOM(config: EditorConfig): HTMLElement {
    const el = document.createElement("div")
    const classes: Record<string, string> = {
      atencao: "border-amber-300/70 bg-amber-50 dark:border-amber-800/60 dark:bg-amber-950/30",
      diaadia:
        "border-emerald-300/70 bg-emerald-50 dark:border-emerald-800/60 dark:bg-emerald-950/30",
      simbolos: "border-violet-300/70 bg-violet-50 dark:border-violet-800/60 dark:bg-violet-950/30",
    }
    el.className = `na-imprime-caixa flex gap-2.5 rounded-xl border px-3.5 py-3 ${classes[this.__estilo] ?? classes.atencao}`
    return el
  }

  updateDOM(): boolean {
    return false
  }

  isInline(): boolean {
    return false
  }

  canBeEmpty(): boolean {
    return true
  }
}

export function $createChamadaNode(estilo = "atencao"): ChamadaNode {
  return $applyNodeReplacement(new ChamadaNode(estilo))
}

export function $isChamadaNode(node: LexicalNode | null | undefined): node is ChamadaNode {
  return node instanceof ChamadaNode
}

// ============================================================
// Lista (itens). Subclasses do ListNode/ListItemNode com id da AST.
// ============================================================

export class ListaNotaNode extends ListNode {
  __id?: string

  static getType(): string {
    return "lista-nota"
  }

  static clone(node: ListaNotaNode): ListaNotaNode {
    const n = new ListaNotaNode(node.getListType(), node.getStart(), node.__key)
    n.__id = node.__id
    return n
  }

  static importJSON(serialized: SerializedListNode): ListaNotaNode {
    const n = new ListaNotaNode(serialized.listType, serialized.start ?? 1)
    n.__id = (serialized as unknown as { id?: string }).id
    return n
  }

  exportJSON(): SerializedListNode {
    return { ...super.exportJSON(), id: this.__id } as unknown as SerializedListNode
  }
}

export function $createListaNotaNode(): ListaNotaNode {
  return $applyNodeReplacement(new ListaNotaNode("bullet", 1))
}

export function $isListaNotaNode(node: LexicalNode | null | undefined): node is ListaNotaNode {
  return node instanceof ListaNotaNode
}

export class ItemListaNotaNode extends ListItemNode {
  __id?: string

  static getType(): string {
    return "item-lista-nota"
  }

  static clone(node: ItemListaNotaNode): ItemListaNotaNode {
    const n = new ItemListaNotaNode(node.getValue(), node.getChecked(), node.__key)
    n.__id = node.__id
    return n
  }

  static importJSON(serialized: SerializedListItemNode): ItemListaNotaNode {
    const n = new ItemListaNotaNode(serialized.value ?? 1)
    n.__id = (serialized as unknown as { id?: string }).id
    return n
  }

  exportJSON(): SerializedListItemNode {
    return { ...super.exportJSON(), id: this.__id } as unknown as SerializedListItemNode
  }
}

export function $createItemListaNotaNode(): ItemListaNotaNode {
  return $applyNodeReplacement(new ItemListaNotaNode(1))
}

export function $isItemListaNotaNode(
  node: LexicalNode | null | undefined,
): node is ItemListaNotaNode {
  return node instanceof ItemListaNotaNode
}

// ============================================================
// Tabela (grade). Células contêm parágrafos. Estrutura:
// TabelaNotaNode > LinhaTabelaNotaNode > CelulaTabelaNotaNode > paragraph
// ============================================================

export type SerializedTabelaNode = Spread<
  { id?: string; comCabecalho: boolean },
  SerializedElementNode
>

export class TabelaNotaNode extends ElementNode {
  __id?: string
  __comCabecalho: boolean

  static getType(): string {
    return "tabela"
  }

  static clone(node: TabelaNotaNode): TabelaNotaNode {
    const n = new TabelaNotaNode(node.__comCabecalho, node.__key)
    n.__id = node.__id
    return n
  }

  constructor(comCabecalho = true, key?: NodeKey) {
    super(key)
    this.__comCabecalho = comCabecalho
  }

  static importJSON(serialized: SerializedTabelaNode): TabelaNotaNode {
    const n = $createTabelaNotaNode(serialized.comCabecalho)
    n.__id = serialized.id
    return n
  }

  exportJSON(): SerializedTabelaNode {
    return { ...super.exportJSON(), id: this.__id, comCabecalho: this.__comCabecalho }
  }

  createDOM(config: EditorConfig): HTMLElement {
    const el = document.createElement("div")
    el.className = "overflow-x-auto rounded-xl border border-stone-200 dark:border-stone-800"
    return el
  }

  updateDOM(): boolean {
    return false
  }

  isInline(): boolean {
    return false
  }

  canBeEmpty(): boolean {
    return true
  }
}

export function $createTabelaNotaNode(comCabecalho = true): TabelaNotaNode {
  return $applyNodeReplacement(new TabelaNotaNode(comCabecalho))
}

export function $isTabelaNotaNode(node: LexicalNode | null | undefined): node is TabelaNotaNode {
  return node instanceof TabelaNotaNode
}

export type SerializedLinhaTabelaNode = Spread<{ id?: string }, SerializedElementNode>

export class LinhaTabelaNotaNode extends ElementNode {
  __id?: string

  static getType(): string {
    return "linha-tabela-nota"
  }

  static clone(node: LinhaTabelaNotaNode): LinhaTabelaNotaNode {
    const n = new LinhaTabelaNotaNode(node.__key)
    n.__id = node.__id
    return n
  }

  static importJSON(serialized: SerializedLinhaTabelaNode): LinhaTabelaNotaNode {
    const n = $createLinhaTabelaNotaNode()
    n.__id = serialized.id
    return n
  }

  exportJSON(): SerializedLinhaTabelaNode {
    return { ...super.exportJSON(), id: this.__id }
  }

  createDOM(config: EditorConfig): HTMLElement {
    const el = document.createElement("div")
    el.className = "flex"
    return el
  }

  updateDOM(): boolean {
    return false
  }

  isInline(): boolean {
    return false
  }

  canBeEmpty(): boolean {
    return true
  }
}

export function $createLinhaTabelaNotaNode(): LinhaTabelaNotaNode {
  return $applyNodeReplacement(new LinhaTabelaNotaNode())
}

export function $isLinhaTabelaNotaNode(
  node: LexicalNode | null | undefined,
): node is LinhaTabelaNotaNode {
  return node instanceof LinhaTabelaNotaNode
}

export type SerializedCelulaTabelaNode = Spread<
  { id?: string; cabecalho?: boolean },
  SerializedElementNode
>

export class CelulaTabelaNotaNode extends ElementNode {
  __id?: string
  __cabecalho: boolean

  static getType(): string {
    return "celula-tabela-nota"
  }

  static clone(node: CelulaTabelaNotaNode): CelulaTabelaNotaNode {
    const n = new CelulaTabelaNotaNode(node.__cabecalho, node.__key)
    n.__id = node.__id
    return n
  }

  constructor(cabecalho = false, key?: NodeKey) {
    super(key)
    this.__cabecalho = cabecalho
  }

  static importJSON(serialized: SerializedCelulaTabelaNode): CelulaTabelaNotaNode {
    const n = $createCelulaTabelaNotaNode(serialized.cabecalho)
    n.__id = serialized.id
    return n
  }

  exportJSON(): SerializedCelulaTabelaNode {
    return { ...super.exportJSON(), id: this.__id, cabecalho: this.__cabecalho }
  }

  createDOM(config: EditorConfig): HTMLElement {
    const el = document.createElement("div")
    el.className = "min-w-[4.5rem] flex-1 border border-stone-200 px-2 py-1.5 dark:border-stone-800"
    if (this.__cabecalho) el.classList.add("font-bold", "bg-stone-100", "dark:bg-stone-800/70")
    return el
  }

  updateDOM(): boolean {
    return false
  }

  isInline(): boolean {
    return false
  }

  canBeEmpty(): boolean {
    return true
  }
}

export function $createCelulaTabelaNotaNode(cabecalho = false): CelulaTabelaNotaNode {
  return $applyNodeReplacement(new CelulaTabelaNotaNode(cabecalho))
}

export function $isCelulaTabelaNotaNode(
  node: LexicalNode | null | undefined,
): node is CelulaTabelaNotaNode {
  return node instanceof CelulaTabelaNotaNode
}

// ============================================================
// Caixa (copiar / exemplo / dica). Contêiner com cabeçalho (rótulo) e
// filhos-bloco. O rótulo é um child especial no início.
// ============================================================

export type SerializedCaixaNode = Spread<
  { id?: string; tipoCaixa: string; rotulo?: string },
  SerializedElementNode
>

export class CaixaNode extends ElementNode {
  __id?: string
  __tipoCaixa: string
  __rotulo: string

  static getType(): string {
    return "caixa"
  }

  static clone(node: CaixaNode): CaixaNode {
    const n = new CaixaNode(node.__tipoCaixa, node.__rotulo, node.__key)
    n.__id = node.__id
    return n
  }

  constructor(tipoCaixa = "copiar", rotulo = "", key?: NodeKey) {
    super(key)
    this.__tipoCaixa = tipoCaixa
    this.__rotulo = rotulo
  }

  static importJSON(serialized: SerializedCaixaNode): CaixaNode {
    const n = $createCaixaNode(serialized.tipoCaixa, serialized.rotulo)
    n.__id = serialized.id
    return n
  }

  exportJSON(): SerializedCaixaNode {
    return {
      ...super.exportJSON(),
      id: this.__id,
      tipoCaixa: this.__tipoCaixa,
      rotulo: this.__rotulo,
    }
  }

  createDOM(config: EditorConfig): HTMLElement {
    const el = document.createElement("div")
    const classes: Record<string, string> = {
      copiar: "border-2 border-dashed border-stone-400 dark:border-stone-600",
      exemplo:
        "border border-l-4 border-emerald-300/70 border-l-emerald-500 bg-emerald-50/70 dark:border-emerald-800/60 dark:bg-emerald-950/25",
      dica: "border border-l-4 border-amber-300/70 border-l-amber-500 bg-amber-50/70 dark:border-amber-800/60 dark:bg-amber-950/25",
    }
    el.className = `na-imprime-caixa rounded-2xl px-4 py-3 ${classes[this.__tipoCaixa] ?? classes.copiar}`
    return el
  }

  updateDOM(): boolean {
    return false
  }

  isInline(): boolean {
    return false
  }

  canBeEmpty(): boolean {
    return true
  }
}

export function $createCaixaNode(tipoCaixa = "copiar", rotulo = ""): CaixaNode {
  return $applyNodeReplacement(new CaixaNode(tipoCaixa, rotulo))
}

export function $isCaixaNode(node: LexicalNode | null | undefined): node is CaixaNode {
  return node instanceof CaixaNode
}

// ============================================================
// Cabeçalho de caixa (rótulo editável + badge). DecoratorNode que fica
// como primeiro filho da CaixaNode; a ponte o reconhece e o exclui da
// lista de filhos.
// ============================================================

export type SerializedCaixaCabecalhoNode = Spread<{ rotulo?: string }, SerializedLexicalNode>

export class CaixaCabecalhoNode extends DecoratorNode<ReactNode> {
  __rotulo: string

  static getType(): string {
    return "caixa-cabecalho"
  }

  static clone(node: CaixaCabecalhoNode): CaixaCabecalhoNode {
    return new CaixaCabecalhoNode(node.__rotulo, node.__key)
  }

  constructor(rotulo = "", key?: NodeKey) {
    super(key)
    this.__rotulo = rotulo
  }

  static importJSON(serialized: SerializedCaixaCabecalhoNode): CaixaCabecalhoNode {
    return $createCaixaCabecalhoNode(serialized.rotulo)
  }

  exportJSON(): SerializedCaixaCabecalhoNode {
    return { ...super.exportJSON(), rotulo: this.__rotulo }
  }

  createDOM(config: EditorConfig): HTMLElement {
    const el = document.createElement("div")
    el.className = "mb-2"
    return el
  }

  updateDOM(): boolean {
    return false
  }

  isInline(): boolean {
    return false
  }

  getRotulo(): string {
    return this.__rotulo
  }

  setRotulo(rotulo: string): void {
    const w = this.getWritable()
    w.__rotulo = rotulo
  }

  decorate(): ReactNode {
    return <CaixaCabecalhoComponent nodeKey={this.getKey()} />
  }
}

export function $createCaixaCabecalhoNode(rotulo = ""): CaixaCabecalhoNode {
  return $applyNodeReplacement(new CaixaCabecalhoNode(rotulo))
}

export function $isCaixaCabecalhoNode(
  node: LexicalNode | null | undefined,
): node is CaixaCabecalhoNode {
  return node instanceof CaixaCabecalhoNode
}

// ============================================================
// Figura. DecoratorNode: guarda url/legenda e renderiza a UI de imagem.
// ============================================================

export type SerializedFiguraNode = Spread<
  { id?: string; url: string; legenda: string },
  SerializedLexicalNode
>

export class FiguraNode extends DecoratorNode<ReactNode> {
  __id?: string
  __url: string
  __legenda: string

  static getType(): string {
    return "figura"
  }

  static clone(node: FiguraNode): FiguraNode {
    return new FiguraNode(node.__url, node.__legenda, node.__id, node.__key)
  }

  constructor(url = "", legenda = "", id?: string, key?: NodeKey) {
    super(key)
    this.__url = url
    this.__legenda = legenda
    this.__id = id
  }

  static importJSON(serialized: SerializedFiguraNode): FiguraNode {
    return $createFiguraNode(serialized.url, serialized.legenda, serialized.id)
  }

  exportJSON(): SerializedFiguraNode {
    return { ...super.exportJSON(), id: this.__id, url: this.__url, legenda: this.__legenda }
  }

  createDOM(config: EditorConfig): HTMLElement {
    const el = document.createElement("figure")
    el.className = "na-imprime-caixa my-1"
    return el
  }

  updateDOM(): boolean {
    return false
  }

  isInline(): boolean {
    return false
  }

  getUrl(): string {
    return this.__url
  }

  getLegenda(): string {
    return this.__legenda
  }

  decorate(): ReactNode {
    return <FiguraComponent nodeKey={this.getKey()} />
  }
}

export function $createFiguraNode(url = "", legenda = "", id?: string): FiguraNode {
  return $applyNodeReplacement(new FiguraNode(url, legenda, id))
}

export function $isFiguraNode(node: LexicalNode | null | undefined): node is FiguraNode {
  return node instanceof FiguraNode
}

// ============================================================
// TikZ. DecoratorNode: guarda codigo/legenda e renderiza a UI do diagrama.
// ============================================================

export type SerializedTikzNode = Spread<
  { id?: string; codigo: string; legenda: string },
  SerializedLexicalNode
>

export class TikzNode extends DecoratorNode<ReactNode> {
  __id?: string
  __codigo: string
  __legenda: string

  static getType(): string {
    return "tikz"
  }

  static clone(node: TikzNode): TikzNode {
    return new TikzNode(node.__codigo, node.__legenda, node.__id, node.__key)
  }

  constructor(codigo = "", legenda = "", id?: string, key?: NodeKey) {
    super(key)
    this.__codigo = codigo
    this.__legenda = legenda
    this.__id = id
  }

  static importJSON(serialized: SerializedTikzNode): TikzNode {
    return $createTikzNode(serialized.codigo, serialized.legenda, serialized.id)
  }

  exportJSON(): SerializedTikzNode {
    return { ...super.exportJSON(), id: this.__id, codigo: this.__codigo, legenda: this.__legenda }
  }

  createDOM(config: EditorConfig): HTMLElement {
    const el = document.createElement("figure")
    el.className = "na-imprime-caixa my-1"
    return el
  }

  updateDOM(): boolean {
    return false
  }

  isInline(): boolean {
    return false
  }

  getCodigo(): string {
    return this.__codigo
  }

  getLegenda(): string {
    return this.__legenda
  }

  decorate(): ReactNode {
    return <TikzComponent nodeKey={this.getKey()} />
  }
}

export function $createTikzNode(codigo = "", legenda = "", id?: string): TikzNode {
  return $applyNodeReplacement(new TikzNode(codigo, legenda, id))
}

export function $isTikzNode(node: LexicalNode | null | undefined): node is TikzNode {
  return node instanceof TikzNode
}

// ============================================================
// Exercícios. DecoratorNode: guarda rotulo/niveis/gabarito.
// ============================================================

export type SerializedExerciciosNode = Spread<
  { id?: string; rotulo: string; niveis: unknown; gabarito: string },
  SerializedLexicalNode
>

export class ExerciciosNode extends DecoratorNode<ReactNode> {
  __id?: string
  __rotulo: string
  __niveis: unknown
  __gabarito: string

  static getType(): string {
    return "exercicios"
  }

  static clone(node: ExerciciosNode): ExerciciosNode {
    return new ExerciciosNode(node.__rotulo, node.__niveis, node.__gabarito, node.__id, node.__key)
  }

  constructor(
    rotulo = "Exercícios propostos",
    niveis: unknown = [],
    gabarito = "",
    id?: string,
    key?: NodeKey,
  ) {
    super(key)
    this.__rotulo = rotulo
    this.__niveis = niveis
    this.__gabarito = gabarito
    this.__id = id
  }

  static importJSON(serialized: SerializedExerciciosNode): ExerciciosNode {
    return $createExerciciosNode(
      serialized.rotulo,
      serialized.niveis,
      serialized.gabarito,
      serialized.id,
    )
  }

  exportJSON(): SerializedExerciciosNode {
    return {
      ...super.exportJSON(),
      id: this.__id,
      rotulo: this.__rotulo,
      niveis: this.__niveis,
      gabarito: this.__gabarito,
    }
  }

  createDOM(config: EditorConfig): HTMLElement {
    const el = document.createElement("section")
    el.className =
      "na-imprime-caixa rounded-2xl border border-stone-200 bg-stone-50/80 dark:border-stone-800 dark:bg-stone-900/50"
    return el
  }

  updateDOM(): boolean {
    return false
  }

  isInline(): boolean {
    return false
  }

  getRotulo(): string {
    return this.__rotulo
  }

  decorate(): ReactNode {
    return <ExerciciosComponent nodeKey={this.getKey()} />
  }
}

export function $createExerciciosNode(
  rotulo = "Exercícios propostos",
  niveis: unknown = [],
  gabarito = "",
  id?: string,
): ExerciciosNode {
  return $applyNodeReplacement(new ExerciciosNode(rotulo, niveis, gabarito, id))
}

export function $isExerciciosNode(node: LexicalNode | null | undefined): node is ExerciciosNode {
  return node instanceof ExerciciosNode
}

// ============================================================
// Tema do Lexical para os blocos (herda o inline de lexical-nodes).
// ============================================================

export const TEMA_BLOCOS: EditorThemeClasses = {}

// Todos os nós de bloco para registrar no editor de documento único.
export const NOS_BLOCOS = [
  SecaoNode,
  ParagrafoNotaNode,
  ListaNotaNode,
  ItemListaNotaNode,
  TabelaNotaNode,
  LinhaTabelaNotaNode,
  CelulaTabelaNotaNode,
  ChamadaNode,
  CaixaNode,
  CaixaCabecalhoNode,
  FiguraNode,
  TikzNode,
  ExerciciosNode,
]
