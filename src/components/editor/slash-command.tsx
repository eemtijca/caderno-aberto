"use client"

// Slash command: ao digitar "/" no início de um bloco de texto, abre a
// paleta de inserção de blocos. Clicar (ou Enter) insere o bloco; Esc
// fecha. No mobile o menu aparece fixo acima do teclado.

import { useEffect, useMemo, useState } from "react"
import {
  $getNodeByKey,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  $setSelection,
  KEY_ESCAPE_COMMAND,
  COMMAND_PRIORITY_LOW,
} from "lexical"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import {
  BookOpenText,
  CircleAlert,
  FileText,
  Grid3X3,
  Image,
  List,
  NotebookPen,
  PencilLine,
  Sigma,
  Sparkles,
  Table,
  X,
} from "lucide-react"
import {
  $createSecaoNode,
  $createListaNotaNode,
  $createItemListaNotaNode,
  $createTabelaNotaNode,
  $createLinhaTabelaNotaNode,
  $createCelulaTabelaNotaNode,
  $createChamadaNode,
  $createCaixaNode,
  $createCaixaCabecalhoNode,
  $createFiguraNode,
  $createTikzNode,
  $createExerciciosNode,
} from "@/lib/notas/lexical-blocos"
import { $createParagrafoNotaNode } from "@/lib/notas/lexical-blocos"
import { $createEquationNode } from "@/lib/notas/lexical-nodes"

interface ItemSlash {
  rotulo: string
  descricao: string
  icone: typeof FileText
  inserir: () => void
}

