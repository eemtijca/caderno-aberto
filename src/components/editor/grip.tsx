"use client"

// Handle de bloco (modelo Notion): puxador "⋮⋮" à esquerda do bloco que
// contém o cursor. No desktop arrasta para reordenar (HTML5 drag & drop
// com linha de destino); em qualquer dispositivo, o toque/clique abre o
// menu de ações do bloco (duplicar, mover, excluir, linhas/colunas da
// tabela). Sem dependência do plugin experimental nem de querySelector
// global: a âncora é o próprio contêiner do editor via ref.

import { useCallback, useEffect, useRef, useState, type RefObject } from "react"
import {
  $getNearestNodeFromDOMNode,
  $getNodeByKey,
  $getSelection,
  $isRangeSelection,
  $parseSerializedNode,
  COMMAND_PRIORITY_LOW,
  KEY_ESCAPE_COMMAND,
  type LexicalNode,
} from "lexical"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ArrowDown, ArrowUp, CopyPlus, GripVertical, Minus, Plus, Trash2 } from "lucide-react"
import { $isLinhaTabelaNotaNode, $isTabelaNotaNode } from "@/lib/notas/lexical-blocos"

// ação do menu de bloco com rótulo, ícone e execução
interface AcaoBloco {
  rotulo: string
  icone: typeof Trash2
  perigo?: boolean
  executar: () => void
}

