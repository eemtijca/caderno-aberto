"use client"

// Editores de blocos. Uma UI por tipo (parágrafo, fórmula, caixas, exercícios...). Usados no nível superior e dentro das caixas (copiar/exemplo/dica).

import { useRef, useState } from "react"
import { ArrowDown, ArrowUp, CircleAlert, Eye, ImagePlus, Plus, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TextareaAuto, BarraInline } from "./pecas"
import { Matematica } from "@/components/notas/matematica"
import { Tikz } from "@/components/notas/tikz"
import { comprimirImagem, enviarImagem } from "@/lib/notas/api-client"
import type {
  BlocoCaixa,
  BlocoChamada,
  BlocoExercicios,
  BlocoFigura,
  BlocoFilho,
  BlocoLista,
  BlocoParagrafo,
  BlocoSecao,
  BlocoTabela,
  BlocoTikz,
  EstiloChamada,
  Questao,
  RotuloTipo,
} from "@/lib/notas/tipos"
import { ROTULOS_FIXOS, ESTILOS_CHAMADA, idBloco } from "@/lib/notas/tipos"
import { toast } from "sonner"

type Patch = (patch: Record<string, unknown>) => void

export function EditorSecao({
  bloco,
  numero,
  onPatch,
}: {
  bloco: BlocoSecao
  numero: number
  onPatch: Patch
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="bg-primary text-primary-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-extrabold tabular-nums">
        {numero}
      </span>
      <input
        value={bloco.titulo}
        onChange={(e) => onPatch({ titulo: e.target.value })}
        placeholder="Título da seção"
        aria-label="Título da seção"
        className="fonte-display hover:border-border/70 focus:border-border focus:bg-card w-full rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-lg font-bold transition-colors outline-none"
      />
    </div>
  )
}

export function EditorParagrafo({ bloco, onPatch }: { bloco: BlocoParagrafo; onPatch: Patch }) {
  const ref = useRef<HTMLTextAreaElement>(null)

  const rotuloAtual: string = bloco.rotulo
    ? bloco.rotulo.tipo === "livre"
      ? `livre:${bloco.rotulo.texto ?? ""}`
      : bloco.rotulo.tipo
    : "nenhum"

  const trocarRotulo = (valor: string) => {
    if (valor === "nenhum") return onPatch({ rotulo: null })
    if (valor.startsWith("livre:")) {
      return onPatch({ rotulo: { tipo: "livre", texto: valor.slice(6) } })
    }
    onPatch({ rotulo: { tipo: valor as RotuloTipo } })
  }

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={rotuloAtual.startsWith("livre:") ? "livre" : rotuloAtual}
          onValueChange={trocarRotulo}
        >
          <SelectTrigger
            size="sm"
            className="h-7 w-auto gap-1 rounded-md border-dashed text-[0.72rem] font-semibold text-sky-700 dark:text-sky-300"
          >
            <SelectValue placeholder="Rótulo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="nenhum" className="text-xs">
              Sem rótulo
            </SelectItem>
            {ROTULOS_FIXOS.map((r) => (
              <SelectItem key={r.tipo} value={r.tipo} className="text-xs">
                {r.texto}
              </SelectItem>
            ))}
            <SelectItem value="livre" className="text-xs">
              Personalizado…
            </SelectItem>
          </SelectContent>
        </Select>
        {bloco.rotulo?.tipo === "livre" ? (
          <Input
            value={bloco.rotulo.texto ?? ""}
            onChange={(e) => onPatch({ rotulo: { tipo: "livre", texto: e.target.value } })}
            placeholder="Texto do rótulo"
            className="h-7 w-44 rounded-md text-[0.78rem]"
            aria-label="Texto do rótulo"
          />
        ) : null}
        <div className="ml-auto">
          <BarraInline alvo={ref} onAplicar={(valor) => onPatch({ texto: valor })} />
        </div>
      </div>
      <TextareaAuto
        valor={bloco.texto}
        onChange={(texto) => onPatch({ texto })}
        placeholder="Texto do parágrafo . Use **negrito**, $fórmulas$ e \\resultado{…}"
        ariaLabel="Texto do parágrafo"
      />
    </div>
  )
}

