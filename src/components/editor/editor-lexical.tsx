"use client"

// Editor WYSIWYG de um bloco de texto. Usa o Lexical por baixo, com os
// nós custom (equação, resultado, dest) e a ponte para a string `texto`
// da AST. É o próprio preview: o professor vê o mesmo KaTeX/marcação que
// o aluno vê na leitura.

import { useEffect, useRef } from "react"
import { LexicalComposer } from "@lexical/react/LexicalComposer"
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin"
import { ContentEditable } from "@lexical/react/LexicalContentEditable"
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary"
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin"
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin"
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { LinkNode } from "@lexical/link"
import {
  $getRoot,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  KEY_ENTER_COMMAND,
  type LexicalEditor,
  type LexicalNode,
} from "lexical"
import { EquationNode, ResultadoNode, DestNode, TEMA_LEXICAL } from "@/lib/notas/lexical-nodes"
import {
  textoParaEstado,
  estadoParaTexto,
  formulaParaEstado,
  estadoParaFormula,
  serializarLista,
  type EstadoLexical,
  type NoSerializado,
} from "@/lib/notas/lexical-bridge"
import { BarraLexical } from "./barra-lexical"

export const NOS_LEXICAL = [LinkNode, EquationNode, ResultadoNode, DestNode]

export function EditorLexical({
  valor,
  onChange,
  placeholder,
  mono,
  ariaLabel,
  aoEnter,
}: {
  valor: string
  onChange: (v: string) => void
  placeholder?: string
  mono?: boolean
  ariaLabel?: string
  /** Enter divide o bloco: recebe o texto antes e depois do cursor */
  aoEnter?: (antes: string, depois: string) => void
}) {
  const ultimoEmitidoRef = useRef(valor)
  const configInicial = {
    namespace: "nota",
    nodes: NOS_LEXICAL,
    theme: TEMA_LEXICAL,
    onError: (erro: Error) => {
      // erro de parse de estado não deve derrubar o editor
      console.error(erro)
    },
    editorState: JSON.stringify(textoParaEstado(valor)),
  }

  const mostraPlaceholder = placeholder ? (
    <div className="pointer-events-none absolute text-sm text-stone-400 dark:text-stone-600">
      {placeholder}
    </div>
  ) : null

  const contentEditavel = placeholder ? (
    <ContentEditable
      aria-label={ariaLabel}
      aria-placeholder={placeholder}
      placeholder={(isEditable: boolean) => (isEditable ? mostraPlaceholder : null)}
      className={`outline-none ${mono ? "font-mono text-[0.88rem]" : ""} min-h-[1.5rem]`}
    />
  ) : (
    <ContentEditable
      aria-label={ariaLabel}
      placeholder={null}
      className={`outline-none ${mono ? "font-mono text-[0.88rem]" : ""} min-h-[1.5rem]`}
    />
  )

  return (
    <LexicalComposer initialConfig={configInicial}>
      <div
        className={`editor-lexical hover:border-border/70 focus-within:border-border focus-within:bg-card w-full rounded-lg border border-transparent px-2 py-1.5 leading-relaxed transition-colors ${
          mono ? "font-mono text-[0.88rem]" : ""
        }`}
        style={{ minHeight: "2rem" }}
      >
        <RichTextPlugin
          contentEditable={contentEditavel}
          placeholder={null}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <LinkPlugin validateUrl={(url) => /^https?:\/\/|^mailto:/.test(url)} />
        <OnChangePlugin
          onChange={(estado) => {
            const texto = estadoParaTexto(estado.toJSON() as unknown as EstadoLexical)
            ultimoEmitidoRef.current = texto
            onChange(texto)
          }}
        />
        <BarraLexical />
        {aoEnter ? <SplitParagrafoPlugin aoEnter={aoEnter} /> : null}
        <SyncValorPlugin valor={valor} ultimoEmitidoRef={ultimoEmitidoRef} />
      </div>
    </LexicalComposer>
  )
}

