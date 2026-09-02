"use client"

// Editor de documento único (Fase B/C). Um único LexicalComposer contém
// todos os blocos da nota como nós; o editor é o próprio preview. Enter
// divide o parágrafo em dois blocos irmãos (modelo Notion), Shift+Enter
// quebra a linha dentro do bloco. O onChange serializa o documento de
// volta para a AST (estadoParaBlocos) e o autosave segue inalterado.

import { useEffect, useRef, useState } from "react"
import { LexicalComposer } from "@lexical/react/LexicalComposer"
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin"
import { ContentEditable } from "@lexical/react/LexicalContentEditable"
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary"
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin"
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin"
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin"
import { ListPlugin } from "@lexical/react/LexicalListPlugin"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { LinkNode } from "@lexical/link"
import {
  $getRoot,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_HIGH,
  KEY_TAB_COMMAND,
} from "lexical"
import { EquationNode, ResultadoNode, DestNode, TEMA_LEXICAL } from "@/lib/notas/lexical-nodes"
import {
  NOS_BLOCOS,
  TEMA_BLOCOS,
  $isSecaoNode,
  $createParagrafoNotaNode,
} from "@/lib/notas/lexical-blocos"
import { blocosParaEstado, estadoParaBlocos } from "@/lib/notas/lexical-documento"
import { ligarEventosDeFoco } from "@/lib/editor/registro-ativo"
import type { Bloco } from "@/lib/notas/tipos"
import { SlashCommandPlugin } from "./slash-command"
import { BubbleMenu } from "./bubble-menu"
import { HandleBlocoPlugin } from "./grip"

export const NOS_DOCUMENTO = [LinkNode, EquationNode, ResultadoNode, DestNode, ...NOS_BLOCOS]

const TEMA = { ...TEMA_LEXICAL, ...TEMA_BLOCOS }

export function EditorNotaWysiwyg({
  blocos,
  onChange,
}: {
  blocos: Bloco[]
  onChange: (blocos: Bloco[]) => void
}) {
  // o estado inicial entra uma única vez na montagem do composer; depois
  // o documento é a fonte da verdade (o editor nunca reescreve o próprio estado)
  const [inicial] = useState(() => JSON.stringify(blocosParaEstado(blocos)))
  void blocos

  const configInicial = {
    namespace: "nota",
    nodes: NOS_DOCUMENTO,
    theme: TEMA,
    onError: (erro: Error) => {
      // erro de parse de estado não deve derrubar o editor
      console.error(erro)
    },
    editorState: inicial,
  }

  return (
    <LexicalComposer initialConfig={configInicial}>
      <CorpoDocumento onChange={onChange} />
    </LexicalComposer>
  )
}

// corpo do editor montado dentro do composer: área de conteúdo + plugins
function CorpoDocumento({ onChange }: { onChange: (blocos: Bloco[]) => void }) {
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={containerRef}
      className="editor-lexical relative w-full pl-11 sm:pl-12"
      data-editor-nota=""
    >
      <RichTextPlugin
        contentEditable={
          <ContentEditable
            aria-label="Nota (documento único)"
            placeholder={null}
            className="outline-none"
          />
        }
        placeholder={null}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <HistoryPlugin />
      <ListPlugin hasStrictIndent />
      <LinkPlugin validateUrl={(url) => /^https?:\/\/|^mailto:|^\/|^#/.test(url)} />
      <OnChangePlugin
        ignoreSelectionChange
        onChange={(estado) => {
          onChange(estadoParaBlocos(estado.toJSON() as never))
        }}
      />
      <PlaceholderDocumento />
      <GuardaRaizPlugin />
      <TabsEmListaPlugin />
      <FocoDocumentoPlugin />
      <SlashCommandPlugin ancoraRef={containerRef} />
      <BubbleMenu ancoraRef={containerRef} />
      <HandleBlocoPlugin ancoraRef={containerRef} />
    </div>
  )
}

// placeholder do documento vazio ("digite / para inserir blocos")
function PlaceholderDocumento() {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    const atualizar = (): void => {
      const raiz = editor.getRootElement()
      const container = raiz?.closest("[data-editor-nota]")
      if (!(container instanceof HTMLElement)) return
      const vazio = (raiz?.textContent?.trim() ?? "x") === "" && (raiz?.childElementCount ?? 0) <= 1
      container.toggleAttribute("data-vazio", vazio)
    }
    atualizar()
    return editor.registerUpdateListener(atualizar)
  }, [editor])

  return null
}

// proteções da raiz: nunca deixa o documento sem bloco editável e remove
// seções que ficaram vazias quando o cursor já saiu delas (modelo Notion)
function GuardaRaizPlugin() {
  const [editor] = useLexicalComposerContext()
  const guardando = useRef(false)

  useEffect(() => {
    return editor.registerUpdateListener(() => {
      if (guardando.current) return
      guardando.current = true
      editor.update(() => {
        const sel = $getSelection()
        const chaveSel = $isRangeSelection(sel) ? sel.anchor.getNode().getKey() : null
        const raiz = $getRoot()
        const filhos = raiz.getChildren()
        if (filhos.length === 0) {
          raiz.append($createParagrafoNotaNode())
        }
        for (const filho of raiz.getChildren()) {
          if (!$isSecaoNode(filho)) continue
          if (filho.getTextContent().trim() !== "") continue
          const dentro = chaveSel !== null && contemChave(filho, chaveSel)
          if (dentro) continue
          if (filhos.length === 1) {
            filho.replace($createParagrafoNotaNode())
          } else {
            filho.remove()
          }
        }
      })
      guardando.current = false
    })
  }, [editor])

  return null
}

// verifica se a chave pertence ao nó ou a algum descendente dele
function contemChave(
  no: { getKey: () => string; getChildren?: () => { getKey: () => string }[] },
  chave: string,
): boolean {
  if (no.getKey() === chave) return true
  const filhos = no.getChildren?.() ?? []
  for (const filho of filhos) {
    if (contemChave(filho, chave)) return true
  }
  return false
}

// bloca Tab dentro de listas: a AST só representa itens planos (sem aninhamento)
function TabsEmListaPlugin() {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return editor.registerCommand(
      KEY_TAB_COMMAND,
      () => {
        const sel = $getSelection()
        if (!$isRangeSelection(sel)) return false
        const pai = sel.anchor.getNode().getParent()
        return pai !== null && (pai.getType() === "item-lista-nota" || pai.getType() === "listitem")
      },
      COMMAND_PRIORITY_HIGH,
    )
  }, [editor])

  return null
}

// registra o documento no controle da barra única (mobile) assim que a raiz existe
function FocoDocumentoPlugin() {
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
