"use client";

// Aba de auditoria: trilha de eventos de segurança.

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi, type Evento } from "./api";

const VARIANTE: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  USAR_CODIGO_OK: "secondary",
  LOGIN_OK: "secondary",
  USAR_CODIGO_FALHA: "destructive",
  LOGIN_FALHA: "destructive",
  REVOGAR_SESSOES: "destructive",
  EXCLUIR_USUARIO: "destructive",
};

export function SecaoAuditoria() {
  const [itens, setItens] = useState<Evento[]>([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const { eventos } = await adminApi.auditoria();
      setItens(eventos);
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Falha ao carregar.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
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
        <ul className="space-y-2">
          {itens.map((e) => (
            <li
              key={e.id}
              className="border-border bg-card flex flex-wrap items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm"
            >
              <Badge variant={VARIANTE[e.acao] ?? "outline"}>{e.acao}</Badge>
              {e.email ? <span className="text-muted-foreground">{e.email}</span> : null}
              <span className="text-muted-foreground ml-auto text-[0.72rem]">
                {e.ip ? `${e.ip} · ` : ""}
                {new Date(e.criadoEm).toLocaleString("pt-BR")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