// Mantém o editor sincronizado quando o valor muda por fora (ex.: uma
// divisão de parágrafo reescreve o texto do bloco atual). Não interfere
// enquanto o professor digita: só aplica quando o prop difere do que o
// próprio editor emitiu por último.
function SyncValorPlugin({
  valor,
  ultimoEmitidoRef,
}: {
  valor: string
  ultimoEmitidoRef: React.MutableRefObject<string>
}) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    if (valor === ultimoEmitidoRef.current) return
    ultimoEmitidoRef.current = valor
    const estado = editor.parseEditorState(JSON.stringify(textoParaEstado(valor)))
    editor.setEditorState(estado)
  }, [valor, editor, ultimoEmitidoRef])

  return null
}

// ============================================================
// Enter divide o parágrafo no cursor (modelo Notion):
// o texto antes vira este bloco e o depois abre um novo.
// ============================================================

function SplitParagrafoPlugin({ aoEnter }: { aoEnter: (antes: string, depois: string) => void }) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event) => {
        // Shift+Enter é quebra de linha dentro do bloco (padrão)
        if (event?.shiftKey) return false
        const divisao = dividirNoCursor(editor)
        if (!divisao) return false
        aoEnter(divisao.antes, divisao.depois)
        return true
      },
      COMMAND_PRIORITY_LOW,
    )
  }, [editor, aoEnter])

  return null
}

/** Divide o parágrafo atual no cursor em duas strings (`antes` e `depois`). */
function dividirNoCursor(editor: LexicalEditor): { antes: string; depois: string } | null {
  const estado = editor.getEditorState()
  let resultado: { antes: string; depois: string } | null = null

  estado.read(() => {
    const selecao = $getSelection()
    if (!$isRangeSelection(selecao)) return
    const ancora = selecao.anchor
    if (ancora.type !== "text") return
    const noTexto = ancora.getNode()
    const paragrafo = noTexto.getParent()
    if (!paragrafo) return
    const offset = ancora.offset
    const filhos = paragrafo.getChildren()

    // nós antes do cursor
    const antes: NoSerializado[] = []
    const depois: NoSerializado[] = []
    let passouCursor = false

    for (const filho of filhos) {
      const json = (filho as unknown as LexicalNode).exportJSON() as NoSerializado
      if (filho.getKey() === noTexto.getKey()) {
        // divide o nó de texto no offset do cursor
        const texto = noTexto.getTextContent()
        const antesDoCursor = texto.slice(0, offset)
        const depoisDoCursor = texto.slice(offset)
        const fmt = (noTexto.getFormat() ?? 0) as number
        if (antesDoCursor)
          antes.push({ type: "text", text: antesDoCursor, format: fmt, version: 1 })
        if (depoisDoCursor)
          depois.push({ type: "text", text: depoisDoCursor, format: fmt, version: 1 })
        passouCursor = true
      } else if (passouCursor) {
        depois.push(json)
      } else {
        antes.push(json)
      }
    }

    resultado = { antes: serializarLista(antes), depois: serializarLista(depois) }
  })

  return resultado
}

// ============================================================
// Editor WYSIWYG de fórmula em destaque ($$...$$). O bloco guarda
// `latex`; o editor mostra o KaTeX renderizado e o professor edita
// o código clicando na fórmula (mesmo EquationNode da leitura).
// ============================================================

export function EditorFormulaLexical({
  valor,
  onChange,
  placeholder,
}: {
  valor: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const configInicial = {
    namespace: "nota-formula",
    nodes: NOS_LEXICAL,
    theme: TEMA_LEXICAL,
    onError: (erro: Error) => {
      console.error(erro)
    },
    editorState: JSON.stringify(formulaParaEstado(valor)),
  }

  return (
    <LexicalComposer initialConfig={configInicial}>
      <div className="editor-lexical hover:border-border/70 focus-within:border-border focus-within:bg-card w-full rounded-lg border border-transparent px-2 py-1.5 transition-colors">
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              aria-label={placeholder ?? "Equação em destaque"}
              placeholder={null}
              className="outline-none"
            />
          }
          placeholder={null}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <OnChangePlugin
          onChange={(estado) => {
            onChange(estadoParaFormula(estado.toJSON() as unknown as EstadoLexical))
          }}
        />
      </div>
    </LexicalComposer>
  )
}
