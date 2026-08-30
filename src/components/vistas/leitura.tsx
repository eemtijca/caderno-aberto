"use client"

// Vista de leitura (professor). A versão web da nota. Toolbar: gabarito ocultável, impressão A4, compartilhar (links), tema e editar.

import { useState } from "react"
import { ArrowLeft, Eye, EyeOff, Link2, Pencil, Printer, Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useTheme } from "next-themes"
import { useNota } from "@/lib/notas/api-client"
import { useSessao } from "@/hooks/use-sessao"
import { corDisciplina } from "@/lib/notas/cores"
import { MESES_CAP, separarHabilidades } from "@/lib/notas/texto"
import { BlocosView } from "@/components/notas/blocos-view"
import { Skeleton } from "@/components/ui/skeleton"
import { DialogoCompartilhar } from "@/components/dialogo-compartilhar"

export function VistaLeitura({ id, navegar }: { id: string; navegar: (para: string) => void }) {
  const { data: nota, isLoading, isError } = useNota(id)
  const { perfil } = useSessao()
  const { setTheme } = useTheme()
  const [mostrarGabarito, setMostrarGabarito] = useState(false)
  const [compartilharAberto, setCompartilharAberto] = useState(false)

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-8">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    )
  }

  if (isError || !nota) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <p className="fonte-display text-xl font-bold">Nota não encontrada</p>
        <p className="text-muted-foreground mt-2 text-sm">
          O endereço pode estar errado ou a nota foi excluída.
        </p>
        <Button onClick={() => navegar("/notas")} className="mt-5 gap-2 rounded-xl">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Voltar às notas
        </Button>
      </div>
    )
  }

  const cor = corDisciplina(nota.disciplina?.cor)
  const habilidades = separarHabilidades(nota.habilidades)

  return (
    <div className="bg-background min-h-screen">
      {/* toolbar fixa */}
      <div className="na-imprime-esconder border-border bg-background/90 sticky top-0 z-40 border-b backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-1.5 px-3 sm:px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navegar("/notas")}
            aria-label="Voltar"
            className="rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </Button>
          <p className="min-w-0 flex-1 truncate px-1 text-sm font-semibold">{nota.titulo}</p>
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
            onClick={() => setCompartilharAberto(true)}
            aria-label="Compartilhar com os alunos"
            title="Compartilhar com os alunos"
            className="rounded-lg"
          >
            <Link2 className="h-4 w-4" aria-hidden />
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
          <Button
            size="sm"
            onClick={() => navegar(`/editor/${nota.id}`)}
            className="gap-1.5 rounded-lg text-xs"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden /> Editar
          </Button>
        </div>
      </div>

      {/* conteúdo */}
      <div className="area-impressao mx-auto max-w-3xl px-4 pt-8 pb-24 sm:px-6">
        {/* cabeçalho da nota */}
        <header className="mb-8 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={`rounded-md ${cor.chip}`} variant="secondary">
              {nota.disciplina?.nome ?? "Sem disciplina"}
            </Badge>
            <Badge variant="outline" className="rounded-md font-normal">
              {MESES_CAP[nota.mes - 1]}/{nota.anoLetivo}
            </Badge>
            {nota.turmas.length > 0 ? (
              <Badge variant="outline" className="rounded-md font-normal">
                {nota.turmas.map((t) => t.nome).join(" · ")}
              </Badge>
            ) : null}
            {nota.status === "rascunho" ? (
              <Badge
                variant="outline"
                className="text-muted-foreground rounded-md text-[0.68rem] print:hidden"
              >
                Rascunho
              </Badge>
            ) : null}
          </div>

          <h1 className="fonte-display text-3xl leading-tight font-extrabold tracking-tight sm:text-4xl">
            {nota.titulo}
          </h1>

          {perfil?.nome || perfil?.escola ? (
            <p className="text-muted-foreground text-sm">
              {[perfil?.nome, perfil?.escola].filter(Boolean).join(" · ")}
            </p>
          ) : null}

          {nota.sobre ? (
            <div className={`rounded-2xl border-l-4 ${cor.borda} ${cor.fundoSuave} px-4 py-3.5`}>
              <p className="text-muted-foreground text-[0.7rem] font-bold tracking-[0.14em] uppercase">
                Sobre esta nota
              </p>
              <p className="mt-1 text-[0.95rem] leading-relaxed">{nota.sobre}</p>
            </div>
          ) : null}

          {habilidades.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-muted-foreground text-[0.7rem] font-bold tracking-wider uppercase">
                Habilidades:
              </span>
              {habilidades.map((h) => (
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

        {/* blocos */}
        <div className="imprime-colunas space-y-5 text-[1.02rem] leading-relaxed">
          <BlocosView blocos={nota.blocos} mostrarGabarito={mostrarGabarito} />
        </div>

        <footer className="na-imprime-esconder border-border text-muted-foreground mt-10 border-t pt-5 pb-6 text-center text-[0.75rem]">
          {nota.disciplina?.nome} · {MESES_CAP[nota.mes - 1]}/{nota.anoLetivo}
          {nota.turmas.length > 0 ? ` · ${nota.turmas.map((t) => t.nome).join(", ")}` : ""} . Gerado
          por Caderno Aberto
        </footer>
      </div>

      {compartilharAberto ? (
        <DialogoCompartilhar
          aberto
          aoFechar={() => setCompartilharAberto(false)}
          notaId={nota.id}
        />
      ) : null}
    </div>
  )
}
