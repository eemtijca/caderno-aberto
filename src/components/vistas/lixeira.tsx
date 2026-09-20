"use client";

// Vista Lixeira: itens excluídos recentemente, restauráveis dentro do prazo.

import { useState } from "react";
import { BookOpenText, Link2, Loader2, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  loteLixeira,
  useLixeira,
  useRestaurarLink,
  useRestaurarNota,
  type LixeiraInfo,
} from "@/lib/notas/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Paginacao } from "@/components/paginacao";
import { BotaoAtualizar } from "@/components/botao-atualizar";
import { BarraLote } from "@/components/barra-lote";
import { usePaginacao } from "@/hooks/use-paginacao";
import { useSelecao } from "@/hooks/use-selecao";

export function VistaLixeira() {
  const lixeiraQ = useLixeira();
  const { data, isLoading } = lixeiraQ;
  const restaurarNota = useRestaurarNota();
  const restaurarLink = useRestaurarLink();
  const qc = useQueryClient();
  const selecao = useSelecao("lixeira");
  const [restaurando, setRestaurando] = useState<string | null>(null);
  const [atualizando, setAtualizando] = useState(false);
  const [processandoLote, setProcessandoLote] = useState(false);

  const itens = [...(data?.notas ?? []), ...(data?.links ?? [])];
  const todosSelecionados = itens.length > 0 && itens.every((i) => selecao.selecionados.has(i.id));
  const algunsSelecionados = itens.some((i) => selecao.selecionados.has(i.id));

  const atualizar = async () => {
    setAtualizando(true);
    try {
      await qc.invalidateQueries({ queryKey: ["lixeira"] });
    } finally {
      setAtualizando(false);
    }
  };

  const restaurarEmLote = async () => {
    const notas = (data?.notas ?? [])
      .filter((n) => selecao.selecionados.has(n.id))
      .map((n) => n.id);
    const links = (data?.links ?? [])
      .filter((l) => selecao.selecionados.has(l.id))
      .map((l) => l.id);
    if (notas.length + links.length === 0) return;
    setProcessandoLote(true);
    try {
      const r = await loteLixeira({ notas, links });
      await qc.invalidateQueries({ queryKey: ["lixeira"] });
      const total = r.notas + r.links;
      toast.success(`${total} ${total === 1 ? "item restaurado" : "itens restaurados"}`);
      if (r.ausentes.length > 0) {
        toast.warning(
          `${r.ausentes.length} ${r.ausentes.length === 1 ? "item não encontrado" : "itens não encontrados"}.`,
        );
        selecao.definir(r.ausentes);
      } else {
        selecao.desativar();
      }
    } catch (e) {
      toast.error("Não foi possível restaurar o lote", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setProcessandoLote(false);
    }
  };

  const restaurar = async (tipo: "nota" | "link", id: string, rotulo: string) => {
    setRestaurando(id);
    try {
      if (tipo === "nota") await restaurarNota.mutateAsync(id);
      else await restaurarLink.mutateAsync(id);
      toast.success("Item restaurado", { description: rotulo });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível restaurar.");
    } finally {
      setRestaurando(null);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="fonte-display text-2xl font-bold">Lixeira</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Notas e links excluídos ficam disponíveis por {data?.dias ?? 30} dias antes da remoção
            definitiva.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BotaoAtualizar carregando={lixeiraQ.isFetching || atualizando} aoAtualizar={atualizar} />
          {itens.length > 0 ? (
            <Button variant="outline" aria-pressed={selecao.ativo} onClick={selecao.alternarModo}>
              {selecao.ativo ? "Sair da seleção" : "Selecionar"}
            </Button>
          ) : null}
        </div>
      </header>

      {isLoading ? (
        <div className="space-y-3" aria-busy="true">
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-5/6 rounded-2xl" />
        </div>
      ) : (
        <div className={cn("space-y-6", selecao.ativo && "pb-28")}>
          {selecao.ativo && itens.length > 0 ? (
            <div className="flex items-center gap-2">
              <Checkbox
                checked={todosSelecionados ? true : algunsSelecionados ? "indeterminate" : false}
                onCheckedChange={() =>
                  todosSelecionados ? selecao.definir([]) : selecao.definir(itens.map((i) => i.id))
                }
                aria-label="Selecionar todos os itens da lixeira"
              />
              <span className="text-sm font-medium">Selecionar todos ({itens.length})</span>
            </div>
          ) : null}
          <Conteudo
            dados={data}
            restaurando={restaurando}
            atualizando={atualizando}
            onRestaurar={restaurar}
            onLimpar={atualizar}
            selecao={selecao}
          />
        </div>
      )}

      {selecao.ativo ? (
        <BarraLote
          quantidade={selecao.quantidade}
          ocupada={processandoLote}
          aoCancelar={selecao.desativar}
          acoes={
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 rounded-lg text-[0.72rem] pointer-coarse:h-10"
              disabled={selecao.quantidade === 0 || processandoLote}
              onClick={() => void restaurarEmLote()}
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Restaurar
            </Button>
          }
        />
      ) : null}
    </div>
  );
}

function Conteudo({
  dados,
  restaurando,
  atualizando,
  onRestaurar,
  onLimpar,
  selecao,
}: {
  dados: LixeiraInfo | undefined;
  restaurando: string | null;
  atualizando: boolean;
  onRestaurar: (tipo: "nota" | "link", id: string, rotulo: string) => void;
  onLimpar: () => void;
  selecao: {
    ativo: boolean;
    selecionados: Set<string>;
    alternar: (id: string) => void;
  };
}) {
  const notas = dados?.notas ?? [];
  const links = dados?.links ?? [];
  const pagNotas = usePaginacao(notas, 10, notas.length);
  const pagLinks = usePaginacao(links, 10, links.length);

  if (notas.length === 0 && links.length === 0) {
    return (
      <div className="border-border rounded-2xl border border-dashed p-10 text-center">
        <Trash2 className="text-muted-foreground/60 mx-auto h-8 w-8" aria-hidden />
        <p className="fonte-display mt-3 font-bold">A lixeira está vazia</p>
        <p className="text-muted-foreground mx-auto mt-1 max-w-md text-sm">
          Ao excluir uma nota ou um link, o item aparece aqui e pode ser restaurado por{" "}
          {dados?.dias ?? 30} dias.
        </p>
        <Button variant="outline" onClick={onLimpar} className="mt-4 gap-1.5 rounded-xl">
          {atualizando ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          Atualizar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {notas.length > 0 ? (
        <section className="space-y-2">
          <h2 className="fonte-display px-1 text-lg font-bold">Notas</h2>
          <ul className="space-y-2">
            {pagNotas.itens.map((n) => (
              <li
                key={n.id}
                className={`border-border bg-card flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 ${
                  selecao.selecionados.has(n.id) ? "ring-primary ring-2" : ""
                }`}
              >
                {selecao.ativo ? (
                  <Checkbox
                    checked={selecao.selecionados.has(n.id)}
                    onCheckedChange={() => selecao.alternar(n.id)}
                    aria-label={`Selecionar ${n.titulo}`}
                  />
                ) : null}
                <BookOpenText className="text-muted-foreground h-4 w-4 shrink-0" aria-hidden />
                <span className="min-w-0 flex-1 truncate font-semibold">{n.titulo}</span>
                <span className="text-muted-foreground text-[0.72rem]">
                  {n.excluidoEm ? new Date(n.excluidoEm).toLocaleString("pt-BR") : ""}
                </span>
                {selecao.ativo ? null : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 gap-1.5 rounded-lg pointer-coarse:h-11"
                    disabled={restaurando === n.id}
                    onClick={() => onRestaurar("nota", n.id, n.titulo)}
                  >
                    {restaurando === n.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                    ) : (
                      <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                    )}
                    Restaurar
                  </Button>
                )}
              </li>
            ))}
          </ul>
          <Paginacao paginacao={pagNotas} rotulo="notas" className="px-1" />
        </section>
      ) : null}

      {links.length > 0 ? (
        <section className="space-y-2">
          <h2 className="fonte-display px-1 text-lg font-bold">Links</h2>
          <ul className="space-y-2">
            {pagLinks.itens.map((l) => (
              <li
                key={l.id}
                className={`border-border bg-card flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 ${
                  selecao.selecionados.has(l.id) ? "ring-primary ring-2" : ""
                }`}
              >
                {selecao.ativo ? (
                  <Checkbox
                    checked={selecao.selecionados.has(l.id)}
                    onCheckedChange={() => selecao.alternar(l.id)}
                    aria-label={`Selecionar ${l.nome || `Link de ${l.tipo}`}`}
                  />
                ) : null}
                <Link2 className="text-muted-foreground h-4 w-4 shrink-0" aria-hidden />
                <span className="min-w-0 flex-1 truncate font-semibold">
                  {l.nome || `Link de ${l.tipo}`}
                </span>
                <span className="text-muted-foreground text-[0.72rem]">
                  {l.excluidoEm ? new Date(l.excluidoEm).toLocaleString("pt-BR") : ""}
                </span>
                {selecao.ativo ? null : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 gap-1.5 rounded-lg pointer-coarse:h-11"
                    disabled={restaurando === l.id}
                    onClick={() => onRestaurar("link", l.id, l.nome || `Link de ${l.tipo}`)}
                  >
                    {restaurando === l.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                    ) : (
                      <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                    )}
                    Restaurar
                  </Button>
                )}
              </li>
            ))}
          </ul>
          <Paginacao paginacao={pagLinks} rotulo="links" className="px-1" />
        </section>
      ) : null}
    </div>
  );
}
