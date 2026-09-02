"use client"

// Componentes renderizados pelos DecoratorNodes de bloco (figura, tikz,
// exercícios e cabeçalho de caixa). Cada um lê e atualiza o nó via o
// contexto do Lexical, mantendo o documento como fonte de verdade. Os
// controles usam alvos de toque generosos (≥40px) para funcionar no mobile.

import { useCallback, useEffect, useRef, useState } from "react"
import { CircleAlert, Eye, ImagePlus, PencilLine, Plus, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { $getNodeByKey, type NodeKey } from "lexical"
import { comprimirImagem, enviarImagem } from "@/lib/notas/api-client"
import { Tikz } from "@/components/notas/tikz"
import { EditorLexical } from "./editor-lexical"
import { idBloco } from "@/lib/notas/tipos"
import { toast } from "sonner"
import {
  $isCaixaCabecalhoNode,
  $isFiguraNode,
  $isTikzNode,
  $isExerciciosNode,
} from "@/lib/notas/lexical-blocos"
import type { Questao } from "@/lib/notas/tipos"

// Figura

export function FiguraComponent({ nodeKey }: { nodeKey: NodeKey }) {
  const [editor] = useLexicalComposerContext()
  const inputArquivo = useRef<HTMLInputElement>(null)
  const [enviando, setEnviando] = useState(false)
  const [dados, setDados] = useState(() => lerFigura(editor, nodeKey))

  // mantém o componente sincronizado quando o nó muda (vindo do undo etc.)
  useEffect(() => {
    return editor.registerUpdateListener(() => {
      setDados(lerFigura(editor, nodeKey))
    })
  }, [editor, nodeKey])

  const url = dados.url
  const legenda = dados.legenda

  const patch = useCallback(
    (p: { url?: string; legenda?: string }) => {
      editor.update(() => {
        const n = $getNodeByKey(nodeKey)
        if ($isFiguraNode(n)) {
          const w = n.getWritable()
          if (p.url !== undefined) w.__url = p.url
          if (p.legenda !== undefined) w.__legenda = p.legenda
        }
      })
    },
    [editor, nodeKey],
  )

  const enviar = async (arquivo: File) => {
    setEnviando(true)
    try {
      const comprimida = await comprimirImagem(arquivo)
      const r = await enviarImagem(comprimida, arquivo.name)
      patch({ url: r.url })
      toast.success("Imagem enviada")
    } catch (e) {
      toast.error("Falha no envio", {
        description: e instanceof Error ? e.message : "Tente novamente.",
      })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="space-y-2">
      {url ? (
        <div className="flex flex-wrap items-start gap-3">
          <img
            src={url}
            alt="Pré-visualização da figura"
            className="border-border h-20 w-28 rounded-lg border object-cover"
          />
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 rounded-lg text-xs"
            onClick={() => patch({ url: "" })}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden /> Remover
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={inputArquivo}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void enviar(f)
            }}
          />
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 rounded-lg text-xs"
            onClick={() => inputArquivo.current?.click()}
            disabled={enviando}
          >
            <ImagePlus className="h-3.5 w-3.5" aria-hidden />
            {enviando ? "Enviando…" : "Enviar imagem"}
          </Button>
          <Input
            value={url}
            onChange={(e) => patch({ url: e.target.value })}
            placeholder="…ou cole uma URL (https://…)"
            className="h-9 min-w-40 flex-1 rounded-lg text-xs"
            aria-label="URL da imagem"
            inputMode="url"
          />
        </div>
      )}
      <EditorLexical
        valor={legenda}
        onChange={(texto) => patch({ legenda: texto })}
        placeholder="Legenda da figura"
        ariaLabel="Legenda da figura"
      />
    </div>
  )
}

// lê url/legenda da figura no estado atual do editor
function lerFigura(editor: ReturnType<typeof useLexicalComposerContext>[0], nodeKey: NodeKey) {
  return editor.getEditorState().read(() => {
    const n = $getNodeByKey(nodeKey)
    return $isFiguraNode(n) ? { url: n.getUrl(), legenda: n.getLegenda() } : { url: "", legenda: "" }
  })
}

// TikZ

