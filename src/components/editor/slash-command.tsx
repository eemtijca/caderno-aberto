"use client"

// Slash command (modelo Notion): digitar "/" num parágrafo vazio abre a
// paleta de inserção de blocos ancorada no cursor, com filtro de digitação
// (typeahead), navegação por setas/Enter/Esc, papéis ARIA e posicionamento
// encaixado na viewport (no mobile respeita o teclado virtual). Os itens
// usam onMouseDown preventDefault para não roubar a seleção do editor
// (era a causa da paleta fechar sem inserir).

import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react"
import {
  $getNodeByKey,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_HIGH,
  ElementNode,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_UP_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND,
  KEY_TAB_COMMAND,
  type LexicalEditor,
  type LexicalNode,
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
  type LucideIcon,
} from "lucide-react"
import {
  $createSecaoNode,
  $createParagrafoNotaNode,
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
  $isParagrafoNotaNode,
  $isSecaoNode,
  $isItemListaNotaNode,
} from "@/lib/notas/lexical-blocos"
import { $createEquationNode } from "@/lib/notas/lexical-nodes"
import { alturaVisual, limitar } from "@/lib/editor/posicao"

interface ItemSlash {
  rotulo: string
  descricao: string
  icone: LucideIcon
  termos: string
  inserir: (editor: LexicalEditor) => void
}

// remove acentos para o filtro de digitação
function normalizar(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}

// cria a caixa (copiar/exemplo/dica) com cabeçalho e um parágrafo inicial
function montarCaixa(tipo: "copiar" | "exemplo" | "dica", rotulo: string) {
  const caixa = $createCaixaNode(tipo, rotulo)
  caixa.append($createCaixaCabecalhoNode(rotulo))
  caixa.append($createParagrafoNotaNode())
  return caixa
}

// monta a tabela inicial (1 linha com 2 colunas, a primeira de cabeçalho)
function montarTabela() {
  const tabela = $createTabelaNotaNode(true)
  const linha = $createLinhaTabelaNotaNode()
  linha.append($createCelulaTabelaNotaNode(true), $createCelulaTabelaNotaNode())
  tabela.append(linha)
  return tabela
}

// monta a lista inicial com um item vazio
function montarLista() {
  const lista = $createListaNotaNode()
  const item = $createItemListaNotaNode()
  item.append($createParagrafoNotaNode())
  lista.append(item)
  return lista
}

// posiciona o cursor no primeiro parágrafo da caixa inserida
function posicionarNaCaixa(novo: LexicalNode): void {
  if (!(novo instanceof ElementNode)) return
  for (const filho of novo.getChildren()) {
    if ($isParagrafoNotaNode(filho)) {
      filho.selectStart()
      return
    }
  }
}

// posiciona o cursor na primeira célula da tabela inserida
function posicionarNaTabela(novo: LexicalNode): void {
  if (!(novo instanceof ElementNode)) return
  const primeira = novo.getFirstChild()
  if (!(primeira instanceof ElementNode)) return
  const celula = primeira.getFirstChild()
  if (celula instanceof ElementNode) celula.selectStart()
}

// substitui o bloco que contém a consulta pelo bloco novo e move o cursor
function inserirNoCursor(
  editor: LexicalEditor,
  montar: () => LexicalNode,
  posicionar?: (novo: LexicalNode) => void,
): void {
  editor.update(() => {
    const sel = $getSelection()
    if (!$isRangeSelection(sel)) return
    const ancora = sel.anchor
    if (ancora.type !== "text") return
    const no = ancora.getNode()
    if (!$isTextNode(no)) return
    const pai = no.getParent()
    const emLista = $isItemListaNotaNode(pai)
    const bloco = emLista ? pai : (no.getTopLevelElement() ?? no)
    const novo = montar()
    bloco.replace(novo)
    if (posicionar) {
      posicionar(novo)
    } else if (novo instanceof ElementNode) {
      novo.selectStart()
    } else {
      novo.selectNext(0, 0)
    }
  })
}

