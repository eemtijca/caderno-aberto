"use client"

// Vista pública do aluno. /#/l/<token> Sem login: tudo vem de /api/publico/<token>, que só devolve o que o RLS libera (link ativo + notas publicadas). Alunos podem alternar o gabarito, imprimir A4 e mudar o tema.

import { useEffect, useMemo, useState } from "react"
import {
  ArrowLeft,
  BookOpenText,
  CalendarDays,
  Check,
  Eye,
  EyeOff,
  Hourglass,
  Printer,
  Search,
  Sun,
  Moon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useTheme } from "next-themes"
import { BlocosView } from "@/components/notas/blocos-view"
import { Skeleton } from "@/components/ui/skeleton"
import { MESES_CAP, separarHabilidades } from "@/lib/notas/texto"
import { corDisciplina } from "@/lib/notas/cores"
import type { Bloco } from "@/lib/notas/tipos"
import { DEMO_NOTA, DEMO_TOKEN } from "@/lib/notas/demo"

interface NotaPublica {
  id: string
  titulo: string
  disciplinaNome: string
  disciplinaCor: string
  turmasNomes: string[]
  anoLetivo: number
  mes: number
  sobre: string
  habilidades: string
  blocos: Bloco[]
  atualizadoEm: string
}

interface DadosPublicos {
  link: {
    tipo: "nota" | "turma" | "disciplina"
    nome: string
    professorNome: string
    expiraEm: string | null
  }
  notas: NotaPublica[]
}