export function HandleBlocoPlugin({ ancoraRef }: { ancoraRef: RefObject<HTMLDivElement | null> }) {
  const [editor] = useLexicalComposerContext()
  const [chaveBloco, setChaveBloco] = useState<string | null>(null)
  const [topo, setTopo] = useState(0)
  const [menuAberto, setMenuAberto] = useState(false)
  const [linhaDestino, setLinhaDestino] = useState<number | null>(null)
  const arrastandoRef = useRef<string | null>(null)

  // localiza o bloco de nível raiz (e a linha da tabela) que contém o cursor
  const rastrear = useCallback(() => {
    const raiz = editor.getRootElement()
    const container = ancoraRef.current
    if (raiz === null || container === null) return
    const info = editor.getEditorState().read(() => {
      const sel = $getSelection()
      if (!$isRangeSelection(sel)) return null
      // sobe até o último nó antes da raiz (o bloco de nível superior)
      let atual: LexicalNode | null = sel.anchor.getNode()
      let ultimo: LexicalNode | null = null
      while (atual !== null) {
        if (atual.getType() === "root") break
        ultimo = atual
        atual = atual.getParent()
      }
      return ultimo !== null ? ultimo.getKey() : null
    })
    if (info === null) {
      setChaveBloco(null)
      return
    }
    const el = editor.getElementByKey(info)
    if (el === null) {
      setChaveBloco(null)
      return
    }
    setChaveBloco(info)
    setTopo(el.offsetTop)
  }, [editor, ancoraRef])

  // atualiza a posição do handle a cada mudança do documento (a posição
  // inicial sem seleção já é o padrão do estado: handle oculto)
  useEffect(() => {
    return editor.registerUpdateListener(() => {
      if (arrastandoRef.current !== null) return
      rastrear()
    })
  }, [editor, rastrear])

  // arrastar (desktop): guarda o bloco de origem e desenha a linha de destino
  useEffect(() => {
    const container = ancoraRef.current
    if (container === null) return
    const aoPassar = (e: DragEvent): void => {
      if (arrastandoRef.current === null || e.dataTransfer === null) return
      e.preventDefault()
      e.dataTransfer.dropEffect = "move"
      const alvo = blocoPeloPonto(editor, e.clientY)
      if (alvo === null) return
      const antes =
        e.clientY < alvo.element.getBoundingClientRect().top + alvo.element.offsetHeight / 2
      setLinhaDestino(
        antes ? alvo.element.offsetTop - 2 : alvo.element.offsetTop + alvo.element.offsetHeight + 2,
      )
    }
    const aoSoltar = (e: DragEvent): void => {
      if (arrastandoRef.current === null || e.dataTransfer === null) return
      e.preventDefault()
      const origem = arrastandoRef.current
      const alvo = blocoPeloPonto(editor, e.clientY)
      if (alvo !== null && alvo.chave !== origem) {
        const antes =
          e.clientY < alvo.element.getBoundingClientRect().top + alvo.element.offsetHeight / 2
        editor.update(() => {
          const movido = $getNodeByKey(origem)
          const referencia = $getNodeByKey(alvo.chave)
          if (movido === null || referencia === null) return
          const destino = antes ? referencia.getPreviousSibling() : referencia
          if (destino !== null && destino.getKey() !== movido.getKey()) {
            destino.insertBefore(movido)
          } else if (destino === null) {
            referencia.insertBefore(movido)
          }
        })
      }
      arrastandoRef.current = null
      setLinhaDestino(null)
    }
    const aoTerminar = (): void => {
      arrastandoRef.current = null
      setLinhaDestino(null)
    }
    container.addEventListener("dragover", aoPassar)
    container.addEventListener("drop", aoSoltar)
    container.addEventListener("dragend", aoTerminar)
    return () => {
      container.removeEventListener("dragover", aoPassar)
      container.removeEventListener("drop", aoSoltar)
      container.removeEventListener("dragend", aoTerminar)
    }
  }, [editor, ancoraRef])

  // Esc fecha o menu de ações do bloco
  useEffect(() => {
    if (!menuAberto) return
    return editor.registerCommand(
      KEY_ESCAPE_COMMAND,
      () => {
        setMenuAberto(false)
        return false
      },
      COMMAND_PRIORITY_LOW,
    )
  }, [menuAberto, editor])

  // linha da tabela com o cursor (para as ações de linha/coluna)
  const linhaAtual = (): string | null => {
    if (chaveBloco === null) return null
    return editor.getEditorState().read(() => {
      const bloco = $getNodeByKey(chaveBloco)
      if (bloco === null || !$isTabelaNotaNode(bloco)) return null
      const sel = $getSelection()
      if (!$isRangeSelection(sel)) return null
      let no: LexicalNode | null = sel.anchor.getNode()
      while (no !== null) {
        if ($isLinhaTabelaNotaNode(no)) return no.getKey()
        no = no.getParent()
      }
      return null
    })
  }

  // monta as ações disponíveis para o bloco atual
  const acoes = (): AcaoBloco[] => {
    if (chaveBloco === null) return []
    const basicas: AcaoBloco[] = [
      {
        rotulo: "Duplicar bloco",
        icone: CopyPlus,
        executar: () => {
          const chave = chaveBloco
          editor.update(() => {
            const no = $getNodeByKey(chave)
            if (no === null) return
            const copia = $parseSerializedNode(no.exportJSON()) as LexicalNode
            no.insertAfter(copia)
          })
        },
      },
      {
        rotulo: "Mover para cima",
        icone: ArrowUp,
        executar: () => {
          const chave = chaveBloco
          editor.update(() => {
            const no = $getNodeByKey(chave)
            const anterior = no?.getPreviousSibling() ?? null
            if (no !== null && anterior !== null) anterior.insertBefore(no)
          })
        },
      },
      {
        rotulo: "Mover para baixo",
        icone: ArrowDown,
        executar: () => {
          const chave = chaveBloco
          editor.update(() => {
            const no = $getNodeByKey(chave)
            const proximo = no?.getNextSibling() ?? null
            if (no !== null && proximo !== null) proximo.insertAfter(no)
          })
        },
      },
    ]
    const tabela: AcaoBloco[] = editor.getEditorState().read(() => {
      const bloco = $getNodeByKey(chaveBloco)
      if (bloco === null || !$isTabelaNotaNode(bloco)) return []
      const linhaRef = linhaAtual()
      return [
        {
          rotulo: "Linha abaixo",
          icone: Plus,
          executar: () => {
            editor.update(() => {
              const no = $getNodeByKey(chaveBloco)
              const linha = $getNodeByKey(linhaRef ?? "")
              if (no === null || !$isTabelaNotaNode(no)) return
              const referencia =
                linha !== null && $isLinhaTabelaNotaNode(linha)
                  ? linha
                  : (no.getLinhas()[no.getLinhas().length - 1] ?? null)
              if (referencia !== null) no.adicionarLinhaApos(referencia)
            })
          },
        },
        {
          rotulo: "Remover linha",
          icone: Minus,
          executar: () => {
            editor.update(() => {
              const no = $getNodeByKey(chaveBloco)
              const linha = $getNodeByKey(linhaRef ?? "")
              if (no === null || !$isTabelaNotaNode(no)) return
              const referencia =
                linha !== null && $isLinhaTabelaNotaNode(linha)
                  ? linha
                  : (no.getLinhas()[no.getLinhas().length - 1] ?? null)
              if (referencia !== null) no.removerLinha(referencia)
            })
          },
        },
        {
          rotulo: "Coluna à direita",
          icone: Plus,
          executar: () => {
            editor.update(() => {
              const no = $getNodeByKey(chaveBloco)
              if (no !== null && $isTabelaNotaNode(no)) no.adicionarColuna()
            })
          },
        },
        {
          rotulo: "Remover última coluna",
          icone: Minus,
          executar: () => {
            editor.update(() => {
              const no = $getNodeByKey(chaveBloco)
              if (no !== null && $isTabelaNotaNode(no)) no.removerColuna()
            })
          },
        },
      ]
    })
    const excluir: AcaoBloco[] = [
      {
        rotulo: "Excluir bloco",
        icone: Trash2,
        perigo: true,
        executar: () => {
          const chave = chaveBloco
          editor.update(() => {
            const no = $getNodeByKey(chave)
            if (no !== null) no.remove()
          })
        },
      },
    ]
    return [...basicas, ...tabela, ...excluir]
  }

  if (chaveBloco === null) return null

  return (
    <>
      <div
        className="absolute z-20"
        style={{ top: topo, left: 4 }}
        onDragStart={(e) => {
          arrastandoRef.current = chaveBloco
          if (e.dataTransfer !== null) {
            e.dataTransfer.setData("text/plain", chaveBloco)
            e.dataTransfer.effectAllowed = "move"
          }
        }}
        draggable
      >
        <Popover open={menuAberto} onOpenChange={setMenuAberto}>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="Ações do bloco (arraste para mover)"
              title="Ações do bloco · arraste para reordenar"
              className="text-muted-foreground/60 hover:bg-accent hover:text-foreground focus-visible:ring-ring flex h-10 w-10 cursor-grab items-center justify-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:outline-none active:cursor-grabbing"
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="h-4 w-4" aria-hidden />
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" side="right" className="w-56 p-1.5">
            <div role="menu" aria-label="Ações do bloco">
              {acoes().map((acao) => (
                <button
                  key={acao.rotulo}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    acao.executar()
                    setMenuAberto(false)
                  }}
                  className={`hover:bg-accent flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                    acao.perigo === true ? "text-destructive hover:bg-destructive/10" : ""
                  }`}
                >
                  <acao.icone className="h-4 w-4 shrink-0" aria-hidden />
                  {acao.rotulo}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>
      {linhaDestino !== null ? (
        <div
          aria-hidden
          className="bg-primary pointer-events-none absolute z-20 h-0.5 rounded-full"
          style={{ top: linhaDestino, left: 44, right: 0 }}
        />
      ) : null}
    </>
  )
}

// encontra o bloco de nível raiz sob a coordenada Y de tela
function blocoPeloPonto(
  editor: ReturnType<typeof useLexicalComposerContext>[0],
  y: number,
): { chave: string; element: HTMLElement } | null {
  const raiz = editor.getRootElement()
  if (raiz === null) return null
  const filhos = Array.from(raiz.children) as HTMLElement[]
  for (const el of filhos) {
    const retangulo = el.getBoundingClientRect()
    if (y >= retangulo.top && y <= retangulo.bottom) {
      const no = editor.getEditorState().read(() => $getNearestNodeFromDOMNode(el))
      if (no !== null) return { chave: no.getKey(), element: el }
    }
  }
  return null
}