// tabela de itens da paleta (mesmos rótulos da versão anterior)
const ITENS: ItemSlash[] = [
  {
    rotulo: "Seção",
    descricao: "Título numerado de tópico",
    icone: NotebookPen,
    termos: "secao titulo topico heading",
    inserir: (editor) => inserirNoCursor(editor, $createSecaoNode),
  },
  {
    rotulo: "Parágrafo",
    descricao: "Texto corrido com rótulo opcional",
    icone: FileText,
    termos: "paragrafo texto corrido",
    inserir: (editor) => inserirNoCursor(editor, $createParagrafoNotaNode),
  },
  {
    rotulo: "Fórmula",
    descricao: "Equação em destaque",
    icone: Sigma,
    termos: "formula equacao matematica latex",
    inserir: (editor) => inserirNoCursor(editor, () => $createEquationNode("", false)),
  },
  {
    rotulo: "Lista",
    descricao: "Itens com marcadores",
    icone: List,
    termos: "lista itens marcadores bullet",
    inserir: (editor) =>
      inserirNoCursor(editor, montarLista, (novo) => {
        if (novo instanceof ElementNode) novo.getFirstChild()?.selectStart()
      }),
  },
  {
    rotulo: "Tabela",
    descricao: "Linhas e colunas",
    icone: Table,
    termos: "tabela grade linhas colunas",
    inserir: (editor) => inserirNoCursor(editor, montarTabela, posicionarNaTabela),
  },
  {
    rotulo: "Atenção / Símbolos",
    descricao: "Alerta, dia a dia ou símbolos",
    icone: CircleAlert,
    termos: "atencao alerta diaadia simbolos chamada",
    inserir: (editor) => inserirNoCursor(editor, () => $createChamadaNode("atencao")),
  },
  {
    rotulo: "Figura",
    descricao: "Imagem com legenda",
    icone: Image,
    termos: "figura imagem foto legenda",
    inserir: (editor) => inserirNoCursor(editor, $createFiguraNode),
  },
  {
    rotulo: "Diagrama",
    descricao: "Ilustração geométrica (TikZ)",
    icone: Grid3X3,
    termos: "diagrama tikz desenho geometria",
    inserir: (editor) => inserirNoCursor(editor, $createTikzNode),
  },
  {
    rotulo: "COPIAR",
    descricao: "O que o aluno leva para o caderno",
    icone: BookOpenText,
    termos: "copiar caderno caixa",
    inserir: (editor) =>
      inserirNoCursor(editor, () => montarCaixa("copiar", ""), posicionarNaCaixa),
  },
  {
    rotulo: "Exemplo",
    descricao: "Exemplo resolvido passo a passo",
    icone: PencilLine,
    termos: "exemplo resolvido passo",
    inserir: (editor) =>
      inserirNoCursor(editor, () => montarCaixa("exemplo", "Exemplo resolvido"), posicionarNaCaixa),
  },
  {
    rotulo: "Dica",
    descricao: "Dica / erro comum",
    icone: Sparkles,
    termos: "dica erro comum",
    inserir: (editor) =>
      inserirNoCursor(editor, () => montarCaixa("dica", "Dica / erro comum"), posicionarNaCaixa),
  },
  {
    rotulo: "Exercícios",
    descricao: "Lista com níveis e gabarito",
    icone: BookOpenText,
    termos: "exercicios questoes niveis gabarito",
    inserir: (editor) => inserirNoCursor(editor, $createExerciciosNode),
  },
]

