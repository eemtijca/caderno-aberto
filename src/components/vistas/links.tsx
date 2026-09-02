"use client"

// Vista Links. Gestão dos links únicos para os alunos. Criar (nota / turma / disciplina), copiar, abrir, pausar, revogar, agendar expiração, regenerar o token, ver quantos acessos cada link recebeu e excluir.

import { useMemo, useState } from "react"
import {
  BookOpenText,
  Check,
  Copy,
  ExternalLink,
  GraduationCap,
  Hourglass,
  Link2,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Trash2,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import {
  urlDoLink,
  useCriarLink,
  useDisciplinas,
  useEditarLink,
  useExcluirLink,
  useLinks,
  useNotas,
  useTurmas,
  type LinkInfo,
  type TipoLink,
} from "@/lib/notas/api-client"

const ROTULO_TIPO: Record<TipoLink, string> = {
  nota: "Uma nota",
  turma: "Turma inteira",
  disciplina: "Disciplina inteira",
}

export function VistaLinks() {
  const linksQ = useLinks()
  const notasQ = useNotas({ status: "publicada" })
  const disciplinasQ = useDisciplinas()
  const turmasQ = useTurmas()
  const { data: links, isLoading } = linksQ

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="fonte-display text-2xl font-bold">Links para os alunos</h1>
        <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
          Cada link é único e gerenciável: compartilhe uma nota, a turma ou a disciplina inteira.
          Pause, agende a validade ou revogue quando necessário. Rascunhos nunca ficam visíveis.
        </p>
      </div>

      <SecaoNovoLink
        notas={(notasQ.data ?? []).map((n) => ({ id: n.id, titulo: n.titulo }))}
        disciplinas={(disciplinasQ.data ?? []).map((d) => ({ id: d.id, nome: d.nome }))}
        turmas={(turmasQ.data ?? []).map((t) => ({ id: t.id, nome: t.nome, ano: t.anoLetivo }))}
      />

      {isLoading ? (
        <div className="space-y-3" aria-busy="true">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 w-5/6 rounded-2xl" />
        </div>
      ) : (links ?? []).length === 0 ? (
        <div className="na-cascata border-border rounded-2xl border border-dashed p-10 text-center">
          <Link2 className="text-muted-foreground/60 mx-auto h-8 w-8" aria-hidden />
          <p className="fonte-display mt-3 font-bold">Nenhum link ainda</p>
          <p className="text-muted-foreground mx-auto mt-1 max-w-md text-sm">
            Crie o primeiro acima. Publique a nota antes, pois rascunhos não aparecem para os
            alunos.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {(links ?? []).map((l, i) => (
            <CartaoLink key={l.id} link={l} indice={i} />
          ))}
        </div>
      )}
    </div>
  )
}

// Criar novo link

