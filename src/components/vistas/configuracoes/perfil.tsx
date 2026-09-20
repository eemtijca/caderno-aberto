"use client";

// Seção Perfil: nome e escola exibidos nas notas e nos arquivos gerados.

import { useState } from "react";
import { Loader2, Mail, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useSessao } from "@/hooks/use-sessao";
import { useGuardaSaida } from "@/hooks/use-guarda-saida";

export function SecaoPerfil() {
  const { usuario, perfil, atualizarPerfil } = useSessao();
  const [nome, setNome] = useState<string | null>(null);
  const [escola, setEscola] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  // null funciona como sentinela: só sobrescreve o valor do perfil após edição.
  const valorNome = nome ?? perfil?.nome ?? "";
  const valorEscola = escola ?? perfil?.escola ?? "";
  const sujo = nome !== null || escola !== null;
  useGuardaSaida(sujo);

  return (
    <section className="na-cascata border-border bg-card rounded-2xl border p-5">
      <h2 className="fonte-display flex items-center gap-2 text-lg font-bold">
        <UserRound className="h-4.5 w-4.5" aria-hidden /> Seus dados
      </h2>
      <p className="text-muted-foreground mt-1 text-sm">
        O nome aparece para os alunos nas notas compartilhadas e nos arquivos de impressão gerados.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="nome">Nome</Label>
          <Input
            id="nome"
            value={valorNome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Prof. Maria da Silva"
            className="rounded-lg"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="escola">Escola</Label>
          <Input
            id="escola"
            value={valorEscola}
            onChange={(e) => setEscola(e.target.value)}
            placeholder="Nome da escola"
            className="rounded-lg"
          />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <Button
          className="gap-2 rounded-xl"
          disabled={!sujo || salvando}
          onClick={async () => {
            setSalvando(true);
            try {
              await atualizarPerfil({ nome: valorNome, escola: valorEscola });
              setNome(null);
              setEscola(null);
              toast.success("Perfil salvo");
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Não foi possível salvar.");
            } finally {
              setSalvando(false);
            }
          }}
        >
          {salvando ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          Salvar perfil
        </Button>
        <span className="text-muted-foreground inline-flex items-center gap-1.5 text-[0.78rem]">
          <Mail className="h-3.5 w-3.5" aria-hidden /> {usuario?.email}
        </span>
      </div>
    </section>
  );
}
