"use client";

// Console de administração: solicitações, códigos, usuários e auditoria.

import { useCallback, useEffect, useState } from "react";
import { BadgeCheck, KeyRound, ScrollText, ShieldCheck, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BotaoAtualizar } from "@/components/botao-atualizar";
import { adminApi, type CodigoEmitido, type Resumo } from "./api";
import { ModalCodigo } from "./modal-codigo";
import { SecaoSolicitacoes } from "./solicitacoes";
import { SecaoCodigos } from "./codigos";
import { SecaoUsuarios } from "./usuarios";
import { SecaoAprovacoes } from "./aprovacoes";
import { SecaoAuditoria } from "./auditoria";

export function VistaAdmin() {
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [erroResumo, setErroResumo] = useState(false);
  const [carregandoResumo, setCarregandoResumo] = useState(true);
  const [emitido, setEmitido] = useState<CodigoEmitido | null>(null);
  const [aba, setAba] = useState(() => {
    if (typeof window === "undefined") return "solicitacoes";
    return sessionStorage.getItem("caderno.admin.aba") ?? "solicitacoes";
  });

  const carregarResumo = useCallback(async () => {
    setCarregandoResumo(true);
    try {
      setResumo(await adminApi.resumo());
      setErroResumo(false);
    } catch {
      setErroResumo(true);
    } finally {
      setCarregandoResumo(false);
    }
  }, []);

  useEffect(() => {
    void carregarResumo();
  }, [carregarResumo]);

  const trocarAba = (valor: string) => {
    setAba(valor);
    try {
      sessionStorage.setItem("caderno.admin.aba", valor);
    } catch {
      // Sem session storage, a aba vale só nesta visita.
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="fonte-display flex items-center gap-2 text-2xl font-bold">
            <ShieldCheck className="text-primary h-6 w-6" aria-hidden /> Administração
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Gerencie acessos, códigos e contas da escola.
          </p>
        </div>
        <BotaoAtualizar carregando={carregandoResumo} aoAtualizar={carregarResumo} />
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Contador rotulo="Solicitações" valor={resumo?.solicitacoesPendentes} erro={erroResumo} />
        <Contador rotulo="Códigos ativos" valor={resumo?.codigosAtivos} erro={erroResumo} />
        <Contador rotulo="Contas" valor={resumo?.usuarios} erro={erroResumo} />
        <Contador rotulo="Contas não ativadas" valor={resumo?.usuariosInativos} erro={erroResumo} />
      </section>

      {erroResumo ? (
        <p className="border-destructive/40 bg-destructive/5 text-destructive flex flex-wrap items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm">
          Não foi possível carregar os contadores.
          <button
            type="button"
            className="font-semibold underline underline-offset-2"
            onClick={() => void carregarResumo()}
          >
            Tentar novamente
          </button>
        </p>
      ) : null}

      <Tabs value={aba} onValueChange={trocarAba} className="w-full">
        <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-xl p-1">
          <TabsTrigger value="solicitacoes" className="gap-1.5 rounded-lg">
            <ShieldCheck className="h-4 w-4" aria-hidden /> Solicitações
          </TabsTrigger>
          <TabsTrigger value="codigos" className="gap-1.5 rounded-lg">
            <KeyRound className="h-4 w-4" aria-hidden /> Códigos
          </TabsTrigger>
          <TabsTrigger value="usuarios" className="gap-1.5 rounded-lg">
            <Users className="h-4 w-4" aria-hidden /> Usuários
          </TabsTrigger>
          <TabsTrigger value="aprovacoes" className="gap-1.5 rounded-lg">
            <BadgeCheck className="h-4 w-4" aria-hidden /> Aprovações
          </TabsTrigger>
          <TabsTrigger value="auditoria" className="gap-1.5 rounded-lg">
            <ScrollText className="h-4 w-4" aria-hidden /> Auditoria
          </TabsTrigger>
        </TabsList>
        <TabsContent value="solicitacoes" className="mt-4">
          <SecaoSolicitacoes aoEmitir={setEmitido} aoAtualizar={carregarResumo} />
        </TabsContent>
        <TabsContent value="codigos" className="mt-4">
          <SecaoCodigos aoEmitir={setEmitido} aoAtualizar={carregarResumo} />
        </TabsContent>
        <TabsContent value="usuarios" className="mt-4">
          <SecaoUsuarios aoEmitir={setEmitido} aoAtualizar={carregarResumo} />
        </TabsContent>
        <TabsContent value="aprovacoes" className="mt-4">
          <SecaoAprovacoes />
        </TabsContent>
        <TabsContent value="auditoria" className="mt-4">
          <SecaoAuditoria />
        </TabsContent>
      </Tabs>

      <ModalCodigo emitido={emitido} aoFechar={() => setEmitido(null)} />
    </div>
  );
}

function Contador({ rotulo, valor, erro }: { rotulo: string; valor?: number; erro?: boolean }) {
  return (
    <div className="border-border bg-card na-cascata rounded-2xl border p-4">
      <p className="text-muted-foreground text-[0.72rem] font-bold tracking-wider uppercase">
        {rotulo}
      </p>
      {erro ? (
        <p className="fonte-display text-muted-foreground mt-1 text-2xl font-bold">--</p>
      ) : valor === undefined ? (
        <Skeleton className="mt-2 h-8 w-12 rounded-lg" />
      ) : (
        <p className="fonte-display mt-1 text-2xl font-bold">{valor}</p>
      )}
    </div>
  );
}
