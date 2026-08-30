"use client"

// Vista Notas. Lista completa com filtros rápidos.

import { useMemo, useState } from "react"
import { FilterX, Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useDisciplinas, useNotas, useTurmas } from "@/lib/notas/api-client"
import { CartaoNota } from "@/components/notas/cartao-nota"
import { MESES_CAP } from "@/lib/notas/texto"
import { corDisciplina } from "@/lib/notas/cores"

export function VistaNotas({
  navegar,
  onNovaNota,
}: {
  navegar: (para: string) => void
  onNovaNota: () => void
}) {
  const [busca, setBusca] = useState("")
  const [disciplina, setDisciplina] = useState<string>("")
  const [ano, setAno] = useState<number | undefined>(undefined)
  const [mes, setMes] = useState<number | undefined>(undefined)
  const [turma, setTurma] = useState<string>("")

  const { data: notas } = useNotas()
  const { data: disciplinas } = useDisciplinas()
  const { data: turmas } = useTurmas()

  const anos = useMemo(
    () => [...new Set((notas ?? []).map((n) => n.anoLetivo))].sort((a, b) => b - a),
    [notas],
  )

  const filtradas = useMemo(() => {
    let lista = notas ?? []
    if (busca.trim()) {
      const alvo = busca.trim().toLowerCase()
      lista = lista.filter(
        (n) =>
          n.titulo.toLowerCase().includes(alvo) ||
          n.sobre.toLowerCase().includes(alvo) ||
          n.habilidades.toLowerCase().includes(alvo),
      )
    }
    if (disciplina) lista = lista.filter((n) => n.disciplinaId === disciplina)
    if (ano) lista = lista.filter((n) => n.anoLetivo === ano)
    if (mes) lista = lista.filter((n) => n.mes === mes)
    if (turma) lista = lista.filter((n) => n.turmas.some((t) => t.id === turma))
    return lista
  }, [notas, busca, disciplina, ano, mes, turma])

  const temFiltro = disciplina || ano || mes || turma

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="fonte-display text-2xl font-bold">Notas</h1>
          <p className="text-muted-foreground text-sm">
            {filtradas.length} de {notas?.length ?? 0} notas
          </p>
        </div>
        <Button onClick={onNovaNota} className="gap-2 rounded-xl">
          <Plus className="h-4 w-4" aria-hidden /> Nova
        </Button>
      </div>

      {/* busca local + filtros */}
      <div className="space-y-3">
        <div className="relative">
          <Search
            className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
            aria-hidden
          />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Filtrar por título, resumo ou habilidade…"
            className="rounded-xl pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <ChipFiltro
            ativo={!disciplina}
            rotulo="Todas as disciplinas"
            onClick={() => setDisciplina("")}
          />
          {(disciplinas ?? []).map((d) => (
            <ChipFiltro
              key={d.id}
              ativo={disciplina === d.id}
              rotulo={d.nome}
              cor={d.cor}
              onClick={() => setDisciplina(disciplina === d.id ? "" : d.id)}
            />
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <ChipFiltro ativo={!ano} rotulo="Todos os anos" onClick={() => setAno(undefined)} />
          {anos.map((a) => (
            <ChipFiltro
              key={a}
              ativo={ano === a}
              rotulo={String(a)}
              onClick={() => setAno(ano === a ? undefined : a)}
            />
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <ChipFiltro ativo={!mes} rotulo="Todos os meses" onClick={() => setMes(undefined)} />
          {MESES_CAP.map((m, i) => (
            <ChipFiltro
              key={m}
              ativo={mes === i + 1}
              rotulo={m.slice(0, 3)}
              onClick={() => setMes(mes === i + 1 ? undefined : i + 1)}
            />
          ))}
        </div>

        {(turmas ?? []).length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <ChipFiltro ativo={!turma} rotulo="Todas as turmas" onClick={() => setTurma("")} />
            {turmas!.map((t) => (
              <ChipFiltro
                key={t.id}
                ativo={turma === t.id}
                rotulo={t.nome}
                onClick={() => setTurma(turma === t.id ? "" : t.id)}
              />
            ))}
          </div>
        ) : null}

        {temFiltro || busca ? (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground gap-1.5"
            onClick={() => {
              setDisciplina("")
              setAno(undefined)
              setMes(undefined)
              setTurma("")
              setBusca("")
            }}
          >
            <FilterX className="h-4 w-4" aria-hidden /> Limpar filtros
          </Button>
        ) : null}
      </div>

      {/* lista */}
      {filtradas.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtradas.map((n) => (
            <CartaoNota
              key={n.id}
              nota={n}
              onAbrir={() => navegar(`/nota/${n.id}`)}
              onEditar={() => navegar(`/editor/${n.id}`)}
            />
          ))}
        </div>
      ) : (
        <div className="border-border rounded-2xl border border-dashed p-10 text-center">
          <p className="font-semibold">
            {(notas ?? []).length === 0
              ? "Nenhuma nota ainda"
              : "Nada encontrado com esses filtros"}
          </p>
          <p className="text-muted-foreground mx-auto mt-1 max-w-md text-sm">
            {(notas ?? []).length === 0
              ? "Crie a primeira nota de aula. Ela já nasce com o modelo completo."
              : "Tente ajustar ou limpar os filtros acima."}
          </p>
          {(notas ?? []).length === 0 ? (
            <Button onClick={onNovaNota} className="mt-4 gap-2 rounded-xl">
              <Plus className="h-4 w-4" aria-hidden /> Nova nota
            </Button>
          ) : null}
        </div>
      )}
    </div>
  )
}

function ChipFiltro({
  ativo,
  rotulo,
  cor,
  onClick,
}: {
  ativo: boolean
  rotulo: string
  cor?: string
  onClick: () => void
}) {
  const classesCor = cor ? corDisciplina(cor) : null
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className={`rounded-lg border px-2.5 py-1 text-[0.78rem] font-semibold transition-colors ${
        ativo
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
      }`}
    >
      {rotulo}
      {classesCor && !ativo ? (
        <span
          className={`ml-1.5 inline-block h-1.5 w-1.5 rounded-full ${classesCor.ponto}`}
          aria-hidden
        />
      ) : null}
    </button>
  )
}
