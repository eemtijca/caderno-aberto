"use client"

// Editor de nota. Orquestra metadados, lista de blocos com arrastar-e-soltar, paleta de inserção, salvamento automático e exportações.

import { useEffect, useMemo, useRef, useState } from "react"
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  ArrowLeft,
  BookOpenText,
  Check,
  ChevronDown,
  ChevronUp,
  CloudUpload,
  Copy,
  CopyPlus,
  Download,
  Eye,
  FileCode2,
  FileJson,
  FileText,
  GripVertical,
  Link2,
  Loader2,
  Plus,
  Printer,
  Trash2,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"

import {
  useDisciplinas,
  useDuplicarNota,
  useExcluirNota,
  useNota,
  useSalvarNota,
  useTurmas,
} from "@/lib/notas/api-client"
import { useSessao } from "@/hooks/use-sessao"
import { DialogoCompartilhar } from "@/components/dialogo-compartilhar"
import { MESES_CAP } from "@/lib/notas/texto"
import type { AparenciaNota, Bloco, NotaDados } from "@/lib/notas/tipos"
import {
  APARENCIA_PADRAO,
  ENTRELINHAS_NOTA,
  ESCALAS_NOTA,
  FONTES_NOTA,
  idBloco,
  variaveisAparencia,
} from "@/lib/notas/tipos"
import { BlocosView } from "@/components/notas/blocos-view"
import {
  atualizarBloco,
  atualizarFilho,
  duplicarBloco,
  inserirBloco,
  inserirFilho,
  moverBloco,
  moverFilho,
  removerBloco,
  removerFilho,
  reordenar,
} from "./ops"
import {
  EditorCaixa,
  EditorChamada,
  EditorExercicios,
  EditorFigura,
  EditorFormula,
  EditorLista,
  EditorParagrafo,
  EditorSecao,
  EditorTabela,
  EditorTikz,
  novoFilho,
} from "./editores-bloco"

const PALETA: { tipo: Bloco["tipo"]; rotulo: string; descricao: string }[] = [
  { tipo: "secao", rotulo: "Seção", descricao: "Título numerado de tópico" },
  { tipo: "paragrafo", rotulo: "Parágrafo", descricao: "Texto corrido com rótulo opcional" },
  { tipo: "formula", rotulo: "Fórmula", descricao: "Equação em destaque" },
  { tipo: "lista", rotulo: "Lista", descricao: "Itens com marcadores" },
  { tipo: "tabela", rotulo: "Tabela", descricao: "Linhas e colunas" },
  { tipo: "chamada", rotulo: "Atenção / Símbolos", descricao: "Alerta, dia a dia ou símbolos" },
  { tipo: "figura", rotulo: "Figura", descricao: "Imagem com legenda" },
  {
    tipo: "tikz",
    rotulo: "Diagrama",
    descricao: "Ilustração geométrica — criada com TikZ por baixo dos panos",
  },
  { tipo: "copiar", rotulo: "COPIAR", descricao: "O que o aluno leva para o caderno" },
  { tipo: "exemplo", rotulo: "Exemplo", descricao: "Exemplo resolvido passo a passo" },
  { tipo: "dica", rotulo: "Dica", descricao: "Dica / erro comum" },
  { tipo: "exercicios", rotulo: "Exercícios", descricao: "Lista com níveis e gabarito" },
]

export function novoBloco(tipo: Bloco["tipo"]): Bloco {
  const id = idBloco()
  switch (tipo) {
    case "secao":
      return { id, tipo: "secao", titulo: "" }
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
    case "figura":
      return { id, tipo: "figura", url: "", legenda: "" }
    case "tikz":
      return { id, tipo: "tikz", codigo: "\\draw (0,0) -- (2,0) -- (1,1) -- cycle;", legenda: "" }
    case "copiar":
      return { id, tipo: "copiar", rotulo: "", filhos: [novoFilho("paragrafo")] }
    case "exemplo":
      return { id, tipo: "exemplo", rotulo: "Exemplo resolvido", filhos: [novoFilho("paragrafo")] }
    case "dica":
      return { id, tipo: "dica", rotulo: "Dica / erro comum", filhos: [novoFilho("paragrafo")] }
    case "exercicios":
      return {
        id,
        tipo: "exercicios",
        rotulo: "Exercícios propostos",
        niveis: [
          { numero: 1, titulo: "Conceitos", questoes: [] },
          { numero: 2, titulo: "Aplicação", questoes: [] },
          { numero: 3, titulo: "Síntese", questoes: [] },
        ],
        gabarito: "",
      }
  }
}

