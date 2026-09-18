"use client";

// Seção Segurança: troca de senha e dados de acesso.

import { useState } from "react";
import { Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useSessao } from "@/hooks/use-sessao";

export function SecaoSeguranca() {
  const { usuario, trocarSenha } = useSessao();
  const [senhaAtual, setSenhaAtual] = useState("");
  const [senha, setSenha] = useState("");
  const [senha2, setSenha2] = useState("");
  const [salvandoSenha, setSalvandoSenha] = useState(false);

  return (
    <section className="na-cascata border-border bg-card rounded-2xl border p-5">
      <h2 className="fonte-display flex items-center gap-2 text-lg font-bold">
        <ShieldAlert className="h-4.5 w-4.5" aria-hidden /> Segurança
      </h2>

      <div className="mt-4 grid gap-5 sm:grid-cols-2">
        <div className="space-y-2.5">
          <p className="text-sm font-bold">Trocar senha</p>
          <Input
            type="password"
            value={senhaAtual}
            onChange={(e) => setSenhaAtual(e.target.value)}
            placeholder="Senha atual"
            className="rounded-lg"
            aria-label="Senha atual para trocar a senha"
          />
          <Input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Nova senha (mín. 8 caracteres)"
            className="rounded-lg"
            aria-label="Nova senha"
          />
          <Input
            type="password"
            value={senha2}
            onChange={(e) => setSenha2(e.target.value)}
            placeholder="Repetir a nova senha"
            className="rounded-lg"
            aria-label="Repetir nova senha"
          />
          <Button
            variant="outline"
            className="gap-2 rounded-lg"
            disabled={salvandoSenha || !senhaAtual || senha.length < 8 || senha !== senha2}
            onClick={async () => {
              setSalvandoSenha(true);
              try {
                await trocarSenha(senhaAtual, senha);
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
