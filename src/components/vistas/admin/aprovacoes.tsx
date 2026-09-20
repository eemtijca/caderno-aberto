"use client";

// Aba de aprovações: ações destrutivas aguardando um segundo administrador.

import { useCallback, useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Paginacao } from "@/components/paginacao";
import { ConfirmacaoDestrutiva } from "@/components/confirmacao-destrutiva";
import { toast } from "sonner";
import { BotaoAtualizar } from "@/components/botao-atualizar";
import { usePaginacaoServidor } from "@/hooks/use-paginacao-servidor";
import { ROTULO_ACAO_APROVACAO, adminApi, type AprovacaoAcao } from "./api";
export {};

export function SecaoAprovacoes() {
  const [decidindo, setDecidindo] = useState<AprovacaoAcao | null>(null);
  const [acao, setAcao] = useState<"aprovar" | "recusar">("aprovar");

  const paginacao = usePaginacaoServidor<AprovacaoAcao>({
    buscar: useCallback(async (pagina, porPagina) => {
      const r = await adminApi.aprovacoes(pagina, porPagina);
      return { itens: r.aprovacoes, total: r.total };
    }, []),
    aoErro: (erro) => toast.error(erro.message),
  });

  const itens = paginacao.itens;
  const carregando = paginacao.carregando;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          {paginacao.total}{" "}
          {paginacao.total === 1 ? "solicitação pendente" : "solicitações pendentes"}
        </p>
        <BotaoAtualizar
          carregando={carregando}
          aoAtualizar={paginacao.recarregar}
          rotulo="Atualizar"
        />
      </div>

      {carregando ? (
        <div className="space-y-3" aria-busy="true">
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
        </div>
      ) : itens.length === 0 ? (
        <div className="border-border rounded-2xl border border-dashed p-8 text-center">
          <p className="font-semibold">Nenhuma aprovação pendente</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Quando a aprovação em duas etapas estiver ativa, as ações destrutivas aparecem aqui.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {itens.map((a) => (
            <li
              key={a.id}
              className="border-border bg-card na-cascata flex flex-wrap items-center gap-3 rounded-2xl border p-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate font-semibold">
                    {ROTULO_ACAO_APROVACAO[a.tipo] ?? a.tipo}
                  </span>
                  <Badge variant="outline">Pendente</Badge>
                </div>
                <p className="text-muted-foreground mt-0.5 truncate text-sm">{a.alvoEmail}</p>
                <p className="text-muted-foreground mt-0.5 text-[0.78rem]">Motivo: {a.motivo}</p>
                <p className="text-muted-foreground mt-0.5 text-[0.75rem]">
                  Solicitada em {new Date(a.criadoEm).toLocaleString("pt-BR")} · expira em{" "}
                  {new Date(a.expiraEm).toLocaleString("pt-BR")}.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="gap-1.5 rounded-lg"
                  onClick={() => {
                    setAcao("aprovar");
                    setDecidindo(a);
                  }}
                >
                  <Check className="h-3.5 w-3.5" aria-hidden /> Aprovar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 rounded-lg"
                  onClick={() => {
                    setAcao("recusar");
                    setDecidindo(a);
                  }}
                >
                  <X className="h-3.5 w-3.5" aria-hidden /> Recusar
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!carregando && itens.length > 0 ? (
        <Paginacao paginacao={paginacao} rotulo="solicitações" />
      ) : null}

      <ConfirmacaoDestrutiva
        aberto={Boolean(decidindo)}
        onOpenChange={(o) => !o && setDecidindo(null)}
        titulo={acao === "aprovar" ? "Aprovar ação" : "Recusar ação"}
        descricao={
          acao === "aprovar" ? (
            <>
              A ação <b>{ROTULO_ACAO_APROVACAO[decidindo?.tipo ?? ""] ?? decidindo?.tipo}</b> sobre{" "}
              <b>{decidindo?.alvoEmail}</b> será executada imediatamente.
            </>
          ) : (
            <>
              A solicitação sobre <b>{decidindo?.alvoEmail}</b> será recusada e descartada.
            </>
          )
        }
        exigeSenha={acao === "aprovar"}
        varianteConfirmar={acao === "aprovar" ? "default" : "destructive"}
        textoConfirmar={acao === "aprovar" ? "Aprovar e executar" : "Recusar"}
        onConfirmar={async ({ senha }) => {
          if (!decidindo) return;
          await adminApi.decidirAprovacao(decidindo.id, acao, senha);
          toast.success(acao === "aprovar" ? "Ação aprovada e executada" : "Solicitação recusada");
          setDecidindo(null);
          await paginacao.recarregar();
        }}
      />
    </div>
  );
}
