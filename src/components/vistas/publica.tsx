"use client";

// Vista pública do aluno. /#/l/<token> Sem login: tudo vem de /api/publico/<token>, que devolve link ativo e notas publicadas. Alunos podem alternar o gabarito, imprimir A4 e mudar o tema.

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpenText,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Hourglass,
  Printer,
  RotateCcw,
  Search,
  Sun,
  Moon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useTheme } from "next-themes";
import { BlocosView, ProvedorRespostasQuiz } from "@/components/notas/blocos-view";
import { AreaImpressao, DocumentoImpresso } from "@/components/notas/area-impressao";
import { BotaoAtualizar } from "@/components/botao-atualizar";
import { Skeleton } from "@/components/ui/skeleton";
import { TelaEstado } from "@/components/tela-estado";
import { toast } from "sonner";
import { MESES_CAP, separarHabilidades } from "@/lib/notas/texto";
import { corDisciplina } from "@/lib/notas/cores";
import type { AparenciaNota, Bloco } from "@/lib/notas/tipos";
import { variaveisAparencia } from "@/lib/notas/tipos";
import { DEMO_NOTA, DEMO_TOKEN } from "@/lib/notas/demo";
import { useTituloAba } from "@/hooks/use-titulo-aba";
import { imprimir, useTemaClaroNaImpressao } from "@/hooks/use-impressao";

interface NotaPublica {
  id: string;
  titulo: string;
  disciplinaNome: string;
  disciplinaCor: string;
  turmasNomes: string[];
  anoLetivo: number;
  mes: number;
  sobre: string;
  habilidades: string;
  blocos: Bloco[];
  /** Aparência escolhida pelo professor: o aluno vê a mesma. */
  aparencia: AparenciaNota;
  atualizadoEm: string;
}

interface DadosPublicos {
  link: {
    tipo: "nota" | "turma" | "disciplina";
    nome: string;
    professorNome: string;
    expiraEm: string | null;
  };
  notas: NotaPublica[];
}

