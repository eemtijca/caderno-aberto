"use client"

// Nós de bloco do Lexical para o editor de documento único. Cada bloco da
// AST vira um nó do documento: seção, parágrafo, fórmula (equation), lista,
// tabela, chamada, figura, tikz, caixas (copiar/exemplo/dica) e exercícios.

import type {
  EditorConfig,
  EditorThemeClasses,
  LexicalNode,
  NodeKey,
  RangeSelection,
  SerializedElementNode,
  SerializedLexicalNode,
  SerializedParagraphNode,
  Spread,
  TextNode,
} from "lexical"
import {
  $applyNodeReplacement,
  $createNodeSelection,
  $isTextNode,
  $parseSerializedNode,
  $setSelection,
  DecoratorNode,
  ElementNode,
  ParagraphNode,
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

// Seção (título numerado). O número vem do contador CSS do
// contêiner do editor, igual à vista de leitura; Backspace no
// início converte a seção em parágrafo comum (modelo Notion).

export type SerializedSecaoNode = Spread<{ id?: string; tag: string }, SerializedElementNode>

export class SecaoNode extends ElementNode {
  __id?: string

  static getType(): string {
    return "secao"
  }

  static clone(node: SecaoNode): SecaoNode {
    const clone = new SecaoNode(node.__key)
    clone.__id = node.__id
    return clone
  }

  constructor(key?: NodeKey) {
    super(key)
  }

  static importJSON(serialized: SerializedSecaoNode): SecaoNode {
    const no = $createSecaoNode()
    no.__id = serialized.id
    return no
  }

  exportJSON(): SerializedSecaoNode {
    return { ...super.exportJSON(), id: this.__id, tag: "h2" }
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const el = document.createElement("h2")
    // classes idênticas às da leitura para o editor ser o próprio preview
    el.className =
      "na-secao flex items-baseline gap-3 border-t border-stone-200 pt-6 text-xl font-bold tracking-tight first:border-t-0 first:pt-0 sm:text-2xl dark:border-stone-800"
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

  // Enter dentro do título insere um parágrafo logo abaixo e move o cursor
  insertNewAfter(_selection: RangeSelection, _restoreSelection = true): ParagrafoNotaNode {
    const paragrafo = $createParagrafoNotaNode()
    this.insertAfter(paragrafo)
    paragrafo.selectStart()
    return paragrafo
  }

  // Backspace no início converte a seção em parágrafo, preservando o texto
  collapseAtStart(_selection: RangeSelection): boolean {
    const paragrafo = $createParagrafoNotaNode()
    const filhos = this.getChildren()
    paragrafo.append(...filhos)
    this.replace(paragrafo)
    paragrafo.selectStart()
    return true
  }
}

export function $createSecaoNode(): SecaoNode {
  return $applyNodeReplacement(new SecaoNode())
}

export function $isSecaoNode(node: LexicalNode | null | undefined): node is SecaoNode {
  return node instanceof SecaoNode
}

// Parágrafo com rótulo (Definição., Fórmulas., ...). Subclasse do
// ParagraphNode que guarda o rotulo e o id da AST; Enter divide em
// dois parágrafos do mesmo tipo e Backspace no início escapa de
// contêineres (caixas) em vez de travar o cursor.

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
    const clone = new ParagrafoNotaNode(node.__key)
    clone.__id = node.__id
    clone.__rotulo = node.__rotulo
    return clone
  }

  constructor(key?: NodeKey) {
    super(key)
  }

  static importJSON(serialized: SerializedParagrafoNotaNode): ParagrafoNotaNode {
    const no = $createParagrafoNotaNode()
    no.__id = serialized.id
    no.__rotulo = serialized.rotulo
    return no
  }

  exportJSON(): SerializedParagrafoNotaNode {
    return { ...super.exportJSON(), id: this.__id, rotulo: this.__rotulo }
  }

  // Enter divide o bloco em um novo parágrafo do mesmo tipo (nunca um p puro)
  insertNewAfter(rangeSelection: RangeSelection, restoreSelection: boolean): ParagrafoNotaNode {
    const paragrafo = $createParagrafoNotaNode()
    this.insertAfter(paragrafo)
    if (restoreSelection) paragrafo.selectStart()
    void rangeSelection
    return paragrafo
  }

  // Backspace no início: dentro de caixa move o parágrafo para fora; no
  // nível raiz com irmão não-paragraph à frente, apenas escapa para o fim dele
  collapseAtStart(): boolean {
    const pai = this.getParent()
    if ($isCaixaNode(pai) && pai.getFirstChild() === this) {
      this.insertBefore($createParagrafoNotaNode())
      return true
    }
    const anterior = this.getPreviousSibling()
    if (anterior === null) return false
    // bloco especial (figura, tikz, exercícios): Backspace o seleciona inteiro
    if (anterior instanceof DecoratorNode) {
      selecionarNo(anterior)
      return true
    }
    if (!this.isEmpty()) {
      const fim = fimDoBloco(anterior)
      if (fim !== null) {
        fim.select(fim.getTextContent().length, fim.getTextContent().length)
        return true
      }
    }
    return false
  }

  // mescla apenas com irmãos que também são parágrafos de nota
  canInsertSiblingsAfterMerge(): boolean {
    return true
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

// Devolve o último nó de texto de um bloco, para posicionar o cursor no fim dele.
function fimDoBloco(no: LexicalNode): TextNode | null {
  if ($isCaixaNode(no)) {
    const filhos = no.getChildren()
    for (let i = filhos.length - 1; i >= 0; i--) {
      const achado = fimDoBloco(filhos[i]!)
      if (achado !== null) return achado
    }
  }
  if ($isSecaoNode(no) || $isParagrafoNotaNode(no) || $isChamadaNode(no)) {
    const ultimo = getLastDescendantText(no)
    if (ultimo !== null) return ultimo
  }
  const anterior = no.getPreviousSibling()
  if (anterior !== null) return fimDoBloco(anterior)
  return null
}

// Percorre a árvore até o último nó de texto do elemento dado.
function getLastDescendantText(no: LexicalNode): TextNode | null {
  if (no instanceof ElementNode) {
    const filhos = no.getChildren()
    for (let i = filhos.length - 1; i >= 0; i--) {
      const achado = getLastDescendantText(filhos[i]!)
      if (achado !== null) return achado
    }
    return null
  }
  if (!$isTextNode(no)) return null
  return no
}

// cria uma seleção de nó sobre o bloco dado (segundo Backspace exclui)
function selecionarNo(no: LexicalNode): void {
  const sel = $createNodeSelection()
  sel.add(no.getKey())
  $setSelection(sel)
}

// Chamada (atenção, dia a dia, símbolos). O prefixo "Atenção:"
// vem do CSS via data-estilo, igual ao título da vista de leitura.

export type SerializedChamadaNode = Spread<{ id?: string; estilo: string }, SerializedElementNode>

export class ChamadaNode extends ElementNode {
  __id?: string
  __estilo: string

  static getType(): string {
    return "chamada"
  }

  static clone(node: ChamadaNode): ChamadaNode {
    const clone = new ChamadaNode(node.__estilo, node.__key)
    clone.__id = node.__id
    return clone
  }

  constructor(estilo = "atencao", key?: NodeKey) {
    super(key)
    this.__estilo = estilo
  }

  static importJSON(serialized: SerializedChamadaNode): ChamadaNode {
    const no = $createChamadaNode(serialized.estilo)
    no.__id = serialized.id
    return no
  }

  exportJSON(): SerializedChamadaNode {
    return { ...super.exportJSON(), id: this.__id, estilo: this.__estilo }
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const el = document.createElement("div")
    el.setAttribute("data-estilo", this.__estilo)
    // classes espelham a leitura; o prefixo e o fundo vêm do CSS por estilo
    el.className = "na-chamada na-imprime-caixa rounded-xl border px-3.5 py-3"
    return el
  }

  updateDOM(prevNode: this, dom: HTMLElement): boolean {
    if (prevNode.__estilo !== this.__estilo) {
      dom.setAttribute("data-estilo", this.__estilo)
      return false
    }
    return false
  }

  isInline(): boolean {
    return false
  }

  canBeEmpty(): boolean {
    return true
  }

  // Enter insere um parágrafo depois da chamada (sai do bloco)
  insertNewAfter(_selection: RangeSelection, _restoreSelection = true): ParagrafoNotaNode {
    const paragrafo = $createParagrafoNotaNode()
    this.insertAfter(paragrafo)
    paragrafo.selectStart()
    return paragrafo
  }

  // Backspace no início converte a chamada em parágrafo, preservando o texto
  collapseAtStart(_selection: RangeSelection): boolean {
    if (this.isEmpty()) {
      this.selectPrevious()
      this.remove()
      return true
    }
    const paragrafo = $createParagrafoNotaNode()
    const filhos = this.getChildren()
    paragrafo.append(...filhos)
    this.replace(paragrafo)
    paragrafo.selectStart()
    return true
  }
}

export function $createChamadaNode(estilo = "atencao"): ChamadaNode {
  return $applyNodeReplacement(new ChamadaNode(estilo))
}

export function $isChamadaNode(node: LexicalNode | null | undefined): node is ChamadaNode {
  return node instanceof ChamadaNode
}

// Lista (itens). Subclasses do ListNode/ListItemNode com id da AST.
// A ponte também aceita os tipos puros (list/listitem) que o
// pacote @lexical/list cria ao dividir itens com Enter.

export class ListaNotaNode extends ListNode {
  __id?: string

  static getType(): string {
    return "lista-nota"
  }

  static clone(node: ListaNotaNode): ListaNotaNode {
    const clone = new ListaNotaNode(node.getListType(), node.getStart(), node.__key)
    clone.__id = node.__id
    return clone
  }

  static importJSON(serialized: SerializedListNode): ListaNotaNode {
    const no = new ListaNotaNode(serialized.listType, serialized.start ?? 1)
    no.__id = (serialized as unknown as { id?: string }).id
    return no
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
    const clone = new ItemListaNotaNode(node.getValue(), node.getChecked(), node.__key)
    clone.__id = node.__id
    return clone
  }

  static importJSON(serialized: SerializedListItemNode): ItemListaNotaNode {
    const no = new ItemListaNotaNode(serialized.value ?? 1)
    no.__id = (serialized as unknown as { id?: string }).id
    return no
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

// Tabela (grade). Células contêm os nós inline da célula e o
// comportamento de Enter fica suspenso dentro da grade; as
// operações de linha/coluna ficam no menu de ações do bloco.

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
    const clone = new TabelaNotaNode(node.__comCabecalho, node.__key)
    clone.__id = node.__id
    return clone
  }

  constructor(comCabecalho = true, key?: NodeKey) {
    super(key)
    this.__comCabecalho = comCabecalho
  }

  static importJSON(serialized: SerializedTabelaNode): TabelaNotaNode {
    const no = $createTabelaNotaNode(serialized.comCabecalho)
    no.__id = serialized.id
    return no
  }

  exportJSON(): SerializedTabelaNode {
    return { ...super.exportJSON(), id: this.__id, comCabecalho: this.__comCabecalho }
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const el = document.createElement("div")
    el.setAttribute("role", "table")
    el.setAttribute("aria-label", "Tabela da nota")
    el.className =
      "na-imprime-caixa overflow-x-auto rounded-xl border border-stone-200 dark:border-stone-800"
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

  // Enter dentro da grade não cria bloco novo (a saída é por setas ou toque fora)
  insertNewAfter(_selection: RangeSelection, _restoreSelection = true): null {
    return null
  }

  getLinhas(): LinhaTabelaNotaNode[] {
    return this.getChildren().filter($isLinhaTabelaNotaNode)
  }

  getNumColunas(): number {
    const primeira = this.getLinhas()[0]
    return primeira ? primeira.getNumCelulas() : 0
  }

  // duplica a linha dada logo abaixo com o mesmo conteúdo serializado
  adicionarLinhaApos(referencia: LinhaTabelaNotaNode): void {
    const nova = $parseSerializedNode(referencia.exportJSON()) as LinhaTabelaNotaNode
    referencia.insertAfter(nova)
  }

  // remove a linha dita; mantém sempre ao menos uma linha
  removerLinha(referencia: LinhaTabelaNotaNode): void {
    if (this.getLinhas().length <= 1) return
    referencia.remove()
  }

  // adiciona uma célula em branco ao fim de cada linha
  adicionarColuna(): void {
    for (const linha of this.getLinhas()) {
      linha.append($createCelulaTabelaNotaNode())
    }
  }

  // remove a última coluna; mantém ao menos uma coluna
  removerColuna(): void {
    for (const linha of this.getLinhas()) {
      const celulas = linha.getCelulas()
      if (celulas.length > 1) celulas[celulas.length - 1]?.remove()
    }
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
    const clone = new LinhaTabelaNotaNode(node.__key)
    clone.__id = node.__id
    return clone
  }

  constructor(key?: NodeKey) {
    super(key)
  }

  static importJSON(serialized: SerializedLinhaTabelaNode): LinhaTabelaNotaNode {
    const no = $createLinhaTabelaNotaNode()
    no.__id = serialized.id
    return no
  }

  exportJSON(): SerializedLinhaTabelaNode {
    return { ...super.exportJSON(), id: this.__id }
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const el = document.createElement("div")
    el.setAttribute("role", "row")
    el.className = "na-linha-tabela flex"
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

  getCelulas(): CelulaTabelaNotaNode[] {
    return this.getChildren().filter($isCelulaTabelaNotaNode)
  }

  getNumCelulas(): number {
    return this.getCelulas().length
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
    const clone = new CelulaTabelaNotaNode(node.__cabecalho, node.__key)
    clone.__id = node.__id
    return clone
  }

  constructor(cabecalho = false, key?: NodeKey) {
    super(key)
    this.__cabecalho = cabecalho
  }

  static importJSON(serialized: SerializedCelulaTabelaNode): CelulaTabelaNotaNode {
    const no = $createCelulaTabelaNotaNode(serialized.cabecalho)
    no.__id = serialized.id
    return no
  }

  exportJSON(): SerializedCelulaTabelaNode {
    return { ...super.exportJSON(), id: this.__id, cabecalho: this.__cabecalho }
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const el = document.createElement("div")
    el.setAttribute("role", "cell")
    el.className =
      "na-celula-tabela min-w-[4.5rem] flex-1 border border-stone-200 px-2 py-1.5 dark:border-stone-800"
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

// Caixa (copiar / exemplo / dica). Contêiner com cabeçalho (rótulo)
// e filhos-bloco; Backspace no primeiro filho move o parágrafo
// para fora da caixa (escape estilo Notion).

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
    const clone = new CaixaNode(node.__tipoCaixa, node.__rotulo, node.__key)
    clone.__id = node.__id
    return clone
  }

  constructor(tipoCaixa = "copiar", rotulo = "", key?: NodeKey) {
    super(key)
    this.__tipoCaixa = tipoCaixa
    this.__rotulo = rotulo
  }

  static importJSON(serialized: SerializedCaixaNode): CaixaNode {
    const no = $createCaixaNode(serialized.tipoCaixa, serialized.rotulo)
    no.__id = serialized.id
    return no
  }

  exportJSON(): SerializedCaixaNode {
    return {
      ...super.exportJSON(),
      id: this.__id,
      tipoCaixa: this.__tipoCaixa,
      rotulo: this.__rotulo,
    }
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const el = document.createElement("div")
    el.setAttribute("data-tipo", this.__tipoCaixa)
    const classes: Record<string, string> = {
      copiar: "border-2 border-dashed border-stone-400 dark:border-stone-600",
      exemplo:
        "border border-l-4 border-emerald-300/70 border-l-emerald-500 bg-emerald-50/70 dark:border-emerald-800/60 dark:bg-emerald-950/25",
      dica: "border border-l-4 border-amber-300/70 border-l-amber-500 bg-amber-50/70 dark:border-amber-800/60 dark:bg-amber-950/25",
    }
    el.className = `na-caixa na-imprime-caixa rounded-2xl px-4 py-3 ${classes[this.__tipoCaixa] ?? classes.copiar}`
    return el
  }

  updateDOM(prevNode: this, dom: HTMLElement): boolean {
    if (prevNode.__tipoCaixa !== this.__tipoCaixa) {
      dom.setAttribute("data-tipo", this.__tipoCaixa)
      return false
    }
    return false
  }

  isInline(): boolean {
    return false
  }

  canBeEmpty(): boolean {
    return true
  }

  // Enter no fim da caixa sai para um parágrafo logo abaixo dela
  insertNewAfter(_selection: RangeSelection, _restoreSelection = true): ParagrafoNotaNode {
    const paragrafo = $createParagrafoNotaNode()
    this.insertAfter(paragrafo)
    paragrafo.selectStart()
    return paragrafo
  }
}

export function $createCaixaNode(tipoCaixa = "copiar", rotulo = ""): CaixaNode {
  return $applyNodeReplacement(new CaixaNode(tipoCaixa, rotulo))
}

export function $isCaixaNode(node: LexicalNode | null | undefined): node is CaixaNode {
  return node instanceof CaixaNode
}

// Cabeçalho de caixa (rótulo editável + badge). DecoratorNode que
// fica como primeiro filho da CaixaNode; a ponte o reconhece e o
// exclui da lista de filhos.

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

  createDOM(_config: EditorConfig): HTMLElement {
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

  isSelectable(): boolean {
    return false
  }

  getRotulo(): string {
    return this.__rotulo
  }

  setRotulo(rotulo: string): void {
    const writable = this.getWritable()
    writable.__rotulo = rotulo
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

// Figura. DecoratorNode: guarda url/legenda e renderiza a UI de
// imagem; selecionável para excluir via teclado.

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

  createDOM(_config: EditorConfig): HTMLElement {
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

  isSelectable(): boolean {
    return true
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

// TikZ. DecoratorNode: guarda codigo/legenda e renderiza a UI do
// diagrama; selecionável para excluir via teclado.

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

  createDOM(_config: EditorConfig): HTMLElement {
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

  isSelectable(): boolean {
    return true
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

// Exercícios. DecoratorNode: guarda rotulo/niveis/gabarito;
// selecionável para excluir via teclado.

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

  createDOM(_config: EditorConfig): HTMLElement {
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

  isSelectable(): boolean {
    return true
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

// Tema do Lexical para os blocos (listas herdando o inline de
// lexical-nodes) e registro dos nós do documento único.

export const TEMA_BLOCOS: EditorThemeClasses = {
  list: {
    ul: "na-lista-ul space-y-1.5",
    listitem: "na-item-lista",
  },
}

export const NOS_BLOCOS = [
  SecaoNode,
  ParagrafoNotaNode,
  ListaNotaNode,
  ItemListaNotaNode,
  ListNode,
  ListItemNode,
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
