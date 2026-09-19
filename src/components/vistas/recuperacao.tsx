"use client";

// Tela de recuperação de conta em carência de exclusão. O usuário entra com as
// credenciais e decide restaurar ou sair de vez.

import { useState } from "react";
import { Hourglass, Loader2, NotebookPen, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useSessao } from "@/hooks/use-sessao";

export function VistaRecuperacao({ navegar }: { navegar: (para: string) => void }) {
  const { perfil, restaurarConta, sair } = useSessao();
  const [restaurando, setRestaurando] = useState(false);
  const [saindo, setSaindo] = useState(false);

  const expiraEm = perfil?.expiraEm;

  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="bg-primary text-primary-foreground flex h-12 w-12 items-center justify-center rounded-2xl">
            <NotebookPen className="h-6 w-6" aria-hidden />
          </span>
          <span className="fonte-display mt-3 text-lg font-bold">Caderno Aberto</span>
        </div>

        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-950/30">
          <h1 className="fonte-display flex items-center gap-2 text-xl font-bold text-amber-800 dark:text-amber-300">
            <Hourglass className="h-5 w-5" aria-hidden /> Recuperação de conta
          </h1>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            A exclusão desta conta foi solicitada. Os links dos alunos estão inativos e o acesso ao
            aplicativo fica suspenso até a restauração. A remoção definitiva ocorre em{" "}
            {expiraEm ? new Date(expiraEm).toLocaleString("pt-BR") : "24 horas"}.
          </p>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            Restaure para voltar a usar o Caderno Aberto e reativar os links. Se preferir seguir com
            a exclusão, saia e não faça mais login.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              className="gap-2 rounded-xl"
              disabled={restaurando || saindo}
              onClick={async () => {
                setRestaurando(true);
                try {
                  await restaurarConta();
                  toast.success("Conta restaurada. O acesso foi restabelecido.");
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Falha ao restaurar.");
                } finally {
                  setRestaurando(false);
                }
              }}
            >
              {restaurando ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              Restaurar conta
            </Button>
            <Button
              variant="outline"
              className="gap-2 rounded-xl"
              disabled={restaurando || saindo}
              onClick={async () => {
                setSaindo(true);
                try {
                  await sair();
                  navegar("/entrar");
                } finally {
                  setSaindo(false);
                }
              }}
            >
              {saindo ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              Sair da conta
            </Button>
          </div>
        </div>

        <p className="text-muted-foreground mt-4 flex items-center justify-center gap-1.5 text-center text-[0.75rem]">
          <Trash2 className="h-3.5 w-3.5" aria-hidden /> A exclusão é permanente após o prazo de
          carência.
        </p>
      </div>
    </div>
  );
}