function SecaoNovoLink({
  notas,
  disciplinas,
  turmas,
}: {
  notas: { id: string; titulo: string }[]
  disciplinas: { id: string; nome: string }[]
  turmas: { id: string; nome: string; ano: number }[]
}) {
  const criar = useCriarLink()
  const [tipo, setTipo] = useState<TipoLink>("nota")
  const [alvo, setAlvo] = useState("")
  const [nome, setNome] = useState("")

  const opcoes =
    tipo === "nota"
      ? notas.map((n) => ({ id: n.id, rotulo: n.titulo }))
      : tipo === "turma"
        ? turmas.map((t) => ({ id: t.id, rotulo: `${t.nome} · ${t.ano}` }))
        : disciplinas.map((d) => ({ id: d.id, rotulo: d.nome }))

  const vazio =
    tipo === "nota"
      ? "Publique uma nota primeiro."
      : tipo === "turma"
        ? "Cadastre turmas primeiro."
        : "Cadastre disciplinas primeiro."

  return (
    <section className="na-cascata border-border bg-card rounded-2xl border p-5">
      <h2 className="fonte-display flex items-center gap-2 text-lg font-bold">
        <Plus className="h-4.5 w-4.5" aria-hidden /> Novo link
      </h2>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="grid gap-1.5">
          <Label>O que compartilhar</Label>
          <Select
            value={tipo}
            onValueChange={(v) => {
              setTipo(v as TipoLink)
              setAlvo("")
            }}
          >
            <SelectTrigger className="w-full rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(ROTULO_TIPO) as TipoLink[]).map((t) => (
                <SelectItem key={t} value={t}>
                  {ROTULO_TIPO[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1.5">
          <Label>Destino</Label>
          {opcoes.length > 0 ? (
            <Select value={alvo} onValueChange={setAlvo}>
              <SelectTrigger className="w-full rounded-lg">
                <SelectValue placeholder="Selecione…" />
              </SelectTrigger>
              <SelectContent>
                {opcoes.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.rotulo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="border-border text-muted-foreground rounded-lg border border-dashed px-3 py-2 text-[0.8rem]">
              {vazio}
            </p>
          )}
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="nome-link">Nome (opcional)</Label>
          <Input
            id="nome-link"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex.: Recuperação 3A"
            className="rounded-lg"
          />
        </div>
      </div>

      <Button
        className="mt-4 gap-2 rounded-xl"
        disabled={!alvo || criar.isPending}
        onClick={async () => {
          try {
            const dados = {
              tipo,
              nome: nome.trim(),
              ...(tipo === "nota" ? { notaId: alvo } : {}),
              ...(tipo === "turma" ? { turmaId: alvo } : {}),
              ...(tipo === "disciplina" ? { disciplinaId: alvo } : {}),
            }
            const r = await criar.mutateAsync(dados)
            setAlvo("")
            setNome("")
            toast.success("Link criado", {
              description: "O endereço já foi copiado. Envie para os alunos.",
            })
            void navigator.clipboard?.writeText(urlDoLink(r.link.token)).catch(() => undefined)
          } catch (e) {
            toast.error("Não foi possível criar o link", {
              description: e instanceof Error ? e.message : "Tente novamente em instantes.",
            })
          }
        }}
      >
        {criar.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
        Criar e copiar link
      </Button>
    </section>
  )
}

// Cartão de cada link

function CartaoLink({ link, indice = 0 }: { link: LinkInfo; indice?: number }) {
  const editar = useEditarLink()
  const excluir = useExcluirLink()
  const [copiado, setCopiado] = useState(false)
  const [editando, setEditando] = useState(false)
  const [nome, setNome] = useState(link.nome)
  const [expira, setExpira] = useState(
    link.expiraEm ? new Date(link.expiraEm).toISOString().slice(0, 10) : "",
  )
  // instante do montar: fixa o "agora" sem quebrar a pureza do render
  const [montadoEm] = useState(() => Date.now())

  const url = useMemo(() => urlDoLink(link.token), [link.token])
  const expirado = useMemo(
    () => (link.expiraEm ? new Date(link.expiraEm).getTime() < montadoEm : false),
    [link.expiraEm, montadoEm],
  )
  const disponivel = link.ativo && !expirado
  const aviso =
    link.tipo === "nota" && link.alvoDetalhe === "rascunho"
      ? "A nota ainda é rascunho. Publique para liberar o acesso"
      : ""

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiado(true)
      toast.success("Link copiado", { description: "Envie para a turma." })
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      toast.error("Não foi possível copiar. Selecione o endereço acima e copie manualmente.")
    }
  }

  const salvarEdicao = async () => {
    try {
      await editar.mutateAsync({
        id: link.id,
        dados: {
          nome: nome.trim(),
          expiraEm: expira ? new Date(`${expira}T23:59:59`).toISOString() : null,
        },
      })
      setEditando(false)
      toast.success("Link atualizado")
    } catch (e) {
      toast.error("Não foi possível salvar", {
        description: e instanceof Error ? e.message : undefined,
      })
    }
  }

  return (
    <article
      className={`na-cascata bg-card rounded-2xl border p-4 sm:p-5 ${disponivel ? "border-border" : "border-dashed opacity-80"}`}
      style={{ "--na-i": indice } as React.CSSProperties}
    >
      <div className="flex flex-wrap items-start gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            disponivel
              ? "bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {link.tipo === "nota" ? (
            <BookOpenText className="h-5 w-5" aria-hidden />
          ) : link.tipo === "turma" ? (
            <Users className="h-5 w-5" aria-hidden />
          ) : (
            <GraduationCap className="h-5 w-5" aria-hidden />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="leading-snug font-semibold">{link.nome || ROTULO_TIPO[link.tipo]}</p>
            {disponivel ? (
              <Badge
                variant="secondary"
                className="bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300 gap-1 rounded-md text-[0.65rem]"
              >
                <Check className="h-3 w-3" aria-hidden /> ativo
              </Badge>
            ) : (
              <Badge variant="outline" className="rounded-md text-[0.65rem]">
                {expirado ? "expirado" : "pausado"}
              </Badge>
            )}
            <span className="text-muted-foreground inline-flex items-center gap-1 text-[0.72rem]">
              <ExternalLink className="h-3 w-3" aria-hidden />
              {link.acessos} {link.acessos === 1 ? "acesso" : "acessos"}
            </span>
          </div>
          <p className="text-muted-foreground mt-0.5 text-[0.82rem]">
            {link.alvo}
            {link.alvoDetalhe && link.tipo !== "nota" ? ` · ${link.alvoDetalhe}` : ""}
            {link.expiraEm
              ? ` · expira em ${new Date(link.expiraEm).toLocaleDateString("pt-BR")}`
              : ""}
          </p>

          {aviso ? (
            <p className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[0.7rem] font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-200">
              <Hourglass className="h-3 w-3" aria-hidden /> {aviso}
            </p>
          ) : null}

          {editando ? (
            <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_10rem_auto_auto]">
              <Input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome do link"
                className="h-9 rounded-lg"
                aria-label="Nome do link"
              />
              <Input
                type="date"
                value={expira}
                onChange={(e) => setExpira(e.target.value)}
                className="h-9 rounded-lg"
                aria-label="Data de expiração"
              />
              <Button size="sm" className="h-9 rounded-lg" onClick={salvarEdicao}>
                Salvar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 rounded-lg"
                onClick={() => {
                  setEditando(false)
                  setNome(link.nome)
                  setExpira(link.expiraEm ? new Date(link.expiraEm).toISOString().slice(0, 10) : "")
                }}
              >
                Cancelar
              </Button>
            </div>
          ) : (
            <code className="bg-muted text-muted-foreground mt-2 block truncate rounded-lg px-2.5 py-1.5 font-mono text-[0.72rem]">
              {url}
            </code>
          )}
        </div>

        {/* ações: copiar e abrir sempre visíveis; o resto no menu */}
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 rounded-lg text-xs"
            onClick={copiar}
          >
            {copiado ? (
              <Check className="text-brand-600 h-3.5 w-3.5" aria-hidden />
            ) : (
              <Copy className="h-3.5 w-3.5" aria-hidden />
            )}
            Copiar
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg"
            aria-label="Abrir como aluno"
            title="Abrir como aluno"
            onClick={() => window.open(url, "_blank")}
          >
            <ExternalLink className="h-4 w-4" aria-hidden />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg"
                aria-label="Mais ações do link"
                title="Mais ações"
              >
                <MoreHorizontal className="h-4 w-4" aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="gap-2"
                onClick={() => {
                  setNome(link.nome)
                  setExpira(link.expiraEm ? new Date(link.expiraEm).toISOString().slice(0, 10) : "")
                  setEditando(true)
                }}
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden /> Editar nome e expiração
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2"
                disabled={editar.isPending}
                onClick={async () => {
                  try {
                    await editar.mutateAsync({ id: link.id, dados: { ativo: !link.ativo } })
                    toast.success(link.ativo ? "Link pausado" : "Link reativado")
                  } catch (e) {
                    toast.error("Não foi possível atualizar o link", {
                      description: e instanceof Error ? e.message : undefined,
                    })
                  }
                }}
              >
                <Power className="h-3.5 w-3.5" aria-hidden />
                {link.ativo ? "Pausar link" : "Reativar link"}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2"
                disabled={editar.isPending}
                onClick={async () => {
                  try {
                    await editar.mutateAsync({ id: link.id, dados: { regenerar: true } })
                    toast.success("Novo link gerado", {
                      description: "O endereço antigo deixará de funcionar.",
                    })
                  } catch (e) {
                    toast.error("Não foi possível gerar novo endereço", {
                      description: e instanceof Error ? e.message : undefined,
                    })
                  }
                }}
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden /> Gerar novo endereço
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive gap-2"
                    onSelect={(e) => e.preventDefault()}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden /> Excluir link
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir este link?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Os alunos que ainda tiverem o endereço perderão o acesso imediatamente. As
                      notas não são afetadas.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive hover:bg-destructive/90 text-white"
                      onClick={async () => {
                        try {
                          await excluir.mutateAsync(link.id)
                          toast.success("Link excluído")
                        } catch (e) {
                          toast.error("Não foi possível excluir o link", {
                            description: e instanceof Error ? e.message : undefined,
                          })
                        }
                      }}
                    >
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </article>
  )
}
