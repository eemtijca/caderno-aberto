"use client"

// Editor WYSIWYG de um campo de texto curto (legenda, enunciado, etc.).
// Usa o Lexical com os nós inline (equação, resultado, dest) e a ponte
// para a string `texto` da AST. É o próprio preview: mostra o mesmo
// KaTeX/marcação que a leitura.

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
import { EquationNode, ResultadoNode, DestNode, TEMA_LEXICAL } from "@/lib/notas/lexical-nodes"
import { textoParaEstado, estadoParaTexto, type EstadoLexical } from "@/lib/notas/lexical-bridge"
import { BarraLexical } from "./barra-lexical"

export const NOS_LEXICAL = [LinkNode, EquationNode, ResultadoNode, DestNode]

export function EditorLexical({
  valor,
  onChange,
  placeholder,
  mono,
  ariaLabel,
}: {
  valor: string
  onChange: (v: string) => void
  placeholder?: string
  mono?: boolean
  ariaLabel?: string
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
        <SyncValorPlugin valor={valor} ultimoEmitidoRef={ultimoEmitidoRef} />
      </div>
    </LexicalComposer>
  )
}

// Mantém o editor sincronizado quando o valor muda por fora (ex.: quando o
// documento reescreve o campo). Não interfere enquanto o professor digita:
// só aplica quando o prop difere do que o próprio editor emitiu por último.
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
