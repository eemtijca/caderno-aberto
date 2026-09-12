"use client";

// Aba de solicitações de acesso: fila de pedidos e geração de código.

import { useCallback, useEffect, useState } from "react";
import { KeyRound, Loader2, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi, type CodigoEmitido, type Solicitacao } from "./api";

const ROTULO_TIPO: Record<string, string> = {
  primeiro_acesso: "Primeiro acesso",
  recuperacao: "Recuperação",
};

export function SecaoSolicitacoes({
  aoEmitir,
  aoAtualizar,
}: {
  aoEmitir: (c: CodigoEmitido) => void;
  aoAtualizar?: () => void;
}) {
  const [filtro, setFiltro] = useState<"pendente" | "todas">("pendente");
  const [itens, setItens] = useState<Solicitacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const { solicitacoes } = await adminApi.solicitacoes(
        filtro === "pendente" ? "pendente" : undefined,
      );
      setItens(solicitacoes);
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Falha ao carregar.");
    } finally {
      setCarregando(false);
    }
  }, [filtro]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const atender = async (id: string) => {
    setProcessando(id);
    try {
      const emitido = await adminApi.atender(id);
      aoEmitir(emitido);
      toast.success("Código gerado");
      await carregar();
      aoAtualizar?.();
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Falha ao atender.");
    } finally {
      setProcessando(null);
    }
  };

  const cancelar = async (id: string) => {
    setProcessando(id);
    try {
      await adminApi.cancelar(id);
      toast.success("Solicitação cancelada");
      await carregar();
      aoAtualizar?.();
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Falha ao cancelar.");
    } finally {
      setProcessando(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <Chip ativo={filtro === "pendente"} onClick={() => setFiltro("pendente")}>
            Pendentes
          </Chip>
          <Chip ativo={filtro === "todas"} onClick={() => setFiltro("todas")}>
            Todas
          </Chip>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 rounded-lg"
          onClick={() => void carregar()}
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden /> Atualizar
        </Button>
      </div>

      {carregando ? (
        <div className="space-y-3" aria-busy="true">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
        </div>
      ) : itens.length === 0 ? (
        <div className="border-border rounded-2xl border border-dashed p-8 text-center">
          <p className="font-semibold">Nenhuma solicitação</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Quando alguém pedir acesso pela tela de login, o pedido aparece aqui.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {itens.map((s) => (
            <li
              key={s.id}
              className="border-border bg-card na-cascata flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{s.nome || "(sem nome)"}</span>
                  <Badge variant={s.tipo === "recuperacao" ? "secondary" : "outline"}>
                    {ROTULO_TIPO[s.tipo] ?? s.tipo}
                  </Badge>
                  {s.status !== "pendente" ? <Badge variant="outline">{s.status}</Badge> : null}
                </div>
                <p className="text-muted-foreground mt-0.5 truncate text-sm">{s.email}</p>
                <p className="text-muted-foreground text-[0.72rem]">
                  {new Date(s.criadoEm).toLocaleString("pt-BR")}
                </p>
              </div>
              {s.status === "pendente" ? (
                <div className="flex shrink-0 gap-2">
                  <Button
                    size="sm"
                    className="gap-1.5 rounded-lg"
                    disabled={processando === s.id}
                    onClick={() => void atender(s.id)}
                  >
                    {processando === s.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                    ) : (
                      <KeyRound className="h-3.5 w-3.5" aria-hidden />
                    )}
                    Gerar código
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1.5 rounded-lg"
                    disabled={processando === s.id}
                    onClick={() => void cancelar(s.id)}
                  >
                    <X className="h-3.5 w-3.5" aria-hidden /> Recusar
                  </Button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Chip({
  ativo,
  onClick,
  children,
}: {
  ativo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={ativo}
      onClick={onClick}
      className={`rounded-lg border px-2.5 py-1 text-[0.78rem] font-semibold transition ${
        ativo
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