export function SlashCommandPlugin({ ancoraRef }: { ancoraRef: RefObject<HTMLDivElement | null> }) {
  const [editor] = useLexicalComposerContext()
  const [aberto, setAberto] = useState(false)
  const [consulta, setConsulta] = useState("")
  const [indice, setIndice] = useState(0)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const listaRef = useRef<HTMLDivElement>(null)
  const chaveNoRef = useRef<string | null>(null)

  // detecta "/consulta" digitado no começo de um bloco de texto
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      const leitura = editorState.read(() => {
        const sel = $getSelection()
        if (!$isRangeSelection(sel) || !sel.isCollapsed()) return null
        const ancora = sel.anchor
        if (ancora.type !== "text") return null
        const no = ancora.getNode()
        if (!$isTextNode(no)) return null
        const texto = no.getTextContent()
        const casa = /^\/(\S*)$/.exec(texto)
        if (casa === null) return null
        // apenas em parágrafo/seção de nível raiz (não dentro de caixas)
        const pai = no.getParent()
        const emLista = $isItemListaNotaNode(pai)
        const bloco = no.getTopLevelElement()
        if (!emLista) {
          if (bloco === null || bloco.getParent()?.getType() !== "root") return null
          if (!($isParagrafoNotaNode(bloco) || $isSecaoNode(bloco))) return null
        }
        return { consulta: casa[1] ?? "", chave: no.getKey() }
      })
      if (leitura === null) {
        chaveNoRef.current = null
        setAberto(false)
        setConsulta("")
        return
      }
      chaveNoRef.current = leitura.chave
      setConsulta(leitura.consulta)
      setAberto(true)
    })
  }, [editor])

  // itens filtrados pela consulta (sem acento, case-insensitive)
  const itens = useMemo(() => {
    const alvo = normalizar(consulta)
    if (alvo === "") return ITENS
    return ITENS.filter(
      (item) =>
        normalizar(item.rotulo).includes(alvo) ||
        normalizar(item.descricao).includes(alvo) ||
        item.termos.includes(alvo),
    )
  }, [consulta])

  // posiciona a paleta no cursor (abaixo, ou acima quando falta espaço)
  useEffect(() => {
    if (!aberto) return
    const container = ancoraRef.current
    if (container === null) return
    const sel = window.getSelection()
    if (sel === null || sel.rangeCount === 0) return
    const rect = sel.getRangeAt(0).getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()
    const menuAltura = Math.min(alturaVisual() * 0.45, 380)
    const baseInferior = (window.visualViewport?.offsetTop ?? 0) + alturaVisual()
    const abaixo = rect.bottom + 6
    const cabeAbaixo = abaixo + menuAltura <= baseInferior
    const yVisivel = cabeAbaixo ? abaixo : Math.max(rect.top - menuAltura - 6, 8)
    const xVisivel = limitar(rect.left, 8 + 160, Math.max(window.innerWidth - 8 - 160, 8 + 160))
    setPos({ x: xVisivel - containerRect.left, y: yVisivel - containerRect.top })
  }, [aberto, consulta, ancoraRef])

  // remove o texto "/consulta" do editor (ao fechar sem inserir ou com Esc)
  const limparTextoConsulta = useCallback((): void => {
    const chave = chaveNoRef.current
    if (chave === null) return
    editor.update(() => {
      const no = $getNodeByKey(chave)
      if (no !== null) no.remove()
    })
    chaveNoRef.current = null
  }, [editor])

  // navegação por teclado: setas movem, Enter/Tab inserem, Esc fecha
  useEffect(() => {
    if (!aberto) return
    const irPara = (delta: number): boolean => {
      if (itens.length === 0) return true
      setIndice((i) => (i + delta + itens.length) % itens.length)
      return true
    }
    const inserirAtivo = (): boolean => {
      const item = itens[indice]
      if (item === undefined) return true
      setAberto(false)
      setConsulta("")
      item.inserir(editor)
      return true
    }
    const registros = [
      editor.registerCommand(KEY_ARROW_DOWN_COMMAND, () => irPara(1), COMMAND_PRIORITY_HIGH),
      editor.registerCommand(KEY_ARROW_UP_COMMAND, () => irPara(-1), COMMAND_PRIORITY_HIGH),
      editor.registerCommand(KEY_ENTER_COMMAND, () => inserirAtivo(), COMMAND_PRIORITY_HIGH),
      editor.registerCommand(KEY_TAB_COMMAND, () => inserirAtivo(), COMMAND_PRIORITY_HIGH),
      editor.registerCommand(
        KEY_ESCAPE_COMMAND,
        () => {
          limparTextoConsulta()
          setAberto(false)
          setConsulta("")
          return true
        },
        COMMAND_PRIORITY_HIGH,
      ),
    ]
    return () => {
      for (const registrar of registros) registrar()
    }
  }, [aberto, editor, itens, indice, limparTextoConsulta])

  // rola o item destacado para dentro da área visível da lista
  useEffect(() => {
    const lista = listaRef.current
    if (lista === null) return
    const opcoes = lista.querySelectorAll("[role='option']")
    const alvo = opcoes[indice]
    if (alvo instanceof HTMLElement) alvo.scrollIntoView({ block: "nearest" })
  }, [indice])

  if (!aberto || pos === null) return null

  return (
    <div
      className="bg-popover text-popover-foreground absolute z-50 w-80 max-w-[calc(100vw-1.5rem)] rounded-xl border p-1.5 shadow-lg"
      style={{ top: pos.y, left: pos.x }}
      role="listbox"
      aria-label="Inserir bloco"
    >
      <div className="mb-1 flex items-center justify-between px-2 pt-1">
        <p className="text-muted-foreground px-1 text-[0.7rem] font-bold tracking-wider uppercase">
          Inserir bloco
        </p>
        <button
          type="button"
          onClick={() => {
            limparTextoConsulta()
            setAberto(false)
          }}
          className="text-muted-foreground hover:bg-accent hover:text-foreground rounded-md p-1"
          aria-label="Fechar paleta de inserção"
          onMouseDown={(e) => e.preventDefault()}
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>
      <div ref={listaRef} className="max-h-[45vh] overflow-y-auto" role="presentation">
        {itens.length === 0 ? (
          <p className="text-muted-foreground px-3 py-4 text-center text-sm">
            Nenhum bloco encontrado para &ldquo;{consulta}&rdquo;.
          </p>
        ) : (
          itens.map((item, i) => (
            <button
              key={item.rotulo}
              type="button"
              role="option"
              aria-selected={i === indice}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setAberto(false)
                setConsulta("")
                item.inserir(editor)
              }}
              className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors ${
                i === indice ? "bg-accent text-accent-foreground" : "hover:bg-accent/60"
              }`}
            >
              <item.icone className="text-muted-foreground h-4 w-4 shrink-0" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[0.85rem] font-semibold">{item.rotulo}</span>
                <span className="text-muted-foreground block truncate text-[0.7rem]">
                  {item.descricao}
                </span>
              </span>
            </button>
          ))
        )}
      </div>
      <p className="text-muted-foreground mt-1 border-t px-3 py-1.5 text-[0.65rem]">
        ↑↓ para navegar · Enter insere · Esc fecha
      </p>
    </div>
  )
}
