"use client"

// Barra de formatação do editor WYSIWYG. Insere/aplica marcação sobre a
// seleção atual do Lexical. Substitui a antiga BarraInline (textareas)
// e mantém os mesmos atalhos pedagógicos: negrito, itálico, riscado,
// link, código, $fórmula$ inline e \resultado{...} / \dest{...}.

import { useCallback, useEffect, useState } from "react"
import { Bold, Code, Highlighter, Italic, Link2, Percent, Sigma, Strikethrough } from "lucide-react"
import {
  $createTextNode,
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  TextNode,
  type BaseSelection,
} from "lexical"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { $isLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link"
import { $createEquationNode } from "@/lib/notas/lexical-nodes"
import { $createResultadoNode, $createDestNode } from "@/lib/notas/lexical-nodes"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

function BotaoFormato({
  ativo,
  rotulo,
  icone: Icone,
  onClick,
}: {
  ativo?: boolean
  rotulo: string
  icone: typeof Bold
  onClick: () => void
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          aria-label={rotulo}
          aria-pressed={ativo}
          className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
            ativo
              ? "bg-primary/15 text-primary"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          }`}
        >
          <Icone className="h-3.5 w-3.5" aria-hidden />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        {rotulo}
      </TooltipContent>
    </Tooltip>
  )
}

export function BarraLexical() {
  const [editor] = useLexicalComposerContext()
  const [ativo, setAtivo] = useState({
    bold: false,
    italic: false,
    riscado: false,
    code: false,
    link: false,
  })

  // acompanha o estado da seleção para ativar/desativar os botões
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const sel = $getSelection()
        if (!$isRangeSelection(sel)) return
        const no = sel.anchor.getNode()
        const emLink = no.getTopLevelElement()?.getParent() !== null ? $isLinkNode(no) : false
        setAtivo({
          bold: sel.hasFormat("bold"),
          italic: sel.hasFormat("italic"),
          riscado: sel.hasFormat("strikethrough"),
          code: sel.hasFormat("code"),
          link: $isLinkNode(no) || $isLinkNode(no.getParent()),
        })
        void emLink
      })
    })
  }, [editor])

  const inserir = useCallback(
    (fn: (sel: BaseSelection) => void) => {
      editor.update(() => {
        const sel = $getSelection()
        if (sel) fn(sel)
      })
    },
    [editor],
  )

  const envolver = useCallback(
    (tipo: "resultado" | "dest") => {
      editor.update(() => {
        const sel = $getSelection()
        if (!$isRangeSelection(sel)) return
        const container = tipo === "resultado" ? $createResultadoNode() : $createDestNode()
        if (sel.isCollapsed()) {
          // sem seleção: insere placeholder e deixa o professor digitar
          const texto = $createTextNode(tipo === "resultado" ? "resposta" : "palavra")
          container.append(texto)
          sel.insertNodes([container])
          return
        }
        // move o texto selecionado para dentro do contêiner
        const nos = sel.getNodes()
        const alvo = sel.anchor.getNode()
        for (const n of nos) {
          container.append(n)
          void n
        }
        sel.insertNodes([container])
        // reposiciona o cursor no fim do contêiner
        container.selectEnd()
        void alvo
      })
    },
    [editor],
  )

  return (
    <div className="flex items-center gap-0.5" role="toolbar" aria-label="Formatação do texto">
      <BotaoFormato
        ativo={ativo.bold}
        rotulo="Negrito"
        icone={Bold}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
      />
      <BotaoFormato
        ativo={ativo.italic}
        rotulo="Itálico"
        icone={Italic}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
      />
      <BotaoFormato
        ativo={ativo.riscado}
        rotulo="Riscado"
        icone={Strikethrough}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough")}
      />
      <BotaoFormato
        ativo={ativo.code}
        rotulo="Código"
        icone={Code}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code")}
      />
      <BotaoFormato
        ativo={ativo.link}
        rotulo="Link"
        icone={Link2}
        onClick={() => {
          const url = window.prompt("Endereço do link (https://…)", "https://")
          if (url) editor.dispatchCommand(TOGGLE_LINK_COMMAND, url)
        }}
      />
      <BotaoFormato
        rotulo="Fórmula no texto"
        icone={Sigma}
        onClick={() =>
          inserir((sel) => {
            const eq = $createEquationNode("x^2", true)
            sel.insertNodes([eq])
          })
        }
      />
      <BotaoFormato
        rotulo="Resposta em destaque"
        icone={Highlighter}
        onClick={() => envolver("resultado")}
      />
      <BotaoFormato
        rotulo="Fórmula química"
        icone={Percent}
        onClick={() =>
          inserir((sel) => {
            const eq = $createEquationNode("\\ce{H2O}", true)
            sel.insertNodes([eq])
          })
        }
      />
    </div>
  )
}