export function EditorFormula({ bloco, onPatch }: { bloco: { latex: string }; onPatch: Patch }) {
  return (
    <div className="space-y-2">
      <TextareaAuto
        valor={bloco.latex}
        onChange={(latex) => onPatch({ latex })}
        placeholder="LaTeX da fórmula . Ex.: P = U i  ou  \dec{5,5}\un{kW}"
        mono
        rowsMin={2}
        ariaLabel="Equação em destaque"
      />
      {bloco.latex.trim() ? (
        <div className="border-border/60 flex items-center gap-2 rounded-lg border bg-stone-50 px-3 py-2.5 text-center dark:bg-stone-900/60">
          <Eye className="text-muted-foreground h-3.5 w-3.5 shrink-0" aria-hidden />
          <div className="w-full overflow-x-auto text-center">
            <Matematica latex={bloco.latex} bloco />
          </div>
        </div>
      ) : null}
    </div>
  )
}

export function EditorLista({ bloco, onPatch }: { bloco: BlocoLista; onPatch: Patch }) {
  const mudarItem = (i: number, valor: string) => {
    const itens = [...bloco.itens]
    itens[i] = valor
    onPatch({ itens })
  }
  return (
    <div className="space-y-1">
      {bloco.itens.map((item, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <span
            className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-stone-400 dark:bg-stone-500"
            aria-hidden
          />
          <TextareaAuto
            valor={item}
            onChange={(v) => mudarItem(i, v)}
            placeholder={`Item ${i + 1}`}
            ariaLabel={`Item ${i + 1}`}
          />
          <button
            type="button"
            onClick={() => onPatch({ itens: bloco.itens.filter((_, j) => j !== i) })}
            className="text-muted-foreground/60 hover:bg-accent hover:text-destructive mt-1 rounded-md p-1 transition-colors"
            aria-label={`Remover item ${i + 1}`}
          >
            <X className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onPatch({ itens: [...bloco.itens, ""] })}
        className="text-muted-foreground hover:bg-accent hover:text-foreground flex items-center gap-1.5 rounded-md px-2 py-1 text-[0.78rem] font-semibold transition-colors"
      >
        <Plus className="h-3.5 w-3.5" aria-hidden /> item
      </button>
    </div>
  )
}

export function EditorTabela({ bloco, onPatch }: { bloco: BlocoTabela; onPatch: Patch }) {
  const nCol = Math.max(1, ...bloco.linhas.map((l) => l.length), 1)
  const linhas = bloco.linhas.map((l) => {
    const c = [...l]
    while (c.length < nCol) c.push("")
    return c
  })

  const mudarCelula = (i: number, j: number, valor: string) => {
    const copia = linhas.map((l) => [...l])
    copia[i][j] = valor
    onPatch({ linhas: copia })
  }

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[320px] border-collapse text-sm">
          <tbody>
            {linhas.map((linha, i) => (
              <tr key={i}>
                {linha.map((cel, j) => (
                  <td key={j} className="border-border/70 border p-0">
                    <input
                      value={cel}
                      onChange={(e) => mudarCelula(i, j, e.target.value)}
                      aria-label={`Célula ${i + 1},${j + 1}`}
                      className={`focus:bg-card w-full min-w-[4.5rem] bg-transparent px-2 py-1.5 text-[0.85rem] outline-none ${
                        bloco.comCabecalho && i === 0 ? "font-bold" : ""
                      }`}
                    />
                  </td>
                ))}
                <td className="w-8">
                  <button
                    type="button"
                    onClick={() => onPatch({ linhas: linhas.filter((_, x) => x !== i) })}
                    className="text-muted-foreground/60 hover:text-destructive flex h-full w-8 items-center justify-center rounded-md transition-colors"
                    aria-label={`Remover linha ${i + 1}`}
                  >
                    <X className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 text-[0.78rem]">
        <button
          type="button"
          onClick={() => onPatch({ linhas: [...linhas, Array.from({ length: nCol }, () => "")] })}
          className="text-muted-foreground hover:bg-accent hover:text-foreground flex items-center gap-1 rounded-md px-2 py-1 font-semibold transition-colors"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden /> linha
        </button>
        <button
          type="button"
          onClick={() =>
            onPatch({
              linhas: linhas.map((l) => [...l, ""]),
            })
          }
          className="text-muted-foreground hover:bg-accent hover:text-foreground flex items-center gap-1 rounded-md px-2 py-1 font-semibold transition-colors"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden /> coluna
        </button>
        {nCol > 1 ? (
          <button
            type="button"
            onClick={() =>
              onPatch({
                linhas: linhas.map((l) => l.slice(0, nCol - 1)),
              })
            }
            className="text-muted-foreground hover:bg-accent hover:text-foreground flex items-center gap-1 rounded-md px-2 py-1 font-semibold transition-colors"
          >
            <X className="h-3.5 w-3.5" aria-hidden /> coluna
          </button>
        ) : null}
        <label className="text-muted-foreground ml-auto flex cursor-pointer items-center gap-1.5 font-medium">
          <input
            type="checkbox"
            checked={bloco.comCabecalho}
            onChange={(e) => onPatch({ comCabecalho: e.target.checked })}
            className="h-3.5 w-3.5 accent-stone-800"
          />
          1ª linha é cabeçalho
        </label>
      </div>
    </div>
  )
}

export function EditorChamada({ bloco, onPatch }: { bloco: BlocoChamada; onPatch: Patch }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <Select value={bloco.estilo} onValueChange={(v) => onPatch({ estilo: v as EstiloChamada })}>
          <SelectTrigger
            size="sm"
            className="h-7 w-auto rounded-md border-dashed text-[0.72rem] font-semibold"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ESTILOS_CHAMADA.map((e) => (
              <SelectItem key={e.estilo} value={e.estilo} className="text-xs">
                {e.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <TextareaAuto
        valor={bloco.texto}
        onChange={(texto) => onPatch({ texto })}
        placeholder={
          bloco.estilo === "atencao"
            ? "O alerta para a turma…"
            : bloco.estilo === "diaadia"
              ? "A conexão com o cotidiano…"
              : "$P$ (W); $U$ (V)…"
        }
        ariaLabel="Texto da chamada"
      />
    </div>
  )
}

export function EditorFigura({ bloco, onPatch }: { bloco: BlocoFigura; onPatch: Patch }) {
  const inputArquivo = useRef<HTMLInputElement>(null)
  const [enviando, setEnviando] = useState(false)

  const enviar = async (arquivo: File) => {
    setEnviando(true)
    try {
      const comprimida = await comprimirImagem(arquivo)
      const r = await enviarImagem(comprimida, arquivo.name)
      onPatch({ url: r.url })
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
      {bloco.url ? (
        <div className="flex items-start gap-3">
          <img
            src={bloco.url}
            alt="Pré-visualização da figura"
            className="border-border h-20 w-28 rounded-lg border object-cover"
          />
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 rounded-lg text-xs"
            onClick={() => onPatch({ url: "" })}
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
            className="gap-1.5 rounded-lg text-xs"
            onClick={() => inputArquivo.current?.click()}
            disabled={enviando}
          >
            <ImagePlus className="h-3.5 w-3.5" aria-hidden />
            {enviando ? "Enviando…" : "Enviar imagem"}
          </Button>
          <Input
            value={bloco.url}
            onChange={(e) => onPatch({ url: e.target.value })}
            placeholder="…ou cole uma URL (https://…)"
            className="h-8 flex-1 rounded-lg text-xs"
            aria-label="URL da imagem"
          />
        </div>
      )}
      <Input
        value={bloco.legenda}
        onChange={(e) => onPatch({ legenda: e.target.value })}
        placeholder="Legenda da figura"
        className="h-8 rounded-lg text-xs"
        aria-label="Legenda da figura"
      />
    </div>
  )
}

export function EditorTikz({ bloco, onPatch }: { bloco: BlocoTikz; onPatch: Patch }) {
  return (
    <div className="space-y-2">
      <TextareaAuto
        valor={bloco.codigo}
        onChange={(codigo) => onPatch({ codigo })}
        placeholder="Descreva o desenho (ex.: triângulo com base 2 cm)"
        mono
        rowsMin={5}
        ariaLabel="Instruções do diagrama"
      />
      <Input
        value={bloco.legenda}
        onChange={(e) => onPatch({ legenda: e.target.value })}
        placeholder="Legenda (opcional)"
        className="h-8 rounded-lg text-xs"
        aria-label="Legenda do diagrama"
      />
      {bloco.codigo.trim() ? (
        <div className="border-border/60 flex justify-center rounded-lg border bg-white p-3 dark:bg-stone-900/60">
          <Tikz codigo={bloco.codigo} />
        </div>
      ) : null}
    </div>
  )
}

export interface AcoesFilhos {
  onPatchFilho: (filhoId: string, patch: Record<string, unknown>) => void
  onRemoverFilho: (filhoId: string) => void
  onMoverFilho: (filhoId: string, delta: number) => void
  onInserirFilho: (tipo: BlocoFilho["tipo"]) => void
}

const TIPOS_FILHO: { tipo: BlocoFilho["tipo"]; rotulo: string }[] = [
  { tipo: "paragrafo", rotulo: "Parágrafo" },
  { tipo: "formula", rotulo: "Fórmula" },
  { tipo: "lista", rotulo: "Lista" },
  { tipo: "chamada", rotulo: "Atenção / Dia a dia / Símbolos" },
  { tipo: "tabela", rotulo: "Tabela" },
]

export function novoFilho(tipo: BlocoFilho["tipo"]): BlocoFilho {
  const id = idBloco()
  switch (tipo) {
    case "paragrafo":
      return { id, tipo: "paragrafo", texto: "", rotulo: null }
    case "formula":
      return { id, tipo: "formula", latex: "" }
    case "lista":
      return { id, tipo: "lista", itens: [""] }
    case "tabela":
      return {
        id,
        tipo: "tabela",
        comCabecalho: true,
        linhas: [
          ["", ""],
          ["", ""],
        ],
      }
    case "chamada":
      return { id, tipo: "chamada", estilo: "atencao", texto: "" }
  }
}

export function EditorCaixa({
  bloco,
  onPatch,
  acoes,
}: {
  bloco: BlocoCaixa
  onPatch: Patch
  acoes: AcoesFilhos
}) {
  const rotuloPlaceholder =
    bloco.tipo === "copiar"
      ? "Nome curto do bloco (ex.: Taxa de transformação)"
      : bloco.tipo === "exemplo"
        ? "Exemplo resolvido"
        : "Dica / erro comum"

  return (
    <div className="space-y-3">
      <input
        value={bloco.rotulo}
        onChange={(e) => onPatch({ rotulo: e.target.value })}
        placeholder={rotuloPlaceholder}
        aria-label="Rótulo da caixa"
        className="hover:border-border/70 focus:border-border focus:bg-card w-full rounded-lg border border-transparent bg-transparent px-2 py-1 text-[0.92rem] font-bold tracking-wide uppercase transition-colors outline-none"
      />

      <div className="space-y-1.5">
        {bloco.filhos.map((filho, i) => (
          <div
            key={filho.id}
            className="group/filho bg-background/60 hover:border-border relative rounded-xl border border-transparent px-2.5 py-2 transition-colors"
          >
            <div className="flex items-center justify-end gap-0.5 opacity-0 transition-opacity group-hover/filho:opacity-100">
              <BotaoMini
                rotulo="Mover para cima"
                onClick={() => acoes.onMoverFilho(filho.id, -1)}
                disabled={i === 0}
              >
                <ArrowUp className="h-3 w-3" aria-hidden />
              </BotaoMini>
              <BotaoMini
                rotulo="Mover para baixo"
                onClick={() => acoes.onMoverFilho(filho.id, 1)}
                disabled={i === bloco.filhos.length - 1}
              >
                <ArrowDown className="h-3 w-3" aria-hidden />
              </BotaoMini>
              <BotaoMini rotulo="Remover" onClick={() => acoes.onRemoverFilho(filho.id)} perigo>
                <Trash2 className="h-3 w-3" aria-hidden />
              </BotaoMini>
            </div>
            <EditorFilho filho={filho} onPatch={(patch) => acoes.onPatchFilho(filho.id, patch)} />
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {TIPOS_FILHO.map((t) => (
          <button
            key={t.tipo}
            type="button"
            onClick={() => acoes.onInserirFilho(t.tipo)}
            className="border-border text-muted-foreground hover:bg-accent hover:text-foreground flex items-center gap-1 rounded-lg border border-dashed px-2.5 py-1 text-[0.75rem] font-semibold transition-colors hover:border-solid"
          >
            <Plus className="h-3 w-3" aria-hidden /> {t.rotulo}
          </button>
        ))}
      </div>
    </div>
  )
}

function BotaoMini({
  children,
  rotulo,
  onClick,
  disabled,
  perigo,
}: {
  children: React.ReactNode
  rotulo: string
  onClick: () => void
  disabled?: boolean
  perigo?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={rotulo}
      title={rotulo}
      className={`rounded-md p-1 transition-colors disabled:opacity-30 ${
        perigo
          ? "text-muted-foreground/70 hover:bg-destructive/10 hover:text-destructive"
          : "text-muted-foreground/70 hover:bg-accent hover:text-foreground"
      }`}
    >
      {children}
    </button>
  )
}

/** Editor de um filho (dentro de caixa). */
export function EditorFilho({ filho, onPatch }: { filho: BlocoFilho; onPatch: Patch }) {
  switch (filho.tipo) {
    case "paragrafo":
      return <EditorParagrafo bloco={filho} onPatch={onPatch} />
    case "formula":
      return <EditorFormula bloco={filho} onPatch={onPatch} />
    case "lista":
      return <EditorLista bloco={filho} onPatch={onPatch} />
    case "tabela":
      return <EditorTabela bloco={filho} onPatch={onPatch} />
    case "chamada":
      return <EditorChamada bloco={filho} onPatch={onPatch} />
  }
}

export function EditorExercicios({ bloco, onPatch }: { bloco: BlocoExercicios; onPatch: Patch }) {
  const setNiveis = (niveis: BlocoExercicios["niveis"]) => onPatch({ niveis })

  const mudarNivel = (i: number, patch: Partial<BlocoExercicios["niveis"][number]>) => {
    const niveis = bloco.niveis.map((n, j) => (j === i ? { ...n, ...patch } : n))
    setNiveis(niveis)
  }

  const novaQuestao = (): Questao => ({
    id: idBloco(),
    enunciado: "",
    alternativas: [],
    correta: null,
  })

  const mudarQuestao = (iNivel: number, idQuestao: string, patch: Partial<Questao>) => {
    const niveis = bloco.niveis.map((n, j) =>
      j === iNivel
        ? { ...n, questoes: n.questoes.map((q) => (q.id === idQuestao ? { ...q, ...patch } : q)) }
        : n,
    )
    setNiveis(niveis)
  }

  const CORES_NIVEL_BORDA = ["border-sky-400", "border-amber-400", "border-rose-400"]

  return (
    <div className="space-y-4">
      <input
        value={bloco.rotulo}
        onChange={(e) => onPatch({ rotulo: e.target.value })}
        placeholder="Exercícios propostos"
        aria-label="Rótulo dos exercícios"
        className="hover:border-border/70 focus:border-border focus:bg-card w-full rounded-lg border border-transparent bg-transparent px-2 py-1 text-[0.92rem] font-bold tracking-wide uppercase transition-colors outline-none"
      />

      {bloco.niveis.map((nivel, i) => (
        <div
          key={`${nivel.numero}-${i}`}
          className={`rounded-xl border border-l-4 ${CORES_NIVEL_BORDA[nivel.numero - 1] ?? "border-sky-400"} border-border bg-background/60 p-3`}
        >
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-md bg-stone-900 px-1.5 py-0.5 text-[0.65rem] font-bold text-stone-50 dark:bg-stone-100 dark:text-stone-900">
              NÍVEL {nivel.numero}
            </span>
            <input
              value={nivel.titulo}
              onChange={(e) => mudarNivel(i, { titulo: e.target.value })}
              placeholder="Conceitos / Aplicação / Síntese"
              aria-label={`Título do nível ${nivel.numero}`}
              className="hover:border-border/70 focus:border-border focus:bg-card w-full rounded-md border border-transparent bg-transparent px-1.5 py-1 text-sm font-bold transition-colors outline-none"
            />
          </div>

          <div className="space-y-2.5">
            {nivel.questoes.map((q, j) => (
              <div key={q.id} className="border-border/70 bg-card rounded-lg border p-2.5">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-muted-foreground text-[0.7rem] font-bold">
                    Questão {j + 1}
                    {q.alternativas.length > 0
                      ? q.correta !== null
                        ? ` · gabarito: (${"abcd"[q.correta] ?? "?"})`
                        : " · sem gabarito marcado"
                      : " · aberta"}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      mudarNivel(i, { questoes: nivel.questoes.filter((x) => x.id !== q.id) })
                    }
                    className="text-muted-foreground/60 hover:bg-accent hover:text-destructive rounded-md p-1 transition-colors"
                    aria-label={`Remover questão ${j + 1}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </div>
                <TextareaAuto
                  valor={q.enunciado}
                  onChange={(enunciado) => mudarQuestao(i, q.id, { enunciado })}
                  placeholder="Enunciado da questão…"
                  ariaLabel={`Enunciado da questão ${j + 1}`}
                />
                {q.alternativas.length > 0 ? (
                  <div className="mt-2 space-y-1.5">
                    {q.alternativas.map((alt, k) => {
                      const correta = q.correta === k
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
                            onClick={() => mudarQuestao(i, q.id, { correta: correta ? null : k })}
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[0.62rem] font-bold transition-colors ${
                              correta
                                ? "border-emerald-500 bg-emerald-500 text-white"
                                : "border-muted-foreground/40 text-muted-foreground hover:border-foreground"
                            }`}
                            aria-label={`Marcar alternativa ${"abcd"[k] ?? "?"} como correta`}
                            title="Marcar como correta"
                          >
                            {"abcd"[k] ?? "?"}
                          </button>
                          <TextareaAuto
                            valor={alt}
                            onChange={(v) => {
                              const alternativas = [...q.alternativas]
                              alternativas[k] = v
                              mudarQuestao(i, q.id, { alternativas })
                            }}
                            placeholder={`Alternativa (${"abcd"[k] ?? "?"})`}
                            ariaLabel={`Alternativa ${"abcd"[k] ?? "?"}`}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const alternativas = q.alternativas.filter((_, x) => x !== k)
                              const correta =
                                q.correta === null
                                  ? null
                                  : q.correta === k
                                    ? null
                                    : q.correta > k
                                      ? q.correta - 1
                                      : q.correta
                              mudarQuestao(i, q.id, { alternativas, correta })
                            }}
                            className="text-muted-foreground/60 hover:bg-accent hover:text-destructive rounded-md p-1 transition-colors"
                            aria-label={`Remover alternativa ${"abcd"[k] ?? "?"}`}
                          >
                            <X className="h-3 w-3" aria-hidden />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                ) : null}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {q.alternativas.length < 5 ? (
                    <button
                      type="button"
                      onClick={() =>
                        mudarQuestao(i, q.id, { alternativas: [...q.alternativas, ""] })
                      }
                      className="text-muted-foreground hover:bg-accent hover:text-foreground flex items-center gap-1 rounded-md px-2 py-0.5 text-[0.72rem] font-semibold transition-colors"
                    >
                      <Plus className="h-3 w-3" aria-hidden /> alternativa
                    </button>
                  ) : null}
                  {q.alternativas.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => mudarQuestao(i, q.id, { alternativas: [], correta: null })}
                      className="text-muted-foreground hover:bg-accent hover:text-foreground flex items-center gap-1 rounded-md px-2 py-0.5 text-[0.72rem] font-semibold transition-colors"
                    >
                      <CircleAlert className="h-3 w-3" aria-hidden /> virar questão aberta
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => mudarNivel(i, { questoes: [...nivel.questoes, novaQuestao()] })}
            className="border-border text-muted-foreground hover:bg-accent hover:text-foreground mt-2 flex items-center gap-1.5 rounded-lg border border-dashed px-2.5 py-1.5 text-[0.78rem] font-semibold transition-colors hover:border-solid"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden /> questão
          </button>
        </div>
      ))}

      <div className="border-border bg-background/60 space-y-1.5 rounded-xl border p-3">
        <p className="text-muted-foreground text-[0.7rem] font-bold tracking-wider uppercase">
          Gabarito (para as questões abertas)
        </p>
        <TextareaAuto
          valor={bloco.gabarito}
          onChange={(gabarito) => onPatch({ gabarito })}
          placeholder="2) 3,0 m/s · 5) veja resolução. As alternativas marcadas entram automaticamente."
          ariaLabel="Gabarito das questões abertas"
        />
      </div>
    </div>
  )
}
