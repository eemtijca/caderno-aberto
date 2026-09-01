"use client"

// Nós custom do Lexical para o editor WYSIWYG. Cada um corresponde a um
// trecho da marcação inline da AST (`texto`), de modo que o editor e a
// leitura (KaTeX/LaTeX/Markdown) compartilham o mesmo significado e o
// round-trip preserva o formato original.

import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  EditorThemeClasses,
  LexicalNode,
  NodeKey,
  SerializedElementNode,
  SerializedLexicalNode,
  Spread,
} from "lexical"
import { $applyNodeReplacement, $getNodeByKey, DecoratorNode, ElementNode } from "lexical"
import { useCallback, useEffect, useRef, useState } from "react"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { Matematica } from "@/components/notas/matematica"

// ============================================================
// Equação ($...$ inline e $$...$$ em destaque). Baseada no
// EquationNode oficial do playground do Lexical, adaptada para
// reutilizar o KaTeX pt-BR do app (matematica.tsx).
// ============================================================

export type SerializedEquationNode = Spread<
  {
    equation: string
    inline: boolean
  },
  SerializedLexicalNode
>

function $convertEquationElement(domNode: HTMLElement): null | DOMConversionOutput {
  const equation = domNode.getAttribute("data-lexical-equation") ?? ""
  const inline = domNode.getAttribute("data-lexical-inline") === "true"
  return { node: $createEquationNode(equation, inline) }
}

export class EquationNode extends DecoratorNode<React.ReactNode> {
  __equation: string
  __inline: boolean

  static getType(): string {
    return "equation"
  }

  static clone(node: EquationNode): EquationNode {
    return new EquationNode(node.__equation, node.__inline, node.__key)
  }

  constructor(equation = "", inline = false, key?: NodeKey) {
    super(key)
    this.__equation = equation
    this.__inline = inline
  }

  static importJSON(serializedNode: SerializedEquationNode): EquationNode {
    return $createEquationNode(serializedNode.equation, serializedNode.inline).updateFromJSON(
      serializedNode,
    )
  }

  exportJSON(): SerializedEquationNode {
    return {
      ...super.exportJSON(),
      equation: this.getEquation(),
      inline: this.__inline,
    }
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const el = document.createElement(this.__inline ? "span" : "div")
    el.className = this.__inline ? "lex-equation-inline" : "lex-equation-display"
    return el
  }

  updateDOM(prevNode: this): boolean {
    // Se o modo inline/display mudar, recria o host
    return this.__inline !== prevNode.__inline
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute("data-lexical-equation")) return null
        return { conversion: $convertEquationElement, priority: 2 }
      },
      span: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute("data-lexical-equation")) return null
        return { conversion: $convertEquationElement, priority: 1 }
      },
    }
  }

  exportDOM(): DOMExportOutput {
    const el = document.createElement(this.__inline ? "span" : "div")
    el.setAttribute("data-lexical-equation", this.__equation)
    el.setAttribute("data-lexical-inline", `${this.__inline}`)
    return { element: el }
  }

  getTextContent(): string {
    return this.__inline ? `$${this.__equation}$` : `$${this.__equation}$$`
  }

  isInline(): boolean {
    return this.__inline
  }

  getEquation(): string {
    return this.getLatest().__equation
  }

  setEquation(equation: string): void {
    const writable = this.getWritable()
    writable.__equation = equation
  }

  decorate(): React.ReactNode {
    return (
      <EquationComponent
        nodeKey={this.getKey()}
        equation={this.__equation}
        inline={this.__inline}
      />
    )
  }
}

export function $createEquationNode(equation = "", inline = false): EquationNode {
  return $applyNodeReplacement(new EquationNode(equation, inline))
}

export function $isEquationNode(node: LexicalNode | null | undefined): node is EquationNode {
  return node instanceof EquationNode
}

