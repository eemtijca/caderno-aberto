"use client"

// Barra de formatação única do editor. Uma só instância (desktop: fixa no
// topo da área de edição; mobile: fixa acima do teclado) despacha comandos
// ao editor em foco via registro-ativo. Alvos de toque de 44px em ponteiro
// grosso, estados ativos acompanhando a seleção, desfazer/refazer e popover
// de link acessível (nada de window.prompt).

import { useCallback, useEffect, useState } from "react"
import {
  Bold,
  Code,
  Highlighter,
  Italic,
  Percent,
  Redo2,
  Sigma,
  Strikethrough,
  Undo2,
} from "lucide-react"
import {
  $createTextNode,
  $getSelection,
  $isRangeSelection,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  FORMAT_TEXT_COMMAND,
  REDO_COMMAND,
  UNDO_COMMAND,
  type BaseSelection,
  type LexicalEditor,
} from "lexical"
import { $isLinkNode } from "@lexical/link"
import {
  $createEquationNode,
  $createResultadoNode,
  $createDestNode,
} from "@/lib/notas/lexical-nodes"
import { MenuLink } from "./menu-link"
import { useAlturaTeclado } from "@/lib/editor/posicao"
import { useEditorAtivo } from "@/lib/editor/registro-ativo"
import { createPortal } from "react-dom"

interface EstadosFormato {
  bold: boolean
  italic: boolean
  riscado: boolean
  code: boolean
  link: boolean
}

const ESTADOS_INICIAIS: EstadosFormato = {
  bold: false,
  italic: false,
  riscado: false,
  code: false,
  link: false,
}

// hook com os estados de formatação da seleção atual do editor dado
function BotaoBarra({
  ativo,
  desabilitado,
  rotulo,
  icone: Icone,
  onClick,
}: {
  ativo?: boolean
  desabilitado?: boolean
  rotulo: string
  icone: typeof Bold
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={rotulo}
      aria-pressed={ativo}
      disabled={desabilitado}
      title={rotulo}
      onClick={onClick}
      onMouseDown={(e) => e.preventDefault()}
      className={`focus-visible:ring-ring flex h-9 w-9 items-center justify-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:outline-none pointer-coarse:h-11 pointer-coarse:w-11 ${
        ativo
          ? "bg-primary/15 text-primary"
          : "text-muted-foreground hover:bg-accent hover:text-foreground"
      } ${desabilitado ? "cursor-not-allowed opacity-40" : ""}`}
    >
      <Icone className="h-[1.15rem] w-[1.15rem]" aria-hidden />
    </button>
  )
}
function useFormatos(editor: LexicalEditor): EstadosFormato {
  const [estados, setEstados] = useState<EstadosFormato>(ESTADOS_INICIAIS)

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const sel = $getSelection()
        if (!$isRangeSelection(sel)) {
          setEstados(ESTADOS_INICIAIS)
          return
        }
        const no = sel.anchor.getNode()
        setEstados({
          bold: sel.hasFormat("bold"),
          italic: sel.hasFormat("italic"),
          riscado: sel.hasFormat("strikethrough"),
          code: sel.hasFormat("code"),
          link: $isLinkNode(no) || $isLinkNode(no.getParent()),
        })
      })
    })
  }, [editor])

  return estados
}

// hook com a disponibilidade de desfazer/refazer do histórico
function useHistorico(editor: LexicalEditor): { podeDesfazer: boolean; podeRefazer: boolean } {
  const [pode, setPode] = useState({ podeDesfazer: false, podeRefazer: false })

  useEffect(() => {
    const des = editor.registerCommand(
      CAN_UNDO_COMMAND,
      (v: boolean) => {
        setPode((p) => ({ ...p, podeDesfazer: v }))
        return false
      },
      COMMAND_PRIORITY_CRITICAL,
    )
    const ref = editor.registerCommand(
      CAN_REDO_COMMAND,
      (v: boolean) => {
        setPode((p) => ({ ...p, podeRefazer: v }))
        return false
      },
      COMMAND_PRIORITY_CRITICAL,
    )
    return () => {
      des()
      ref()
    }
  }, [editor])

  return pode
}

