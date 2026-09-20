"use client";

// Vista Notas. Lista com busca, filtros em painel e paginação.

import { useMemo, useRef, useState } from "react";
import {
  FilterX,
  GraduationCap,
  Loader2,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Paginacao } from "@/components/paginacao";
import { BarraLote } from "@/components/barra-lote";
import { BotaoAtualizar } from "@/components/botao-atualizar";
import { ConfirmacaoDestrutiva } from "@/components/confirmacao-destrutiva";
import { useEstadoSessao } from "@/hooks/use-estado-sessao";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePaginacao } from "@/hooks/use-paginacao";
import { useSelecao } from "@/hooks/use-selecao";
import {
  importarNotaArquivo,
  loteLixeira,
  loteNotas,
  useDisciplinas,
  useNotas,
  useTurmas,
} from "@/lib/notas/api-client";
import { CartaoNota } from "@/components/notas/cartao-nota";
import { MESES_CAP } from "@/lib/notas/texto";
import { corDisciplina } from "@/lib/notas/cores";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const POR_PAGINA = 12;

export function VistaNotas({
  navegar,
  onNovaNota,
}: {
  navegar: (para: string) => void;
  onNovaNota: () => void;
}) {
  // Os filtros sobrevivem à navegação dentro da sessão.
  const [busca, setBusca] = useEstadoSessao("caderno.filtros.notas.busca", "");
  const [disciplina, setDisciplina] = useEstadoSessao("caderno.filtros.notas.disciplina", "");
  const [ano, setAno] = useEstadoSessao<number | undefined>("caderno.filtros.notas.ano", undefined);
  const [mes, setMes] = useEstadoSessao<number | undefined>("caderno.filtros.notas.mes", undefined);
  const [turma, setTurma] = useEstadoSessao("caderno.filtros.notas.turma", "");
  const [painelAberto, setPainelAberto] = useState(false);
  const inputArquivo = useRef<HTMLInputElement>(null);
  const [importando, setImportando] = useState(false);
  const ehMobile = useIsMobile();

  const notasQ = useNotas();
  const disciplinasQ = useDisciplinas();
  const turmasQ = useTurmas();
  const { data: notas, isLoading: carregandoNotas } = notasQ;
  const { data: disciplinas } = disciplinasQ;
  const { data: turmas } = turmasQ;

  const anos = useMemo(
    () => [...new Set((notas ?? []).map((n) => n.anoLetivo))].sort((a, b) => b - a),
    [notas],
  );

  // Busca local por título, resumo e habilidades, somada aos filtros.
  const filtradas = useMemo(() => {
    let lista = notas ?? [];
    if (busca.trim()) {
      const alvo = busca.trim().toLowerCase();
      lista = lista.filter(
        (n) =>
          n.titulo.toLowerCase().includes(alvo) ||
          n.sobre.toLowerCase().includes(alvo) ||
          n.habilidades.toLowerCase().includes(alvo),
      );
    }
    if (disciplina) lista = lista.filter((n) => n.disciplinaId === disciplina);
    if (ano) lista = lista.filter((n) => n.anoLetivo === ano);
    if (mes) lista = lista.filter((n) => n.mes === mes);
    if (turma) lista = lista.filter((n) => n.turmas.some((t) => t.id === turma));
    return lista;
  }, [notas, busca, disciplina, ano, mes, turma]);

  const assinaturaFiltros = `${busca}|${disciplina}|${ano ?? ""}|${mes ?? ""}|${turma}`;
  const paginacao = usePaginacao(filtradas, POR_PAGINA, assinaturaFiltros);

  const qc = useQueryClient();
  const selecao = useSelecao(assinaturaFiltros);
  const [processandoLote, setProcessandoLote] = useState(false);
  const [confirmarLixeira, setConfirmarLixeira] = useState(false);
  const [escolherDisciplina, setEscolherDisciplina] = useState(false);
  const todosSelecionados =
    filtradas.length > 0 && filtradas.every((n) => selecao.selecionados.has(n.id));
  const algunsSelecionados = filtradas.some((n) => selecao.selecionados.has(n.id));

  const invalidarNotas = () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ["notas"] }),
      qc.invalidateQueries({ queryKey: ["disciplinas"] }),
      qc.invalidateQueries({ queryKey: ["turmas"] }),
      qc.invalidateQueries({ queryKey: ["lixeira"] }),
    ]);

  // Executa o lote, atualiza as listas e mantém ausentes selecionados.
  const executarLote = async (
    acao: "publicar" | "rascunho" | "lixeira" | "disciplina",
    mensagem: (n: number) => string,
    disciplinaId?: string,
  ) => {
    const ids = [...selecao.selecionados];
    setProcessandoLote(true);
    try {
      const r = await loteNotas({ acao, ids, disciplinaId });
      await invalidarNotas();
      if (acao === "lixeira") {
        toast.success(mensagem(r.atualizados), {
          action: {
            label: "Desfazer",
            onClick: () => {
              void loteLixeira({ notas: ids, links: [] })
                .then(() => {
                  void invalidarNotas();
                  toast.success("Notas restauradas");
                })
                .catch(() => toast.error("Não foi possível restaurar"));
            },
          },
        });
      } else {
        toast.success(mensagem(r.atualizados));
      }
      if (r.ausentes.length > 0) {
        toast.warning(
          `${r.ausentes.length} ${r.ausentes.length === 1 ? "item não encontrado" : "itens não encontrados"}.`,
        );
        selecao.definir(r.ausentes);
      } else {
        selecao.desativar();
      }
    } catch (e) {
      toast.error("Não foi possível concluir o lote", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setProcessandoLote(false);
      setConfirmarLixeira(false);
      setEscolherDisciplina(false);
    }
  };

  const ativos = [
    disciplina
      ? {
          chave: "disciplina",
          rotulo: (disciplinas ?? []).find((d) => d.id === disciplina)?.nome ?? "Disciplina",
          limpar: () => setDisciplina(""),
        }
      : null,
    ano ? { chave: "ano", rotulo: String(ano), limpar: () => setAno(undefined) } : null,
    mes ? { chave: "mes", rotulo: MESES_CAP[mes - 1], limpar: () => setMes(undefined) } : null,
    turma
      ? {
          chave: "turma",
          rotulo: (turmas ?? []).find((t) => t.id === turma)?.nome ?? "Turma",
          limpar: () => setTurma(""),
        }
      : null,
  ].filter((f): f is NonNullable<typeof f> => Boolean(f));

  const limparFiltros = () => {
    setBusca("");
    setDisciplina("");
    setAno(undefined);
    setMes(undefined);
    setTurma("");
  };

  const importarNota = async (arquivo: File) => {
    setImportando(true);
    try {
      const conteudo = await arquivo.text();
      const formato = arquivo.name.endsWith(".json") ? "json" : "md";
      const nota = await importarNotaArquivo(conteudo, formato);
      toast.success("Nota importada", { description: nota.titulo });
      navegar(`/editor/${nota.id}`);
    } catch (e) {
      toast.error("Falha na importação", {
        description: e instanceof Error ? e.message : "Verifique o formato do arquivo.",
      });
    } finally {
      setImportando(false);
      if (inputArquivo.current) inputArquivo.current.value = "";
    }
  };

  const botaoFiltros = (
    <Button variant="outline" className="shrink-0 gap-2 rounded-xl">
      <SlidersHorizontal className="h-4 w-4" aria-hidden /> Filtros
      {ativos.length > 0 ? (
        <Badge variant="secondary" className="rounded-md px-1.5 text-[0.68rem]">
          {ativos.length}
        </Badge>
      ) : null}
    </Button>
  );

  const painel = (
    <PainelFiltros
      disciplinas={disciplinas ?? []}
      anos={anos}
      turmas={turmas ?? []}
      valores={{ disciplina, ano, mes, turma }}
      onDisciplina={setDisciplina}
      onAno={setAno}
      onMes={setMes}
      onTurma={setTurma}
      onLimpar={limparFiltros}
    />
  );

  return (
    <div className={cn("space-y-5", selecao.ativo && "pb-28")}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="fonte-display text-2xl font-bold">Notas</h1>
          <p className="text-muted-foreground text-sm">
            {filtradas.length} de {notas?.length ?? 0} notas
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <BotaoAtualizar
            carregando={notasQ.isFetching || disciplinasQ.isFetching || turmasQ.isFetching}
            aoAtualizar={() =>
              Promise.all([notasQ.refetch(), disciplinasQ.refetch(), turmasQ.refetch()])
            }
          />
          {filtradas.length > 0 ? (
            <Button
              variant="outline"
              className="gap-2 rounded-xl"
              aria-pressed={selecao.ativo}
              onClick={selecao.alternarModo}
            >
              {selecao.ativo ? "Sair da seleção" : "Selecionar"}
            </Button>
          ) : null}
          <input
            ref={inputArquivo}
            type="file"
            accept=".md,.json,text/markdown,application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void importarNota(f);
            }}
          />
          <Button
            variant="outline"
            className="gap-2 rounded-xl"
            disabled={importando}
            onClick={() => inputArquivo.current?.click()}
          >
            {importando ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Upload className="h-4 w-4" aria-hidden />
            )}
            {importando ? "Importando..." : "Importar nota"}
          </Button>
          <Button onClick={onNovaNota} className="gap-2 rounded-xl">
            <Plus className="h-4 w-4" aria-hidden /> Nova nota
          </Button>
        </div>
      </div>

      {/* busca + filtros */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search
              className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
              aria-hidden
            />
            <Input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Filtrar por título, resumo ou habilidade..."
              aria-label="Filtrar notas"
              className="rounded-xl pl-9"
            />
          </div>

          {ehMobile ? (
            <Drawer open={painelAberto} onOpenChange={setPainelAberto}>
              <button
                type="button"
                onClick={() => setPainelAberto(true)}
                className="border-input hover:bg-accent inline-flex h-9 shrink-0 items-center gap-2 rounded-xl border px-3 text-sm font-medium"
              >
                <SlidersHorizontal className="h-4 w-4" aria-hidden /> Filtros
                {ativos.length > 0 ? (
                  <Badge variant="secondary" className="rounded-md px-1.5 text-[0.68rem]">
                    {ativos.length}
                  </Badge>
                ) : null}
              </button>
              <DrawerContent className="pb-[env(safe-area-inset-bottom)]">
                <DrawerHeader className="group-data-[vaul-drawer-direction=bottom]/drawer-content:text-left">
                  <DrawerTitle className="fonte-display">Filtros</DrawerTitle>
                </DrawerHeader>
                <div className="max-h-[65vh] overflow-y-auto px-4 pb-4">{painel}</div>
              </DrawerContent>
            </Drawer>
          ) : (
            <Popover open={painelAberto} onOpenChange={setPainelAberto}>
              <PopoverTrigger asChild>{botaoFiltros}</PopoverTrigger>
              <PopoverContent align="end" className="w-[22rem]">
                {painel}
              </PopoverContent>
            </Popover>
          )}
        </div>

        {ativos.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {ativos.map((f) => (
              <button
                key={f.chave}
                type="button"
                onClick={f.limpar}
                className="border-border bg-secondary text-secondary-foreground hover:bg-accent inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[0.78rem] font-semibold transition-colors"
                aria-label={`Remover filtro ${f.rotulo}`}
              >
                {f.rotulo}
                <X className="h-3 w-3" aria-hidden />
              </button>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground h-7 gap-1.5 px-2"
              onClick={limparFiltros}
            >
              <FilterX className="h-3.5 w-3.5" aria-hidden /> Limpar tudo
            </Button>
          </div>
        ) : null}
      </div>

      {/* lista */}
      {carregandoNotas ? (
        <div className="grid gap-3 sm:grid-cols-2" aria-busy="true">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      ) : filtradas.length > 0 ? (
        <div className="space-y-4">
          {selecao.ativo ? (
            <div className="flex items-center gap-2">
              <Checkbox
                checked={todosSelecionados ? true : algunsSelecionados ? "indeterminate" : false}
                onCheckedChange={() =>
                  todosSelecionados
                    ? selecao.definir([])
                    : selecao.definir(filtradas.map((n) => n.id))
                }
                aria-label="Selecionar todas as notas filtradas"
              />
              <span className="text-sm font-medium">Selecionar todas ({filtradas.length})</span>
            </div>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            {paginacao.itens.map((n, i) => (
              <CartaoNota
                key={n.id}
                nota={n}
                indice={i}
                onAbrir={() => navegar(`/nota/${n.id}`)}
                onEditar={() => navegar(`/editor/${n.id}`)}
                selecao={
                  selecao.ativo
                    ? {
                        ativo: true,
                        selecionado: selecao.selecionados.has(n.id),
                        onAlternar: () => selecao.alternar(n.id),
                      }
                    : undefined
                }
              />
            ))}
          </div>
          <Paginacao paginacao={paginacao} rotulo="notas" />
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
          ) : (
            <Button variant="outline" onClick={limparFiltros} className="mt-4 gap-2 rounded-xl">
              <FilterX className="h-4 w-4" aria-hidden /> Limpar filtros
            </Button>
          )}
        </div>
      )}

      <BarraLote
        aberto={selecao.ativo}
        quantidade={selecao.quantidade}
        ocupada={processandoLote}
        aoCancelar={selecao.desativar}
        acoes={
          <>
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 rounded-lg text-[0.72rem] pointer-coarse:h-10"
              disabled={selecao.quantidade === 0 || processandoLote}
              onClick={() =>
                void executarLote(
                  "publicar",
                  (n) => `${n} ${n === 1 ? "nota publicada" : "notas publicadas"}`,
                )
              }
            >
              Publicar
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 rounded-lg text-[0.72rem] pointer-coarse:h-10"
              disabled={selecao.quantidade === 0 || processandoLote}
              onClick={() =>
                void executarLote(
                  "rascunho",
                  (n) => `${n} ${n === 1 ? "nota em rascunho" : "notas em rascunho"}`,
                )
              }
            >
              Rascunho
            </Button>

            <Popover open={escolherDisciplina} onOpenChange={setEscolherDisciplina}>
              <PopoverTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 rounded-lg text-[0.72rem] pointer-coarse:h-10"
                  disabled={selecao.quantidade === 0 || processandoLote}
                >
                  <GraduationCap className="h-3.5 w-3.5" aria-hidden /> Disciplina
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="max-h-72 w-56 overflow-y-auto p-1.5">
                {(disciplinas ?? []).length === 0 ? (
                  <p className="text-muted-foreground p-2 text-sm">
                    Nenhuma disciplina cadastrada.
                  </p>
                ) : (
                  (disciplinas ?? []).map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      className="hover:bg-accent flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm"
                      onClick={() =>
                        void executarLote(
                          "disciplina",
                          (n) => `${n} ${n === 1 ? "nota movida" : "notas movidas"} de disciplina`,
                          d.id,
                        )
                      }
                    >
                      <span className={`h-2.5 w-2.5 rounded-full ${corDisciplina(d.cor).ponto}`} />
                      {d.nome}
                    </button>
                  ))
                )}
              </PopoverContent>
            </Popover>

            <Button
              size="sm"
              variant="outline"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 gap-1.5 rounded-lg text-[0.72rem] pointer-coarse:h-10"
              disabled={selecao.quantidade === 0 || processandoLote}
              onClick={() => setConfirmarLixeira(true)}
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden /> Lixeira
            </Button>
          </>
        }
      />

      <ConfirmacaoDestrutiva
        aberto={confirmarLixeira}
        onOpenChange={setConfirmarLixeira}
        titulo={`Mover ${selecao.quantidade} ${selecao.quantidade === 1 ? "nota" : "notas"} para a lixeira?`}
        descricao="As notas e os links delas vão para a lixeira e podem ser restaurados por 30 dias."
        textoConfirmar="Mover para a lixeira"
        onConfirmar={() =>
          executarLote(
            "lixeira",
            (n) => `${n} ${n === 1 ? "nota movida" : "notas movidas"} para a lixeira`,
          )
        }
      />
    </div>
  );
}

