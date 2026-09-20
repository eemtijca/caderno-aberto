"use client";

// Cartão de nota. Usado na lista, no painel e nas visões.

import {
  BookOpenText,
  ChevronDown,
  Download,
  Eye,
  FileCode,
  FileJson,
  FileText,
  ListChecks,
  Pencil,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { NotaDados } from "@/lib/notas/tipos";
import { corDisciplina } from "@/lib/notas/cores";
import { contarQuestoes, MESES_CAP } from "@/lib/notas/texto";
import { abrirExportacao } from "@/lib/exportar";

export function CartaoNota({
  nota,
  onAbrir,
  onEditar,
  indice = 0,
  selecao,
}: {
  nota: NotaDados;
  onAbrir: () => void;
  onEditar?: () => void;
  /** posição na lista: atrasa a animação de cascata */
  indice?: number;
  /** Quando presente, o cartão entra no modo de seleção múltipla. */
  selecao?: { ativo: boolean; selecionado: boolean; onAlternar: () => void };
}) {
  const cor = corDisciplina(nota.disciplina?.cor);
  // Sem questões, o resumo mostra a contagem de blocos.
  const questoes = contarQuestoes(nota);

  return (
    <article
      className={`na-cascata group border-border bg-card relative rounded-2xl border p-4 transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-5 ${cor.borda} border-l-4 ${
        selecao?.selecionado ? "ring-primary ring-2" : ""
      }`}
      style={{ "--na-i": indice } as React.CSSProperties}
    >
      <div className="flex items-start justify-between gap-3">
        {selecao?.ativo ? (
          <Checkbox
            checked={selecao.selecionado}
            onCheckedChange={() => selecao.onAlternar()}
            aria-label={`Selecionar ${nota.titulo}`}
            className="mt-0.5"
          />
        ) : null}
        <button
          type="button"
          onClick={selecao?.ativo ? selecao.onAlternar : onAbrir}
          aria-pressed={selecao?.ativo ? selecao.selecionado : undefined}
          className="min-w-0 flex-1 text-left"
        >
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
                {nota.sobre.length > 60 ? "..." : ""}
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

      {selecao?.ativo ? null : (
        <div className="mt-3 flex flex-wrap items-center gap-2">
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="text-muted-foreground hover:border-border hover:bg-accent hover:text-foreground flex items-center gap-1.5 rounded-lg border border-transparent px-3 py-1.5 text-[0.82rem] font-semibold transition-colors"
                aria-label={`Exportar a nota ${nota.titulo}`}
              >
                <Download className="h-3.5 w-3.5" aria-hidden /> Exportar
                <ChevronDown className="h-3 w-3" aria-hidden />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                className="gap-2"
                onClick={() => abrirExportacao(`/api/notas/${nota.id}/exportar?formato=tex`)}
              >
                <FileCode className="h-3.5 w-3.5" aria-hidden /> Arquivo para impressão
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2"
                onClick={() => abrirExportacao(`/api/notas/${nota.id}/exportar?formato=md`)}
              >
                <FileText className="h-3.5 w-3.5" aria-hidden /> Arquivo de texto
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2"
                onClick={() => abrirExportacao(`/api/notas/${nota.id}/exportar?formato=json`)}
              >
                <FileJson className="h-3.5 w-3.5" aria-hidden /> Backup completo
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </article>
  );
}
