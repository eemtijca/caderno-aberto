"use client";

// Vista de leitura (professor). A versão web da nota. Toolbar: gabarito ocultável, impressão A4, compartilhar (links), tema e editar.

import { useState } from "react";
import { ArrowLeft, Eye, EyeOff, Link2, Pencil, Printer, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TelaEstado } from "@/components/tela-estado";
import { useTheme } from "next-themes";
import { useNota } from "@/lib/notas/api-client";
import { useSessao } from "@/hooks/use-sessao";
import { corDisciplina } from "@/lib/notas/cores";
import { MESES_CAP, separarHabilidades } from "@/lib/notas/texto";
import { variaveisAparencia } from "@/lib/notas/tipos";
import { BlocosView } from "@/components/notas/blocos-view";
import { AreaImpressao, DocumentoImpresso } from "@/components/notas/area-impressao";
import { BotaoAtualizar } from "@/components/botao-atualizar";
import { Skeleton } from "@/components/ui/skeleton";
import { DialogoCompartilhar } from "@/components/dialogo-compartilhar";
import { imprimir, useTemaClaroNaImpressao } from "@/hooks/use-impressao";

export function VistaLeitura({ id, navegar }: { id: string; navegar: (para: string) => void }) {
  const notaQ = useNota(id);
  const { data: nota, isLoading, isError } = notaQ;
  const { perfil } = useSessao();
  const { setTheme } = useTheme();
  const [mostrarGabarito, setMostrarGabarito] = useState(false);
  const [compartilharAberto, setCompartilharAberto] = useState(false);
  useTemaClaroNaImpressao();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-8" aria-busy="true">
        <div className="flex gap-2">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-9 w-1/2 rounded-lg" />
        </div>
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError || !nota) {
    return (
      <TelaEstado
        variante="nao_encontrado"
        titulo="Nota não encontrada"
        descricao="O endereço pode estar errado ou a nota foi movida para a lixeira."
        acao={{ rotulo: "Voltar às notas", onClick: () => navegar("/notas") }}
        incorporado
      />
    );
  }

  const cor = corDisciplina(nota.disciplina?.cor);
  const habilidades = separarHabilidades(nota.habilidades);

  return (
    <div className="bg-background min-h-dvh">
      {/* toolbar fixa; na impressão some e só a área da nota permanece */}
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
          <BotaoAtualizar carregando={notaQ.isFetching} aoAtualizar={notaQ.refetch} />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMostrarGabarito(!mostrarGabarito)}
            className="gap-1.5 rounded-lg text-xs"
            aria-label={mostrarGabarito ? "Ocultar gabarito" : "Mostrar gabarito"}
          >
            {mostrarGabarito ? (
              <>
                <EyeOff className="h-3.5 w-3.5" aria-hidden />
                <span className="hidden sm:inline">Ocultar gabarito</span>
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5" aria-hidden />
                <span className="hidden sm:inline">Gabarito</span>
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => imprimir()}
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
              const escuro = document.documentElement.classList.contains("dark");
              setTheme(escuro ? "light" : "dark");
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
            aria-label="Editar nota"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden />
            <span className="hidden sm:inline">Editar</span>
          </Button>
        </div>
      </div>

      {/* conteúdo (a aparência da nota vem do editor: fonte/escala/entrelinha) */}
      <div
        className="na-entra na-nota mx-auto max-w-3xl px-4 pt-8 pb-24 sm:px-6"
        style={variaveisAparencia(nota.aparencia) as React.CSSProperties}
      >
        {/* cabeçalho da nota */}
        <header className="mb-8 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={`max-w-full rounded-md ${cor.chip}`} variant="secondary">
              <span className="break-words">{nota.disciplina?.nome ?? "Sem disciplina"}</span>
            </Badge>
            <Badge variant="outline" className="rounded-md font-normal">
              {MESES_CAP[nota.mes - 1]}/{nota.anoLetivo}
            </Badge>
            {nota.turmas.length > 0 ? (
              <Badge
                variant="outline"
                className="max-w-full rounded-md font-normal break-words whitespace-normal"
              >
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
        <div className="imprime-colunas space-y-5">
          <BlocosView blocos={nota.blocos} mostrarGabarito={mostrarGabarito} />
        </div>

        <footer className="na-imprime-esconder border-border text-muted-foreground mt-10 border-t pt-5 pb-6 text-center text-[0.75rem]">
          {nota.disciplina?.nome} · {MESES_CAP[nota.mes - 1]}/{nota.anoLetivo}
          {nota.turmas.length > 0 ? ` · ${nota.turmas.map((t) => t.nome).join(", ")}` : ""} · Gerado
          por Caderno Aberto
        </footer>
      </div>

      {compartilharAberto ? (
        <DialogoCompartilhar
          aberto
          aoFechar={() => setCompartilharAberto(false)}
          notaId={nota.id}
          status={nota.status}
        />
      ) : null}

      {/* versão de impressão: portal no body, visível apenas no papel */}
      <AreaImpressao>
        <DocumentoImpresso
          dados={{
            titulo: nota.titulo,
            disciplinaNome: nota.disciplina?.nome ?? "",
            disciplinaCor: nota.disciplina?.cor,
            mes: nota.mes,
            anoLetivo: nota.anoLetivo,
            turmas: nota.turmas.map((t) => t.nome),
            sobre: nota.sobre,
            habilidades: nota.habilidades,
            professor: [perfil?.nome, perfil?.escola].filter(Boolean).join(" · "),
            blocos: nota.blocos,
            aparencia: nota.aparencia,
            mostrarGabarito,
          }}
        />
      </AreaImpressao>
    </div>
  );
}
