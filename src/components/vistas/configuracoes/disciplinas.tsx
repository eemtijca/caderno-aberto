"use client";

// Seção Disciplinas: criação e edição com nome, cor e ícone.

import { useState } from "react";
import { GraduationCap, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import {
  useCriarDisciplina,
  useDisciplinas,
  useEditarDisciplina,
  useExcluirDisciplina,
} from "@/lib/notas/api-client";
import { SeletorIcone } from "@/components/seletor-icone";
import { CORES, corDisciplina, nomeIconeValido } from "@/lib/notas/cores";

function OpcoesCor() {
  return (
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
  );
}

export function SecaoDisciplinas() {
  const disciplinasQ = useDisciplinas();
  const { data: disciplinas, isLoading: carregando } = disciplinasQ;
  const criar = useCriarDisciplina();
  const editar = useEditarDisciplina();
  const excluir = useExcluirDisciplina();

  const [nome, setNome] = useState("");
  const [cor, setCor] = useState("verde");
  const [icone, setIcone] = useState("BookOpen");

  const [editando, setEditando] = useState<string | null>(null);
  const [nomeEditado, setNomeEditado] = useState("");
  const [corEditada, setCorEditada] = useState("verde");
  const [iconeEditado, setIconeEditado] = useState("BookOpen");

  return (
    <section className="na-cascata border-border bg-card rounded-2xl border p-5">
      <h2 className="fonte-display flex items-center gap-2 text-lg font-bold">
        <GraduationCap className="h-4.5 w-4.5" aria-hidden /> Disciplinas
      </h2>
      <p className="text-muted-foreground mt-1 text-sm">
        Qualquer componente curricular. Cada disciplina tem cor e ícone próprios.
      </p>

      <div className="mt-4 space-y-2" aria-busy={carregando || undefined}>
        {carregando ? (
          <>
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-5/6 rounded-xl" />
          </>
        ) : (
          (disciplinas ?? []).map((d) => {
            const c = corDisciplina(d.cor);
            const emEdicao = editando === d.id;
            return (
              <div
                key={d.id}
                className={`flex flex-wrap items-center gap-2.5 rounded-xl border ${c.borda} ${c.fundoSuave} px-3.5 py-2.5`}
              >
                {emEdicao ? (
                  <>
                    <Input
                      value={nomeEditado}
                      onChange={(e) => setNomeEditado(e.target.value)}
                      className="h-9 w-44 rounded-lg"
                      aria-label="Novo nome da disciplina"
                    />
                    <Select value={corEditada} onValueChange={setCorEditada}>
                      <SelectTrigger size="sm" className="h-9 w-40 rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <OpcoesCor />
                    </Select>
                    <SeletorIcone
                      valor={iconeEditado}
                      onChange={setIconeEditado}
                      className="h-9 w-44"
                    />
                    <Button
                      size="sm"
                      className="h-9 rounded-lg"
                      onClick={async () => {
                        try {
                          await editar.mutateAsync({
                            id: d.id,
                            dados: {
                              nome: nomeEditado,
                              cor: corEditada,
                              icone: nomeIconeValido(iconeEditado),
                            },
                          });
                          setEditando(null);
                          toast.success("Disciplina atualizada");
                        } catch (e) {
                          toast.error("Não foi possível salvar a disciplina", {
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
                      className="h-9 rounded-lg"
                      onClick={() => setEditando(null)}
                    >
                      Cancelar
                    </Button>
                  </>
                ) : (
                  <>
                    <span className={`h-3 w-3 rounded-full ${c.ponto}`} aria-hidden />
                    <span className="font-bold">{d.nome}</span>
                    <Badge variant="secondary" className={`rounded-md text-[0.65rem] ${c.chip}`}>
                      {d.totalNotas} {d.totalNotas === 1 ? "nota" : "notas"}
                    </Badge>
                    <div className="ml-auto flex gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditando(d.id);
                          setNomeEditado(d.nome);
                          setCorEditada(d.cor);
                          setIconeEditado(nomeIconeValido(d.icone));
                        }}
                        className="text-muted-foreground hover:bg-accent hover:text-foreground flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                        aria-label={`Editar ${d.nome}`}
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" aria-hidden />
                      </button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            type="button"
                            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                            aria-label={`Excluir ${d.nome}`}
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir {d.nome}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              {d.totalNotas > 0
                                ? d.totalNotas === 1
                                  ? "Esta disciplina tem 1 nota. Ela continua existindo, apenas perde a disciplina."
                                  : `Esta disciplina tem ${d.totalNotas} notas. Elas continuam existindo, apenas perdem a disciplina.`
                                : "A disciplina será removida. Não há notas vinculadas."}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive hover:bg-destructive/90 text-white"
                              onClick={async () => {
                                try {
                                  await excluir.mutateAsync(d.id);
                                  toast.success("Disciplina excluída");
                                } catch (e) {
                                  toast.error("Não foi possível excluir a disciplina", {
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
                  </>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="border-border mt-4 grid gap-3 rounded-xl border border-dashed p-3.5">
        <div className="grid gap-2.5 sm:grid-cols-[1fr_auto]">
          <Input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nova disciplina (ex.: Química)"
            className="h-9 rounded-lg"
            aria-label="Nome da nova disciplina"
          />
          <Button
            className="h-9 gap-1.5 rounded-lg"
            disabled={!nome.trim() || criar.isPending}
            onClick={async () => {
              try {
                await criar.mutateAsync({ nome: nome.trim(), cor, icone: nomeIconeValido(icone) });
                setNome("");
                toast.success("Disciplina criada");
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Erro ao criar.");
              }
            }}
          >
            <Plus className="h-4 w-4" aria-hidden /> Criar
          </Button>
        </div>
        <div className="grid gap-2.5 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <span className="text-muted-foreground text-xs font-medium">Cor</span>
            <Select value={cor} onValueChange={setCor}>
              <SelectTrigger className="h-9 w-full rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <OpcoesCor />
            </Select>
          </div>
          <div className="grid gap-1.5">
            <span className="text-muted-foreground text-xs font-medium">Ícone</span>
            <SeletorIcone valor={icone} onChange={setIcone} className="h-9" />
          </div>
        </div>
      </div>
    </section>
  );
}
