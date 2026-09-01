"use client"

// Diálogo Compartilhar. Links da nota aberta: cria, copia, pausa, regenera ou exclui sem sair da leitura/edição.

import { useState } from "react"
import { Check, Copy, Link2, Loader2, Power, RefreshCw, Rocket, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import {
  urlDoLink,
  useCriarLink,
  useEditarLink,
  useExcluirLink,
  useLinks,
  useNota,
  useSalvarNota,
} from "@/lib/notas/api-client"

export function DialogoCompartilhar({
  aberto,
  aoFechar,
  notaId,
  aoPublicar,
}: {
  aberto: boolean
  aoFechar: () => void
  notaId: string
  /** Chamado quando a nota foi publicada automaticamente (para o editor sincronizar) */
  aoPublicar?: () => void
}) {
  const { data: links, isLoading } = useLinks()
  const { data: nota } = useNota(notaId)
  const criar = useCriarLink()
  const salvar = useSalvarNota(notaId)
  const editar = useEditarLink()
  const excluir = useExcluirLink()
  const [nome, setNome] = useState("")
  const [copiado, setCopiado] = useState<string | null>(null)
  // compartilhar publica a nota automaticamente (marcado por padrão)
  const [publicar, setPublicar] = useState(true)

  const rascunho = nota?.status === "rascunho"
  const meusLinks = (links ?? []).filter((l) => l.tipo === "nota" && l.notaId === notaId)

  const criarLink = async () => {
    // se a nota é rascunho e o professor autorizou, publica antes do link
    if (rascunho && publicar) {
      await salvar.mutateAsync({ status: "publicada" })
      aoPublicar?.()
    }
    return criar.mutateAsync({ tipo: "nota", notaId, nome: nome.trim() })
  }

  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && aoFechar()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="fonte-display flex items-center gap-2">
            <Link2 className="h-4.5 w-4.5" aria-hidden /> Compartilhar com os alunos
          </DialogTitle>
          <DialogDescription>
            Gere um link único e controlável. Somente notas publicadas ficam visíveis. Rascunhos não
            são exibidos.
          </DialogDescription>
        </DialogHeader>

        {/* criar novo */}
        <div className="grid gap-2">
          {rascunho ? (
            <label className="border-primary/30 bg-primary/5 text-foreground flex cursor-pointer items-start gap-2.5 rounded-xl border px-3 py-2.5">
              <input
                type="checkbox"
                checked={publicar}
                onChange={(e) => setPublicar(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-stone-800"
              />
              <span className="text-[0.82rem] leading-snug">
                <span className="flex items-center gap-1.5 font-semibold">
                  <Rocket className="text-primary h-3.5 w-3.5" aria-hidden />
                  Publicar esta nota ao criar o link
                </span>
                <span className="text-muted-foreground block">
                  Os alunos poderão abrir o link imediatamente. Desmarque para manter como rascunho.
                </span>
              </span>
            </label>
          ) : null}
          <div className="flex gap-2">
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome do link (opcional)"
              className="rounded-lg"
            />
            <Button
              className="shrink-0 gap-2 rounded-lg"
              disabled={criar.isPending || (rascunho && publicar && salvar.isPending)}
              onClick={async () => {
                try {
                  const r = await criarLink()
                  setNome("")
                  if (rascunho && publicar) {
                    toast.success("Nota publicada e link criado", {
                      description: "O endereço já foi copiado. Envie para os alunos.",
                    })
                  } else {
                    toast.success("Link criado", {
                      description: "O endereço já foi copiado. Envie para os alunos.",
                    })
                  }
                  void navigator.clipboard
                    ?.writeText(urlDoLink(r.link.token))
                    .catch(() => undefined)
                } catch (e) {
                  toast.error("Não foi possível criar o link.", {
                    description: e instanceof Error ? e.message : undefined,
                  })
                }
              }}
            >
              {criar.isPending || (rascunho && publicar && salvar.isPending) ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : null}
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
              const url = urlDoLink(l.token)
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
                      className="h-7 gap-1.5 rounded-md text-[0.72rem]"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(url)
                          setCopiado(l.id)
                          setTimeout(() => setCopiado(null), 2000)
                        } catch {
                          toast.error(
                            "Não foi possível copiar. Selecione o endereço e copie manualmente.",
                          )
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
                      className="h-7 gap-1.5 rounded-md text-[0.72rem]"
                      disabled={editar.isPending}
                      onClick={async () => {
                        try {
                          await editar.mutateAsync({ id: l.id, dados: { ativo: !l.ativo } })
                          toast.success(l.ativo ? "Link pausado" : "Link reativado")
                        } catch (e) {
                          toast.error("Não foi possível atualizar o link.", {
                            description: e instanceof Error ? e.message : undefined,
                          })
                        }
                      }}
                    >
                      <Power className="h-3 w-3" aria-hidden />
                      {l.ativo ? "Pausar" : "Reativar"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1.5 rounded-md text-[0.72rem]"
                      disabled={editar.isPending}
                      onClick={async () => {
                        try {
                          await editar.mutateAsync({ id: l.id, dados: { regenerar: true } })
                          toast.success("Novo link gerado")
                        } catch (e) {
                          toast.error("Não foi possível gerar novo endereço.", {
                            description: e instanceof Error ? e.message : undefined,
                          })
                        }
                      }}
                    >
                      <RefreshCw className="h-3 w-3" aria-hidden /> Regenerar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive h-7 gap-1.5 rounded-md text-[0.72rem]"
                      disabled={excluir.isPending}
                      onClick={async () => {
                        try {
                          await excluir.mutateAsync(l.id)
                          toast.success("Link excluído")
                        } catch (e) {
                          toast.error("Não foi possível excluir o link.", {
                            description: e instanceof Error ? e.message : undefined,
                          })
                        }
                      }}
                    >
                      <Trash2 className="h-3 w-3" aria-hidden /> Excluir
                    </Button>
                    <span className="text-muted-foreground ml-auto text-[0.68rem]">
                      {l.acessos} {l.acessos === 1 ? "acesso" : "acessos"}
                    </span>
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        <p className="text-muted-foreground text-center text-[0.72rem] leading-snug">
          Links de turma e disciplina inteira ficam na vista <b>Links</b> do menu.
        </p>
      </DialogContent>
    </Dialog>
  )
}
