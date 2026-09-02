"use client"

// Editor WYSIWYG de um campo de texto curto (legenda, enunciado, etc.). Usa
// o Lexical com os nós inline (equação, resultado, dest) e a ponte para a
// string `texto` da AST. Sem toolbar própria: no mobile a barra única do
// registro-ativo se liga a este editor quando ele recebe foco.

import { useEffect, useMemo, useRef } from "react"
import { LexicalComposer } from "@lexical/react/LexicalComposer"
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin"
import { ContentEditable } from "@lexical/react/LexicalContentEditable"
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary"
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin"
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin"
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { useLexicalEditable } from "@lexical/react/useLexicalEditable"
import { LinkNode } from "@lexical/link"
import { EquationNode, ResultadoNode, DestNode, TEMA_LEXICAL } from "@/lib/notas/lexical-nodes"
import { textoParaEstado, estadoParaTexto, type EstadoLexical } from "@/lib/notas/lexical-bridge"
import { ligarEventosDeFoco } from "@/lib/editor/registro-ativo"

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
  const editavel = useLexicalEditable()

  const configInicial = useMemo(
    () => ({
      namespace: "campo-nota",
      nodes: NOS_LEXICAL,
      theme: TEMA_LEXICAL,
      onError: (erro: Error) => {
        // erro de parse de estado não deve derrubar o editor
        console.error(erro)
      },
      editorState: JSON.stringify(textoParaEstado(valor)),
    }),
    // o estado inicial só entra na montagem do composer; o sync externo
    // fica por conta do SyncValorPlugin
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const mostraPlaceholder =
    placeholder && editavel ? (
      <div
        aria-hidden
        data-placeholder-campo=""
        className="text-muted-foreground/70 pointer-events-none absolute inset-x-2 top-1.5 truncate text-sm"
      >
        {placeholder}
      </div>
    ) : null

  return (
    <LexicalComposer initialConfig={configInicial}>
      <div
        className={`editor-lexical hover:border-border/70 focus-within:border-border focus-within:bg-card relative w-full rounded-lg border border-transparent px-2 py-1.5 leading-relaxed transition-colors ${
          mono ? "font-mono text-[0.88rem]" : ""
        }`}
      >
        {mostraPlaceholder}
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              aria-label={ariaLabel}
              placeholder={null}
              className={`min-h-[1.5rem] outline-none ${mono ? "font-mono text-[0.88rem]" : ""}`}
            />
          }
          placeholder={null}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <LinkPlugin validateUrl={(url) => /^https?:\/\/|^mailto:|^\/|^#/.test(url)} />
        <OnChangePlugin
          ignoreSelectionChange
          onChange={(estado) => {
            const texto = estadoParaTexto(estado.toJSON() as unknown as EstadoLexical)
            ultimoEmitidoRef.current = texto
            onChange(texto)
          }}
        />
        <VazioPlugin placeholder={mostraPlaceholder} />
        <FocoPlugin />
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
  ultimoEmitidoRef: React.RefObject<string>
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

// Oculta o placeholder customizado quando o campo tem conteúdo.
function VazioPlugin({ placeholder }: { placeholder: React.ReactNode }) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    if (!placeholder) return
    const esconder = (): void => {
      const raiz = editor.getRootElement()
      if (!raiz) return
      const temTexto = raiz.textContent !== null && raiz.textContent.trim() !== ""
      const alvo = raiz.parentElement?.querySelector("[data-placeholder-campo]")
      if (alvo instanceof HTMLElement) alvo.hidden = temTexto
    }
    esconder()
    return editor.registerUpdateListener(esconder)
  }, [editor, placeholder])

  return null
}

// registra o editor no controle da barra única assim que a raiz existe
function FocoPlugin() {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    const limpezas = new Set<() => void>()
    const removerRoot = editor.registerRootListener((raiz) => {
      if (raiz !== null) limpezas.add(ligarEventosDeFoco(editor, raiz))
    })
    return () => {
      removerRoot()
      for (const limpar of limpezas) limpar()
      limpezas.clear()
    }
  }, [editor])

  return null
}
