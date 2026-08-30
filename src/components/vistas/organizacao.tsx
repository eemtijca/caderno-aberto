"use client"

// Vista Organização. As visões automáticas geradas pelos metadados: Ano → Turma → Mês (como a pasta 2026/) e Disciplina → Ano.

import { useMemo, useState } from "react"
import { ChevronDown, ChevronRight, Plus, Settings } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useDisciplinas, useNotas, useTurmas } from "@/lib/notas/api-client"
import { corDisciplina } from "@/lib/notas/cores"
import { MESES_CAP } from "@/lib/notas/texto"

export function VistaOrganizacao({ navegar }: { navegar: (para: string) => void }) {
  const { data: notas } = useNotas()
  const { data: disciplinas } = useDisciplinas()
  const { data: turmas } = useTurmas()

  const anos = useMemo(
    () => [...new Set((notas ?? []).map((n) => n.anoLetivo))].sort((a, b) => b - a),
    [notas],
  )

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="fonte-display text-2xl font-bold">Turmas &amp; calendário</h1>
          <p className="text-muted-foreground text-sm">
            Visões montadas automaticamente a partir dos metadados das notas.
          </p>
        </div>
        <Button variant="outline" onClick={() => navegar("/conta")} className="gap-2 rounded-xl">
          <Settings className="h-4 w-4" aria-hidden /> Gerenciar turmas
        </Button>
      </div>

      {(notas ?? []).length === 0 ? (
        <div className="border-border rounded-2xl border border-dashed p-10 text-center">
          <p className="font-semibold">Ainda não há nada para organizar</p>
          <p className="text-muted-foreground mx-auto mt-1 max-w-md text-sm">
            Ao criar notas com turma, mês e disciplina, a estrutura do ano letivo será exibida
            automaticamente.
          </p>
          <Button onClick={() => navegar("/notas")} className="mt-4 gap-2 rounded-xl">
            <Plus className="h-4 w-4" aria-hidden /> Criar nota
          </Button>
        </div>
      ) : (
        <Tabs defaultValue={anos[0] ? String(anos[0]) : "2026"} className="w-full">
          <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-xl p-1">
            {anos.map((a) => (
              <TabsTrigger key={a} value={String(a)} className="rounded-lg px-4">
                {a}
              </TabsTrigger>
            ))}
          </TabsList>
          {anos.map((ano) => (
            <TabsContent key={ano} value={String(ano)} className="mt-4 space-y-4">
              <AcordeaoTurmas ano={ano} navegar={navegar} />
              <PainelDisciplinas
                ano={ano}
                navegar={navegar}
                disciplinas={disciplinas ?? []}
                notas={notas ?? []}
              />
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  )
}

function AcordeaoTurmas({ ano, navegar }: { ano: number; navegar: (para: string) => void }) {
  const { data: turmas } = useTurmas(ano)
  const { data: notas } = useNotas({ ano })
  const [abertas, setAbertas] = useState<Record<string, boolean>>({})

  const porTurma = useMemo(() => {
    const mapa = new Map<string, typeof notas>()
    for (const n of notas ?? []) {
      if (n.turmas.length === 0) continue
      for (const t of n.turmas) {
        const lista = mapa.get(t.id) ?? []
        lista.push(n)
        mapa.set(t.id, lista)
      }
    }
    return mapa
  }, [notas])

  const semTurma = (notas ?? []).filter((n) => n.turmas.length === 0)
  const lista = (turmas ?? []).slice().sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))

  return (
    <section className="space-y-2">
      <h2 className="fonte-display px-1 text-lg font-bold">Por turma</h2>
      {lista.length === 0 ? (
        <p className="border-border text-muted-foreground rounded-xl border border-dashed p-4 text-sm">
          Nenhuma turma cadastrada em {ano}. Cadastre em Conta → Turmas.
        </p>
      ) : (
        <div className="border-border overflow-hidden rounded-2xl border">
          {lista.map((t) => {
            const aberta = abertas[t.id]
            const notasTurma = porTurma.get(t.id) ?? []
            const meses = [...new Set(notasTurma.map((n) => n.mes))].sort((a, b) => a - b)
            return (
              <div key={t.id} className="border-border border-b last:border-b-0">
                <button
                  type="button"
                  onClick={() => setAbertas({ ...abertas, [t.id]: !aberta })}
                  aria-expanded={aberta}
                  className="bg-card hover:bg-accent/60 flex w-full items-center gap-3 px-4 py-3 text-left transition-colors"
                >
                  {aberta ? (
                    <ChevronDown className="text-muted-foreground h-4 w-4" aria-hidden />
                  ) : (
                    <ChevronRight className="text-muted-foreground h-4 w-4" aria-hidden />
                  )}
                  <span className="fonte-display w-12 font-bold">{t.nome}</span>
                  <span className="text-muted-foreground text-sm">{t.serie}</span>
                  <Badge variant="secondary" className="ml-auto rounded-md text-[0.68rem]">
                    {notasTurma.length} {notasTurma.length === 1 ? "nota" : "notas"}
                  </Badge>
                </button>
                {aberta ? (
                  <div className="bg-background/60 space-y-3 px-4 pt-1 pb-4">
                    {meses.length === 0 ? (
                      <p className="text-muted-foreground text-sm">Sem notas nesta turma.</p>
                    ) : (
                      meses.map((m) => {
                        const doMes = notasTurma.filter((n) => n.mes === m)
                        return (
                          <div key={m} className="space-y-1.5">
                            <p className="text-muted-foreground text-[0.72rem] font-bold tracking-wider uppercase">
                              {MESES_CAP[m - 1]}
                            </p>
                            {doMes.map((n) => (
                              <LinhaNota key={n.id} nota={n} navegar={navegar} />
                            ))}
                          </div>
                        )
                      })
                    )}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      )}

      {semTurma.length > 0 ? (
        <details className="border-border bg-card/50 rounded-2xl border border-dashed">
          <summary className="text-muted-foreground cursor-pointer list-none px-4 py-3 text-sm font-semibold">
            {semTurma.length} {semTurma.length === 1 ? "nota sem turma" : "notas sem turma"} em{" "}
            {ano}
          </summary>
          <div className="space-y-1.5 px-4 pb-4">
            {semTurma.map((n) => (
              <LinhaNota key={n.id} nota={n} navegar={navegar} />
            ))}
          </div>
        </details>
      ) : null}
    </section>
  )
}

function PainelDisciplinas({
  ano,
  navegar,
  disciplinas,
  notas,
}: {
  ano: number
  navegar: (para: string) => void
  disciplinas: { id: string; nome: string; cor: string }[]
  notas: {
    id: string
    titulo: string
    disciplinaId: string
    mes: number
    anoLetivo: number
    status: string
  }[]
}) {
  const doAno = notas.filter((n) => n.anoLetivo === ano)
  return (
    <section className="space-y-2">
      <h2 className="fonte-display px-1 text-lg font-bold">Por disciplina</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {disciplinas.map((d) => {
          const cor = corDisciplina(d.cor)
          const notasD = doAno.filter((n) => n.disciplinaId === d.id)
          return (
            <div key={d.id} className={`border-border rounded-2xl border ${cor.fundoSuave} p-4`}>
              <div className="flex items-center justify-between gap-2">
                <span className="fonte-display flex items-center gap-2 font-bold">
                  <span className={`h-2.5 w-2.5 rounded-full ${cor.ponto}`} aria-hidden />
                  {d.nome}
                </span>
                <Badge variant="secondary" className={`rounded-md text-[0.68rem] ${cor.chip}`}>
                  {notasD.length}
                </Badge>
              </div>
              {notasD.length > 0 ? (
                <ul className="mt-3 space-y-1">
                  {notasD
                    .slice()
                    .sort((a, b) => a.mes - b.mes)
                    .map((n) => (
                      <li key={n.id}>
                        <button
                          type="button"
                          onClick={() => navegar(`/nota/${n.id}`)}
                          className="hover:bg-background/70 w-full rounded-lg px-2 py-1.5 text-left text-sm transition-colors"
                        >
                          <span className="text-muted-foreground text-[0.7rem] font-semibold uppercase">
                            {MESES_CAP[n.mes - 1]?.slice(0, 3)}
                          </span>{" "}
                          {n.titulo}
                        </button>
                      </li>
                    ))}
                </ul>
              ) : (
                <p className="text-muted-foreground mt-2 text-sm">Sem notas em {ano}.</p>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

function LinhaNota({
  nota,
  navegar,
}: {
  nota: { id: string; titulo: string; status: string; disciplina?: { nome: string } | null }
  navegar: (para: string) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => navegar(`/nota/${nota.id}`)}
        className="hover:bg-accent flex-1 truncate rounded-lg px-2 py-1.5 text-left text-sm transition-colors"
      >
        {nota.titulo}
      </button>
      {nota.status === "rascunho" ? (
        <Badge variant="outline" className="rounded-md text-[0.62rem]">
          Rascunho
        </Badge>
      ) : null}
      <button
        type="button"
        onClick={() => navegar(`/editor/${nota.id}`)}
        className="text-muted-foreground hover:bg-accent hover:text-foreground rounded-lg px-2 py-1 text-[0.75rem] font-semibold transition-colors"
      >
        editar
      </button>
    </div>
  )
}
