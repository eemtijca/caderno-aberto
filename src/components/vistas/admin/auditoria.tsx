"use client";

// Aba de auditoria: trilha de eventos de segurança, com filtro e limpeza.

import { useCallback, useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { BotaoAtualizar } from "@/components/botao-atualizar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Paginacao } from "@/components/paginacao";
import { ConfirmacaoDestrutiva } from "@/components/confirmacao-destrutiva";
import { usePaginacao } from "@/hooks/use-paginacao";
import { adminApi, type Evento } from "./api";

const VARIANTE: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  USAR_CODIGO_OK: "secondary",
  LOGIN_OK: "secondary",
  USAR_CODIGO_FALHA: "destructive",
  LOGIN_FALHA: "destructive",
  REVOGAR_SESSOES: "destructive",
  EXCLUIR_USUARIO: "destructive",
  LIMPAR_AUDITORIA: "destructive",
};

const ACOES_CONHECIDAS = [
  "LOGIN_OK",
  "LOGIN_FALHA",
  "SOLICITAR_ACESSO",
  "USAR_CODIGO_OK",
  "USAR_CODIGO_FALHA",
  "GERAR_CODIGO",
  "REVOGAR_CODIGO",
  "CRIAR_USUARIO",
  "EDITAR_USUARIO",
  "REATIVAR_USUARIO",
  "SUSPENDER_USUARIO",
  "EXCLUIR_USUARIO",
  "REVOGAR_SESSOES",
  "APROVAR_ACAO",
  "RECUSAR_ACAO",
  "CANCELAR_SOLICITACAO",
  "CONFIGURAR_ADMIN",
  "LIMPAR_AUDITORIA",
];

export function SecaoAuditoria() {
  const [itens, setItens] = useState<Evento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [acao, setAcao] = useState("");
  const [confirmarLimpeza, setConfirmarLimpeza] = useState(false);
  const paginacao = usePaginacao(itens, 20, `${acao}:${itens.length}`);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const { eventos } = await adminApi.auditoria(acao || undefined);
      setItens(eventos);
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Falha ao carregar.");
    } finally {
      setCarregando(false);
    }
  }, [acao]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const acoes = useMemo(
    () => [...new Set([...ACOES_CONHECIDAS, ...itens.map((e) => e.acao)])].sort(),
    [itens],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={acao || "todas"} onValueChange={(v) => setAcao(v === "todas" ? "" : v)}>
          <SelectTrigger className="h-9 w-full rounded-lg sm:w-56" aria-label="Filtrar por ação">
            <SelectValue placeholder="Todas as ações" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as ações</SelectItem>
            {acoes.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <BotaoAtualizar carregando={carregando} aoAtualizar={carregar} rotulo="Atualizar" />

        <Button
          variant="outline"
          size="sm"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive ml-auto gap-2 rounded-lg"
          onClick={() => setConfirmarLimpeza(true)}
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden /> Limpar registros
        </Button>
      </div>

      {carregando ? (
        <div className="space-y-3" aria-busy="true">
          <Skeleton className="h-14 w-full rounded-2xl" />
          <Skeleton className="h-14 w-full rounded-2xl" />
        </div>
      ) : itens.length === 0 ? (
        <div className="border-border rounded-2xl border border-dashed p-8 text-center">
          <p className="font-semibold">Sem eventos</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Ações sensíveis de acesso aparecem aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <ul className="space-y-2">
            {paginacao.itens.map((e) => (
              <li
                key={e.id}
                className="border-border bg-card flex flex-wrap items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm"
              >
                <Badge variant={VARIANTE[e.acao] ?? "outline"}>{e.acao}</Badge>
                {e.email ? (
                  <span className="text-muted-foreground min-w-0 break-all">{e.email}</span>
                ) : null}
                <span className="text-muted-foreground ml-auto text-[0.72rem]">
                  {e.ip ? `${e.ip} · ` : ""}
                  {new Date(e.criadoEm).toLocaleString("pt-BR")}
                </span>
              </li>
            ))}
          </ul>
          <Paginacao paginacao={paginacao} rotulo="eventos" />
        </div>
      )}

      <ConfirmacaoDestrutiva
        aberto={confirmarLimpeza}
        onOpenChange={setConfirmarLimpeza}
        titulo="Limpar a auditoria?"
        descricao="Todos os eventos de segurança serão apagados. A própria limpeza fica registrada na trilha."
        alvo={{ rotulo: "Digite LIMPAR para confirmar", valor: "LIMPAR" }}
        exigeSenha
        textoConfirmar="Limpar registros"
        onConfirmar={async ({ senha }) => {
          const r = await adminApi.limparAuditoria(senha);
          toast.success("Auditoria limpa", {
            description: `${r.removidos} ${r.removidos === 1 ? "evento removido" : "eventos removidos"}.`,
          });
          await carregar();
        }}
      />
    </div>
  );
}
