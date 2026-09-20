"use client";

// Vista Links: cria e gerencia links de nota, turma ou disciplina, com cópia,
// pausa, expiração, regeneração e exclusão.

import { useMemo, useState } from "react";
import {
  BookOpenText,
  Check,
  Copy,
  ExternalLink,
  GraduationCap,
  Hourglass,
  Link2,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Trash2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { ConfirmacaoDestrutiva } from "@/components/confirmacao-destrutiva";
import {
  loteLinks,
  urlDoLink,
  useCriarLink,
  useDisciplinas,
  useEditarLink,
  useExcluirLink,
  useLinks,
  useNotas,
  useRestaurarLink,
  useTurmas,
  type LinkInfo,
  type TipoLink,
} from "@/lib/notas/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { copiarTexto } from "@/lib/clipboard";
import { cn } from "@/lib/utils";
import { Paginacao } from "@/components/paginacao";
import { BotaoAtualizar } from "@/components/botao-atualizar";
import { BarraLote } from "@/components/barra-lote";
import { usePaginacao } from "@/hooks/use-paginacao";
import { useSelecao } from "@/hooks/use-selecao";

const ROTULO_TIPO: Record<TipoLink, string> = {
  nota: "Uma nota",
  turma: "Turma inteira",
  disciplina: "Disciplina inteira",
};

export function VistaLinks() {
  const linksQ = useLinks();
  const notasQ = useNotas({ status: "publicada" });
  const disciplinasQ = useDisciplinas();
  const turmasQ = useTurmas();
  const { data: links, isLoading } = linksQ;
  const paginacao = usePaginacao(links ?? [], 10);

  const qc = useQueryClient();
  const selecao = useSelecao("links");
  const [processandoLote, setProcessandoLote] = useState(false);
  const [confirmarLote, setConfirmarLote] = useState(false);
  const lista = links ?? [];
  const todosSelecionados = lista.length > 0 && lista.every((l) => selecao.selecionados.has(l.id));
  const algunsSelecionados = lista.some((l) => selecao.selecionados.has(l.id));

  const executarLote = async (acao: "pausar" | "reativar" | "excluir", ids: string[]) => {
    setProcessandoLote(true);
    try {
      const r = await loteLinks({ acao, ids });
      await qc.invalidateQueries({ queryKey: ["links"] });
      const participio =
        acao === "pausar" ? "pausado" : acao === "reativar" ? "reativado" : "excluído";
      toast.success(
        `${r.atualizados} ${r.atualizados === 1 ? `link ${participio}` : `links ${participio}s`}`,
      );
      if (r.ausentes.length > 0) {
        toast.warning(
          `${r.ausentes.length} ${r.ausentes.length === 1 ? "link não encontrado" : "links não encontrados"}.`,
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
      setConfirmarLote(false);
    }
  };

  return (
    <div className={cn("space-y-6 pb-8", selecao.ativo && "pb-28")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="fonte-display text-2xl font-bold">Links para os alunos</h1>
          <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
            Cada link é único e gerenciável: compartilhe uma nota, a turma ou a disciplina inteira.
            Pause, agende a validade ou revogue quando necessário. Rascunhos nunca ficam visíveis.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BotaoAtualizar
            carregando={
              linksQ.isFetching ||
              notasQ.isFetching ||
              disciplinasQ.isFetching ||
              turmasQ.isFetching
            }
            aoAtualizar={() =>
              Promise.all([
                linksQ.refetch(),
                notasQ.refetch(),
                disciplinasQ.refetch(),
                turmasQ.refetch(),
              ])
            }
          />
          {lista.length > 0 ? (
            <Button
              variant="outline"
              className="gap-2 rounded-xl"
              aria-pressed={selecao.ativo}
              onClick={selecao.alternarModo}
            >
              {selecao.ativo ? "Sair da seleção" : "Selecionar"}
            </Button>
          ) : null}
        </div>
      </div>

      <SecaoNovoLink
        notas={(notasQ.data ?? []).map((n) => ({ id: n.id, titulo: n.titulo }))}
        disciplinas={(disciplinasQ.data ?? []).map((d) => ({ id: d.id, nome: d.nome }))}
        turmas={(turmasQ.data ?? []).map((t) => ({ id: t.id, nome: t.nome, ano: t.anoLetivo }))}
      />

      {isLoading ? (
        <div className="space-y-3" aria-busy="true">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 w-5/6 rounded-2xl" />
        </div>
      ) : (links ?? []).length === 0 ? (
        <div className="na-cascata border-border rounded-2xl border border-dashed p-10 text-center">
          <Link2 className="text-muted-foreground/60 mx-auto h-8 w-8" aria-hidden />
          <p className="fonte-display mt-3 font-bold">Nenhum link ainda</p>
          <p className="text-muted-foreground mx-auto mt-1 max-w-md text-sm">
            Crie o primeiro acima. Publique a nota antes, pois rascunhos não aparecem para os
            alunos.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {selecao.ativo ? (
            <div className="flex items-center gap-2">
              <Checkbox
                checked={todosSelecionados ? true : algunsSelecionados ? "indeterminate" : false}
                onCheckedChange={() =>
                  todosSelecionados ? selecao.definir([]) : selecao.definir(lista.map((l) => l.id))
                }
                aria-label="Selecionar todos os links"
              />
              <span className="text-sm font-medium">Selecionar todos ({lista.length})</span>
            </div>
          ) : null}
          <div className="space-y-3">
            {paginacao.itens.map((l, i) => (
              <CartaoLink
                key={l.id}
                link={l}
                indice={i}
                selecao={
                  selecao.ativo
                    ? {
                        ativo: true,
                        selecionado: selecao.selecionados.has(l.id),
                        onAlternar: () => selecao.alternar(l.id),
                      }
                    : undefined
                }
              />
            ))}
          </div>
          <Paginacao paginacao={paginacao} rotulo="links" />
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
              onClick={() => void executarLote("pausar", [...selecao.selecionados])}
            >
              Pausar
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 rounded-lg text-[0.72rem] pointer-coarse:h-10"
              disabled={selecao.quantidade === 0 || processandoLote}
              onClick={() => void executarLote("reativar", [...selecao.selecionados])}
            >
              Reativar
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 gap-1.5 rounded-lg text-[0.72rem] pointer-coarse:h-10"
              disabled={selecao.quantidade === 0 || processandoLote}
              onClick={() => setConfirmarLote(true)}
            >
              Excluir
            </Button>
          </>
        }
      />

      <ConfirmacaoDestrutiva
        aberto={confirmarLote}
        onOpenChange={setConfirmarLote}
        titulo={`Excluir ${selecao.quantidade} ${selecao.quantidade === 1 ? "link" : "links"}?`}
        descricao="Os alunos perdem o acesso imediatamente. Os links vão para a lixeira e podem ser restaurados por 30 dias. As notas não são afetadas."
        textoConfirmar="Excluir links"
        onConfirmar={() => executarLote("excluir", [...selecao.selecionados])}
      />
    </div>
  );
}

function SecaoNovoLink({
  notas,
  disciplinas,
  turmas,
}: {
  notas: { id: string; titulo: string }[];
  disciplinas: { id: string; nome: string }[];
  turmas: { id: string; nome: string; ano: number }[];
}) {
  const criar = useCriarLink();
  const [tipo, setTipo] = useState<TipoLink>("nota");
  const [alvo, setAlvo] = useState("");
  const [nome, setNome] = useState("");

  const opcoes =
    tipo === "nota"
      ? notas.map((n) => ({ id: n.id, rotulo: n.titulo }))
      : tipo === "turma"
        ? turmas.map((t) => ({ id: t.id, rotulo: `${t.nome} · ${t.ano}` }))
        : disciplinas.map((d) => ({ id: d.id, rotulo: d.nome }));

  const vazio =
    tipo === "nota"
      ? "Publique uma nota primeiro."
      : tipo === "turma"
        ? "Cadastre turmas primeiro."
        : "Cadastre disciplinas primeiro.";

  return (
    <section className="na-cascata border-border bg-card rounded-2xl border p-5">
      <h2 className="fonte-display flex items-center gap-2 text-lg font-bold">
        <Plus className="h-4.5 w-4.5" aria-hidden /> Novo link
      </h2>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="grid gap-1.5">
          <Label>O que compartilhar</Label>
          <Select
            value={tipo}
            onValueChange={(v) => {
              setTipo(v as TipoLink);
              setAlvo("");
            }}
          >
            <SelectTrigger className="w-full rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(ROTULO_TIPO) as TipoLink[]).map((t) => (
                <SelectItem key={t} value={t}>
                  {ROTULO_TIPO[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1.5">
          <Label>Destino</Label>
          {opcoes.length > 0 ? (
            <Select value={alvo} onValueChange={setAlvo}>
              <SelectTrigger className="w-full rounded-lg">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {opcoes.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.rotulo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="border-border text-muted-foreground rounded-lg border border-dashed px-3 py-2 text-[0.8rem]">
              {vazio}
            </p>
          )}
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="nome-link">Nome (opcional)</Label>
          <Input
            id="nome-link"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex.: Recuperação 3A"
            className="rounded-lg"
          />
        </div>
      </div>

      <Button
        className="mt-4 gap-2 rounded-xl"
        disabled={!alvo || criar.isPending}
        onClick={async () => {
          try {
            const dados = {
              tipo,
              nome: nome.trim(),
              ...(tipo === "nota" ? { notaId: alvo } : {}),
              ...(tipo === "turma" ? { turmaId: alvo } : {}),
              ...(tipo === "disciplina" ? { disciplinaId: alvo } : {}),
            };
            const r = await criar.mutateAsync(dados);
            setAlvo("");
            setNome("");
            const copiou = await copiarTexto(urlDoLink(r.link.token));
            toast.success("Link criado", {
              description: copiou
                ? "O endereço já foi copiado. Envie para os alunos."
                : "Copie o endereço no cartão abaixo e envie para os alunos.",
            });
          } catch (e) {
            toast.error("Não foi possível criar o link", {
              description: e instanceof Error ? e.message : "Tente novamente em instantes.",
            });
          }
        }}
      >
        {criar.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
        Criar e copiar link
      </Button>
    </section>
  );
}

function CartaoLink({
  link,
  indice = 0,
  selecao,
}: {
  link: LinkInfo;
  indice?: number;
  selecao?: { ativo: boolean; selecionado: boolean; onAlternar: () => void };
}) {
  const editar = useEditarLink();
  const excluir = useExcluirLink();
  const restaurar = useRestaurarLink();
  const [copiado, setCopiado] = useState(false);
  const [editando, setEditando] = useState(false);
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);
  const [nome, setNome] = useState(link.nome);
  const [expira, setExpira] = useState(
    link.expiraEm ? new Date(link.expiraEm).toISOString().slice(0, 10) : "",
  );

  const url = useMemo(() => urlDoLink(link.token), [link.token]);
  // Um link só está disponível se estiver ativo e dentro do prazo.
  const expirado = link.expiraEm ? new Date(link.expiraEm).getTime() < Date.now() : false;
  const disponivel = link.ativo && !expirado;
  const aviso =
    link.tipo === "nota" && link.alvoDetalhe === "rascunho"
      ? "A nota ainda é rascunho. Publique para liberar o acesso."
      : "";

  const copiar = async () => {
    if (await copiarTexto(url)) {
      setCopiado(true);
      toast.success("Link copiado", { description: "Envie para a turma." });
      setTimeout(() => setCopiado(false), 2000);
    } else {
      toast.error("Não foi possível copiar. Selecione o endereço acima e copie manualmente.");
    }
  };

  const salvarEdicao = async () => {
    try {
      await editar.mutateAsync({
        id: link.id,
        dados: {
          nome: nome.trim(),
          expiraEm: expira ? new Date(`${expira}T23:59:59`).toISOString() : null,
        },
      });
      setEditando(false);
      toast.success("Link atualizado");
    } catch (e) {
      toast.error("Não foi possível salvar", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  };

  return (
    <article
      onClick={selecao?.ativo ? selecao.onAlternar : undefined}
      className={`na-cascata bg-card rounded-2xl border p-4 sm:p-5 ${disponivel ? "border-border" : "border-dashed opacity-80"} ${
        selecao?.selecionado ? "ring-primary ring-2" : ""
      } ${selecao?.ativo ? "cursor-pointer" : ""}`}
      style={{ "--na-i": indice } as React.CSSProperties}
    >
      <div className="flex flex-wrap items-start gap-3">
        {selecao?.ativo ? (
          <Checkbox
            checked={selecao.selecionado}
            onCheckedChange={() => selecao.onAlternar()}
            aria-label={`Selecionar ${link.nome || ROTULO_TIPO[link.tipo]}`}
            className="mt-1"
          />
        ) : null}
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            disponivel
              ? "bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {link.tipo === "nota" ? (
            <BookOpenText className="h-5 w-5" aria-hidden />
          ) : link.tipo === "turma" ? (
            <Users className="h-5 w-5" aria-hidden />
          ) : (
            <GraduationCap className="h-5 w-5" aria-hidden />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="leading-snug font-semibold">{link.nome || ROTULO_TIPO[link.tipo]}</p>
            {disponivel ? (
              <Badge
                variant="secondary"
                className="bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300 gap-1 rounded-md text-[0.65rem]"
              >
                <Check className="h-3 w-3" aria-hidden /> ativo
              </Badge>
            ) : (
              <Badge variant="outline" className="rounded-md text-[0.65rem]">
                {expirado ? "expirado" : "pausado"}
              </Badge>
            )}
            <span className="text-muted-foreground inline-flex items-center gap-1 text-[0.72rem]">
              <ExternalLink className="h-3 w-3" aria-hidden />
              {link.acessos} {link.acessos === 1 ? "acesso" : "acessos"}
            </span>
          </div>
          <p className="text-muted-foreground mt-0.5 text-[0.82rem]">
            {link.alvo}
            {link.alvoDetalhe && link.tipo !== "nota" ? ` · ${link.alvoDetalhe}` : ""}
            {link.expiraEm
              ? ` · expira em ${new Date(link.expiraEm).toLocaleDateString("pt-BR")}`
              : ""}
          </p>

          {aviso ? (
            <p className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[0.7rem] font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-200">
              <Hourglass className="h-3 w-3" aria-hidden /> {aviso}
            </p>
          ) : null}

          {editando ? (
            <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_10rem_auto_auto]">
              <Input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome do link"
                className="h-9 rounded-lg"
                aria-label="Nome do link"
              />
              <Input
                type="date"
                value={expira}
                onChange={(e) => setExpira(e.target.value)}
                className="h-9 rounded-lg"
                aria-label="Data de expiração"
              />
              <Button
                size="sm"
                className="h-9 rounded-lg"
                onClick={() => void salvarEdicao()}
                disabled={editar.isPending}
              >
                {editar.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                ) : null}
                Salvar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 rounded-lg"
                onClick={() => {
                  setEditando(false);
                  setNome(link.nome);
                  setExpira(
                    link.expiraEm ? new Date(link.expiraEm).toISOString().slice(0, 10) : "",
                  );
                }}
              >
                Cancelar
              </Button>
            </div>
          ) : (
            <code className="bg-muted text-muted-foreground mt-2 block truncate rounded-lg px-2.5 py-1.5 font-mono text-[0.72rem]">
              {url}
            </code>
          )}
        </div>

        {/* ações: copiar e abrir sempre visíveis; o resto no menu */}
        {selecao?.ativo ? null : (
          <div className="flex shrink-0 items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 rounded-lg text-xs pointer-coarse:h-11"
              onClick={copiar}
            >
              {copiado ? (
                <Check className="text-brand-600 h-3.5 w-3.5" aria-hidden />
              ) : (
                <Copy className="h-3.5 w-3.5" aria-hidden />
              )}
              Copiar
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-lg pointer-coarse:h-11 pointer-coarse:w-11"
              aria-label="Abrir como aluno"
              title="Abrir como aluno"
              onClick={() => window.open(url, "_blank")}
            >
              <ExternalLink className="h-4 w-4" aria-hidden />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-lg pointer-coarse:h-11 pointer-coarse:w-11"
                  aria-label="Mais ações do link"
                  title="Mais ações"
                >
                  <MoreHorizontal className="h-4 w-4" aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="gap-2"
                  onClick={() => {
                    setNome(link.nome);
                    setExpira(
                      link.expiraEm ? new Date(link.expiraEm).toISOString().slice(0, 10) : "",
                    );
                    setEditando(true);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden /> Editar nome e expiração
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="gap-2"
                  disabled={editar.isPending}
                  onClick={async () => {
                    try {
                      await editar.mutateAsync({ id: link.id, dados: { ativo: !link.ativo } });
                      toast.success(link.ativo ? "Link pausado" : "Link reativado");
                    } catch (e) {
                      toast.error("Não foi possível atualizar o link", {
                        description: e instanceof Error ? e.message : undefined,
                      });
                    }
                  }}
                >
                  {editar.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                  ) : (
                    <Power className="h-3.5 w-3.5" aria-hidden />
                  )}
                  {link.ativo ? "Pausar link" : "Reativar link"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="gap-2"
                  disabled={editar.isPending}
                  onClick={async () => {
                    try {
                      await editar.mutateAsync({ id: link.id, dados: { regenerar: true } });
                      toast.success("Novo link gerado", {
                        description: "O endereço antigo deixará de funcionar.",
                      });
                    } catch (e) {
                      toast.error("Não foi possível gerar novo endereço", {
                        description: e instanceof Error ? e.message : undefined,
                      });
                    }
                  }}
                >
                  {editar.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                  )}
                  Gerar novo endereço
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive gap-2"
                  onSelect={(e) => {
                    e.preventDefault();
                    setConfirmarExclusao(true);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden /> Excluir link
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      <ConfirmacaoDestrutiva
        aberto={confirmarExclusao}
        onOpenChange={setConfirmarExclusao}
        titulo="Excluir este link?"
        descricao="Os alunos que ainda tiverem o endereço perderão o acesso imediatamente. O link vai para a lixeira e pode ser restaurado por 30 dias. As notas não são afetadas."
        textoConfirmar="Excluir link"
        onConfirmar={async () => {
          await excluir.mutateAsync(link.id);
          toast.success("Link movido para a lixeira", {
            action: {
              label: "Desfazer",
              onClick: () => {
                void restaurar
                  .mutateAsync(link.id)
                  .then(() => toast.success("Link restaurado"))
                  .catch(() => toast.error("Não foi possível restaurar"));
              },
            },
          });
        }}
      />
    </article>
  );
}