export function TikzComponent({ nodeKey }: { nodeKey: NodeKey }) {
  const [editor] = useLexicalComposerContext()
  const [dados, setDados] = useState(() => lerTikz(editor, nodeKey))

  // mantém o componente sincronizado quando o nó muda (vindo do undo etc.)
  useEffect(() => {
    return editor.registerUpdateListener(() => {
      setDados(lerTikz(editor, nodeKey))
    })
  }, [editor, nodeKey])

  const codigo = dados.codigo
  const legenda = dados.legenda

  const patch = useCallback(
    (p: { codigo?: string; legenda?: string }) => {
      editor.update(() => {
        const n = $getNodeByKey(nodeKey)
        if ($isTikzNode(n)) {
          const w = n.getWritable()
          if (p.codigo !== undefined) w.__codigo = p.codigo
          if (p.legenda !== undefined) w.__legenda = p.legenda
        }
      })
    },
    [editor, nodeKey],
  )

  return (
    <div className="space-y-2">
      <textarea
        value={codigo}
        onChange={(e) => patch({ codigo: e.target.value })}
        placeholder="Descreva o desenho (ex.: triângulo com base 2 cm)"
        aria-label="Instruções do diagrama"
        rows={5}
        className="placeholder:text-muted-foreground/70 hover:border-border/70 focus:border-border focus:bg-card w-full resize-none rounded-lg border border-transparent bg-transparent px-2 py-1.5 font-mono text-[0.88rem] leading-relaxed transition-colors outline-none"
      />
      <EditorLexical
        valor={legenda}
        onChange={(texto) => patch({ legenda: texto })}
        placeholder="Legenda (opcional)"
        ariaLabel="Legenda do diagrama"
      />
      {codigo.trim() ? (
        <div className="border-border/60 flex justify-center rounded-lg border bg-white p-3 dark:bg-stone-900/60">
          <Tikz codigo={codigo} />
        </div>
      ) : null}
    </div>
  )
}

// lê codigo/legenda do tikz no estado atual do editor
function lerTikz(editor: ReturnType<typeof useLexicalComposerContext>[0], nodeKey: NodeKey) {
  return editor.getEditorState().read(() => {
    const n = $getNodeByKey(nodeKey)
    return $isTikzNode(n)
      ? { codigo: n.getCodigo(), legenda: n.getLegenda() }
      : { codigo: "", legenda: "" }
  })
}

// Cabeçalho de caixa (rótulo + badge)

export function CaixaCabecalhoComponent({ nodeKey }: { nodeKey: NodeKey }) {
  const [editor] = useLexicalComposerContext()
  const [rotulo, setRotulo] = useState("")
  const [tipoCaixa, setTipoCaixa] = useState("copiar")

  // mantém rótulo e tipo sincronizados com o nó (undo, duplicar etc.)
  useEffect(() => {
    return editor.registerUpdateListener(() => {
      const leitura = editor.getEditorState().read(() => {
        const n = $getNodeByKey(nodeKey)
        const rotuloAtual = $isCaixaCabecalhoNode(n) ? n.getRotulo() : ""
        const pai = n?.getParent() as { __tipoCaixa?: string } | null | undefined
        return { rotulo: rotuloAtual, tipo: pai?.__tipoCaixa ?? "copiar" }
      })
      setRotulo(leitura.rotulo)
      setTipoCaixa(leitura.tipo)
    })
  }, [editor, nodeKey])

  const setRotuloNo = (valor: string) => {
    editor.update(() => {
      const n = $getNodeByKey(nodeKey)
      if ($isCaixaCabecalhoNode(n)) n.setRotulo(valor)
    })
  }

  const badges: Record<string, { rotulo: string; classe: string }> = {
    copiar: {
      rotulo: "COPIAR",
      classe:
        "rounded-md bg-stone-900 px-1.5 py-0.5 text-[0.62rem] tracking-[0.18em] text-stone-50 dark:bg-stone-100 dark:text-stone-900",
    },
    exemplo: {
      rotulo: "EXEMPLO",
      classe:
        "rounded-md bg-emerald-600 px-1.5 py-0.5 text-[0.62rem] tracking-[0.18em] text-white dark:bg-emerald-500 dark:text-stone-900",
    },
    dica: {
      rotulo: "DICA",
      classe:
        "rounded-md bg-amber-500 px-1.5 py-0.5 text-[0.62rem] tracking-[0.18em] text-white dark:bg-amber-400 dark:text-stone-900",
    },
  }
  const badge = badges[tipoCaixa] ?? badges["copiar"]
  if (badge === undefined) return null

  return (
    <div className="flex items-center gap-2">
      <PencilLine className="text-muted-foreground h-3.5 w-3.5 shrink-0" aria-hidden />
      <span className={badge.classe}>{badge.rotulo}</span>
      <Input
        value={rotulo}
        onChange={(e) => setRotuloNo(e.target.value)}
        placeholder="Rótulo da caixa"
        className="h-9 flex-1 rounded-lg border border-transparent bg-transparent px-2 text-[0.85rem] font-bold tracking-wide uppercase transition-colors outline-none hover:border-border/70 focus:border-border focus:bg-card"
        aria-label="Rótulo da caixa"
      />
    </div>
  )
}

