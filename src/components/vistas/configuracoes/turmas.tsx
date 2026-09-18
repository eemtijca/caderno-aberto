"use client";

// Seção Turmas: cadastro e edição de turmas por ano letivo.

import { useState } from "react";
import { GraduationCap, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useCriarTurma, useEditarTurma, useExcluirTurma, useTurmas } from "@/lib/notas/api-client";

const SERIES = ["1º ano", "2º ano", "3º ano", "Outro"];

export function SecaoTurmas() {
  const turmasQ = useTurmas();
  const { data: turmas, isLoading: carregando } = turmasQ;
  const criar = useCriarTurma();
  const editar = useEditarTurma();
  const excluir = useExcluirTurma();

  const [nome, setNome] = useState("");
  const [serie, setSerie] = useState("1º ano");
  const [anoLetivo, setAnoLetivo] = useState(new Date().getFullYear());
  const [editando, setEditando] = useState<string | null>(null);
  const [nomeEditado, setNomeEditado] = useState("");
  const [serieEditada, setSerieEditada] = useState("");

  const anos = [...new Set((turmas ?? []).map((t) => t.anoLetivo))].sort((a, b) => b - a);

  return (
    <section className="na-cascata border-border bg-card rounded-2xl border p-5">
      <h2 className="fonte-display flex items-center gap-2 text-lg font-bold">
        <GraduationCap className="h-4.5 w-4.5" aria-hidden /> Turmas
      </h2>
      <p className="text-muted-foreground mt-1 text-sm">
        As turmas alimentam a organização automática (Ano, Turma, Mês) e os links por turma.
      </p>

      {carregando ? (
        <div className="mt-4 space-y-3" aria-busy="true">
          <Skeleton className="h-12 w-40 rounded-xl" />
          <Skeleton className="h-12 w-64 rounded-xl" />
        </div>
      ) : anos.length > 0 ? (
        <div className="mt-4 space-y-3">
          {anos.map((ano) => (
            <div key={ano}>
              <p className="text-muted-foreground text-[0.7rem] font-bold tracking-wider uppercase">
                {ano}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {(turmas ?? [])
                  .filter((t) => t.anoLetivo === ano)
                  .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
                  .map((t) => {
                    const emEdicao = editando === t.id;
                    return emEdicao ? (
                      <div
                        key={t.id}
                        className="border-border bg-background flex flex-wrap items-center gap-1.5 rounded-xl border px-3 py-2"
                      >
                        <Input
                          value={nomeEditado}
                          onChange={(e) => setNomeEditado(e.target.value.toUpperCase())}
                          className="h-8 w-20 rounded-lg"
                          aria-label="Novo nome da turma"
                        />
                        <Select value={serieEditada} onValueChange={setSerieEditada}>
                          <SelectTrigger size="sm" className="h-8 w-28 rounded-lg">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SERIES.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          className="h-8 rounded-lg"
                          onClick={async () => {
                            try {
                              await editar.mutateAsync({
                                id: t.id,
                                dados: { nome: nomeEditado, serie: serieEditada },
                              });
                              setEditando(null);
                              toast.success("Turma atualizada");
                            } catch (e) {
                              toast.error("Não foi possível salvar a turma", {
                                description: e instanceof Error ? e.message : undefined,
                              });
                            }
                          }}
                        >
                          Salvar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 rounded-lg"
                          onClick={() => setEditando(null)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <div
                        key={t.id}
                        className="border-border bg-background flex items-center gap-2 rounded-xl border px-3 py-2"
                      >
                        <span className="fonte-display font-bold">{t.nome}</span>
                        <span className="text-muted-foreground text-[0.72rem]">{t.serie}</span>
                        <span className="text-muted-foreground text-[0.72rem]">
                          · {t.totalNotas} {t.totalNotas === 1 ? "nota" : "notas"}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setEditando(t.id);
                            setNomeEditado(t.nome);
                            setSerieEditada(t.serie);
                          }}
                          className="text-muted-foreground/70 hover:bg-accent hover:text-foreground flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                          aria-label={`Editar turma ${t.nome}`}
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" aria-hidden />
                        </button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button
                              type="button"
                              className="text-muted-foreground/60 hover:bg-destructive/10 hover:text-destructive flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                              aria-label={`Excluir turma ${t.nome}`}
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4" aria-hidden />
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir turma {t.nome}?</AlertDialogTitle>
                              <AlertDialogDescription>
                                {t.totalNotas > 0
                                  ? t.totalNotas === 1
                                    ? "Há 1 nota vinculada. Ela continua existindo, apenas perde esta turma."
                                    : `Há ${t.totalNotas} notas vinculadas. Elas continuam existindo, apenas perdem esta turma.`
                                  : "A turma será removida."}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive hover:bg-destructive/90 text-white"
                                onClick={async () => {
                                  try {
                                    await excluir.mutateAsync(t.id);
                                    toast.success("Turma excluída");
                                  } catch (e) {
                                    toast.error("Não foi possível excluir a turma", {
                                      description: e instanceof Error ? e.message : undefined,
                                    });
                                  }
                                }}
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground mt-3 text-sm">Nenhuma turma cadastrada ainda.</p>
      )}

      <div className="border-border mt-4 grid gap-2.5 rounded-xl border border-dashed p-3.5 sm:grid-cols-[auto_1fr_auto_auto]">
        <Input
          value={nome}
          onChange={(e) => setNome(e.target.value.toUpperCase())}
          placeholder="Turma (ex.: 3A)"
          className="h-9 w-28 rounded-lg"
          aria-label="Nome da nova turma"
        />
        <Select value={serie} onValueChange={setSerie}>
          <SelectTrigger size="sm" className="h-9 w-full rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SERIES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="number"
          value={anoLetivo}
          onChange={(e) => setAnoLetivo(Number(e.target.value) || new Date().getFullYear())}
          className="h-9 w-24 rounded-lg"
          aria-label="Ano letivo"
        />
        <Button
          className="h-9 gap-1.5 rounded-lg"
          disabled={!nome.trim() || criar.isPending}
          onClick={async () => {
            try {
              await criar.mutateAsync({ nome: nome.trim(), serie, anoLetivo });
              setNome("");
              toast.success("Turma criada");
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Erro ao criar.");
            }
          }}
        >
          <Plus className="h-4 w-4" aria-hidden /> Criar
        </Button>
      </div>
    </section>
  );
}
