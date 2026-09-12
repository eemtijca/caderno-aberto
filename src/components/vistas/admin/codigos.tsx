"use client";

// Aba de códigos: emissão avulsa, listagem e revogação.

import { useCallback, useEffect, useState } from "react";
import { KeyRound, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi, type Codigo, type CodigoEmitido, type TipoCodigo } from "./api";

const ROTULO_TIPO: Record<string, string> = {
  primeiro_acesso: "Primeiro acesso",
  recuperacao: "Recuperação",
};

const VARIANTE: Record<string, "default" | "secondary" | "outline"> = {
  ativo: "default",
  usado: "secondary",
  expirado: "outline",
};

export function SecaoCodigos({
  aoEmitir,
  aoAtualizar,
}: {
  aoEmitir: (c: CodigoEmitido) => void;
  aoAtualizar?: () => void;
}) {
  const [itens, setItens] = useState<Codigo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [email, setEmail] = useState("");
  const [tipo, setTipo] = useState<TipoCodigo>("primeiro_acesso");
  const [enviando, setEnviando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const { codigos } = await adminApi.codigos();
      setItens(codigos);
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Falha ao carregar.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const gerar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setEnviando(true);
    try {
      const emitido = await adminApi.emitirCodigo(email.trim(), tipo);
      aoEmitir(emitido);
      setEmail("");
      toast.success("Código gerado");
      await carregar();
      aoAtualizar?.();
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Falha ao gerar.");
    } finally {
      setEnviando(false);
    }
  };

  const revogar = async (id: string) => {
    try {
      await adminApi.revogarCodigo(id);
      toast.success("Código revogado");
      await carregar();
      aoAtualizar?.();
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Falha ao revogar.");
    }
  };

  return (
    <div className="space-y-5">
      <form
        onSubmit={gerar}
        className="border-border bg-card grid gap-3 rounded-2xl border p-4 sm:grid-cols-[1fr_12rem_auto]"
      >
        <div className="grid gap-1.5">
          <Label htmlFor="codigo-email">E-mail</Label>
          <Input
            id="codigo-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nome@escola.br"
            className="rounded-lg"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="codigo-tipo">Tipo</Label>
          <Select value={tipo} onValueChange={(v) => setTipo(v as TipoCodigo)}>
            <SelectTrigger id="codigo-tipo" className="rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="primeiro_acesso">Primeiro acesso</SelectItem>
              <SelectItem value="recuperacao">Recuperação</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <Button type="submit" className="w-full gap-1.5 rounded-lg sm:w-auto" disabled={enviando}>
            <KeyRound className="h-4 w-4" aria-hidden /> Gerar
          </Button>
        </div>
      </form>

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
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
        </div>
      ) : itens.length === 0 ? (
        <div className="border-border rounded-2xl border border-dashed p-8 text-center">
          <p className="font-semibold">Nenhum código</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Gere um código para liberar o primeiro acesso ou recuperar uma senha.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {itens.map((c) => (
            <li
              key={c.id}
              className="border-border bg-card na-cascata flex flex-col gap-2 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate font-semibold">{c.email}</span>
                  <Badge variant="outline">{ROTULO_TIPO[c.tipo] ?? c.tipo}</Badge>
                  <Badge variant={VARIANTE[c.status] ?? "outline"}>{c.status}</Badge>
                </div>
                <p className="text-muted-foreground mt-0.5 text-[0.72rem]">
                  Criado em {new Date(c.criadoEm).toLocaleString("pt-BR")} · Expira em{" "}
                  {new Date(c.expiraEm).toLocaleString("pt-BR")}
                </p>
              </div>
              {c.status === "ativo" ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive focus:text-destructive shrink-0 gap-1.5 rounded-lg"
                  onClick={() => void revogar(c.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden /> Revogar
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
