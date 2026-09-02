"use client"

// Diálogo de nova nota. Metadados para organização automática.
import { useMemo, useState } from "react"
import { Loader2, Plus, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { useTurmas, useCriarNota, useDisciplinas, useCriarDisciplina } from "@/lib/notas/api-client"
import {
  CORES,
  corDisciplina,
  ICONES_DISCIPLINA,
  obterIconeDisciplina,
  nomeIconeValido,
} from "@/lib/notas/cores"
import { MESES_CAP } from "@/lib/notas/texto"
import { toast } from "sonner"

interface Props {
  aberto: boolean
  aoFechar: () => void
  aoCriar: (id: string) => void
}

export function DialogoNovaNota({ aberto, aoFechar, aoCriar }: Props) {
  const disciplinasQ = useDisciplinas()
  const turmasQ = useTurmas()
  const disciplinas = disciplinasQ.data
  const turmas = turmasQ.data
  const criar = useCriarNota()
  const criarDisciplina = useCriarDisciplina()

  const anoAtual = new Date().getFullYear()
  const mesAtual = new Date().getMonth() + 1

  const [titulo, setTitulo] = useState("")
  const [disciplinaId, setDisciplinaId] = useState("")
  const [anoLetivo, setAnoLetivo] = useState(anoAtual)
  const [mes, setMes] = useState(mesAtual)
  const [turmasSel, setTurmasSel] = useState<string[]>([])
  const [comModelo, setComModelo] = useState(true)
  const [mostrarNovaDisciplina, setMostrarNovaDisciplina] = useState(false)
  const [novaDisciplinaNome, setNovaDisciplinaNome] = useState("")
  const [novaDisciplinaCor, setNovaDisciplinaCor] = useState("verde")
  const [novaDisciplinaIcone, setNovaDisciplinaIcone] = useState("BookOpen")
  const turmasDoAno = useMemo(
    () => (turmas ?? []).filter((t) => t.anoLetivo === anoLetivo),
    [turmas, anoLetivo],
  )

  const podeCriar = titulo.trim().length >= 2 && disciplinaId !== ""

  const submeter = async () => {
    try {
      const r = await criar.mutateAsync({
        titulo: titulo.trim(),
        disciplinaId,
        anoLetivo,
        mes,
        turmasIds: turmasSel,
        comModelo,
      })
      toast.success("Nota criada", { description: `"${r.nota.titulo}" está pronta para editar.` })
      aoFechar()
      aoCriar(r.nota.id)
    } catch (e) {
      toast.error("Não foi possível criar", {
        description: e instanceof Error ? e.message : "Erro inesperado.",
      })
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && aoFechar()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="fonte-display">Nova nota de aula</DialogTitle>
          <DialogDescription>
            Os metadados abaixo organizam a nota automaticamente nas visões por turma, mês e
            disciplina.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="titulo-nota">Título da aula</Label>
            <Input
              id="titulo-nota"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex.: Ondas mecânicas"
              autoFocus
            />
          </div>

          <div className="grid gap-1.5">
            <div className="flex items-center justify-between">
              <Label>Disciplina</Label>
              <button
                type="button"
                onClick={() => setMostrarNovaDisciplina(!mostrarNovaDisciplina)}
                className="text-primary text-xs font-semibold hover:underline"
              >
                {mostrarNovaDisciplina ? "Cancelar" : "+ Nova disciplina"}
              </button>
            </div>
            {mostrarNovaDisciplina ? (
              <div className="border-border grid gap-2 rounded-xl border border-dashed p-3">
                <Input
                  value={novaDisciplinaNome}
                  onChange={(e) => setNovaDisciplinaNome(e.target.value)}
                  placeholder="Nome da disciplina"
                  className="h-9 rounded-lg"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Select value={novaDisciplinaCor} onValueChange={setNovaDisciplinaCor}>
                    <SelectTrigger className="h-9 rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CORES.map((cc) => (
                        <SelectItem key={cc.chave} value={cc.chave}>
                          <span className="flex items-center gap-2">
                            <span className={`h-2.5 w-2.5 rounded-full ${cc.ponto}`} aria-hidden />
                            {cc.nome}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={novaDisciplinaIcone} onValueChange={setNovaDisciplinaIcone}>
                    <SelectTrigger className="h-9 rounded-lg">
                      <SelectValue>
                        {(() => {
                          const Icon = obterIconeDisciplina(novaDisciplinaIcone)
                          return (
                            <span className="flex items-center gap-2">
                              <Icon className="h-4 w-4" aria-hidden />
                              {novaDisciplinaIcone}
                            </span>
                          )
                        })()}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {ICONES_DISCIPLINA.map((i) => {
                        const Icon = obterIconeDisciplina(i)
                        return (
                          <SelectItem key={i} value={i}>
                            <span className="flex items-center gap-2">
                              <Icon className="h-4 w-4" aria-hidden />
                              {i}
                            </span>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  size="sm"
                  disabled={!novaDisciplinaNome.trim() || criarDisciplina.isPending}
                  onClick={async () => {
                    try {
                      const d = await criarDisciplina.mutateAsync({
                        nome: novaDisciplinaNome.trim(),
                        cor: novaDisciplinaCor,
                        icone: nomeIconeValido(novaDisciplinaIcone),
                      })
                      setDisciplinaId((d as { disciplina: { id: string } }).disciplina.id)
                      setMostrarNovaDisciplina(false)
                      setNovaDisciplinaNome("")
                      toast.success("Disciplina criada")
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "Falha ao criar disciplina.")
                    }
                  }}
                  className="gap-1"
                >
                  {criarDisciplina.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}{" "}
                  Criar e selecionar
                </Button>
              </div>
            ) : disciplinas && disciplinas.length > 0 ? (
              <Select value={disciplinaId} onValueChange={setDisciplinaId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione…" />
                </SelectTrigger>
                <SelectContent>
                  {disciplinas.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      <span className="flex items-center gap-2">
                        <span
                          className={`h-2 w-2 rounded-full ${corDisciplina(d.cor).ponto}`}
                          aria-hidden
                        />
                        {d.nome}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : disciplinasQ.isLoading ? (
              <Skeleton className="h-9 w-full rounded-lg" aria-label="Carregando disciplinas" />
            ) : (
              <p className="border-border text-muted-foreground rounded-lg border border-dashed px-3 py-2.5 text-sm">
                Nenhuma disciplina cadastrada. Crie uma acima.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="ano-nota">Ano letivo</Label>
              <Input
                id="ano-nota"
                type="number"
                min={2000}
                max={2100}
                value={anoLetivo}
                onChange={(e) => setAnoLetivo(Number(e.target.value) || anoAtual)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Mês</Label>
              <Select value={String(mes)} onValueChange={(v) => setMes(Number(v))}>
                <SelectTrigger className="w-full">
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

          <div className="grid gap-1.5">
            <Label>
              Turmas (
              {turmasQ.isLoading
                ? "carregando…"
                : turmasDoAno.length > 0
                  ? "opcional"
                  : "nenhuma em " + anoLetivo}
              )
            </Label>
            {turmasQ.isLoading ? (
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-8 w-16 rounded-lg" />
                <Skeleton className="h-8 w-16 rounded-lg" />
                <Skeleton className="h-8 w-14 rounded-lg" />
              </div>
            ) : turmasDoAno.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {turmasDoAno.map((t) => {
                  const sel = turmasSel.includes(t.id)
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() =>
                        setTurmasSel(
                          sel ? turmasSel.filter((x) => x !== t.id) : [...turmasSel, t.id],
                        )
                      }
                      className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors ${
                        sel
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card hover:bg-accent"
                      }`}
                      aria-pressed={sel}
                    >
                      {t.nome}
                    </button>
                  )
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                Cadastre turmas em <b>Conta → Turmas</b> para vinculá-las aqui.
              </p>
            )}
          </div>

          <label className="border-border bg-card flex cursor-pointer items-start gap-3 rounded-xl border p-3.5">
            <Switch checked={comModelo} onCheckedChange={setComModelo} />
            <span className="grid gap-0.5">
              <span className="flex items-center gap-1.5 text-sm font-semibold">
                <Sparkles className="h-4 w-4 text-amber-500" aria-hidden />
                Começar do modelo
              </span>
              <span className="text-muted-foreground text-[0.82rem] leading-snug">
                Cria a estrutura pronta: seção, caixa COPIAR com definição e fórmula, exemplo
                resolvido, dica e exercícios nos três níveis.
              </span>
            </span>
          </label>
        </div>

        <DialogFooter className="mt-2 gap-2">
          <Button variant="outline" onClick={aoFechar}>
            Cancelar
          </Button>
          <Button onClick={submeter} disabled={!podeCriar || criar.isPending} className="gap-2">
            {criar.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            Criar nota
          </Button>
        </DialogFooter>

        {turmasSel.length > 0 ? (
          <p className="text-muted-foreground text-center text-[0.75rem]">
            A nota aparecerá para{" "}
            {turmasSel
              .map((id) => turmasDoAno.find((t) => t.id === id)?.nome)
              .filter(Boolean)
              .join(", ")}{" "}
            em {MESES_CAP[mes - 1]}/{anoLetivo}.
          </p>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