// Exercícios

interface NivelLocal {
  numero: number
  titulo: string
  questoes: Questao[]
}

function QuestaoEditor({
  questao,
  numero,
  onChange,
}: {
  questao: Questao
  numero: number
  onChange: (q: Questao) => void
}) {
  const mudarAlternativa = (k: number, valor: string) => {
    const alternativas = [...questao.alternativas]
    alternativas[k] = valor
    onChange({ ...questao, alternativas })
  }
  return (
    <div className="border-border/70 bg-card rounded-lg border p-2.5">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-muted-foreground text-[0.7rem] font-bold">Questão {numero}</span>
        <button
          type="button"
          onClick={() => onChange({ ...questao, alternativas: questao.alternativas.slice(0, -1) })}
          className="text-muted-foreground/60 hover:bg-accent hover:text-destructive flex h-8 w-8 items-center justify-center rounded-md transition-colors"
          aria-label={`Remover alternativa da questão ${numero}`}
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>
      <EditorLexical
        valor={questao.enunciado}
        onChange={(enunciado) => onChange({ ...questao, enunciado })}
        placeholder={`Enunciado da questão ${numero}…`}
        ariaLabel={`Enunciado da questão ${numero}`}
      />
      {questao.alternativas.length > 0 ? (
        <div className="mt-2 space-y-1.5">
          {questao.alternativas.map((alt, k) => {
            const correta = questao.correta === k
            return (
              <div
                key={k}
                className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 ${
                  correta
                    ? "border-emerald-400 bg-emerald-50/70 dark:border-emerald-600 dark:bg-emerald-950/30"
                    : "border-border/70"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onChange({ ...questao, correta: correta ? null : k })}
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[0.65rem] font-bold transition-colors ${
                    correta
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-muted-foreground/40 text-muted-foreground hover:border-foreground"
                  }`}
                  aria-label={`Marcar alternativa ${"abcd"[k] ?? "?"} como correta`}
                  title="Marcar como correta"
                >
                  {"abcd"[k] ?? "?"}
                </button>
                <EditorLexical
                  valor={alt}
                  onChange={(v) => mudarAlternativa(k, v)}
                  placeholder={`Alternativa (${"abcd"[k] ?? "?"})`}
                  ariaLabel={`Alternativa ${"abcd"[k] ?? "?"}`}
                />
              </div>
            )
          })}
        </div>
      ) : null}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {questao.alternativas.length < 5 ? (
          <button
            type="button"
            onClick={() => onChange({ ...questao, alternativas: [...questao.alternativas, ""] })}
            className="text-muted-foreground hover:bg-accent hover:text-foreground flex min-h-9 items-center gap-1 rounded-lg px-2.5 text-[0.72rem] font-semibold transition-colors"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden /> alternativa
          </button>
        ) : null}
        {questao.alternativas.length > 0 ? (
          <button
            type="button"
            onClick={() => onChange({ ...questao, alternativas: [], correta: null })}
            className="text-muted-foreground hover:bg-accent hover:text-foreground flex min-h-9 items-center gap-1 rounded-lg px-2.5 text-[0.72rem] font-semibold transition-colors"
          >
            <CircleAlert className="h-3.5 w-3.5" aria-hidden /> virar questão aberta
          </button>
        ) : null}
      </div>
    </div>
  )
}

export function ExerciciosComponent({ nodeKey }: { nodeKey: NodeKey }) {
  const [editor] = useLexicalComposerContext()
  const [dados, setDados] = useState(() => lerExercicios(editor, nodeKey))

  // mantém o componente sincronizado quando o nó muda (vindo do undo etc.)
  useEffect(() => {
    return editor.registerUpdateListener(() => {
      setDados(lerExercicios(editor, nodeKey))
    })
  }, [editor, nodeKey])

  const rotulo = dados.rotulo
  const niveis = dados.niveis
  const gabarito = dados.gabarito

  const patch = useCallback(
    (p: { rotulo?: string; niveis?: NivelLocal[]; gabarito?: string }) => {
      editor.update(() => {
        const n = $getNodeByKey(nodeKey)
        if ($isExerciciosNode(n)) {
          const w = n.getWritable()
          if (p.rotulo !== undefined) w.__rotulo = p.rotulo
          if (p.niveis !== undefined) w.__niveis = p.niveis
          if (p.gabarito !== undefined) w.__gabarito = p.gabarito
        }
      })
    },
    [editor, nodeKey],
  )

  const mudarNivel = (i: number, patchNivel: Partial<NivelLocal>) => {
    const novo = niveis.map((n, j) => (j === i ? { ...n, ...patchNivel } : n))
    patch({ niveis: novo })
  }

  const novaQuestao = (): Questao => ({
    id: idBloco(),
    enunciado: "",
    alternativas: [],
    correta: null,
  })

  const mudarQuestao = (iNivel: number, idQuestao: string, q: Questao) => {
    mudarNivel(iNivel, {
      questoes: niveis[iNivel]?.questoes.map((x) => (x.id === idQuestao ? q : x)) ?? [],
    })
  }

  const CORES_NIVEL_BORDA = ["border-sky-400", "border-amber-400", "border-rose-400"]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Eye className="text-muted-foreground h-3.5 w-3.5" aria-hidden />
        <Input
          value={rotulo}
          onChange={(e) => patch({ rotulo: e.target.value })}
          placeholder="Exercícios propostos"
          aria-label="Rótulo dos exercícios"
          className="h-9 w-full rounded-lg border border-transparent bg-transparent px-2 text-[0.92rem] font-bold tracking-wide uppercase transition-colors outline-none hover:border-border/70 focus:border-border focus:bg-card"
        />
      </div>

      {niveis.map((nivel, i) => (
        <div
          key={`${nivel.numero}-${i}`}
          className={`rounded-xl border border-l-4 ${CORES_NIVEL_BORDA[nivel.numero - 1] ?? "border-sky-400"} border-border bg-background/60 p-3`}
        >
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-md bg-stone-900 px-1.5 py-0.5 text-[0.65rem] font-bold text-stone-50 dark:bg-stone-100 dark:text-stone-900">
              NÍVEL {nivel.numero}
            </span>
            <Input
              value={nivel.titulo}
              onChange={(e) => mudarNivel(i, { titulo: e.target.value })}
              placeholder="Conceitos / Aplicação / Síntese"
              aria-label={`Título do nível ${nivel.numero}`}
              className="h-9 w-full rounded-md border border-transparent bg-transparent px-1.5 text-sm font-bold transition-colors outline-none hover:border-border/70 focus:border-border focus:bg-card"
            />
          </div>

          <div className="space-y-2.5">
            {nivel.questoes.map((q, j) => (
              <QuestaoEditor
                key={q.id}
                questao={q}
                numero={j + 1}
                onChange={(nova) => mudarQuestao(i, q.id, nova)}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => mudarNivel(i, { questoes: [...nivel.questoes, novaQuestao()] })}
            className="border-border text-muted-foreground hover:bg-accent hover:text-foreground mt-2 flex min-h-10 items-center gap-1.5 rounded-lg border border-dashed px-2.5 text-[0.78rem] font-semibold transition-colors hover:border-solid"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden /> questão
          </button>
        </div>
      ))}

      <div className="border-border bg-background/60 space-y-1.5 rounded-xl border p-3">
        <p className="text-muted-foreground text-[0.7rem] font-bold tracking-wider uppercase">
          Gabarito (para as questões abertas)
        </p>
        <EditorLexical
          valor={gabarito}
          onChange={(g) => patch({ gabarito: g })}
          placeholder="2) 3,0 m/s · 5) veja resolução. As alternativas marcadas entram automaticamente."
          ariaLabel="Gabarito das questões abertas"
        />
      </div>
    </div>
  )
}

// lê rotulo/niveis/gabarito dos exercícios no estado atual do editor
function lerExercicios(
  editor: ReturnType<typeof useLexicalComposerContext>[0],
  nodeKey: NodeKey,
): { rotulo: string; niveis: NivelLocal[]; gabarito: string } {
  return editor.getEditorState().read(() => {
    const n = $getNodeByKey(nodeKey)
    if (!$isExerciciosNode(n)) return { rotulo: "", niveis: [], gabarito: "" }
    return {
      rotulo: n.__rotulo,
      niveis: (n.__niveis as NivelLocal[]) ?? [],
      gabarito: n.__gabarito,
    }
  })
}
