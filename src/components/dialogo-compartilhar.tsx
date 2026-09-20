"use client";

// Diálogo Compartilhar. Links da nota aberta: cria, copia, pausa, regenera ou exclui sem sair da leitura/edição.

import { useState } from "react";
import { AlertTriangle, Check, Copy, Link2, Loader2, Power, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ConfirmacaoDestrutiva } from "@/components/confirmacao-destrutiva";
import { copiarTexto } from "@/lib/clipboard";
import {
  urlDoLink,
  useCriarLink,
  useEditarLink,
  useExcluirLink,
  useLinks,
  useRestaurarLink,
  type LinkInfo,
} from "@/lib/notas/api-client";

export function DialogoCompartilhar({
  aberto,
  aoFechar,
  notaId,
  status,
}: {
  aberto: boolean;
  aoFechar: () => void;
  notaId: string;
  status?: "rascunho" | "publicada";
}) {
  const { data: links, isLoading } = useLinks();
  const criar = useCriarLink();
  const editar = useEditarLink();
  const excluir = useExcluirLink();
  const restaurar = useRestaurarLink();
  const [nome, setNome] = useState("");
  const [copiado, setCopiado] = useState<string | null>(null);
  const [confirmar, setConfirmar] = useState<{
    tipo: "regenerar" | "excluir";
    link: LinkInfo;
  } | null>(null);

  const executar = async () => {
    if (!confirmar) return;
    const { tipo, link } = confirmar;
    if (tipo === "regenerar") {
      await editar.mutateAsync({ id: link.id, dados: { regenerar: true } });
      toast.success("Novo link gerado", {
        description: "O endereço antigo deixará de funcionar.",
      });
    } else {
      await excluir.mutateAsync(link.id);
      toast.success("Link movido para a lixeira", {
        action: {
          label: "Desfazer",
          onClick: () => {
            void restaurar
              .mutateAsync(link.id)
              .then(() => toast.success("Link restaurado"))
              .catch(() => toast.error("Não foi possível restaurar"));
          },
        },
      });
    }
    setConfirmar(null);
  };

  // Mostra apenas os links da nota aberta, não os de turma/disciplina.
  const meusLinks = (links ?? []).filter((l) => l.tipo === "nota" && l.notaId === notaId);

  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && aoFechar()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overscroll-contain sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="fonte-display flex items-center gap-2">
            <Link2 className="h-4.5 w-4.5" aria-hidden /> Compartilhar com os alunos
          </DialogTitle>
          <DialogDescription>
            Gere um link único e controlável. Somente notas publicadas ficam visíveis. Rascunhos não
            são exibidos.
          </DialogDescription>
        </DialogHeader>

        {status === "rascunho" ? (
          <p className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-[0.8rem] leading-snug text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />A nota ainda é
            rascunho. O aluno só verá o conteúdo depois que ela for publicada.
          </p>
        ) : null}

        {/* criar novo */}
        <div className="grid gap-2">
          <div className="flex gap-2">
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome do link (opcional)"
              className="rounded-lg"
            />
            <Button
              className="shrink-0 gap-2 rounded-lg"
              disabled={criar.isPending}
              onClick={async () => {
                try {
                  const r = await criar.mutateAsync({ tipo: "nota", notaId, nome: nome.trim() });
                  setNome("");
                  const copiou = await copiarTexto(urlDoLink(r.link.token));
                  toast.success("Link criado", {
                    description: copiou
                      ? "O endereço já foi copiado. Envie para os alunos."
                      : "Copie o endereço na lista abaixo e envie para os alunos.",
                  });
                } catch (e) {
                  toast.error("Não foi possível criar o link", {
                    description: e instanceof Error ? e.message : undefined,
                  });
                }
              }}
            >
              {criar.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              Criar
            </Button>
          </div>
        </div>

        {/* lista */}
        {isLoading ? (
          <div className="space-y-2" aria-busy="true">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 w-5/6 rounded-xl" />
          </div>
        ) : meusLinks.length === 0 ? (
          <p className="border-border text-muted-foreground rounded-xl border border-dashed px-4 py-6 text-center text-sm">
            Nenhum link para notas ainda. Crie acima ou abra <b>Links</b> no menu para compartilhar
            turmas e disciplinas inteiras.
          </p>
        ) : (
          <ul className="space-y-2">
            {meusLinks.map((l) => {
              const url = urlDoLink(l.token);
              return (
                <li key={l.id} className="border-border rounded-xl border p-3">
                  <div className="flex items-center gap-2">
                    <p className="min-w-0 flex-1 truncate text-sm font-semibold">
                      {l.nome || "Link"}
                    </p>
                    <span
                      className={`rounded-md px-1.5 py-0.5 text-[0.62rem] font-bold ${
                        l.ativo
                          ? "bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {l.ativo ? "ativo" : "pausado"}
                    </span>
                  </div>
                  <code className="bg-muted text-muted-foreground mt-1 block truncate rounded-lg px-2 py-1 font-mono text-[0.68rem]">
                    {url}
                  </code>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 rounded-md text-[0.72rem] pointer-coarse:h-10"
                      onClick={async () => {
                        if (await copiarTexto(url)) {
                          setCopiado(l.id);
                          setTimeout(() => setCopiado(null), 2000);
                        } else {
                          toast.error(
                            "Não foi possível copiar. Selecione o endereço e copie manualmente.",
                          );
                        }
                      }}
                    >
                      {copiado === l.id ? (
                        <Check className="text-brand-600 h-3 w-3" aria-hidden />
                      ) : (
                        <Copy className="h-3 w-3" aria-hidden />
                      )}
                      Copiar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1.5 rounded-md text-[0.72rem] pointer-coarse:h-10"
                      disabled={editar.isPending}
                      onClick={async () => {
                        try {
                          await editar.mutateAsync({ id: l.id, dados: { ativo: !l.ativo } });
                          toast.success(l.ativo ? "Link pausado" : "Link reativado");
                        } catch (e) {
                          toast.error("Não foi possível atualizar o link", {
                            description: e instanceof Error ? e.message : undefined,
                          });
                        }
                      }}
                    >
                      {editar.isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                      ) : (
                        <Power className="h-3 w-3" aria-hidden />
                      )}
                      {l.ativo ? "Pausar link" : "Reativar link"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1.5 rounded-md text-[0.72rem] pointer-coarse:h-10"
                      disabled={editar.isPending}
                      onClick={() => setConfirmar({ tipo: "regenerar", link: l })}
                    >
                      <RefreshCw className="h-3 w-3" aria-hidden /> Gerar novo endereço
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive h-8 gap-1.5 rounded-md text-[0.72rem] pointer-coarse:h-10"
                      disabled={excluir.isPending}
                      onClick={() => setConfirmar({ tipo: "excluir", link: l })}
                    >
                      <Trash2 className="h-3 w-3" aria-hidden /> Excluir
                    </Button>
                    <span className="text-muted-foreground ml-auto text-[0.68rem]">
                      {l.acessos} {l.acessos === 1 ? "acesso" : "acessos"}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <p className="text-muted-foreground text-center text-[0.72rem] leading-snug">
          Links de turma e disciplina inteira ficam na vista <b>Links</b> do menu.
        </p>
      </DialogContent>

      <ConfirmacaoDestrutiva
        aberto={Boolean(confirmar)}
        onOpenChange={(o) => !o && setConfirmar(null)}
        titulo={confirmar?.tipo === "regenerar" ? "Gerar novo endereço?" : "Excluir o link?"}
        descricao={
          confirmar?.tipo === "regenerar"
            ? "O endereço atual deixará de funcionar imediatamente e os alunos precisarão do novo link."
            : "Os alunos que tiverem o endereço perdem o acesso. O link vai para a lixeira e pode ser restaurado por 30 dias."
        }
        textoConfirmar={confirmar?.tipo === "regenerar" ? "Gerar novo" : "Excluir link"}
        onConfirmar={executar}
      />
    </Dialog>
  );
}