// conteúdo da barra (usado na versão desktop e na versão mobile acima do teclado)
export function ConteudoBarra({ editor }: { editor: LexicalEditor }) {
  const formatos = useFormatos(editor)
  const { podeDesfazer, podeRefazer } = useHistorico(editor)

  const inserir = useCallback(
    (fn: (sel: BaseSelection) => void) => {
      editor.update(() => {
        const sel = $getSelection()
        if (sel) fn(sel)
      })
    },
    [editor],
  )

  // insere fórmula vazia que abre direto em edição (inline ou modo químico)
  const inserirFormula = useCallback(
    (quimica: boolean) => {
      inserir((sel) => {
        const eq = $createEquationNode(quimica ? "\\ce{}" : "", true)
        sel.insertNodes([eq])
      })
    },
    [inserir],
  )

  // envolve a seleção em \resultado{...} ou \dest{...} preservando o conteúdo
  const envolver = useCallback(
    (tipo: "resultado" | "dest") => {
      editor.update(() => {
        const sel = $getSelection()
        if (!$isRangeSelection(sel)) return
        const inicio = sel.anchor.getNode().getTopLevelElement()
        const fim = sel.focus.getNode().getTopLevelElement()
        if (inicio === null || fim === null || inicio !== fim) return
        const container = tipo === "resultado" ? $createResultadoNode() : $createDestNode()
        if (sel.isCollapsed()) {
          const texto = $createTextNode(tipo === "resultado" ? "resposta" : "palavra")
          container.append(texto)
          sel.insertNodes([container])
          texto.select(0, texto.getTextContent().length)
          return
        }
        const extraidos = sel.extract()
        container.append(...extraidos)
        sel.insertNodes([container])
        container.selectEnd()
      })
    },
    [editor],
  )

  return (
    <div
      role="toolbar"
      aria-label="Formatação do texto"
      className="bg-popover text-popover-foreground flex max-w-full [scrollbar-width:none] items-center gap-0.5 overflow-x-auto rounded-xl border p-1 shadow-lg [&::-webkit-scrollbar]:hidden"
    >
      <div className="flex shrink-0 items-center gap-0.5">
        <BotaoBarra
          rotulo="Desfazer"
          icone={Undo2}
          desabilitado={!podeDesfazer}
          onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
        />
        <BotaoBarra
          rotulo="Refazer"
          icone={Redo2}
          desabilitado={!podeRefazer}
          onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
        />
      </div>
      <span aria-hidden className="bg-border mx-0.5 h-6 w-px shrink-0" />
      <div className="flex shrink-0 items-center gap-0.5">
        <BotaoBarra
          ativo={formatos.bold}
          rotulo="Negrito"
          icone={Bold}
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
        />
        <BotaoBarra
          ativo={formatos.italic}
          rotulo="Itálico"
          icone={Italic}
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
        />
        <BotaoBarra
          ativo={formatos.riscado}
          rotulo="Riscado"
          icone={Strikethrough}
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough")}
        />
        <BotaoBarra
          ativo={formatos.code}
          rotulo="Código"
          icone={Code}
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code")}
        />
        <MenuLink editor={editor} />
      </div>
      <span aria-hidden className="bg-border mx-0.5 h-6 w-px shrink-0" />
      <div className="flex shrink-0 items-center gap-0.5">
        <BotaoBarra rotulo="Fórmula no texto" icone={Sigma} onClick={() => inserirFormula(false)} />
        <BotaoBarra rotulo="Fórmula química" icone={Percent} onClick={() => inserirFormula(true)} />
        <BotaoBarra
          rotulo="Resposta em destaque"
          icone={Highlighter}
          onClick={() => envolver("resultado")}
        />
      </div>
    </div>
  )
}

// barra fixa do mobile: sobe junto com o teclado virtual (visualViewport)
// e pousa acima da navegação inferior quando o teclado está fechado
export function BarraMobile({ editor }: { editor: LexicalEditor }) {
  const alturaTeclado = useAlturaTeclado()
  const desloc = alturaTeclado > 0 ? alturaTeclado : 0

  // portal para o body: a animação de entrada da vista retém um transform
  // que viraria containing block do position: fixed
  return createPortal(
    <div
      className="fixed inset-x-0 z-40 lg:hidden"
      style={{
        bottom: `calc(${desloc}px + ${alturaTeclado > 0 ? "0px" : "3.5rem"} + env(safe-area-inset-bottom))`,
      }}
      data-barra-editor=""
    >
      <div className="flex justify-center px-2">
        <ConteudoBarra editor={editor} />
      </div>
    </div>,
    document.body,
  )
}

// barra do mobile ligada ao editor em foco (documento ou editor aninhado)
export function BarraAtivaMobile() {
  const editor = useEditorAtivo()
  if (!editor) return null
  return <BarraMobile editor={editor} />
}