function PainelFiltros({
  disciplinas,
  anos,
  turmas,
  valores,
  onDisciplina,
  onAno,
  onMes,
  onTurma,
  onLimpar,
}: {
  disciplinas: { id: string; nome: string; cor: string }[];
  anos: number[];
  turmas: { id: string; nome: string }[];
  valores: { disciplina: string; ano?: number; mes?: number; turma: string };
  onDisciplina: (v: string) => void;
  onAno: (v: number | undefined) => void;
  onMes: (v: number | undefined) => void;
  onTurma: (v: string) => void;
  onLimpar: () => void;
}) {
  return (
    <div className="space-y-4">
      <GrupoFiltro titulo="Disciplina">
        <ChipFiltro ativo={!valores.disciplina} rotulo="Todas" onClick={() => onDisciplina("")} />
        {disciplinas.map((d) => (
          <ChipFiltro
            key={d.id}
            ativo={valores.disciplina === d.id}
            rotulo={d.nome}
            cor={d.cor}
            onClick={() => onDisciplina(valores.disciplina === d.id ? "" : d.id)}
          />
        ))}
      </GrupoFiltro>

      {anos.length > 0 ? (
        <GrupoFiltro titulo="Ano letivo">
          <ChipFiltro ativo={!valores.ano} rotulo="Todos" onClick={() => onAno(undefined)} />
          {anos.map((a) => (
            <ChipFiltro
              key={a}
              ativo={valores.ano === a}
              rotulo={String(a)}
              onClick={() => onAno(valores.ano === a ? undefined : a)}
            />
          ))}
        </GrupoFiltro>
      ) : null}

      <GrupoFiltro titulo="Mês">
        <ChipFiltro ativo={!valores.mes} rotulo="Todos" onClick={() => onMes(undefined)} />
        {MESES_CAP.map((m, i) => (
          <ChipFiltro
            key={m}
            ativo={valores.mes === i + 1}
            rotulo={m.slice(0, 3)}
            onClick={() => onMes(valores.mes === i + 1 ? undefined : i + 1)}
          />
        ))}
      </GrupoFiltro>

      {turmas.length > 0 ? (
        <GrupoFiltro titulo="Turma">
          <ChipFiltro ativo={!valores.turma} rotulo="Todas" onClick={() => onTurma("")} />
          {turmas.map((t) => (
            <ChipFiltro
              key={t.id}
              ativo={valores.turma === t.id}
              rotulo={t.nome}
              onClick={() => onTurma(valores.turma === t.id ? "" : t.id)}
            />
          ))}
        </GrupoFiltro>
      ) : null}

      <div className="border-border flex justify-end border-t pt-3">
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={onLimpar}>
          <FilterX className="h-3.5 w-3.5" aria-hidden /> Limpar filtros
        </Button>
      </div>
    </div>
  );
}

function GrupoFiltro({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-muted-foreground text-[0.7rem] font-bold tracking-wider uppercase">
        {titulo}
      </p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function ChipFiltro({
  ativo,
  rotulo,
  cor,
  onClick,
}: {
  ativo: boolean;
  rotulo: string;
  cor?: string;
  onClick: () => void;
}) {
  const classesCor = cor ? corDisciplina(cor) : null;
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
  );
}
