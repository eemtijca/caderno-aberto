"use client";

// Console de administração: solicitações, códigos, usuários e auditoria.

import { useCallback, useEffect, useState } from "react";
import { KeyRound, ScrollText, ShieldCheck, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { adminApi, type CodigoEmitido, type Resumo } from "./api";
import { ModalCodigo } from "./modal-codigo";
import { SecaoSolicitacoes } from "./solicitacoes";
import { SecaoCodigos } from "./codigos";
import { SecaoUsuarios } from "./usuarios";
import { SecaoAuditoria } from "./auditoria";

export function VistaAdmin() {
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [emitido, setEmitido] = useState<CodigoEmitido | null>(null);

  const carregarResumo = useCallback(async () => {
    try {
      setResumo(await adminApi.resumo());
    } catch {
      // Contadores são acessórios; as abas mostram os erros.
    }
  }, []);

  useEffect(() => {
    void carregarResumo();
  }, [carregarResumo]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="fonte-display flex items-center gap-2 text-2xl font-bold">
          <ShieldCheck className="text-primary h-6 w-6" aria-hidden /> Administração
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Gerencie acessos, códigos e contas da escola.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Contador rotulo="Solicitações" valor={resumo?.solicitacoesPendentes} />
        <Contador rotulo="Códigos ativos" valor={resumo?.codigosAtivos} />
        <Contador rotulo="Contas" valor={resumo?.usuarios} />
        <Contador rotulo="Pendentes" valor={resumo?.usuariosInativos} />
      </section>

      <Tabs defaultValue="solicitacoes" className="w-full">
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
          <SecaoUsuarios aoEmitir={setEmitido} />
        </TabsContent>
        <TabsContent value="auditoria" className="mt-4">
          <SecaoAuditoria />
        </TabsContent>
      </Tabs>

      <ModalCodigo emitido={emitido} aoFechar={() => setEmitido(null)} />
    </div>
  );
}

function Contador({ rotulo, valor }: { rotulo: string; valor?: number }) {
  return (
    <div className="border-border bg-card na-cascata rounded-2xl border p-4">
      <p className="text-muted-foreground text-[0.72rem] font-bold tracking-wider uppercase">
        {rotulo}
      </p>
      {valor === undefined ? (
        <Skeleton className="mt-2 h-8 w-12 rounded-lg" />
      ) : (
        <p className="fonte-display mt-1 text-2xl font-bold">{valor}</p>
      )}
    </div>
  );
}