export function SlashCommandPlugin() {
  const [editor] = useLexicalComposerContext()
  const [aberto, setAberto] = useState(false)

  // detecta "/" digitado no início de um bloco de texto
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      const noInicio = editorState.read(() => {
        const sel = $getSelection()
        if (!$isRangeSelection(sel) || !sel.isCollapsed()) return false
        const ancora = sel.anchor
        if (ancora.type !== "text") return false
        const no = ancora.getNode()
        if (!$isTextNode(no)) return false
        const texto = no.getTextContent()
        // "/" como único caractere do nó de texto (cursor no fim)
        return texto === "/" && ancora.offset === texto.length
      })
      setAberto(noInicio)
    })
  }, [editor])

  useEffect(() => {
    if (!aberto) return
    return editor.registerCommand(
      KEY_ESCAPE_COMMAND,
      () => {
        setAberto(false)
        return true
      },
      COMMAND_PRIORITY_LOW,
    )
  }, [editor, aberto])

  const itens = useMemo<ItemSlash[]>(
    () => [
      {
        rotulo: "Seção",
        descricao: "Título numerado de tópico",
        icone: NotebookPen,
        inserir: () => inserirNoCursor(editor, (no) => no.replace($createSecaoNode())),
      },
      {
        rotulo: "Parágrafo",
        descricao: "Texto corrido com rótulo opcional",
        icone: FileText,
        inserir: () => inserirNoCursor(editor, (no) => no.replace($createParagrafoNotaNode())),
      },
      {
        rotulo: "Fórmula",
        descricao: "Equação em destaque",
        icone: Sigma,
        inserir: () => inserirNoCursor(editor, (no) => no.replace($createEquationNode("", false))),
      },
      {
        rotulo: "Lista",
        descricao: "Itens com marcadores",
        icone: List,
        inserir: () =>
          inserirNoCursor(editor, (no) => {
            const lista = $createListaNotaNode()
            const item = $createItemListaNotaNode()
            item.append($createParagrafoNotaNode())
            lista.append(item)
            no.replace(lista)
          }),
      },
      {
        rotulo: "Tabela",
        descricao: "Linhas e colunas",
        icone: Table,
        inserir: () =>
          inserirNoCursor(editor, (no) => {
            const tabela = $createTabelaNotaNode(true)
            const linha = $createLinhaTabelaNotaNode()
            linha.append($createCelulaTabelaNotaNode(true), $createCelulaTabelaNotaNode())
            tabela.append(linha)
            no.replace(tabela)
          }),
      },
      {
        rotulo: "Atenção / Símbolos",
        descricao: "Alerta, dia a dia ou símbolos",
        icone: CircleAlert,
        inserir: () => inserirNoCursor(editor, (no) => no.replace($createChamadaNode("atencao"))),
      },
      {
        rotulo: "Figura",
        descricao: "Imagem com legenda",
        icone: Image,
        inserir: () => inserirNoCursor(editor, (no) => no.replace($createFiguraNode())),
      },
      {
        rotulo: "Diagrama",
        descricao: "Ilustração geométrica (TikZ)",
        icone: Grid3X3,
        inserir: () => inserirNoCursor(editor, (no) => no.replace($createTikzNode())),
      },
      {
        rotulo: "COPIAR",
        descricao: "O que o aluno leva para o caderno",
        icone: BookOpenText,
        inserir: () => inserirNoCursor(editor, (no) => no.replace(montarCaixa("copiar", ""))),
      },
      {
        rotulo: "Exemplo",
        descricao: "Exemplo resolvido passo a passo",
        icone: PencilLine,
        inserir: () =>
          inserirNoCursor(editor, (no) => no.replace(montarCaixa("exemplo", "Exemplo resolvido"))),
      },
      {
        rotulo: "Dica",
        descricao: "Dica / erro comum",
        icone: Sparkles,
        inserir: () =>
          inserirNoCursor(editor, (no) => no.replace(montarCaixa("dica", "Dica / erro comum"))),
      },
      {
        rotulo: "Exercícios",
        descricao: "Lista com níveis e gabarito",
        icone: BookOpenText,
        inserir: () => inserirNoCursor(editor, (no) => no.replace($createExerciciosNode())),
      },
    ],
    [editor],
  )

  if (!aberto) return null

  return (
    <div className="border-border bg-popover fixed bottom-20 left-1/2 z-50 max-h-[45vh] w-[min(92vw,22rem)] -translate-x-1/2 overflow-y-auto rounded-2xl border p-2 shadow-lg sm:top-16 sm:bottom-auto">
      <div className="mb-1 flex items-center justify-between px-1">
        <p className="text-muted-foreground px-1 text-[0.7rem] font-bold tracking-wider uppercase">
          Inserir bloco
        </p>
        <button
          type="button"
          onClick={() => setAberto(false)}
          className="text-muted-foreground hover:bg-accent rounded-md p-1"
          aria-label="Fechar paleta"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {itens.map((item) => (
          <button
            key={item.rotulo}
            type="button"
            onClick={() => {
              item.inserir()
              setAberto(false)
            }}
            className="border-border bg-card hover:border-foreground/30 hover:bg-accent rounded-xl border px-3 py-2.5 text-left transition-colors"
          >
            <span className="flex items-center gap-1.5 text-[0.82rem] font-bold">
              <item.icone className="text-muted-foreground h-3.5 w-3.5" aria-hidden />
              {item.rotulo}
            </span>
            <span className="text-muted-foreground block text-[0.68rem] leading-snug">
              {item.descricao}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

/** Substitui o parágrafo atual por um novo bloco. */
function inserirNoCursor(
  editor: ReturnType<typeof useLexicalComposerContext>[0],
  fn: (no: NonNullable<ReturnType<typeof $getNodeByKey>>) => void,
) {
  editor.update(() => {
    const sel = $getSelection()
    if (!$isRangeSelection(sel)) return
    const ancora = sel.anchor
    if (ancora.type !== "text") return
    const no = ancora.getNode()
    // sobe até o parágrafo/bloco que contém o texto "/"
    const bloco = no.getTopLevelElement() ?? no
    if (!bloco) return
    // limpa a seleção antes de substituir para não perder o cursor
    $setSelection(null)
    fn(bloco)
  })
}

/** Monta uma caixa (copiar/exemplo/dica) com cabeçalho e um parágrafo inicial. */
function montarCaixa(
  tipo: "copiar" | "exemplo" | "dica",
  rotulo: string,
): ReturnType<typeof $createCaixaNode> {
  const caixa = $createCaixaNode(tipo, rotulo)
  caixa.append($createCaixaCabecalhoNode(rotulo))
  caixa.append($createParagrafoNotaNode())
  return caixa
}