export function VistaEditor({ id, navegar }: { id: string; navegar: (para: string) => void }) {
  const { data: nota, isLoading, isError } = useNota(id)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    )
  }

  if (!nota || isError) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <p className="fonte-display text-xl font-bold">Nota não encontrada</p>
        <p className="text-muted-foreground mt-2 text-sm">
          Ela pode ter sido excluída ou pertence a outro professor.
        </p>
        <Button onClick={() => navegar("/notas")} className="mt-5 gap-2 rounded-xl">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Voltar às notas
        </Button>
      </div>
    )
  }

  // remonta ao trocar de nota (estado inicializado direto dos dados)
  return <FormularioNota key={nota.id} notaInicial={nota} navegar={navegar} />
}

function FormularioNota({
  notaInicial,
  navegar,
}: {
  notaInicial: NotaDados
  navegar: (para: string) => void
}) {
  const id = notaInicial.id
  const { data: disciplinas } = useDisciplinas()
  const { data: turmas } = useTurmas()
  const { perfil } = useSessao()
  const salvar = useSalvarNota(id)
  const excluir = useExcluirNota()
  const duplicar = useDuplicarNota()
  const [compartilharAberto, setCompartilharAberto] = useState(false)

  const [titulo, setTitulo] = useState(notaInicial.titulo)
  const [disciplinaId, setDisciplinaId] = useState(notaInicial.disciplinaId)
  const [anoLetivo, setAnoLetivo] = useState(notaInicial.anoLetivo)
  const [mes, setMes] = useState(notaInicial.mes)
  const [sobre, setSobre] = useState(notaInicial.sobre)
  const [habilidades, setHabilidades] = useState(notaInicial.habilidades)
  const [status, setStatus] = useState<"rascunho" | "publicada">(notaInicial.status)
  const [turmasSel, setTurmasSel] = useState<string[]>(notaInicial.turmas.map((t) => t.id))
  const [blocos, setBlocos] = useState<Bloco[]>(notaInicial.blocos)
  // aparência da leitura: vale para o professor, os alunos e a impressão
  const [aparencia, setAparencia] = useState<AparenciaNota>(
    notaInicial.aparencia ?? APARENCIA_PADRAO,
  )

  const [sujo, setSujo] = useState(false)
  const [estadoSalvamento, setEstadoSalvamento] = useState<"salvo" | "salvando" | "erro">("salvo")
  const [paletaEm, setPaletaEm] = useState<number | null>(null)
  const timerAutoSave = useRef<ReturnType<typeof setTimeout> | null>(null)

  // autosave com debounce
  useEffect(() => {
    if (!sujo) return
    if (timerAutoSave.current) clearTimeout(timerAutoSave.current)
    timerAutoSave.current = setTimeout(async () => {
      setEstadoSalvamento("salvando")
      try {
        await salvar.mutateAsync({
          titulo,
          disciplinaId,
          anoLetivo,
          mes,
          sobre,
          habilidades,
          status,
          turmasIds: turmasSel,
          blocos,
          aparencia,
        })
        setEstadoSalvamento("salvo")
        setSujo(false)
      } catch {
        setEstadoSalvamento("erro")
      }
    }, 900)
    return () => {
      if (timerAutoSave.current) clearTimeout(timerAutoSave.current)
    }
  }, [
    titulo,
    disciplinaId,
    anoLetivo,
    mes,
    sobre,
    habilidades,
    status,
    turmasSel,
    blocos,
    aparencia,
    sujo,
  ])

  const marcar =
    <T,>(fn: (v: T) => void) =>
    (valor: T) => {
      fn(valor)
      setSujo(true)
    }

  const mudarBlocos = (fn: (b: Bloco[]) => Bloco[]) => {
    setBlocos(fn)
    setSujo(true)
  }

  const turmasDoAno = useMemo(
    () => (turmas ?? []).filter((t) => t.anoLetivo === anoLetivo),
    [turmas, anoLetivo],
  )

  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const aoArrastarFim = (e: DragEndEvent) => {
    const { active, over } = e
    if (active.id !== over?.id && over) {
      const de = blocos.findIndex((b) => b.id === String(active.id))
      const para = blocos.findIndex((b) => b.id === String(over.id))
      if (de !== -1 && para !== -1) mudarBlocos(() => reordenar(blocos, de, para))
    }
  }

  const linkLeitura = `#/nota/${notaInicial.id}`

  const exportar = (formato: "tex" | "md" | "json") => {
    window.open(`/api/notas/${id}/exportar?formato=${formato}`, "_blank")
    toast.success(
      formato === "tex"
        ? "Arquivo para impressão gerado"
        : formato === "md"
          ? "Arquivo de texto gerado"
          : "Arquivo de backup gerado",
      {
        description:
          formato === "tex"
            ? "Autocontido: compila direto no Overleaf ou TeX Live, sem arquivos externos."
            : undefined,
      },
    )
  }

  return (
    <div className="space-y-5">
      {/* barra superior */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navegar("/notas")}
          aria-label="Voltar para notas"
          className="rounded-lg"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden />
        </Button>
        <div className="min-w-0 flex-1">
          <input
            value={titulo}
            onChange={(e) => marcar(setTitulo)(e.target.value)}
            placeholder="Título da nota"
            aria-label="Título da nota"
            className="fonte-display hover:border-border/70 focus:border-border focus:bg-card w-full truncate rounded-lg border border-transparent bg-transparent px-1 py-1 text-xl font-bold transition-colors outline-none sm:text-2xl"
          />
        </div>
        <span
          className={`flex items-center gap-1.5 text-[0.72rem] font-semibold ${
            estadoSalvamento === "erro" ? "text-destructive" : "text-muted-foreground"
          }`}
          role="status"
        >
          {estadoSalvamento === "salvando" ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> salvando…
            </>
          ) : estadoSalvamento === "erro" ? (
            <>
              <CloudUpload className="h-3.5 w-3.5" aria-hidden /> Erro ao salvar. Tente novamente
            </>
          ) : (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden /> salvo
            </>
          )}
        </span>
      </div>

      {/* ações */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 rounded-lg text-xs"
          onClick={() => navegar(linkLeitura)}
        >
          <BookOpenText className="h-3.5 w-3.5" aria-hidden /> Ler
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 rounded-lg text-xs">
              <Download className="h-3.5 w-3.5" aria-hidden /> Exportar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => exportar("tex")} className="gap-2 text-xs">
              <FileCode2 className="h-3.5 w-3.5" aria-hidden /> Arquivo para impressão
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => exportar("md")} className="gap-2 text-xs">
              <FileText className="h-3.5 w-3.5" aria-hidden /> Arquivo de texto
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => exportar("json")} className="gap-2 text-xs">
              <FileJson className="h-3.5 w-3.5" aria-hidden /> Backup completo
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 rounded-lg text-xs"
          onClick={() => setCompartilharAberto(true)}
        >
          <Link2 className="h-3.5 w-3.5" aria-hidden /> Compartilhar
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 rounded-lg text-xs"
          disabled={duplicar.isPending}
          onClick={async () => {
            try {
              const r = await duplicar.mutateAsync(id)
              toast.success("Nota duplicada", { description: "A cópia abriu como rascunho." })
              navegar(`/editor/${r.nota.id}`)
            } catch {
              toast.error("Não foi possível duplicar.")
            }
          }}
        >
          <CopyPlus className="h-3.5 w-3.5" aria-hidden /> Duplicar
        </Button>

        <label className="border-border bg-card ml-auto flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-1.5">
          <Switch
            checked={status === "publicada"}
            onCheckedChange={(v) => marcar(setStatus)(v ? "publicada" : "rascunho")}
          />
          <span className="text-xs font-semibold">
            {status === "publicada" ? "Publicada" : "Rascunho"}
          </span>
        </label>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive rounded-lg"
              aria-label="Excluir nota"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir esta nota?</AlertDialogTitle>
              <AlertDialogDescription>
                &ldquo;{titulo || "Sem título"}&rdquo; será removida definitivamente, junto com seu
                conteúdo e vinculações de turma. Não dá para desfazer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive hover:bg-destructive/90 text-white"
                onClick={async () => {
                  try {
                    await excluir.mutateAsync(id)
                    toast.success("Nota excluída")
                    navegar("/notas")
                  } catch {
                    toast.error("Não foi possível excluir.")
                  }
                }}
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* metadados */}
      <details className="group border-border bg-card rounded-2xl border" open={false}>
        <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-bold">
          <ChevronDown
            className="text-muted-foreground h-4 w-4 transition-transform group-open:rotate-180"
            aria-hidden
          />
          Metadados da nota
          <Badge variant="secondary" className="ml-1 rounded-md text-[0.65rem] font-normal">
            {MESES_CAP[mes - 1]}/{anoLetivo}
            {turmasSel.length > 0
              ? ` · ${turmasSel
                  .map((tid) => turmas?.find((t) => t.id === tid)?.nome)
                  .filter(Boolean)
                  .join(", ")}`
              : ""}
          </Badge>
        </summary>
        <div className="border-border grid gap-4 border-t px-4 py-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label className="text-xs">Disciplina</Label>
              <Select value={disciplinaId} onValueChange={marcar(setDisciplinaId)}>
                <SelectTrigger className="w-full rounded-lg">
                  <SelectValue placeholder="Selecione…" />
                </SelectTrigger>
                <SelectContent>
                  {(disciplinas ?? []).map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="ano-editor" className="text-xs">
                  Ano letivo
                </Label>
                <Input
                  id="ano-editor"
                  type="number"
                  value={anoLetivo}
                  onChange={(e) => marcar(setAnoLetivo)(Number(e.target.value) || anoLetivo)}
                  className="rounded-lg"
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">Mês</Label>
                <Select value={String(mes)} onValueChange={(v) => marcar(setMes)(Number(v))}>
                  <SelectTrigger className="w-full rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MESES_CAP.map((m, i) => (
                      <SelectItem key={m} value={String(i + 1)}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label className="text-xs">
              Turmas de {anoLetivo} {turmasDoAno.length === 0 ? "(nenhuma cadastrada)" : ""}
            </Label>
            <div className="flex flex-wrap gap-2">
              {turmasDoAno.map((t) => {
                const sel = turmasSel.includes(t.id)
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() =>
                      marcar(setTurmasSel)(
                        sel ? turmasSel.filter((x) => x !== t.id) : [...turmasSel, t.id],
                      )
                    }
                    aria-pressed={sel}
                    className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors ${
                      sel
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card hover:bg-accent"
                    }`}
                  >
                    {t.nome}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="sobre-editor" className="text-xs">
              Sobre esta nota (resumo de abertura)
            </Label>
            <Textarea
              id="sobre-editor"
              value={sobre}
              onChange={(e) => marcar(setSobre)(e.target.value)}
              placeholder="Conteúdo, subtópicos e contexto da aula…"
              className="min-h-[64px] rounded-lg text-sm"
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="habilidades-editor" className="text-xs">
              Habilidades BNCC/ENEM (separadas por vírgula)
            </Label>
            <Input
              id="habilidades-editor"
              value={habilidades}
              onChange={(e) => marcar(setHabilidades)(e.target.value)}
              placeholder="EM13CNT107, EM13CNT203…"
              className="rounded-lg font-mono text-sm"
            />
          </div>

          {/* aparência da leitura: fonte, tamanho e entrelinha da nota */}
          <div className="border-border grid gap-4 border-t pt-4">
            <div className="space-y-1">
              <p className="text-xs font-bold">Aparência da leitura</p>
              <p className="text-muted-foreground text-[0.72rem] leading-snug">
                Vale para o professor, para os alunos que abrirem o link e para a impressão. A
                prévia ao lado já acompanha a escolha.
              </p>
            </div>

            <div className="grid gap-1.5">
              <Label className="text-xs">Fonte</Label>
              <div className="flex flex-wrap gap-1.5">
                {FONTES_NOTA.map((f) => (
                  <button
                    key={f.chave}
                    type="button"
                    onClick={() => marcar(setAparencia)({ ...aparencia, fonte: f.chave })}
                    aria-pressed={(aparencia.fonte ?? APARENCIA_PADRAO.fonte) === f.chave}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[0.78rem] font-semibold transition-colors ${
                      (aparencia.fonte ?? APARENCIA_PADRAO.fonte) === f.chave
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card hover:bg-accent"
                    }`}
                  >
                    <span
                      className="text-base leading-none"
                      style={{ fontFamily: f.familia }}
                      aria-hidden
                    >
                      Aa
                    </span>
                    {f.nome}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label className="text-xs">Tamanho do texto</Label>
              <div className="flex flex-wrap gap-1.5">
                {ESCALAS_NOTA.map((e) => (
                  <button
                    key={e.chave}
                    type="button"
                    onClick={() => marcar(setAparencia)({ ...aparencia, escala: e.chave })}
                    aria-pressed={(aparencia.escala ?? APARENCIA_PADRAO.escala) === e.chave}
                    className={`rounded-lg border px-3 py-1.5 text-[0.78rem] font-semibold transition-colors ${
                      (aparencia.escala ?? APARENCIA_PADRAO.escala) === e.chave
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card hover:bg-accent"
                    }`}
                  >
                    {e.nome}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label className="text-xs">Entrelinha</Label>
              <div className="flex flex-wrap gap-1.5">
                {ENTRELINHAS_NOTA.map((e) => (
                  <button
                    key={e.chave}
                    type="button"
                    onClick={() => marcar(setAparencia)({ ...aparencia, entrelinha: e.chave })}
                    aria-pressed={(aparencia.entrelinha ?? APARENCIA_PADRAO.entrelinha) === e.chave}
                    className={`rounded-lg border px-3 py-1.5 text-[0.78rem] font-semibold transition-colors ${
                      (aparencia.entrelinha ?? APARENCIA_PADRAO.entrelinha) === e.chave
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card hover:bg-accent"
                    }`}
                  >
                    {e.nome}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </details>

      {/* editar / pré-visualizar */}
      <div className="lg:hidden">
        <Tabs defaultValue="editar">
          <TabsList className="w-full rounded-xl">
            <TabsTrigger value="editar" className="flex-1 rounded-lg">
              Editar
            </TabsTrigger>
            <TabsTrigger value="previa" className="flex-1 rounded-lg">
              <Eye className="mr-1.5 h-3.5 w-3.5" aria-hidden /> Prévia
            </TabsTrigger>
          </TabsList>
          <TabsContent value="editar" className="mt-4">
            <ListaBlocos
              blocos={blocos}
              mudarBlocos={mudarBlocos}
              paletaEm={paletaEm}
              setPaletaEm={setPaletaEm}
              sensores={sensores}
              aoArrastarFim={aoArrastarFim}
            />
          </TabsContent>
          <TabsContent value="previa" className="mt-4">
            <Previa blocos={blocos} titulo={titulo} aparencia={aparencia} />
          </TabsContent>
        </Tabs>
      </div>

      <div className="hidden gap-6 lg:grid lg:grid-cols-[1fr_0.9fr]">
        <div>
          <ListaBlocos
            blocos={blocos}
            mudarBlocos={mudarBlocos}
            paletaEm={paletaEm}
            setPaletaEm={setPaletaEm}
            sensores={sensores}
            aoArrastarFim={aoArrastarFim}
          />
        </div>
        <div className="border-border bg-card sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto rounded-2xl border p-5 shadow-sm">
          <p className="text-muted-foreground mb-4 flex items-center gap-1.5 text-[0.7rem] font-bold tracking-wider uppercase">
            <Eye className="h-3.5 w-3.5" aria-hidden /> Prévia ao vivo
          </p>
          <Previa blocos={blocos} titulo={titulo} aparencia={aparencia} />
        </div>
      </div>

      {compartilharAberto ? (
        <DialogoCompartilhar aberto aoFechar={() => setCompartilharAberto(false)} notaId={id} />
      ) : null}
    </div>
  )
}

// Lista de blocos com dnd-kit

function ListaBlocos({
  blocos,
  mudarBlocos,
  paletaEm,
  setPaletaEm,
  sensores,
  aoArrastarFim,
}: {
  blocos: Bloco[]
  mudarBlocos: (fn: (b: Bloco[]) => Bloco[]) => void
  paletaEm: number | null
  setPaletaEm: (i: number | null) => void
  sensores: ReturnType<typeof useSensors>
  aoArrastarFim: (e: DragEndEvent) => void
}) {
  let numeroSecao = 0

  return (
    <DndContext sensors={sensores} collisionDetection={closestCenter} onDragEnd={aoArrastarFim}>
      <SortableContext items={blocos.map((b) => b.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2.5">
          {blocos.map((b, i) => {
            if (b.tipo === "secao") numeroSecao++
            return (
              <div key={b.id}>
                <CartaoBloco
                  bloco={b}
                  indice={i}
                  numeroSecao={numeroSecao}
                  total={blocos.length}
                  mudarBlocos={mudarBlocos}
                  onInserirAqui={() => setPaletaEm(i + 1)}
                />
                {paletaEm === i + 1 ? (
                  <PaletaInsercao
                    onEscolher={(tipo) => {
                      mudarBlocos((bs) => inserirBloco(bs, i + 1, novoBloco(tipo)))
                      setPaletaEm(null)
                    }}
                    onFechar={() => setPaletaEm(null)}
                  />
                ) : null}
              </div>
            )
          })}
        </div>
      </SortableContext>

      <div className="mt-3">
        {paletaEm === blocos.length || blocos.length === 0 ? (
          <PaletaInsercao
            onEscolher={(tipo) => {
              mudarBlocos((bs) => inserirBloco(bs, bs.length, novoBloco(tipo)))
              setPaletaEm(null)
            }}
            onFechar={() => setPaletaEm(null)}
          />
        ) : (
          <button
            type="button"
            onClick={() => setPaletaEm(blocos.length)}
            className="border-border text-muted-foreground hover:bg-accent hover:text-foreground flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed py-3.5 text-sm font-semibold transition-colors hover:border-solid"
          >
            <Plus className="h-4 w-4" aria-hidden />
            {blocos.length === 0 ? "Adicionar o primeiro bloco" : "Adicionar bloco ao final"}
          </button>
        )}
      </div>
    </DndContext>
  )
}

function CartaoBloco({
  bloco,
  indice,
  numeroSecao,
  total,
  mudarBlocos,
  onInserirAqui,
}: {
  bloco: Bloco
  indice: number
  numeroSecao: number
  total: number
  mudarBlocos: (fn: (b: Bloco[]) => Bloco[]) => void
  onInserirAqui: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: bloco.id,
  })

  const estilo: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  }

  const classesCaixa =
    bloco.tipo === "copiar"
      ? "border-2 border-dashed border-stone-400 dark:border-stone-600"
      : bloco.tipo === "exemplo"
        ? "border border-emerald-300/70 border-l-4 border-l-emerald-500 dark:border-emerald-800/60"
        : bloco.tipo === "dica"
          ? "border border-amber-300/70 border-l-4 border-l-amber-500 dark:border-amber-800/60"
          : bloco.tipo === "tikz"
            ? "border border-violet-300/70 border-l-4 border-l-violet-500 bg-violet-50/20 dark:border-violet-800/60 dark:bg-violet-950/10"
            : bloco.tipo === "exercicios"
              ? "border border-border bg-stone-50/70 dark:bg-stone-900/40"
              : "border border-border"

  const patch = (p: Record<string, unknown>) => mudarBlocos((bs) => atualizarBloco(bs, bloco.id, p))

  return (
    <article
      ref={setNodeRef}
      style={estilo}
      className={`group bg-card relative rounded-2xl border px-3 py-3 transition-shadow hover:shadow-sm sm:px-4 ${classesCaixa}`}
    >
      {/* controles laterais (desktop) */}
      <div className="absolute top-2 -left-11 hidden flex-col items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 sm:flex">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="text-muted-foreground/60 hover:bg-accent hover:text-foreground cursor-grab touch-none rounded-md p-1.5 active:cursor-grabbing"
          aria-label="Arrastar para reordenar"
        >
          <GripVertical className="h-4 w-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={onInserirAqui}
          className="text-muted-foreground/60 hover:bg-accent hover:text-foreground rounded-md p-1.5"
          aria-label="Inserir bloco abaixo"
        >
          <Plus className="h-4 w-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => mudarBlocos((bs) => duplicarBloco(bs, bloco.id))}
          className="text-muted-foreground/60 hover:bg-accent hover:text-foreground rounded-md p-1.5"
          aria-label="Duplicar bloco"
        >
          <Copy className="h-3.5 w-3.5" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => mudarBlocos((bs) => moverBloco(bs, bloco.id, -1))}
          disabled={indice === 0}
          className="text-muted-foreground/60 hover:bg-accent hover:text-foreground rounded-md p-1 disabled:opacity-25"
          aria-label="Mover para cima"
        >
          <ChevronUp className="h-3.5 w-3.5" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => mudarBlocos((bs) => moverBloco(bs, bloco.id, 1))}
          disabled={indice === total - 1}
          className="text-muted-foreground/60 hover:bg-accent hover:text-foreground rounded-md p-1 disabled:opacity-25"
          aria-label="Mover para baixo"
        >
          <ChevronDown className="h-3.5 w-3.5" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => mudarBlocos((bs) => removerBloco(bs, bloco.id))}
          className="text-muted-foreground/60 hover:bg-destructive/10 hover:text-destructive rounded-md p-1"
          aria-label="Remover bloco"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>

      {/* etiqueta do tipo + controles completos (mobile — os mesmos do desktop) */}
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-1.5 sm:mb-0">
        <span className="rounded-md bg-stone-100 px-1.5 py-0.5 text-[0.6rem] font-bold tracking-widest text-stone-500 uppercase dark:bg-stone-800 dark:text-stone-400">
          {PALETA.find((p) => p.tipo === bloco.tipo)?.rotulo ?? bloco.tipo}
        </span>
        <div className="flex items-center gap-0.5 sm:hidden">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="text-muted-foreground/70 hover:bg-accent hover:text-foreground cursor-grab touch-none rounded-md p-1.5 active:cursor-grabbing"
            aria-label="Arrastar para reordenar"
          >
            <GripVertical className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={onInserirAqui}
            className="text-muted-foreground/70 hover:bg-accent hover:text-foreground rounded-md p-1.5"
            aria-label="Inserir bloco abaixo"
          >
            <Plus className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => mudarBlocos((bs) => duplicarBloco(bs, bloco.id))}
            className="text-muted-foreground/70 hover:bg-accent hover:text-foreground rounded-md p-1.5"
            aria-label="Duplicar bloco"
          >
            <Copy className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => mudarBlocos((bs) => moverBloco(bs, bloco.id, -1))}
            disabled={indice === 0}
            className="text-muted-foreground rounded-md p-1.5 disabled:opacity-25"
            aria-label="Mover para cima"
          >
            <ChevronUp className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => mudarBlocos((bs) => moverBloco(bs, bloco.id, 1))}
            disabled={indice === total - 1}
            className="text-muted-foreground rounded-md p-1.5 disabled:opacity-25"
            aria-label="Mover para baixo"
          >
            <ChevronDown className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => mudarBlocos((bs) => removerBloco(bs, bloco.id))}
            className="text-muted-foreground/70 hover:bg-destructive/10 hover:text-destructive rounded-md p-1.5"
            aria-label="Remover bloco"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>

      {/* conteúdo por tipo */}
      {bloco.tipo === "secao" ? (
        <EditorSecao bloco={bloco} numero={numeroSecao} onPatch={patch} />
      ) : bloco.tipo === "paragrafo" ? (
        <EditorParagrafo bloco={bloco} onPatch={patch} />
      ) : bloco.tipo === "formula" ? (
        <EditorFormula bloco={bloco} onPatch={patch} />
      ) : bloco.tipo === "lista" ? (
        <EditorLista bloco={bloco} onPatch={patch} />
      ) : bloco.tipo === "tabela" ? (
        <EditorTabela bloco={bloco} onPatch={patch} />
      ) : bloco.tipo === "chamada" ? (
        <EditorChamada bloco={bloco} onPatch={patch} />
      ) : bloco.tipo === "figura" ? (
        <EditorFigura bloco={bloco} onPatch={patch} />
      ) : bloco.tipo === "tikz" ? (
        <EditorTikz bloco={bloco} onPatch={patch} />
      ) : bloco.tipo === "exercicios" ? (
        <EditorExercicios bloco={bloco} onPatch={patch} />
      ) : (
        <EditorCaixa
          bloco={bloco}
          onPatch={patch}
          acoes={{
            onPatchFilho: (filhoId, p) =>
              mudarBlocos((bs) => atualizarFilho(bs, bloco.id, filhoId, p)),
            onRemoverFilho: (filhoId) => mudarBlocos((bs) => removerFilho(bs, bloco.id, filhoId)),
            onMoverFilho: (filhoId, delta) =>
              mudarBlocos((bs) => moverFilho(bs, bloco.id, filhoId, delta)),
            onInserirFilho: (tipo) =>
              mudarBlocos((bs) => {
                const caixa = bs.find((b) => b.id === bloco.id)
                const fim =
                  caixa &&
                  (caixa.tipo === "copiar" || caixa.tipo === "exemplo" || caixa.tipo === "dica")
                    ? caixa.filhos.length
                    : 0
                return inserirFilho(bs, bloco.id, fim, novoFilho(tipo))
              }),
          }}
        />
      )}
    </article>
  )
}

