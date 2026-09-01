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
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { LinkNode } from "@lexical/link"
import {
  COMMAND_PRIORITY_NORMAL,
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND,
  type LexicalEditor,
} from "lexical"
import { EquationNode, ResultadoNode, DestNode, TEMA_LEXICAL } from "@/lib/notas/lexical-nodes"
import { NOS_BLOCOS } from "@/lib/notas/lexical-blocos"
import { blocosParaEstado, estadoParaBlocos } from "@/lib/notas/lexical-documento"
import { TEMA_BLOCOS } from "@/lib/notas/lexical-blocos"
import type { Bloco } from "@/lib/notas/tipos"
import { BarraLexical } from "./barra-lexical"
import { SlashCommandPlugin } from "./slash-command"
import { BubbleMenu } from "./bubble-menu"
import { GripPlugin } from "./grip"

export const NOS_DOCUMENTO = [LinkNode, EquationNode, ResultadoNode, DestNode, ...NOS_BLOCOS]

const TEMA = { ...TEMA_LEXICAL, ...TEMA_BLOCOS }

export function EditorNotaWysiwyg({
  blocos,
  onChange,
}: {
  blocos: Bloco[]
  onChange: (blocos: Bloco[]) => void
}) {
  const configInicial = {
    namespace: "nota",
    nodes: NOS_DOCUMENTO,
    theme: TEMA,
    onError: (erro: Error) => {
      // erro de parse de estado não deve derrubar o editor
      console.error(erro)
    },
    editorState: JSON.stringify(blocosParaEstado(blocos)),
  }

  return (
    <LexicalComposer initialConfig={configInicial}>
      <div className="editor-lexical relative w-full">
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
        <LinkPlugin validateUrl={(url) => /^https?:\/\/|^mailto:/.test(url)} />
        <OnChangePlugin
          onChange={(estado) => {
            onChange(estadoParaBlocos(estado.toJSON() as never))
          }}
        />
        <BarraLexical />
        <SlashCommandPlugin />
        <BubbleMenu />
        <GripPlugin />
      </div>
    </LexicalComposer>
  )
}
