"use client"

// Editor de nota. Orquestra metadados, o documento único WYSIWYG (editor
// de blocos com Lexical), salvamento automático e exportações.

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  ArrowLeft,
  BookOpenText,
  Check,
  ChevronDown,
  CloudUpload,
  CopyPlus,
  Download,
  FileCode2,
  FileJson,
  FileText,
  Link2,
  Loader2,
  Trash2,
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
import { toast } from "sonner"

import {
  useDisciplinas,
  useDuplicarNota,
  useExcluirNota,
  useNota,
  useSalvarNota,
  useTurmas,
} from "@/lib/notas/api-client"
import { DialogoCompartilhar } from "@/components/dialogo-compartilhar"
import { MESES_CAP } from "@/lib/notas/texto"
import type { AparenciaNota, Bloco, NotaDados } from "@/lib/notas/tipos"
import {
  APARENCIA_PADRAO,
  ENTRELINHAS_NOTA,
  ESCALAS_NOTA,
  FONTES_NOTA,
  variaveisAparencia,
} from "@/lib/notas/tipos"
import { EditorNotaWysiwyg } from "./editor-nota-wysiwyg"
import { BarraAtivaMobile } from "./barra-formatar"

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
  const timerAutoSave = useRef<ReturnType<typeof setTimeout> | null>(null)

  // payload atual do formulário para o autosave e o flush
  const dadosAtuais = useCallback(
    () => ({
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
    }),
    [titulo, disciplinaId, anoLetivo, mes, sobre, habilidades, status, turmasSel, blocos, aparencia],
  )

  // grava imediatamente o que está pendente (usado ao sair da página)
  const salvarAgora = useCallback(() => {
    if (!sujo) return
    if (timerAutoSave.current) clearTimeout(timerAutoSave.current)
    setEstadoSalvamento("salvando")
    salvar.mutate(dadosAtuais(), {
      onSuccess: () => {
        setSujo(false)
        setEstadoSalvamento("salvo")
      },
      onError: () => setEstadoSalvamento("erro"),
    })
  }, [sujo, salvar, dadosAtuais])

  // referência sempre atual do flush (o efeito de saída usa deps vazias)
  const salvarAgoraRef = useRef(salvarAgora)
  useEffect(() => {
    salvarAgoraRef.current = salvarAgora
  })

  // flush ao sair da rota ou fechar a aba (não perde os últimos toques)
  useEffect(() => {
    const aoDescarregar = (): void => salvarAgoraRef.current()
    window.addEventListener("beforeunload", aoDescarregar)
    return () => {
      window.removeEventListener("beforeunload", aoDescarregar)
      aoDescarregar()
    }
  }, [])

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
    salvar,
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

      {/* edição: documento único (o editor é o preview) */}
      <div className="na-nota" style={variaveisAparencia(aparencia) as React.CSSProperties}>
        <EditorNotaWysiwyg blocos={blocos} onChange={(novos) => mudarBlocos(() => novos)} />
      </div>

      {/* barra de formatação fixa do mobile (desktop usa o bubble da seleção) */}
      <BarraAtivaMobile />

      {compartilharAberto ? (
        <DialogoCompartilhar
          aberto
          aoFechar={() => setCompartilharAberto(false)}
          notaId={id}
          aoPublicar={() => setStatus("publicada")}
        />
      ) : null}
    </div>
  )
}
