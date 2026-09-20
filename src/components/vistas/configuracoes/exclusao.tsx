"use client";

// Seção Exclusão: inicia a remoção da conta com carência de 24 horas. Ao
// confirmar, a sessão é encerrada e a recuperação exige novo login.

import { useState } from "react";
import { Download, Loader2, ShieldAlert, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useSessao } from "@/hooks/use-sessao";

export function SecaoExclusao({ navegar }: { navegar: (para: string) => void }) {
  const { ehAdmin, solicitarExclusao, sair } = useSessao();
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [aceita, setAceita] = useState(false);
  const [etapa, setEtapa] = useState<1 | 2>(1);
  const [excluindo, setExcluindo] = useState(false);
  const [aberto, setAberto] = useState(false);

  if (ehAdmin) {
    return (
      <section className="na-cascata border-border bg-card rounded-2xl border p-5">
        <h2 className="fonte-display flex items-center gap-2 text-lg font-bold">
          <ShieldAlert className="h-4.5 w-4.5" aria-hidden /> Exclusão da conta
        </h2>
        <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
          A conta de administração da escola não pode ser excluída pelo próprio usuário. Para
          removê-la, é necessário outro administrador pelo console de administração.
        </p>
      </section>
    );
  }

  return (
    <section className="na-cascata border-destructive/40 bg-destructive/5 rounded-2xl border p-5">
      <h2 className="fonte-display text-destructive flex items-center gap-2 text-lg font-bold">
        <Trash2 className="h-4.5 w-4.5" aria-hidden /> Excluir a conta
      </h2>
      <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
        Solicita a remoção permanente da conta, notas, disciplinas, turmas, links e imagens. Existe
        carência de 24 horas para restauração. Ao confirmar, a sessão é encerrada.
      </p>
      <a
        href="/api/backup"
        download
        className="text-primary mt-2 inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
      >
        <Download className="h-3.5 w-3.5" aria-hidden /> Baixar um backup antes
      </a>

      <AlertDialog open={aberto} onOpenChange={setAberto}>
        <AlertDialogTrigger asChild>
          <Button
            variant="destructive"
            className="mt-4 gap-2 rounded-xl"
            onClick={() => {
              setEtapa(1);
              setAceita(false);
              setSenha("");
              setConfirmacao("");
            }}
          >
            <Trash2 className="h-4 w-4" aria-hidden /> Excluir minha conta
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {etapa === 1 ? "Confirmar solicitação" : "Confirmação final"}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                {etapa === 1 ? (
                  <>
                    <p>
                      Esta ação inicia a exclusão com carência de 24 horas. Os links dos alunos
                      serão desativados e a sessão será encerrada. A remoção é permanente após o
                      prazo.
                    </p>
                    <label className="border-border mt-4 flex items-start gap-2 rounded-lg border p-3">
                      <input
                        type="checkbox"
                        checked={aceita}
                        onChange={(e) => setAceita(e.target.checked)}
                        className="mt-1"
                      />
                      <span className="text-sm">
                        Compreendo que a exclusão é permanente e que há 24 horas para restaurar.
                      </span>
                    </label>
                  </>
                ) : (
                  <>
                    <p>
                      Digite <b>EXCLUIR</b> e confirme com a senha para concluir.
                    </p>
                    <div className="mt-3 grid gap-2">
                      <Label htmlFor="confirmacao-excluir">Digite EXCLUIR</Label>
                      <Input
                        id="confirmacao-excluir"
                        value={confirmacao}
                        onChange={(e) => setConfirmacao(e.target.value)}
                        placeholder="EXCLUIR"
                        className="rounded-lg"
                      />
                      <Label htmlFor="senha-excluir">Senha atual</Label>
                      <Input
                        id="senha-excluir"
                        type="password"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        className="rounded-lg"
                        autoComplete="current-password"
                      />
                    </div>
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setAceita(false);
                setSenha("");
                setConfirmacao("");
                setEtapa(1);
              }}
            >
              Cancelar
            </AlertDialogCancel>
            {etapa === 1 ? (
              <Button
                disabled={!aceita}
                onClick={() => setEtapa(2)}
                className="bg-destructive hover:bg-destructive/90 text-white"
              >
                Continuar
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setEtapa(1)}>
                  Voltar
                </Button>
                <AlertDialogAction
                  className="bg-destructive hover:bg-destructive/90 text-white"
                  disabled={confirmacao !== "EXCLUIR" || !senha || excluindo}
                  onClick={async (e) => {
                    // Evita o fechamento automático para poder tratar o erro no diálogo.
                    e.preventDefault();
                    setExcluindo(true);
                    try {
                      const r = await solicitarExclusao(senha, confirmacao);
                      setAberto(false);
                      toast.success("Exclusão solicitada", {
                        description: `Sessão encerrada. Faça login para restaurar até ${new Date(r.expiraEm).toLocaleString("pt-BR")}.`,
                      });
                      await sair();
                      navegar("/entrar");
                    } catch (err) {
                      // Mantém a confirmação digitada e pede apenas a senha de novo.
                      setSenha("");
                      toast.error(err instanceof Error ? err.message : "Erro ao solicitar.");
                    } finally {
                      setExcluindo(false);
                    }
                  }}
                >
                  {excluindo ? (
                    <>
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden /> Processando
                    </>
                  ) : (
                    "Confirmar exclusão"
                  )}
                </AlertDialogAction>
              </>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