export function VistaPublica({
  token,
  navegar,
}: {
  token: string
  navegar?: (para: string) => void
}) {
  const { setTheme } = useTheme()
  const [dados, setDados] = useState<DadosPublicos | null>(null)
  const [erro, setErro] = useState("")
  const [carregando, setCarregando] = useState(true)
  const [selecionada, setSelecionada] = useState<string | null>(null)
  const [mostrarGabarito, setMostrarGabarito] = useState(false)
  const [busca, setBusca] = useState("")

  useEffect(() => {
    if (token === DEMO_TOKEN) {
      const demo: DadosPublicos = {
        link: {
          tipo: "nota",
          nome: DEMO_NOTA.titulo,
          professorNome: "Equipe Caderno Aberto",
          expiraEm: null,
        },
        notas: [
          {
            id: DEMO_NOTA.id,
            titulo: DEMO_NOTA.titulo,
            disciplinaNome: DEMO_NOTA.disciplina?.nome ?? "",
            disciplinaCor: DEMO_NOTA.disciplina?.cor ?? "ciano",
            turmasNomes: DEMO_NOTA.turmas.map((t) => t.nome),
            anoLetivo: DEMO_NOTA.anoLetivo,
            mes: DEMO_NOTA.mes,
            sobre: DEMO_NOTA.sobre,
            habilidades: DEMO_NOTA.habilidades,
            blocos: DEMO_NOTA.blocos,
            atualizadoEm: DEMO_NOTA.atualizadoEm,
          },
        ],
      }
      setDados(demo)
      setSelecionada(DEMO_NOTA.id)
      setCarregando(false)
      setErro("")
      return
    }
    let vivo = true
    setCarregando(true)
    setErro("")
    fetch(`/api/publico/${encodeURIComponent(token)}`, { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) {
          const c = await r.json().catch(() => ({ erro: "Link indisponível." }))
          throw new Error(c.erro ?? "Link indisponível.")
        }
        return r.json() as Promise<DadosPublicos>
      })
      .then((c) => {
        if (!vivo) return
        setDados(c)
        setSelecionada(c.link.tipo === "nota" ? (c.notas[0]?.id ?? null) : null)
      })
      .catch((e: Error) => {
        if (vivo) setErro(e.message)
      })
      .finally(() => {
        if (vivo) setCarregando(false)
      })
    return () => {
      vivo = false
    }
  }, [token])

  const varias = Boolean(dados && dados.link.tipo !== "nota" && dados.notas.length > 1)
  const nota = dados?.notas.find((n) => n.id === selecionada) ?? dados?.notas[0] ?? null

  const filtradas = useMemo(() => {
    const base = dados?.notas ?? []
    if (!varias || !busca.trim()) return base
    const alvo = busca.trim().toLowerCase()
    return base.filter(
      (n) => n.titulo.toLowerCase().includes(alvo) || n.disciplinaNome.toLowerCase().includes(alvo),
    )
  }, [dados, varias, busca])

  if (carregando) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-10">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    )
  }

  if (erro || !dados) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <span className="bg-destructive/10 text-destructive mx-auto flex h-14 w-14 items-center justify-center rounded-2xl">
          <Hourglass className="h-6 w-6" aria-hidden />
        </span>
        <h1 className="fonte-display mt-4 text-xl font-bold">Link indisponível</h1>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
          {erro || "Este link não existe, foi revogado pelo professor ou expirou."}
        </p>
      </div>
    )
  }

  const expira = dados.link.expiraEm ? new Date(dados.link.expiraEm) : null

  return (
    <div className="bg-background min-h-screen">
      {/* toolbar */}
      <div className="na-imprime-esconder border-border bg-background/90 sticky top-0 z-40 border-b backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-1.5 px-3 sm:px-4">
          {varias && selecionada ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelecionada(null)}
              aria-label="Voltar para a lista"
              className="rounded-lg"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (navegar) navegar("/")
                else if (window.history.length > 1) window.history.back()
                else window.location.hash = "#/"
              }}
              aria-label="Voltar"
              className="rounded-lg"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden />
            </Button>
          )}
          <p className="min-w-0 flex-1 truncate px-1 text-sm font-semibold">
            {varias && selecionada
              ? (nota?.titulo ?? "")
              : token === DEMO_TOKEN
                ? "Demonstração · Caderno Aberto"
                : `Caderno de ${dados.link.professorNome || "seu professor"}`}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMostrarGabarito(!mostrarGabarito)}
            className="gap-1.5 rounded-lg text-xs"
          >
            {mostrarGabarito ? (
              <>
                <EyeOff className="h-3.5 w-3.5" aria-hidden /> Ocultar gabarito
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5" aria-hidden /> Gabarito
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => window.print()}
            aria-label="Imprimir ou salvar em PDF"
            className="rounded-lg"
          >
            <Printer className="h-4 w-4" aria-hidden />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              const escuro = document.documentElement.classList.contains("dark")
              setTheme(escuro ? "light" : "dark")
            }}
            aria-label="Alternar tema"
            className="hidden rounded-lg sm:inline-flex"
          >
            <Sun className="hidden h-4 w-4 dark:block" aria-hidden />
            <Moon className="h-4 w-4 dark:hidden" aria-hidden />
          </Button>
        </div>
      </div>

      {/* lista de notas (links de turma/disciplina) */}
      {varias && !selecionada ? (
        <div className="mx-auto max-w-3xl px-4 pt-8 pb-24 sm:px-6">
          <header className="mb-6">
            <h1 className="fonte-display text-2xl font-extrabold sm:text-3xl">
              {dados.link.nome ||
                (dados.link.tipo === "turma" ? "Notas da turma" : "Notas da disciplina")}
            </h1>
            <p className="text-muted-foreground mt-1.5 text-sm">
              {dados.link.professorNome
                ? `Prof. ${dados.link.professorNome.replace(/^Prof\.?\s*/i, "")}`
                : ""}
              {expira
                ? ` · disponível até ${expira.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}`
                : ""}
              {" · "}
              {dados.notas.length} {dados.notas.length === 1 ? "aula" : "aulas"}
            </p>
          </header>

          <div className="relative mb-4">
            <Search
              className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
              aria-hidden
            />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar aula por título…"
              className="rounded-xl pl-9"
            />
          </div>

          <div className="space-y-2.5">
            {filtradas.map((n) => {
              const cor = corDisciplina(n.disciplinaCor)
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => setSelecionada(n.id)}
                  className={`border-border bg-card flex w-full items-start gap-3 rounded-2xl border border-l-4 p-4 text-left transition-shadow hover:shadow-md ${cor.borda}`}
                >
                  <BookOpenText
                    className="text-muted-foreground mt-0.5 h-5 w-5 shrink-0"
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className="fonte-display block leading-snug font-bold">{n.titulo}</span>
                    <span className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[0.78rem]">
                      <span className="font-medium">
                        {MESES_CAP[n.mes - 1]}/{n.anoLetivo}
                      </span>
                      {n.turmasNomes.length > 0 ? <span>· {n.turmasNomes.join(", ")}</span> : null}
                      {n.sobre ? (
                        <span className="hidden sm:inline">
                          · {n.sobre.slice(0, 60)}
                          {n.sobre.length > 60 ? "…" : ""}
                        </span>
                      ) : null}
                    </span>
                  </span>
                  <Badge
                    className={`shrink-0 rounded-md text-[0.68rem] ${cor.chip}`}
                    variant="secondary"
                  >
                    {n.disciplinaNome || "Aula"}
                  </Badge>
                </button>
              )
            })}
            {filtradas.length === 0 ? (
              <p className="border-border text-muted-foreground rounded-2xl border border-dashed p-8 text-center text-sm">
                Nenhuma aula encontrada para &ldquo;{busca}&rdquo;.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* leitura da nota */}
      {nota ? (
        <div className="area-impressao mx-auto max-w-3xl px-4 pt-8 pb-24 sm:px-6">
          <header className="mb-8 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {nota.disciplinaNome ? (
                <Badge
                  className={`rounded-md ${corDisciplina(nota.disciplinaCor).chip}`}
                  variant="secondary"
                >
                  {nota.disciplinaNome}
                </Badge>
              ) : null}
              <Badge variant="outline" className="rounded-md font-normal">
                {MESES_CAP[nota.mes - 1]}/{nota.anoLetivo}
              </Badge>
              {nota.turmasNomes.length > 0 ? (
                <Badge variant="outline" className="rounded-md font-normal">
                  {nota.turmasNomes.join(" · ")}
                </Badge>
              ) : null}
              <span className="na-imprime-esconder text-muted-foreground inline-flex items-center gap-1 text-[0.72rem]">
                <CalendarDays className="h-3 w-3" aria-hidden />
                {new Date(nota.atualizadoEm).toLocaleDateString("pt-BR")}
              </span>
            </div>

            <h1 className="fonte-display text-3xl leading-tight font-extrabold tracking-tight sm:text-4xl">
              {nota.titulo}
            </h1>

            {dados.link.professorNome ? (
              <p className="text-muted-foreground text-sm">{dados.link.professorNome}</p>
            ) : null}

            {nota.sobre ? (
              <div className="border-brand-200 bg-brand-50 dark:border-brand-900 dark:bg-brand-950/40 rounded-2xl border-l-4 px-4 py-3.5">
                <p className="text-muted-foreground text-[0.7rem] font-bold tracking-[0.14em] uppercase">
                  Sobre esta nota
                </p>
                <p className="mt-1 text-[0.95rem] leading-relaxed">{nota.sobre}</p>
              </div>
            ) : null}

            {separarHabilidades(nota.habilidades).length > 0 ? (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-muted-foreground text-[0.7rem] font-bold tracking-wider uppercase">
                  Habilidades:
                </span>
                {separarHabilidades(nota.habilidades).map((h) => (
                  <Badge
                    key={h}
                    variant="secondary"
                    className="rounded-md bg-stone-200 font-mono text-[0.68rem] text-stone-700 dark:bg-stone-800 dark:text-stone-300"
                  >
                    {h}
                  </Badge>
                ))}
              </div>
            ) : null}
          </header>

          <div className="imprime-colunas space-y-5 text-[1.02rem] leading-relaxed">
            <BlocosView blocos={nota.blocos} mostrarGabarito={mostrarGabarito} />
          </div>

          <footer className="na-imprime-esconder border-border text-muted-foreground mt-10 border-t pt-5 pb-6 text-center text-[0.75rem]">
            {dados.link.professorNome ? `${dados.link.professorNome} · ` : ""}
            gerado com Caderno Aberto
          </footer>
        </div>
      ) : !varias ? (
        <div className="mx-auto max-w-xl px-4 py-20 text-center">
          <p className="fonte-display text-xl font-bold">Nenhuma aula publicada ainda</p>
          <p className="text-muted-foreground mt-2 text-sm">
            Volte quando o professor publicar as notas deste link.
          </p>
        </div>
      ) : (
        <div className="mx-auto max-w-xl px-4 py-20 text-center">
          <p className="fonte-display text-xl font-bold">Nenhuma aula encontrada</p>
          <p className="text-muted-foreground mt-2 text-sm">Tente outra busca.</p>
        </div>
      )}

      {/* aviso de expiração */}
      {expira && expira.getTime() - Date.now() < 3 * 24 * 3600 * 1000 ? (
        <p className="na-imprime-esconder fixed inset-x-0 bottom-0 z-30 mx-auto mb-0 flex w-fit items-center gap-1.5 rounded-t-xl border border-b-0 border-amber-300 bg-amber-50 px-3.5 py-1.5 text-[0.72rem] font-medium text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
          <Hourglass className="h-3 w-3" aria-hidden />
          Este link expira em {expira.toLocaleDateString("pt-BR")}
        </p>
      ) : null}
    </div>
  )
}