// Paleta de inserção de blocos

function PaletaInsercao({
  onEscolher,
  onFechar,
}: {
  onEscolher: (tipo: Bloco["tipo"]) => void
  onFechar: () => void
}) {
  return (
    <div className="border-border bg-popover mt-2 rounded-2xl border p-3 shadow-lg">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-muted-foreground px-1 text-[0.7rem] font-bold tracking-wider uppercase">
          Inserir bloco
        </p>
        <button
          type="button"
          onClick={onFechar}
          className="text-muted-foreground hover:bg-accent rounded-md p-1"
          aria-label="Fechar paleta"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
        {PALETA.map((item) => (
          <button
            key={item.tipo}
            type="button"
            onClick={() => onEscolher(item.tipo)}
            className="border-border bg-card hover:border-foreground/30 hover:bg-accent rounded-xl border px-3 py-2.5 text-left transition-colors"
          >
            <span className="block text-[0.82rem] font-bold">{item.rotulo}</span>
            <span className="text-muted-foreground block text-[0.68rem] leading-snug">
              {item.descricao}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

// Prévia

function Previa({
  blocos,
  titulo,
  aparencia,
}: {
  blocos: Bloco[]
  titulo: string
  aparencia: AparenciaNota
}) {
  const [gabarito, setGabarito] = useState(false)
  return (
    <div className="na-nota" style={variaveisAparencia(aparencia) as React.CSSProperties}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="fonte-display text-xl font-extrabold">{titulo || "Sem título"}</h3>
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1.5 rounded-lg text-[0.7rem]"
          onClick={() => setGabarito(!gabarito)}
        >
          {gabarito ? "Ocultar gabarito" : "Mostrar gabarito"}
        </Button>
      </div>
      <div className="space-y-5">
        <BlocosView blocos={blocos} mostrarGabarito={gabarito} />
      </div>
      <p className="border-border text-muted-foreground mt-8 flex items-center gap-1.5 border-t pt-4 text-[0.7rem]">
        <Printer className="h-3 w-3" aria-hidden />A versão de impressão (A4, 2 colunas) abre pelo
        botão de imprimir na leitura.
      </p>
    </div>
  )
}
