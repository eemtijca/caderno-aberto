"use client";

// Editor da nota: metadados, aparência, blocos arrastáveis e prévia ao vivo.
// O salvamento é automático após um intervalo de inatividade.

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowLeft,
  BookOpenText,
  Check,
  ChevronDown,
  ChevronUp,
  CloudUpload,
  Copy,
  CopyPlus,
  Download,
  Eye,
  FileCode2,
  FileJson,
  FileText,
  GripVertical,
  Link2,
  Loader2,
  Plus,
  Printer,
  Redo2,
  Trash2,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ConfirmacaoDestrutiva } from "@/components/confirmacao-destrutiva";
import { BotaoAtualizar } from "@/components/botao-atualizar";
import { toast } from "sonner";

import {
  useDisciplinas,
  useDuplicarNota,
  useExcluirNota,
  useNota,
  useRestaurarNota,
  useSalvarNota,
  useTurmas,
  type DadosSalvarNota,
} from "@/lib/notas/api-client";
import { useSessao } from "@/hooks/use-sessao";
import { useIsMobile } from "@/hooks/use-mobile";
import { ignorarProximaGuarda, useGuardaSaida } from "@/hooks/use-guarda-saida";
import { useEhLargo } from "@/hooks/use-eh-largo";
import { DialogoCompartilhar } from "@/components/dialogo-compartilhar";
import { MESES_CAP } from "@/lib/notas/texto";
import { abrirExportacao } from "@/lib/exportar";
import type { AparenciaNota, Bloco, NotaDados } from "@/lib/notas/tipos";
import {
  APARENCIA_PADRAO,
  ENTRELINHAS_NOTA,
  ESCALAS_NOTA,
  FONTES_NOTA,
  idBloco,
  variaveisAparencia,
} from "@/lib/notas/tipos";
import { BlocosView } from "@/components/notas/blocos-view";
import {
  atualizarBloco,
  atualizarFilho,
  duplicarBloco,
  inserirBloco,
  inserirFilho,
  moverBloco,
  moverFilho,
  removerBloco,
  removerFilho,
  reordenar,
} from "./ops";
import {
  EditorCaixa,
  EditorChamada,
  EditorExercicios,
  EditorFigura,
  EditorFormula,
  EditorLista,
  EditorParagrafo,
  EditorSecao,
  EditorTabela,
  EditorTikz,
  novoFilho,
  type Patch,
} from "./editores-bloco";
import { PALETA, PaletaBlocos } from "./paleta-blocos";

export function novoBloco(tipo: Bloco["tipo"]): Bloco {
  const id = idBloco();
  switch (tipo) {
    case "secao":
      return { id, tipo: "secao", titulo: "" };
    case "paragrafo":
      return { id, tipo: "paragrafo", texto: "", rotulo: null };
    case "formula":
      return { id, tipo: "formula", latex: "" };
    case "lista":
      return { id, tipo: "lista", itens: [""] };
    case "tabela":
      return {
        id,
        tipo: "tabela",
        comCabecalho: true,
        linhas: [
          ["", ""],
          ["", ""],
        ],
      };
    case "chamada":
      return { id, tipo: "chamada", estilo: "atencao", texto: "" };
    case "figura":
      return { id, tipo: "figura", url: "", legenda: "" };
    case "tikz":
      return { id, tipo: "tikz", codigo: "\\draw (0,0) -- (2,0) -- (1,1) -- cycle;", legenda: "" };
    case "copiar":
      return { id, tipo: "copiar", rotulo: "", filhos: [novoFilho("paragrafo")] };
    case "exemplo":
      return { id, tipo: "exemplo", rotulo: "Exemplo resolvido", filhos: [novoFilho("paragrafo")] };
    case "dica":
      return { id, tipo: "dica", rotulo: "Dica / erro comum", filhos: [novoFilho("paragrafo")] };
    case "exercicios":
      return {
        id,
        tipo: "exercicios",
        rotulo: "Exercícios propostos",
        niveis: [
          { numero: 1, titulo: "Conceitos", questoes: [] },
          { numero: 2, titulo: "Aplicação", questoes: [] },
          { numero: 3, titulo: "Síntese", questoes: [] },
        ],
        gabarito: "",
      };
  }
}

export function VistaEditor({ id, navegar }: { id: string; navegar: (para: string) => void }) {
  const { data: nota, isLoading, isError } = useNota(id);

  if (isLoading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (!nota || isError) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <p className="fonte-display text-xl font-bold">Nota não encontrada</p>
        <p className="text-muted-foreground mt-2 text-sm">
          Ela pode ter sido excluída ou pertence a outro professor.
        </p>
        <Button onClick={() => navegar("/notas")} className="mt-5 gap-2 rounded-xl">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Voltar às notas
        </Button>
      </div>
    );
  }

  return <FormularioNota key={nota.id} notaInicial={nota} navegar={navegar} />;
}