export function VistaPublica({
  token,
  aulaId,
  navegar,
}: {
  token: string;
  aulaId?: string;
  navegar?: (para: string) => void;
}) {
  const { setTheme } = useTheme();
  const [dados, setDados] = useState<DadosPublicos | null>(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [selecionadaLocal, setSelecionadaLocal] = useState<string | null>(null);
  const [mostrarGabarito, setMostrarGabarito] = useState(false);
  const [respostas, setRespostas] = useState<Record<string, number | null>>({});
  const [busca, setBusca] = useState("");
  const [temHistorico, setTemHistorico] = useState(false);
  const [atualizando, setAtualizando] = useState(false);
  useTemaClaroNaImpressao();

  // Atualização manual: mantém os dados atuais se a rede falhar.
  const recarregar = async () => {
    if (token === DEMO_TOKEN) return;
    setAtualizando(true);
    try {
      const r = await fetch(`/api/publico/${encodeURIComponent(token)}`, { cache: "no-store" });
      if (!r.ok) throw new Error("Não foi possível atualizar.");
      setDados((await r.json()) as DadosPublicos);
      setErro("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível atualizar.");
    } finally {
      setAtualizando(false);
    }
  };

  // A aula aberta vive na URL quando há roteador; sem ele, fica no estado local.
  const selecionada = navegar
    ? aulaId && dados?.notas.some((n) => n.id === aulaId)
      ? aulaId
      : null
    : selecionadaLocal;
  const responderQuiz = (questaoId: string, indice: number | null) =>
    setRespostas((atual) => ({ ...atual, [questaoId]: indice }));

  // Link aberto direto (QR code, WhatsApp) não tem para onde voltar.
  useEffect(() => {
    setTemHistorico(window.history.length > 1);
  }, []);

  const tituloAba =
    dados?.link.tipo === "nota"
      ? (dados.notas[0]?.titulo ?? "Nota de aula")
      : (dados?.link.nome ?? null);
  useTituloAba(tituloAba);

  useEffect(() => {
    // Token de demonstração monta os dados localmente, sem chamar a API.
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
            aparencia: {},
            atualizadoEm: DEMO_NOTA.atualizadoEm,
          },
        ],
      };
      setDados(demo);
      setCarregando(false);
      setErro("");
      return;
    }
    // A flag evita atualizar o estado se o token mudar antes da resposta.
    let vivo = true;
    setCarregando(true);
    setErro("");
    fetch(`/api/publico/${encodeURIComponent(token)}`, { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) {
          const c = await r.json().catch(() => ({ erro: "Link indisponível." }));
          throw new Error(c.erro ?? "Link indisponível.");
        }
        return r.json() as Promise<DadosPublicos>;
      })
      .then((c) => {
        if (!vivo) return;
        setDados(c);
      })
      .catch((e: Error) => {
        if (vivo) setErro(e.message);
      })
      .finally(() => {
        if (vivo) setCarregando(false);
      });
    return () => {
      vivo = false;
    };
  }, [token]);

  // Links de turma e disciplina são coleções: a lista vem sempre primeiro,
  // mesmo com uma única aula. Somente o link de nota abre direto.
  const ehColecao = Boolean(dados && dados.link.tipo !== "nota");
  const nota = ehColecao
    ? (dados?.notas.find((n) => n.id === selecionada) ?? null)
    : (dados?.notas[0] ?? null);
  const indiceAtual =
    dados && selecionada ? dados.notas.findIndex((n) => n.id === selecionada) : -1;

  const filtradas = useMemo(() => {
    const base = dados?.notas ?? [];
    if (!ehColecao || !busca.trim()) return base;
    const alvo = busca.trim().toLowerCase();
    return base.filter(
      (n) => n.titulo.toLowerCase().includes(alvo) || n.disciplinaNome.toLowerCase().includes(alvo),
    );
  }, [dados, ehColecao, busca]);

  const rolarTopo = () => {
    const reduzirMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduzirMovimento ? "auto" : "smooth" });
  };

  const abrirAula = (id: string) => {
    if (navegar) navegar(`/l/${token}/aula/${id}`);
    else setSelecionadaLocal(id);
    rolarTopo();
  };

  const voltarParaLista = () => {
    if (navegar) navegar(`/l/${token}`);
    else setSelecionadaLocal(null);
    rolarTopo();
  };

  if (carregando) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-10" aria-busy="true">
        <div className="flex gap-2">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-9 w-2/5 rounded-lg" />
        </div>
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    );
  }

  if (erro || !dados) {
    return (
      <TelaEstado
        variante="link_invalido"
        descricao={erro || "Este link não existe, foi revogado pelo professor ou expirou."}
        acao={
          navegar
            ? { rotulo: "Ir para o início", onClick: () => navegar("/") }
            : {
                rotulo: "Voltar",
                onClick: () => {
                  if (window.history.length > 1) window.history.back();
                  else window.location.hash = "#/";
                },
              }
        }
      />
    );
  }

  const expira = dados.link.expiraEm ? new Date(dados.link.expiraEm) : null;

  return (
    <div className="bg-background min-h-dvh">
      {/* toolbar */}
      <div className="na-imprime-esconder border-border bg-background/90 sticky top-0 z-40 border-b backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-1.5 px-3 sm:px-4">
          {ehColecao && selecionada ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={voltarParaLista}
              aria-label="Voltar para a lista"
              className="rounded-lg"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden />
            </Button>
          ) : temHistorico ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.history.back()}
              aria-label="Voltar"
              className="rounded-lg"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden />
            </Button>
          ) : null}
          <p className="min-w-0 flex-1 truncate px-1 text-sm font-semibold">
            {ehColecao && selecionada
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
          <BotaoAtualizar carregando={atualizando} aoAtualizar={recarregar} />
          {nota ? (
            <Button
              variant="outline"
              size="icon"
              onClick={() => setRespostas({})}
              aria-label="Refazer exercícios"
              title="Refazer exercícios"
              className="rounded-lg"
            >
              <RotateCcw className="h-4 w-4" aria-hidden />
            </Button>
          ) : null}
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
            onClick={() => {
              const escuro = document.documentElement.classList.contains("dark");
              setTheme(escuro ? "light" : "dark");
            }}
            aria-label="Alternar tema"
            className="rounded-lg"
          >
            <Sun className="hidden h-4 w-4 dark:block" aria-hidden />
            <Moon className="h-4 w-4 dark:hidden" aria-hidden />
          </Button>
        </div>
      </div>

      {/* lista de notas (links de turma/disciplina) */}
      {ehColecao && !selecionada ? (
        <div className="na-entra mx-auto max-w-3xl px-4 pt-8 pb-24 sm:px-6">
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
              placeholder="Buscar aula por título..."
              className="rounded-xl pl-9"
            />
          </div>

          <div className="space-y-2.5">
            {filtradas.map((n, i) => {
              const cor = corDisciplina(n.disciplinaCor);
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => abrirAula(n.id)}
                  className={`na-cascata border-border bg-card flex w-full items-start gap-3 rounded-2xl border border-l-4 p-4 text-left transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-md ${cor.borda}`}
                  style={{ "--na-i": i } as React.CSSProperties}
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
                          {n.sobre.length > 60 ? "..." : ""}
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
              );
            })}
            {filtradas.length === 0 ? (
              <p className="border-border text-muted-foreground rounded-2xl border border-dashed p-8 text-center text-sm">
                {dados.notas.length === 0
                  ? "Nenhuma aula publicada ainda. Volte quando o professor publicar as notas deste link."
                  : `Nenhuma aula encontrada para "${busca}".`}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* leitura da nota (aparência definida pelo professor) */}
      {nota ? (
        <div
          className="na-entra na-nota mx-auto max-w-3xl px-4 pt-8 pb-24 sm:px-6"
          style={variaveisAparencia(nota.aparencia) as React.CSSProperties}
        >
          <header className="mb-8 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {nota.disciplinaNome ? (
                <Badge
                  className={`max-w-full rounded-md ${corDisciplina(nota.disciplinaCor).chip}`}
                  variant="secondary"
                >
                  <span className="break-words">{nota.disciplinaNome}</span>
                </Badge>
              ) : null}
              <Badge variant="outline" className="rounded-md font-normal">
                {MESES_CAP[nota.mes - 1]}/{nota.anoLetivo}
              </Badge>
              {nota.turmasNomes.length > 0 ? (
                <Badge
                  variant="outline"
                  className="max-w-full rounded-md font-normal break-words whitespace-normal"
                >
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

          <ProvedorRespostasQuiz respostas={respostas} responder={responderQuiz}>
            <div className="imprime-colunas space-y-5">
              <BlocosView blocos={nota.blocos} mostrarGabarito={mostrarGabarito} />
            </div>
          </ProvedorRespostasQuiz>

          {/* navegação entre as aulas da coleção */}
          {ehColecao && indiceAtual >= 0 ? (
            <nav
              className="na-imprime-esconder border-border mt-8 flex items-center justify-between gap-3 border-t pt-4"
              aria-label="Navegação entre aulas"
            >
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 rounded-lg"
                disabled={indiceAtual === 0}
                onClick={() => abrirAula(dados.notas[indiceAtual - 1].id)}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden /> Anterior
              </Button>
              <span className="text-muted-foreground text-[0.78rem] font-medium">
                Aula {indiceAtual + 1} de {dados.notas.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 rounded-lg"
                disabled={indiceAtual === dados.notas.length - 1}
                onClick={() => abrirAula(dados.notas[indiceAtual + 1].id)}
              >
                Próxima <ChevronRight className="h-4 w-4" aria-hidden />
              </Button>
            </nav>
          ) : null}

          <footer className="na-imprime-esconder border-border text-muted-foreground mt-10 border-t pt-5 pb-6 text-center text-[0.75rem]">
            {dados.link.professorNome ? `${dados.link.professorNome} · ` : ""}
            Gerado por Caderno Aberto.
          </footer>
        </div>
      ) : (
        <div className="mx-auto max-w-xl px-4 py-20 text-center">
          <p className="fonte-display text-xl font-bold">Nenhuma aula publicada ainda</p>
          <p className="text-muted-foreground mt-2 text-sm">
            Volte quando o professor publicar as notas deste link.
          </p>
        </div>
      )}

      {/* aviso de expiração aparece na reta final de 3 dias */}
      {expira && expira.getTime() - Date.now() < 3 * 24 * 3600 * 1000 ? (
        <p className="na-imprime-esconder fixed inset-x-0 bottom-0 z-30 mx-auto mb-0 flex w-fit items-center gap-1.5 rounded-t-xl border border-b-0 border-amber-300 bg-amber-50 px-3.5 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] text-[0.72rem] font-medium text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
          <Hourglass className="h-3 w-3" aria-hidden />
          Este link expira em {expira.toLocaleDateString("pt-BR")}.
        </p>
      ) : null}

      {/* versão de impressão: portal no body, visível apenas no papel */}
      {nota ? (
        <AreaImpressao>
          <DocumentoImpresso
            dados={{
              titulo: nota.titulo,
              disciplinaNome: nota.disciplinaNome,
              disciplinaCor: nota.disciplinaCor,
              mes: nota.mes,
              anoLetivo: nota.anoLetivo,
              turmas: nota.turmasNomes,
              sobre: nota.sobre,
              habilidades: nota.habilidades,
              professor: dados.link.professorNome,
              blocos: nota.blocos,
              aparencia: nota.aparencia,
              mostrarGabarito,
            }}
          />
        </AreaImpressao>
      ) : null}
    </div>
  );
}
