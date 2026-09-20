"use client";

// Seção Segurança: troca de senha e dados de acesso.

import { useState } from "react";
import { Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useSessao } from "@/hooks/use-sessao";

export function SecaoSeguranca() {
  const { usuario, trocarSenha } = useSessao();
  const [senhaAtual, setSenhaAtual] = useState("");
  const [senha, setSenha] = useState("");
  const [senha2, setSenha2] = useState("");
  const [salvandoSenha, setSalvandoSenha] = useState(false);
  const divergente = senha2.length > 0 && senha !== senha2;

  return (
    <section className="na-cascata border-border bg-card rounded-2xl border p-5">
      <h2 className="fonte-display flex items-center gap-2 text-lg font-bold">
        <ShieldAlert className="h-4.5 w-4.5" aria-hidden /> Troca de senha
      </h2>

      <div className="mt-4 grid gap-5 sm:grid-cols-2">
        <div className="space-y-3">
          <p className="text-sm font-bold">Trocar senha</p>
          <div className="grid gap-1.5">
            <Label htmlFor="senha-atual">Senha atual</Label>
            <Input
              id="senha-atual"
              type="password"
              value={senhaAtual}
              onChange={(e) => setSenhaAtual(e.target.value)}
              placeholder="Digite a senha atual"
              autoComplete="current-password"
              className="rounded-lg"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="senha-nova">Nova senha</Label>
            <Input
              id="senha-nova"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Mínimo de 8 caracteres"
              autoComplete="new-password"
              aria-describedby="senha-nova-dica"
              className="rounded-lg"
            />
            <p id="senha-nova-dica" className="text-muted-foreground text-[0.72rem]">
              Use pelo menos 8 caracteres e evite a senha atual.
            </p>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="senha-repetir">Repetir a nova senha</Label>
            <Input
              id="senha-repetir"
              type="password"
              value={senha2}
              onChange={(e) => setSenha2(e.target.value)}
              placeholder="Repita a nova senha"
              autoComplete="new-password"
              aria-describedby={divergente ? "senha-repetir-erro" : undefined}
              aria-invalid={divergente || undefined}
              className="rounded-lg"
            />
            {divergente ? (
              <p id="senha-repetir-erro" role="alert" className="text-destructive text-[0.72rem]">
                As senhas não conferem.
              </p>
            ) : null}
          </div>
          <Button
            variant="outline"
            className="gap-2 rounded-lg"
            disabled={salvandoSenha || !senhaAtual || senha.length < 8 || senha !== senha2}
            onClick={async () => {
              setSalvandoSenha(true);
              try {
                const manterConectado = localStorage.getItem("caderno.manterConectado") !== "0";
                await trocarSenha(senhaAtual, senha, manterConectado);
                setSenhaAtual("");
                setSenha("");
                setSenha2("");
                toast.success("Senha alterada");
              } catch (e) {
                toast.error("Não foi possível alterar a senha", {
                  description: e instanceof Error ? e.message : undefined,
                });
              } finally {
                setSalvandoSenha(false);
              }
            }}
          >
            {salvandoSenha ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            Alterar senha
          </Button>
        </div>

        <div className="space-y-2.5">
          <p className="text-sm font-bold">Dados de acesso</p>
          <p className="text-muted-foreground text-[0.78rem] leading-snug">
            E-mail: {usuario?.email}. O endereço só pode ser alterado pela administração da escola.
          </p>
          <p className="text-muted-foreground text-[0.78rem] leading-snug">
            Esqueceu a senha? Saia e use a opção "Esqueci minha senha" na tela de login para receber
            um código da administração.
          </p>
        </div>
      </div>
    </section>
  );
}