function EquationComponent({
  nodeKey,
  equation,
  inline,
}: {
  nodeKey: NodeKey
  equation: string
  inline: boolean
}) {
  const [editor] = useLexicalComposerContext()
  const [editando, setEditando] = useState(false)
  const [valor, setValor] = useState(equation)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const finalizar = useCallback(
    (restaurarSelecao = false) => {
      setEditando(false)
      editor.update(() => {
        const node = $getNodeByKey(nodeKey)
        if (node && $isEquationNode(node)) node.setEquation(valor)
        if (restaurarSelecao) node?.selectNext(0, 0)
      })
    },
    [editor, nodeKey, valor],
  )

  useEffect(() => {
    if (editando) inputRef.current?.focus()
  }, [editando])

  const tecla = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault()
      finalizar(true)
    } else if (e.key === "Backspace" && valor.length === 0) {
      e.preventDefault()
      editor.update(() => {
        const node = $getNodeByKey(nodeKey)
        if (node) node.remove()
      })
    } else {
      e.stopPropagation()
    }
  }

  if (editando) {
    return (
      <span className="border-primary/40 bg-background mx-1 inline-flex items-center gap-1 rounded-lg border px-1.5 py-0.5">
        <span className="text-muted-foreground font-mono text-[0.7rem]">{inline ? "$" : "$$"}</span>
        <input
          ref={inputRef}
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          onBlur={() => finalizar()}
          onKeyDown={tecla}
          aria-label="LaTeX da fórmula"
          className="font-mono text-[0.8rem] outline-none"
        />
        <span className="text-muted-foreground font-mono text-[0.7rem]">{inline ? "$" : "$$"}</span>
      </span>
    )
  }

  return (
    <span
      onDoubleClick={(e) => {
        e.preventDefault()
        setValor(equation)
        setEditando(true)
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault()
          setValor(equation)
          setEditando(true)
        }
      }}
      tabIndex={0}
      role="button"
      aria-label="Fórmula (clique para editar)"
      className={
        inline
          ? "lex-equation-inline"
          : "lex-equation-display na-formula-display my-1 block overflow-x-auto text-center"
      }
    >
      <Matematica latex={equation} bloco={!inline} />
    </span>
  )
}

// ============================================================
// Resultado (\resultado{...}) e Dest (\dest{...}). Contêineres
// inline que aceitam filhos (inclusive $matemática$) e preservam
// o comando LaTeX original na serialização para a AST.
// ============================================================

type SerializedResultadoNode = Spread<{ resultType: "resultado" | "dest" }, SerializedElementNode>

export class ResultadoNode extends ElementNode {
  static getType(): string {
    return "resultado"
  }

  static clone(node: ResultadoNode): ResultadoNode {
    return new ResultadoNode(node.__key)
  }

  constructor(key?: NodeKey) {
    super(key)
  }

  static importJSON(serialized: SerializedResultadoNode): ResultadoNode {
    if (serialized.resultType === "dest") return $createDestNode()
    return $createResultadoNode()
  }

  exportJSON(): SerializedResultadoNode {
    return { ...super.exportJSON(), resultType: "resultado" }
  }

  static importDOM(): DOMConversionMap | null {
    return {
      span: (domNode: HTMLElement) => {
        if (domNode.getAttribute("data-lex-result") !== "resultado") return null
        return { conversion: () => ({ node: $createResultadoNode() }), priority: 1 }
      },
    }
  }

  exportDOM(): DOMExportOutput {
    const el = document.createElement("span")
    el.setAttribute("data-lex-result", "resultado")
    return { element: el }
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const el = document.createElement("span")
    el.className = "font-semibold text-rose-700 dark:text-rose-300"
    return el
  }

  updateDOM(): boolean {
    return false
  }

  isInline(): boolean {
    return true
  }

  canBeEmpty(): boolean {
    return true
  }
}

export class DestNode extends ElementNode {
  static getType(): string {
    return "dest"
  }

  static clone(node: DestNode): DestNode {
    return new DestNode(node.__key)
  }

  constructor(key?: NodeKey) {
    super(key)
  }

  static importJSON(serialized: SerializedResultadoNode): DestNode {
    if (serialized.resultType === "resultado") return $createResultadoNode()
    return $createDestNode()
  }

  exportJSON(): SerializedResultadoNode {
    return { ...super.exportJSON(), resultType: "dest" }
  }

  static importDOM(): DOMConversionMap | null {
    return {
      span: (domNode: HTMLElement) => {
        if (domNode.getAttribute("data-lex-result") !== "dest") return null
        return { conversion: () => ({ node: $createDestNode() }), priority: 1 }
      },
    }
  }

  exportDOM(): DOMExportOutput {
    const el = document.createElement("span")
    el.setAttribute("data-lex-result", "dest")
    return { element: el }
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const el = document.createElement("span")
    el.className = "font-bold"
    return el
  }

  updateDOM(): boolean {
    return false
  }

  isInline(): boolean {
    return true
  }

  canBeEmpty(): boolean {
    return true
  }
}

export function $createResultadoNode(): ResultadoNode {
  return $applyNodeReplacement(new ResultadoNode())
}

export function $isResultadoNode(node: LexicalNode | null | undefined): node is ResultadoNode {
  return node instanceof ResultadoNode
}

export function $createDestNode(): DestNode {
  return $applyNodeReplacement(new DestNode())
}

export function $isDestNode(node: LexicalNode | null | undefined): node is DestNode {
  return node instanceof DestNode
}

// Tema do Lexical. Mantém as classes iguais às da leitura para não
// haver discrepância entre o que o professor digita e o que vê.
export const TEMA_LEXICAL: EditorThemeClasses = {
  text: {
    bold: "font-bold",
    italic: "italic",
    strikethrough: "line-through",
    underline: "underline",
    code: "rounded bg-stone-200 px-1 py-0.5 font-mono text-[0.9em] dark:bg-stone-800",
  },
  link: "text-brand-700 underline dark:text-brand-300",
}
