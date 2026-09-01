"use client"

// Cartão de nota. Usado na lista, no painel e nas visões.

import { BookOpenText, Eye, FileText, ListChecks, Pencil } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { NotaDados } from "@/lib/notas/tipos"
import { corDisciplina } from "@/lib/notas/cores"
import { contarQuestoes, MESES_CAP } from "@/lib/notas/texto"

export function CartaoNota({
  nota,
  onAbrir,
  onEditar,
  indice = 0,
}: {
  nota: NotaDados
  onAbrir: () => void
  onEditar?: () => void
  /** posição na lista: atrasa a animação de cascata */
  indice?: number
}) {
  const cor = corDisciplina(nota.disciplina?.cor)
  const questoes = contarQuestoes(nota)

  return (
    <article
      className={`na-cascata group border-border bg-card relative rounded-2xl border p-4 transition-shadow hover:shadow-md sm:p-5 ${cor.borda} border-l-4`}
      style={{ "--na-i": indice } as React.CSSProperties}
    >
      <div className="flex items-start justify-between gap-3">
        <button type="button" onClick={onAbrir} className="min-w-0 flex-1 text-left">
          <h3 className="fonte-display line-clamp-2 text-[1.02rem] leading-snug font-bold">
            {nota.titulo}
          </h3>
          <p className="text-muted-foreground mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-[0.78rem]">
            <span className="font-medium">
              {MESES_CAP[nota.mes - 1]}/{nota.anoLetivo}
            </span>
            {nota.turmas.length > 0 ? (
              <span className="break-words">· {nota.turmas.map((t) => t.nome).join(", ")}</span>
            ) : null}
            {nota.sobre ? (
              <span className="hidden break-words sm:inline">
                · {nota.sobre.slice(0, 60)}
                {nota.sobre.length > 60 ? "…" : ""}
              </span>
            ) : null}
          </p>
        </button>
        <Badge
          className={`max-w-[45%] shrink-0 truncate rounded-md text-[0.68rem] ${cor.chip}`}
          variant="secondary"
        >
          {nota.disciplina?.nome ?? "Sem disciplina"}
        </Badge>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {nota.status === "publicada" ? (
          <Badge
            variant="secondary"
            className="gap-1 rounded-md bg-emerald-100 text-[0.68rem] text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
          >
            <Eye className="h-3 w-3" aria-hidden /> Publicada
          </Badge>
        ) : (
          <Badge variant="outline" className="rounded-md text-[0.68rem]">
            Rascunho
          </Badge>
        )}
        {questoes > 0 ? (
          <Badge variant="outline" className="gap-1 rounded-md text-[0.68rem] font-normal">
            <ListChecks className="h-3 w-3" aria-hidden /> {questoes} questões
          </Badge>
        ) : (
          <Badge variant="outline" className="gap-1 rounded-md text-[0.68rem] font-normal">
            <FileText className="h-3 w-3" aria-hidden /> {nota.blocos.length} blocos
          </Badge>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={onAbrir}
          className="border-border hover:bg-accent flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[0.82rem] font-semibold transition-colors"
        >
          <BookOpenText className="h-3.5 w-3.5" aria-hidden /> Ler
        </button>
        {onEditar ? (
          <button
            type="button"
            onClick={onEditar}
            className="text-muted-foreground hover:border-border hover:bg-accent hover:text-foreground flex items-center gap-1.5 rounded-lg border border-transparent px-3 py-1.5 text-[0.82rem] font-semibold transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden /> Editar
          </button>
        ) : null}
      </div>
    </article>
  )
}