function FormularioNota({
  notaInicial,
  navegar,
}: {
  notaInicial: NotaDados;
  navegar: (para: string) => void;
}) {
  const id = notaInicial.id;
  const { data: disciplinas } = useDisciplinas();
  const { data: turmas } = useTurmas();
  const { perfil } = useSessao();
  const salvar = useSalvarNota(id);
  const excluir = useExcluirNota();
  const restaurar = useRestaurarNota();
  const duplicar = useDuplicarNota();
  const [compartilharAberto, setCompartilharAberto] = useState(false);
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);

  const [titulo, setTitulo] = useState(notaInicial.titulo);
  const [disciplinaId, setDisciplinaId] = useState(notaInicial.disciplinaId);
  const [anoLetivo, setAnoLetivo] = useState(notaInicial.anoLetivo);
  const [mes, setMes] = useState(notaInicial.mes);
  const [sobre, setSobre] = useState(notaInicial.sobre);
  const [habilidades, setHabilidades] = useState(notaInicial.habilidades);
  const [status, setStatus] = useState<"rascunho" | "publicada">(notaInicial.status);
  const [turmasSel, setTurmasSel] = useState<string[]>(notaInicial.turmas.map((t) => t.id));
  const [blocos, setBlocos] = useState<Bloco[]>(notaInicial.blocos);
  const [aparencia, setAparencia] = useState<AparenciaNota>(
    notaInicial.aparencia ?? APARENCIA_PADRAO,
  );

  const [sujo, setSujo] = useState(false);
  const [estadoSalvamento, setEstadoSalvamento] = useState<"salvo" | "salvando" | "erro">("salvo");
  const [erroValidacao, setErroValidacao] = useState<string | null>(null);
  const [paletaEm, setPaletaEm] = useState<number | null>(null);
  const [blocoParaRolar, setBlocoParaRolar] = useState<string | null>(null);
  const [blocoRealcado, setBlocoRealcado] = useState<string | null>(null);
  const ehMobile = useIsMobile();
  const ehLargo = useEhLargo();
  // A prévia usa um valor adiado para a digitação não travar em notas longas.
  const blocosPrevistos = useDeferredValue(blocos);
  const [gabaritoPrevia, setGabaritoPrevia] = useState(false);
  const [metadadosAbertos, setMetadadosAbertos] = useState(false);
  const [podeDesfazer, setPodeDesfazer] = useState(false);
  const [podeRefazer, setPodeRefazer] = useState(false);
  const [blocoEmFoco, setBlocoEmFoco] = useState<string | null>(null);
  const timerAutoSave = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sujoRef = useRef(false);
  const dadosRef = useRef<DadosSalvarNota | null>(null);
  // Cada alteração avança a revisão; só marca "salvo" se nada mudou no meio.
  const revisaoRef = useRef(0);
  const salvandoRef = useRef<Promise<void> | null>(null);
  // Histórico estrutural dos blocos (inserir, remover, mover e duplicar).
  const blocosRef = useRef<Bloco[]>(notaInicial.blocos);
  const historicoRef = useRef<{ passado: Bloco[][]; futuro: Bloco[][] }>({
    passado: [],
    futuro: [],
  });

  useGuardaSaida(sujo);

  // Mantém o último estado em ref para salvar no unmount, no atalho e no retry.
  useEffect(() => {
    dadosRef.current = {
      titulo,
      disciplinaId,
      anoLetivo,
      mes,
      sobre,
      habilidades,
      status,
      turmasIds: turmasSel,
      blocos,
      aparencia,
    };
    sujoRef.current = sujo;
    revisaoRef.current += 1;
  }, [
    titulo,
    disciplinaId,
    anoLetivo,
    mes,
    sobre,
    habilidades,
    status,
    turmasSel,
    blocos,
    aparencia,
    sujo,
  ]);

  // Salva o estado mais recente, serializando chamadas e repetindo se algo
  // mudou durante a requisição. Devolve true quando não há pendências.
  const executarSalvamento = useCallback(async (): Promise<boolean> => {
    if (!dadosRef.current) return true;
    // Antecipa as regras do servidor para não anunciar "salvo" sem persistir.
    if (dadosRef.current.titulo !== undefined && dadosRef.current.titulo.trim().length < 2) {
      setErroValidacao("O título precisa de ao menos 2 caracteres.");
      setEstadoSalvamento("erro");
      return false;
    }
    if (
      dadosRef.current.anoLetivo !== undefined &&
      (dadosRef.current.anoLetivo < 2000 || dadosRef.current.anoLetivo > 2100)
    ) {
      setErroValidacao("O ano letivo deve ficar entre 2000 e 2100.");
      setEstadoSalvamento("erro");
      return false;
    }
    setErroValidacao(null);
    if (salvandoRef.current) await salvandoRef.current.catch(() => undefined);

    let liberar: () => void = () => undefined;
    salvandoRef.current = new Promise<void>((resolver) => {
      liberar = resolver;
    });
    try {
      for (;;) {
        const revisao = revisaoRef.current;
        setEstadoSalvamento("salvando");
        try {
          await salvar.mutateAsync(dadosRef.current);
        } catch {
          setEstadoSalvamento("erro");
          return false;
        }
        if (revisaoRef.current === revisao) {
          sujoRef.current = false;
          setSujo(false);
          setEstadoSalvamento("salvo");
          return true;
        }
      }
    } finally {
      liberar();
      salvandoRef.current = null;
    }
  }, [salvar.mutateAsync]);

  // Autosave: espera 900ms do último campo alterado antes de persistir.
  useEffect(() => {
    if (!sujo) return;
    if (timerAutoSave.current) clearTimeout(timerAutoSave.current);
    timerAutoSave.current = setTimeout(() => {
      void executarSalvamento();
    }, 900);
    return () => {
      if (timerAutoSave.current) clearTimeout(timerAutoSave.current);
    };
  }, [
    titulo,
    disciplinaId,
    anoLetivo,
    mes,
    sobre,
    habilidades,
    status,
    turmasSel,
    blocos,
    aparencia,
    sujo,
    executarSalvamento,
  ]);

  // Salva pendências ao desmontar (troca de vista ou navegação).
  useEffect(
    () => () => {
      if (sujoRef.current && dadosRef.current) void executarSalvamento();
    },
    [executarSalvamento],
  );

  // Aguarda a persistência antes de trocar de vista, para não perder edições.
  const sairPara = async (para: string) => {
    if (sujoRef.current) {
      const ok = await executarSalvamento();
      if (!ok) {
        toast.error("Não foi possível salvar", {
          description: "Resolva o erro antes de sair para não perder alterações.",
        });
        return;
      }
      // O estado de sujo só atualiza no próximo render: libera esta saída.
      ignorarProximaGuarda();
    }
    navegar(para);
  };

  // Ctrl/Cmd+S força o salvamento imediato.
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (sujoRef.current) void executarSalvamento();
      }
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [executarSalvamento]);

  // Envolve um setter para sinalizar que a nota passou a ter alterações pendentes.
  const marcar =
    <T,>(fn: (v: T) => void) =>
    (valor: T) => {
      fn(valor);
      setSujo(true);
    };

  const sincronizarHistorico = useCallback(() => {
    setPodeDesfazer(historicoRef.current.passado.length > 0);
    setPodeRefazer(historicoRef.current.futuro.length > 0);
  }, []);

  // Aplica uma mudança nos blocos; `comHistorico` guarda o estado anterior.
  const mudarBlocos = useCallback(
    (fn: (b: Bloco[]) => Bloco[], comHistorico = false) => {
      const proximo = fn(blocosRef.current);
      if (proximo === blocosRef.current) return;
      if (comHistorico) {
        historicoRef.current.passado.push(blocosRef.current);
        if (historicoRef.current.passado.length > 40) historicoRef.current.passado.shift();
        historicoRef.current.futuro = [];
        sincronizarHistorico();
      }
      blocosRef.current = proximo;
      setBlocos(proximo);
      setSujo(true);
    },
    [sincronizarHistorico],
  );

  const desfazer = useCallback(() => {
    const h = historicoRef.current;
    if (h.passado.length === 0) return;
    h.futuro.unshift(blocosRef.current);
    if (h.futuro.length > 40) h.futuro.pop();
    const anterior = h.passado.pop()!;
    blocosRef.current = anterior;
    setBlocos(anterior);
    setSujo(true);
    sincronizarHistorico();
  }, [sincronizarHistorico]);

  const refazer = useCallback(() => {
    const h = historicoRef.current;
    if (h.futuro.length === 0) return;
    h.passado.push(blocosRef.current);
    if (h.passado.length > 40) h.passado.shift();
    const proximo = h.futuro.shift()!;
    blocosRef.current = proximo;
    setBlocos(proximo);
    setSujo(true);
    sincronizarHistorico();
  }, [sincronizarHistorico]);

  // Ctrl/Cmd+Z desfaz operações estruturais; em campos de texto vale o nativo.
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "z") return;
      const alvo = e.target as HTMLElement | null;
      const emTexto =
        alvo && (alvo.tagName === "INPUT" || alvo.tagName === "TEXTAREA" || alvo.isContentEditable);
      if (emTexto) return;
      e.preventDefault();
      if (e.shiftKey) refazer();
      else desfazer();
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [desfazer, refazer]);

  const removerBlocoComDesfazer = (id: string) => {
    mudarBlocos((bs) => removerBloco(bs, id), true);
    toast("Bloco removido", {
      action: { label: "Desfazer", onClick: () => desfazer() },
    });
  };

  const turmasDoAno = useMemo(
    () => (turmas ?? []).filter((t) => t.anoLetivo === anoLetivo),
    [turmas, anoLetivo],
  );

  // Ao trocar o ano, descarta turmas de outro ano que ficariam invisíveis.
  useEffect(() => {
    const validos = turmasSel.filter((id) => turmasDoAno.some((t) => t.id === id));
    if (validos.length !== turmasSel.length) {
      setTurmasSel(validos);
      setSujo(true);
    }
  }, [turmasDoAno, turmasSel]);

  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Converte o resultado do arraste em reordenação imutável da lista.
  const aoArrastarFim = (e: DragEndEvent) => {
    const { active, over } = e;
    if (active.id !== over?.id && over) {
      const de = blocos.findIndex((b) => b.id === String(active.id));
      const para = blocos.findIndex((b) => b.id === String(over.id));
      if (de !== -1 && para !== -1) mudarBlocos(() => reordenar(blocos, de, para), true);
    }
  };

  // Tipo do bloco acima da posição de inserção, usado no subtítulo da paleta.
  const rotuloAnterior =
    paletaEm !== null && paletaEm > 0
      ? PALETA.find((p) => p.tipo === blocos[paletaEm - 1]?.tipo)?.rotulo
      : undefined;

  // Insere, rola até o novo bloco e o realça por instantes.
  const revelarBloco = (id: string) => {
    setBlocoParaRolar(id);
    setBlocoRealcado(id);
  };

  const inserirNaPaleta = (tipo: Bloco["tipo"]) => {
    const indice = paletaEm ?? blocos.length;
    const bloco = novoBloco(tipo);
    mudarBlocos((bs) => inserirBloco(bs, indice, bloco), true);
    revelarBloco(bloco.id);
    setPaletaEm(null);
  };

  const duplicarBlocoAtual = (id: string) => {
    const r = duplicarBloco(blocos, id);
    if (!r.id) return;
    mudarBlocos(() => r.blocos, true);
    revelarBloco(r.id);
  };

  // Rola até o bloco recém-inserido ou duplicado, escolhendo a lista visível (mobile ou desktop).
  useEffect(() => {
    if (!blocoParaRolar) return;
    const alvo = Array.from(
      document.querySelectorAll<HTMLElement>(`[data-bloco-id="${blocoParaRolar}"]`),
    ).find((el) => el.offsetParent !== null);
    const reduzirMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    alvo?.scrollIntoView({ behavior: reduzirMovimento ? "auto" : "smooth", block: "center" });
    setBlocoParaRolar(null);
  }, [blocoParaRolar]);

  // O realce some sozinho depois da rolagem.
  useEffect(() => {
    if (!blocoRealcado) return;
    const t = setTimeout(() => setBlocoRealcado(null), 1400);
    return () => clearTimeout(t);
  }, [blocoRealcado]);

  const linkLeitura = `#/nota/${notaInicial.id}`;

  const exportar = (formato: "tex" | "md" | "json") => {
    if (!abrirExportacao(`/api/notas/${id}/exportar?formato=${formato}`)) return;
    toast.success(
      formato === "tex"
        ? "Arquivo para impressão gerado"
        : formato === "md"
          ? "Arquivo de texto gerado"
          : "Arquivo de backup gerado",
      {
        description:
          formato === "tex"
            ? "Autocontido: compila direto no Overleaf ou TeX Live, sem arquivos externos."
            : undefined,
      },
    );
  };

  return (
    <div className="space-y-5">
      {/* barra superior */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => void sairPara("/notas")}
          aria-label="Voltar para notas"
          className="rounded-lg"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden />
        </Button>
        <div className="min-w-0 flex-1">
          <input
            value={titulo}
            onChange={(e) => marcar(setTitulo)(e.target.value)}
            placeholder="Título da nota"
            aria-label="Título da nota"
            className="fonte-display hover:border-border/70 focus:border-border focus:bg-card w-full truncate rounded-lg border border-transparent bg-transparent px-1 py-1 text-xl font-bold transition-colors outline-none sm:text-2xl"
          />
        </div>
        <span
          key={
            estadoSalvamento === "salvando"
              ? "salvando"
              : estadoSalvamento === "erro"
                ? "erro"
                : sujo
                  ? "pendente"
                  : "salvo"
          }
          className={`na-entra flex items-center gap-1.5 text-[0.72rem] font-semibold ${
            estadoSalvamento === "erro" ? "text-destructive" : "text-muted-foreground"
          }`}
          role="status"
          aria-live="polite"
        >
          {estadoSalvamento === "salvando" ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> salvando...
            </>
          ) : estadoSalvamento === "erro" ? (
            <>
              <CloudUpload className="h-3.5 w-3.5" aria-hidden />
              {erroValidacao ?? "Erro ao salvar."}
              <button
                type="button"
                onClick={() => void executarSalvamento()}
                className="underline underline-offset-2"
              >
                Tentar novamente
              </button>
            </>
          ) : sujo ? (
            <>
              <CloudUpload className="h-3.5 w-3.5" aria-hidden /> alterações pendentes
            </>
          ) : (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden /> salvo
            </>
          )}
        </span>
      </div>

      {/* ações */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="border-border flex items-center gap-0.5 rounded-lg border p-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-md"
            onClick={desfazer}
            disabled={!podeDesfazer}
            aria-label="Desfazer"
            title="Desfazer (Ctrl+Z)"
          >
            <Undo2 className="h-3.5 w-3.5" aria-hidden />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-md"
            onClick={refazer}
            disabled={!podeRefazer}
            aria-label="Refazer"
            title="Refazer (Ctrl+Shift+Z)"
          >
            <Redo2 className="h-3.5 w-3.5" aria-hidden />
          </Button>
        </div>

        <BotaoAtualizar
          carregando={estadoSalvamento === "salvando"}
          aoAtualizar={executarSalvamento}
          titulo="Salvar e atualizar"
        />

        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 rounded-lg text-xs"
          onClick={() => void sairPara(linkLeitura)}
        >
          <BookOpenText className="h-3.5 w-3.5" aria-hidden /> Ler
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 rounded-lg text-xs">
              <Download className="h-3.5 w-3.5" aria-hidden /> Exportar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => exportar("tex")} className="gap-2 text-xs">
              <FileCode2 className="h-3.5 w-3.5" aria-hidden /> Arquivo para impressão
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => exportar("md")} className="gap-2 text-xs">
              <FileText className="h-3.5 w-3.5" aria-hidden /> Arquivo de texto
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => exportar("json")} className="gap-2 text-xs">
              <FileJson className="h-3.5 w-3.5" aria-hidden /> Backup completo
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 rounded-lg text-xs"
          onClick={() => setCompartilharAberto(true)}
        >
          <Link2 className="h-3.5 w-3.5" aria-hidden /> Compartilhar
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 rounded-lg text-xs"
          disabled={duplicar.isPending}
          onClick={async () => {
            try {
              const r = await duplicar.mutateAsync(id);
              toast.success("Nota duplicada", { description: "A cópia abriu como rascunho." });
              await sairPara(`/editor/${r.nota.id}`);
            } catch {
              toast.error("Não foi possível duplicar");
            }
          }}
        >
          {duplicar.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : (
            <CopyPlus className="h-3.5 w-3.5" aria-hidden />
          )}
          Duplicar
        </Button>

        <label className="border-border bg-card ml-auto flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-1.5">
          <Switch
            checked={status === "publicada"}
            onCheckedChange={(v) => marcar(setStatus)(v ? "publicada" : "rascunho")}
          />
          <span className="text-xs font-semibold">
            {status === "publicada" ? "Publicada" : "Rascunho"}
          </span>
        </label>

        <Button
          variant="outline"
          size="icon"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive rounded-lg"
          aria-label="Excluir nota"
          onClick={() => setConfirmarExclusao(true)}
        >
          <Trash2 className="h-4 w-4" aria-hidden />
        </Button>
      </div>

      <ConfirmacaoDestrutiva
        aberto={confirmarExclusao}
        onOpenChange={setConfirmarExclusao}
        titulo="Mover esta nota para a lixeira?"
        descricao={
          <>
            "{titulo || "Sem título"}" vai para a lixeira e os links dela são desativados. É
            possível restaurar por 30 dias.
          </>
        }
        textoConfirmar="Mover para a lixeira"
        onConfirmar={async () => {
          await excluir.mutateAsync(id);
          toast.success("Nota movida para a lixeira", {
            action: {
              label: "Desfazer",
              onClick: () => {
                void restaurar
                  .mutateAsync(id)
                  .then(() => toast.success("Nota restaurada"))
                  .catch(() => toast.error("Não foi possível restaurar"));
              },
            },
          });
          sujoRef.current = false;
          ignorarProximaGuarda();
          navegar("/notas");
        }}
      />

      {/* metadados */}
      <Collapsible
        open={metadadosAbertos}
        onOpenChange={setMetadadosAbertos}
        className="border-border bg-card rounded-2xl border"
      >
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full min-w-0 items-center gap-2 px-4 py-3 text-left text-sm font-bold"
            aria-label="Metadados da nota"
          >
            <ChevronDown
              className={`text-muted-foreground h-4 w-4 shrink-0 transition-transform duration-200 ${
                metadadosAbertos ? "rotate-180" : ""
              }`}
              aria-hidden
            />
            <span className="shrink-0">Metadados da nota</span>
            <Badge
              variant="secondary"
              className="ml-1 max-w-[60%] min-w-0 truncate rounded-md text-[0.65rem] font-normal"
            >
              {MESES_CAP[mes - 1]}/{anoLetivo}
              {turmasSel.length > 0
                ? ` · ${turmasSel
                    .map((tid) => turmas?.find((t) => t.id === tid)?.nome)
                    .filter(Boolean)
                    .join(", ")}`
                : ""}
            </Badge>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden">
          <div className="border-border grid gap-4 border-t px-4 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label className="text-xs">Disciplina</Label>
                <Select value={disciplinaId} onValueChange={marcar(setDisciplinaId)}>
                  <SelectTrigger className="w-full rounded-lg" aria-label="Disciplina">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(disciplinas ?? []).map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="ano-editor" className="text-xs">
                    Ano letivo
                  </Label>
                  <Input
                    id="ano-editor"
                    type="number"
                    min={2000}
                    max={2100}
                    value={anoLetivo}
                    onChange={(e) => marcar(setAnoLetivo)(Number(e.target.value) || anoLetivo)}
                    className="rounded-lg"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs">Mês</Label>
                  <Select value={String(mes)} onValueChange={(v) => marcar(setMes)(Number(v))}>
                    <SelectTrigger className="w-full rounded-lg" aria-label="Mês">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MESES_CAP.map((m, i) => (
                        <SelectItem key={m} value={String(i + 1)}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label className="text-xs">
                Turmas de {anoLetivo} {turmasDoAno.length === 0 ? "(nenhuma cadastrada)" : ""}
              </Label>
              <div className="flex flex-wrap gap-2">
                {turmasDoAno.map((t) => {
                  const sel = turmasSel.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() =>
                        marcar(setTurmasSel)(
                          sel ? turmasSel.filter((x) => x !== t.id) : [...turmasSel, t.id],
                        )
                      }
                      aria-pressed={sel}
                      className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors ${
                        sel
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card hover:bg-accent"
                      }`}
                    >
                      {t.nome}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="sobre-editor" className="text-xs">
                Sobre esta nota (resumo de abertura)
              </Label>
              <Textarea
                id="sobre-editor"
                value={sobre}
                onChange={(e) => marcar(setSobre)(e.target.value)}
                placeholder="Conteúdo, subtópicos e contexto da aula..."
                className="min-h-[64px] rounded-lg text-sm"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="habilidades-editor" className="text-xs">
                Habilidades BNCC/ENEM (separadas por vírgula)
              </Label>
              <Input
                id="habilidades-editor"
                value={habilidades}
                onChange={(e) => marcar(setHabilidades)(e.target.value)}
                placeholder="EM13CNT107, EM13CNT203..."
                className="rounded-lg font-mono text-sm"
              />
            </div>

            {/* aparência da leitura: fonte, tamanho e entrelinha da nota */}
            <div className="border-border grid gap-4 border-t pt-4">
              <div className="space-y-1">
                <p className="text-xs font-bold">Aparência da leitura</p>
                <p className="text-muted-foreground text-[0.72rem] leading-snug">
                  Vale para o professor, para os alunos que abrirem o link e para a impressão. A
                  prévia ao lado já acompanha a escolha.
                </p>
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs">Fonte</Label>
                <div className="flex flex-wrap gap-1.5">
                  {FONTES_NOTA.map((f) => (
                    <button
                      key={f.chave}
                      type="button"
                      onClick={() => marcar(setAparencia)({ ...aparencia, fonte: f.chave })}
                      aria-pressed={(aparencia.fonte ?? APARENCIA_PADRAO.fonte) === f.chave}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[0.78rem] font-semibold transition-colors ${
                        (aparencia.fonte ?? APARENCIA_PADRAO.fonte) === f.chave
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card hover:bg-accent"
                      }`}
                    >
                      <span
                        className="text-base leading-none"
                        style={{ fontFamily: f.familia }}
                        aria-hidden
                      >
                        Aa
                      </span>
                      {f.nome}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs">Tamanho do texto</Label>
                <div className="flex flex-wrap gap-1.5">
                  {ESCALAS_NOTA.map((e) => (
                    <button
                      key={e.chave}
                      type="button"
                      onClick={() => marcar(setAparencia)({ ...aparencia, escala: e.chave })}
                      aria-pressed={(aparencia.escala ?? APARENCIA_PADRAO.escala) === e.chave}
                      className={`rounded-lg border px-3 py-1.5 text-[0.78rem] font-semibold transition-colors ${
                        (aparencia.escala ?? APARENCIA_PADRAO.escala) === e.chave
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card hover:bg-accent"
                      }`}
                    >
                      {e.nome}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs">Entrelinha</Label>
                <div className="flex flex-wrap gap-1.5">
                  {ENTRELINHAS_NOTA.map((e) => (
                    <button
                      key={e.chave}
                      type="button"
                      onClick={() => marcar(setAparencia)({ ...aparencia, entrelinha: e.chave })}
                      aria-pressed={
                        (aparencia.entrelinha ?? APARENCIA_PADRAO.entrelinha) === e.chave
                      }
                      className={`rounded-lg border px-3 py-1.5 text-[0.78rem] font-semibold transition-colors ${
                        (aparencia.entrelinha ?? APARENCIA_PADRAO.entrelinha) === e.chave
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card hover:bg-accent"
                      }`}
                    >
                      {e.nome}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* editar / pré-visualizar: só a versão do breakpoint atual é montada */}
      {ehLargo ? (
        <div className="grid grid-cols-[1fr_0.9fr] gap-6">
          <div>
            <ListaBlocos
              blocos={blocos}
              mudarBlocos={mudarBlocos}
              onInserirEm={setPaletaEm}
              onDuplicar={duplicarBlocoAtual}
              onRemoverBloco={removerBlocoComDesfazer}
              onFocarBloco={setBlocoEmFoco}
              blocoRealcado={blocoRealcado}
              sensores={sensores}
              aoArrastarFim={aoArrastarFim}
            />
          </div>
          <div className="border-border bg-card sticky top-6 max-h-[calc(100dvh-3rem)] overflow-y-auto rounded-2xl border p-5 shadow-sm">
            <p className="text-muted-foreground mb-4 flex items-center gap-1.5 text-[0.7rem] font-bold tracking-wider uppercase">
              <Eye className="h-3.5 w-3.5" aria-hidden /> Prévia ao vivo
            </p>
            <Previa
              blocos={blocosPrevistos}
              titulo={titulo}
              aparencia={aparencia}
              mostrarGabarito={gabaritoPrevia}
              onAlternarGabarito={() => setGabaritoPrevia((v) => !v)}
              blocoEmFoco={blocoEmFoco}
            />
          </div>
        </div>
      ) : (
        <Tabs defaultValue="editar">
          <TabsList className="w-full rounded-xl">
            <TabsTrigger value="editar" className="flex-1 rounded-lg">
              Editar
            </TabsTrigger>
            <TabsTrigger value="previa" className="flex-1 rounded-lg">
              <Eye className="mr-1.5 h-3.5 w-3.5" aria-hidden /> Prévia
            </TabsTrigger>
          </TabsList>
          <TabsContent value="editar" className="mt-4">
            <ListaBlocos
              blocos={blocos}
              mudarBlocos={mudarBlocos}
              onInserirEm={setPaletaEm}
              onDuplicar={duplicarBlocoAtual}
              onRemoverBloco={removerBlocoComDesfazer}
              onFocarBloco={setBlocoEmFoco}
              blocoRealcado={blocoRealcado}
              sensores={sensores}
              aoArrastarFim={aoArrastarFim}
            />
          </TabsContent>
          <TabsContent value="previa" className="mt-4">
            <Previa
              blocos={blocosPrevistos}
              titulo={titulo}
              aparencia={aparencia}
              mostrarGabarito={gabaritoPrevia}
              onAlternarGabarito={() => setGabaritoPrevia((v) => !v)}
              blocoEmFoco={blocoEmFoco}
            />
          </TabsContent>
        </Tabs>
      )}

      <PaletaBlocos
        aberta={paletaEm !== null}
        posicao={paletaEm ?? blocos.length}
        total={blocos.length}
        rotuloAnterior={rotuloAnterior}
        ehMobile={ehMobile}
        onEscolher={inserirNaPaleta}
        onFechar={() => setPaletaEm(null)}
      />

      {compartilharAberto ? (
        <DialogoCompartilhar
          aberto
          aoFechar={() => setCompartilharAberto(false)}
          notaId={id}
          status={status}
        />
      ) : null}
    </div>
  );
}

function ListaBlocos({
  blocos,
  mudarBlocos,
  onInserirEm,
  onDuplicar,
  onRemoverBloco,
  onFocarBloco,
  blocoRealcado,
  sensores,
  aoArrastarFim,
}: {
  blocos: Bloco[];
  mudarBlocos: (fn: (b: Bloco[]) => Bloco[], comHistorico?: boolean) => void;
  onInserirEm: (i: number) => void;
  onDuplicar: (id: string) => void;
  onRemoverBloco: (id: string) => void;
  onFocarBloco: (id: string) => void;
  blocoRealcado: string | null;
  sensores: ReturnType<typeof useSensors>;
  aoArrastarFim: (e: DragEndEvent) => void;
}) {
  // Numeração das seções é acumulada na ordem de exibição, ignorando outros tipos.
  let numeroSecao = 0;

  return (
    <DndContext sensors={sensores} collisionDetection={closestCenter} onDragEnd={aoArrastarFim}>
      <SortableContext items={blocos.map((b) => b.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2.5">
          {blocos.map((b, i) => {
            if (b.tipo === "secao") numeroSecao++;
            return (
              <div key={b.id}>
                <CartaoBloco
                  bloco={b}
                  indice={i}
                  numeroSecao={numeroSecao}
                  total={blocos.length}
                  mudarBlocos={mudarBlocos}
                  onInserirAqui={() => onInserirEm(i + 1)}
                  onDuplicar={() => onDuplicar(b.id)}
                  onRemover={() => onRemoverBloco(b.id)}
                  onFocar={() => onFocarBloco(b.id)}
                  realcado={blocoRealcado === b.id}
                />
              </div>
            );
          })}
        </div>
      </SortableContext>

      <div className="mt-3">
        <button
          type="button"
          onClick={() => onInserirEm(blocos.length)}
          className="border-border text-muted-foreground hover:bg-accent hover:text-foreground flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed py-3.5 text-sm font-semibold transition-colors hover:border-solid"
        >
          <Plus className="h-4 w-4" aria-hidden />
          {blocos.length === 0 ? "Adicionar o primeiro bloco" : "Adicionar bloco ao final"}
        </button>
      </div>
    </DndContext>
  );
}

function CartaoBloco({
  bloco,
  indice,
  numeroSecao,
  total,
  mudarBlocos,
  onInserirAqui,
  onDuplicar,
  onRemover,
  onFocar,
  realcado,
}: {
  bloco: Bloco;
  indice: number;
  numeroSecao: number;
  total: number;
  mudarBlocos: (fn: (b: Bloco[]) => Bloco[], comHistorico?: boolean) => void;
  onInserirAqui: () => void;
  onDuplicar: () => void;
  onRemover: () => void;
  onFocar: () => void;
  realcado: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: bloco.id,
  });

  const estilo: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  const classesCaixa =
    bloco.tipo === "copiar"
      ? "border-2 border-dashed border-stone-400 dark:border-stone-600"
      : bloco.tipo === "exemplo"
        ? "border border-emerald-300/70 border-l-4 border-l-emerald-500 dark:border-emerald-800/60"
        : bloco.tipo === "dica"
          ? "border border-amber-300/70 border-l-4 border-l-amber-500 dark:border-amber-800/60"
          : bloco.tipo === "tikz"
            ? "border border-violet-300/70 border-l-4 border-l-violet-500 bg-violet-50/20 dark:border-violet-800/60 dark:bg-violet-950/10"
            : bloco.tipo === "exercicios"
              ? "border border-border bg-stone-50/70 dark:bg-stone-900/40"
              : "border border-border";

  const patch: Patch = (p, opcoes) =>
    mudarBlocos((bs) => atualizarBloco(bs, bloco.id, p), opcoes?.historico);

  return (
    <article
      ref={setNodeRef}
      data-bloco-id={bloco.id}
      style={estilo}
      onFocusCapture={onFocar}
      aria-label={`Bloco ${indice + 1} de ${total}: ${PALETA.find((p) => p.tipo === bloco.tipo)?.rotulo ?? bloco.tipo}`}
      className={`group bg-card relative scroll-mt-24 rounded-2xl border px-3 py-3 transition-shadow hover:shadow-sm sm:px-4 ${classesCaixa} ${
        realcado ? "na-realce" : ""
      }`}
    >
      {/* controles laterais (telas largas) */}
      <div className="absolute top-2 -left-11 z-10 hidden flex-col items-center gap-0.5 opacity-0 transition-opacity group-hover:z-20 group-hover:opacity-100 has-[:focus-visible]:z-20 has-[:focus-visible]:opacity-100 lg:flex">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="text-muted-foreground/60 hover:bg-accent hover:text-foreground cursor-grab touch-none rounded-md p-2 active:cursor-grabbing pointer-coarse:p-2.5"
          aria-label="Arrastar para reordenar"
        >
          <GripVertical className="h-4 w-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={onInserirAqui}
          className="text-muted-foreground/60 hover:bg-accent hover:text-foreground rounded-md p-2 pointer-coarse:p-2.5"
          aria-label="Inserir bloco abaixo"
        >
          <Plus className="h-4 w-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={onDuplicar}
          className="text-muted-foreground/60 hover:bg-accent hover:text-foreground rounded-md p-2 pointer-coarse:p-2.5"
          aria-label="Duplicar bloco"
        >
          <Copy className="h-3.5 w-3.5" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => mudarBlocos((bs) => moverBloco(bs, bloco.id, -1), true)}
          disabled={indice === 0}
          className="text-muted-foreground/60 hover:bg-accent hover:text-foreground rounded-md p-1 disabled:opacity-25"
          aria-label="Mover para cima"
        >
          <ChevronUp className="h-3.5 w-3.5" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => mudarBlocos((bs) => moverBloco(bs, bloco.id, 1), true)}
          disabled={indice === total - 1}
          className="text-muted-foreground/60 hover:bg-accent hover:text-foreground rounded-md p-1 disabled:opacity-25"
          aria-label="Mover para baixo"
        >
          <ChevronDown className="h-3.5 w-3.5" aria-hidden />
        </button>
        <button
          type="button"
          onClick={onRemover}
          className="text-muted-foreground/60 hover:bg-destructive/10 hover:text-destructive rounded-md p-1"
          aria-label="Remover bloco"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>

      {/* Etiqueta do tipo e controles completos */}
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-1.5 sm:mb-0">
        <span className="rounded-md bg-stone-100 px-1.5 py-0.5 text-[0.6rem] font-bold tracking-widest text-stone-500 uppercase dark:bg-stone-800 dark:text-stone-400">
          {PALETA.find((p) => p.tipo === bloco.tipo)?.rotulo ?? bloco.tipo}
        </span>
        <div className="flex items-center gap-0.5 lg:hidden">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="text-muted-foreground/70 hover:bg-accent hover:text-foreground cursor-grab touch-none rounded-md p-2 active:cursor-grabbing pointer-coarse:p-2.5"
            aria-label="Arrastar para reordenar"
          >
            <GripVertical className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={onInserirAqui}
            className="text-muted-foreground/70 hover:bg-accent hover:text-foreground rounded-md p-2 pointer-coarse:p-2.5"
            aria-label="Inserir bloco abaixo"
          >
            <Plus className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={onDuplicar}
            className="text-muted-foreground/70 hover:bg-accent hover:text-foreground rounded-md p-2 pointer-coarse:p-2.5"
            aria-label="Duplicar bloco"
          >
            <Copy className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => mudarBlocos((bs) => moverBloco(bs, bloco.id, -1), true)}
            disabled={indice === 0}
            className="text-muted-foreground rounded-md p-2 disabled:opacity-25 pointer-coarse:p-2.5"
            aria-label="Mover para cima"
          >
            <ChevronUp className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => mudarBlocos((bs) => moverBloco(bs, bloco.id, 1), true)}
            disabled={indice === total - 1}
            className="text-muted-foreground rounded-md p-2 disabled:opacity-25 pointer-coarse:p-2.5"
            aria-label="Mover para baixo"
          >
            <ChevronDown className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={onRemover}
            className="text-muted-foreground/70 hover:bg-destructive/10 hover:text-destructive rounded-md p-2 pointer-coarse:p-2.5"
            aria-label="Remover bloco"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>

      {/* conteúdo por tipo */}
      {bloco.tipo === "secao" ? (
        <EditorSecao bloco={bloco} numero={numeroSecao} onPatch={patch} />
      ) : bloco.tipo === "paragrafo" ? (
        <EditorParagrafo bloco={bloco} onPatch={patch} />
      ) : bloco.tipo === "formula" ? (
        <EditorFormula bloco={bloco} onPatch={patch} />
      ) : bloco.tipo === "lista" ? (
        <EditorLista bloco={bloco} onPatch={patch} />
      ) : bloco.tipo === "tabela" ? (
        <EditorTabela bloco={bloco} onPatch={patch} />
      ) : bloco.tipo === "chamada" ? (
        <EditorChamada bloco={bloco} onPatch={patch} />
      ) : bloco.tipo === "figura" ? (
        <EditorFigura bloco={bloco} onPatch={patch} />
      ) : bloco.tipo === "tikz" ? (
        <EditorTikz bloco={bloco} onPatch={patch} />
      ) : bloco.tipo === "exercicios" ? (
        <EditorExercicios bloco={bloco} onPatch={patch} />
      ) : (
        <EditorCaixa
          bloco={bloco}
          onPatch={patch}
          acoes={{
            onPatchFilho: (filhoId, p) =>
              mudarBlocos((bs) => atualizarFilho(bs, bloco.id, filhoId, p)),
            onRemoverFilho: (filhoId) =>
              mudarBlocos((bs) => removerFilho(bs, bloco.id, filhoId), true),
            onMoverFilho: (filhoId, delta) =>
              mudarBlocos((bs) => moverFilho(bs, bloco.id, filhoId, delta), true),
            onInserirFilho: (tipo) =>
              mudarBlocos((bs) => {
                const caixa = bs.find((b) => b.id === bloco.id);
                const fim =
                  caixa &&
                  (caixa.tipo === "copiar" || caixa.tipo === "exemplo" || caixa.tipo === "dica")
                    ? caixa.filhos.length
                    : 0;
                return inserirFilho(bs, bloco.id, fim, novoFilho(tipo));
              }, true),
          }}
        />
      )}
    </article>
  );
}

function Previa({
  blocos,
  titulo,
  aparencia,
  mostrarGabarito,
  onAlternarGabarito,
  blocoEmFoco,
}: {
  blocos: Bloco[];
  titulo: string;
  aparencia: AparenciaNota;
  mostrarGabarito: boolean;
  onAlternarGabarito: () => void;
  blocoEmFoco?: string | null;
}) {
  // Mantém a prévia posicionada no bloco que está sendo editado.
  useEffect(() => {
    if (!blocoEmFoco) return;
    const alvo = document.querySelector<HTMLElement>(`.na-nota [data-bloco-id="${blocoEmFoco}"]`);
    if (!alvo) return;
    const reduzirMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    alvo.scrollIntoView({
      behavior: reduzirMovimento ? "auto" : "smooth",
      block: "nearest",
    });
  }, [blocoEmFoco]);

  return (
    <div className="na-nota" style={variaveisAparencia(aparencia) as React.CSSProperties}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="fonte-display min-w-0 flex-1 truncate text-xl font-extrabold">
          {titulo || "Sem título"}
        </h3>
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1.5 rounded-lg text-[0.7rem]"
          onClick={onAlternarGabarito}
        >
          {mostrarGabarito ? "Ocultar gabarito" : "Mostrar gabarito"}
        </Button>
      </div>
      {blocos.length === 0 ? (
        <p className="border-border text-muted-foreground rounded-xl border border-dashed p-6 text-center text-sm">
          A prévia aparece aqui conforme os blocos forem adicionados.
        </p>
      ) : (
        <div className="space-y-5">
          <BlocosView blocos={blocos} mostrarGabarito={mostrarGabarito} />
        </div>
      )}
      <p className="border-border text-muted-foreground mt-8 flex items-center gap-1.5 border-t pt-4 text-[0.7rem]">
        <Printer className="h-3 w-3" aria-hidden />A versão de impressão (A4, 2 colunas) abre pelo
        botão de imprimir na leitura.
      </p>
    </div>
  );
}
