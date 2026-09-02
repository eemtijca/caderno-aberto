"use client"

// Conta. Perfil, segurança (senha/e-mail), disciplinas, turmas, backup/importação e exclusão da conta.

import { useRef, useState } from "react"
import {
  Download,
  FileJson,
  FileText,
  GraduationCap,
  Loader2,
  Mail,
  Pencil,
  Plus,
  RefreshCw,
  ShieldAlert,
  Trash2,
  Upload,
  UserRound,
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
import { useQueryClient } from "@tanstack/react-query"
import {
  importarBackup,
  importarNotaArquivo,
  useCriarDisciplina,
  useCriarTurma,
  useDisciplinas,
  useEditarDisciplina,
  useEditarTurma,
  useExcluirDisciplina,
  useExcluirTurma,
  useTurmas,
} from "@/lib/notas/api-client"
import { useSessao } from "@/hooks/use-sessao"
import {
  CORES,
  corDisciplina,
  ICONES_DISCIPLINA,
  nomeIconeValido,
  obterIconeDisciplina,
} from "@/lib/notas/cores"

const SERIES = ["1º ano", "2º ano", "3º ano", "Outro"]

export function VistaConta({ navegar }: { navegar: (para: string) => void }) {
  return (
    <div className="space-y-8 pb-8">
      <div>
        <h1 className="fonte-display text-2xl font-bold">Conta</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Perfil, segurança, disciplinas, turmas e dados. Tudo no espaço privado do Caderno Aberto.
        </p>
      </div>

      <SecaoPerfil />
      <SecaoSeguranca />
      <SecaoDisciplinas />
      <SecaoTurmas />
      <SecaoBackup navegar={navegar} />
      <SecaoExcluirConta />
    </div>
  )
}

// Perfil

function SecaoPerfil() {
  const { usuario, perfil, atualizarPerfil } = useSessao()
  const [nome, setNome] = useState<string | null>(null)
  const [escola, setEscola] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  const valorNome = nome ?? perfil?.nome ?? ""
  const valorEscola = escola ?? perfil?.escola ?? ""
  const sujo = nome !== null || escola !== null

  return (
    <section className="na-cascata border-border bg-card rounded-2xl border p-5">
      <h2 className="fonte-display flex items-center gap-2 text-lg font-bold">
        <UserRound className="h-4.5 w-4.5" aria-hidden /> Perfil
      </h2>
      <p className="text-muted-foreground mt-1 text-sm">
        O nome aparece para os alunos nas notas compartilhadas e nos arquivos de impressão gerados.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="professor">Professor(a)</Label>
          <Input
            id="professor"
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
            setSalvando(true)
            try {
              await atualizarPerfil({ nome: valorNome, escola: valorEscola })
              setNome(null)
              setEscola(null)
              toast.success("Perfil salvo")
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Não foi possível salvar.")
            } finally {
              setSalvando(false)
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
  )
}

// Segurança. Trocar senha e trocar e-mail

function SecaoSeguranca() {
  const { usuario, trocarSenha, trocarEmail } = useSessao()
  const [senha, setSenha] = useState("")
  const [senha2, setSenha2] = useState("")
  const [novoEmail, setNovoEmail] = useState("")
  const [salvandoSenha, setSalvandoSenha] = useState(false)
  const [salvandoEmail, setSalvandoEmail] = useState(false)

  return (
    <section
      className="na-cascata border-border bg-card rounded-2xl border p-5"
      style={{ "--na-i": 1 } as React.CSSProperties}
    >
      <h2 className="fonte-display flex items-center gap-2 text-lg font-bold">
        <ShieldAlert className="h-4.5 w-4.5" aria-hidden /> Segurança
      </h2>

      <div className="mt-4 grid gap-5 sm:grid-cols-2">
        <div className="space-y-2.5">
          <p className="text-sm font-bold">Trocar senha</p>
          <Input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Nova senha (mín. 6 caracteres)"
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
            disabled={salvandoSenha || senha.length < 6 || senha !== senha2}
            onClick={async () => {
              setSalvandoSenha(true)
              try {
                await trocarSenha(senha)
                setSenha("")
                setSenha2("")
                toast.success("Senha alterada")
              } catch (e) {
                toast.error("Não foi possível alterar a senha.", {
                  description: e instanceof Error ? e.message : undefined,
                })
              } finally {
                setSalvandoSenha(false)
              }
            }}
          >
            {salvandoSenha ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            Alterar senha
          </Button>
        </div>

        <div className="space-y-2.5">
          <p className="text-sm font-bold">Trocar e-mail</p>
          <p className="text-muted-foreground text-[0.78rem] leading-snug">
            Atual: {usuario?.email}. O novo endereço recebe um e-mail de confirmação. A troca
            somente será efetivada após confirmação.
          </p>
          <Input
            type="email"
            value={novoEmail}
            onChange={(e) => setNovoEmail(e.target.value)}
            placeholder="novo@email.br"
            className="rounded-lg"
            aria-label="Novo e-mail"
          />
          <Button
            variant="outline"
            className="gap-2 rounded-lg"
            disabled={salvandoEmail || !novoEmail.includes("@") || novoEmail === usuario?.email}
            onClick={async () => {
              setSalvandoEmail(true)
              try {
                await trocarEmail(novoEmail.trim())
                setNovoEmail("")
                toast.success("Confirmação enviada", {
                  description: "Siga as instruções no novo e-mail para concluir.",
                })
              } catch (e) {
                toast.error("Não foi possível enviar a confirmação.", {
                  description: e instanceof Error ? e.message : undefined,
                })
              } finally {
                setSalvandoEmail(false)
              }
            }}
          >
            {salvandoEmail ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            Enviar confirmação
          </Button>
        </div>
      </div>
    </section>
  )
}

// Disciplinas

// rótulo do valor do select de ícones: ícone da disciplina ao lado do nome
function ValorIcone({ nome }: { nome: string }) {
  // despacho dinâmico de ícone: referência estável vinda do mapa do módulo
  const Icon = obterIconeDisciplina(nome)
  return (
    <span className="flex items-center gap-2">
      {/* eslint-disable-next-line react-hooks/static-components -- ícone estável do mapa do módulo */}
      <Icon className="h-4 w-4" aria-hidden /> {nome}
    </span>
  )
}

function SecaoDisciplinas() {
  const disciplinasQ = useDisciplinas()
  const { data: disciplinas, isLoading: carregando } = disciplinasQ
  const criar = useCriarDisciplina()
  const editar = useEditarDisciplina()
  const excluir = useExcluirDisciplina()

  const [nome, setNome] = useState("")
  const [cor, setCor] = useState("verde")
  const [icone, setIcone] = useState("BookOpen")
  const [editando, setEditando] = useState<string | null>(null)
  const [nomeEditado, setNomeEditado] = useState("")

  return (
    <section
      className="na-cascata border-border bg-card rounded-2xl border p-5"
      style={{ "--na-i": 2 } as React.CSSProperties}
    >
      <h2 className="fonte-display flex items-center gap-2 text-lg font-bold">
        <GraduationCap className="h-4.5 w-4.5" aria-hidden /> Disciplinas
      </h2>
      <p className="text-muted-foreground mt-1 text-sm">
        Qualquer componente curricular. Cada disciplina tem cor e ícone próprios.
      </p>

      <div className="mt-4 space-y-2" aria-busy={carregando || undefined}>
        {carregando ? (
          <>
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-5/6 rounded-xl" />
          </>
        ) : (
          (disciplinas ?? []).map((d) => {
            const c = corDisciplina(d.cor)
            const emEdicao = editando === d.id
            return (
              <div
                key={d.id}
                className={`flex flex-wrap items-center gap-2.5 rounded-xl border ${c.borda} ${c.fundoSuave} px-3.5 py-2.5`}
              >
                {emEdicao ? (
                  <>
                    <Input
                      value={nomeEditado}
                      onChange={(e) => setNomeEditado(e.target.value)}
                      className="h-8 w-44 rounded-lg"
                      aria-label="Novo nome da disciplina"
                    />
                    <Select value={cor} onValueChange={setCor}>
                      <SelectTrigger size="sm" className="h-8 w-36 rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CORES.map((cc) => (
                          <SelectItem key={cc.chave} value={cc.chave}>
                            <span className="flex items-center gap-2">
                              <span
                                className={`h-2.5 w-2.5 rounded-full ${cc.ponto}`}
                                aria-hidden
                              />
                              {cc.nome}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      className="h-8 rounded-lg"
                      onClick={async () => {
                        try {
                          await editar.mutateAsync({
                            id: d.id,
                            dados: { nome: nomeEditado, cor },
                          })
                          setEditando(null)
                          toast.success("Disciplina atualizada")
                        } catch (e) {
                          toast.error("Não foi possível salvar a disciplina.", {
                            description: e instanceof Error ? e.message : undefined,
                          })
                        }
                      }}
                    >
                      Salvar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 rounded-lg"
                      onClick={() => setEditando(null)}
                    >
                      Cancelar
                    </Button>
                  </>
                ) : (
                  <>
                    <span className={`h-3 w-3 rounded-full ${c.ponto}`} aria-hidden />
                    <span className="font-bold">{d.nome}</span>
                    <Badge variant="secondary" className={`rounded-md text-[0.65rem] ${c.chip}`}>
                      {d.totalNotas} {d.totalNotas === 1 ? "nota" : "notas"}
                    </Badge>
                    <div className="ml-auto flex gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditando(d.id)
                          setNomeEditado(d.nome)
                          setCor(d.cor)
                        }}
                        className="text-muted-foreground hover:bg-accent hover:text-foreground flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                        aria-label={`Editar ${d.nome}`}
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" aria-hidden />
                      </button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            type="button"
                            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                            aria-label={`Excluir ${d.nome}`}
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir {d.nome}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              {d.totalNotas > 0
                                ? `Esta disciplina tem ${d.totalNotas} nota(s). As notas continuam existindo, apenas perdem a disciplina.`
                                : "A disciplina será removida. Não há notas vinculadas."}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive hover:bg-destructive/90 text-white"
                              onClick={async () => {
                                try {
                                  await excluir.mutateAsync(d.id)
                                  toast.success("Disciplina excluída")
                                } catch (e) {
                                  toast.error("Não foi possível excluir a disciplina.", {
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
                    </div>
                  </>
                )}
              </div>
            )
          })
        )}
      </div>

      <div className="border-border mt-4 grid gap-2.5 rounded-xl border border-dashed p-3.5 sm:grid-cols-[1fr_auto_auto_auto]">
        <Input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Nova disciplina (ex.: Química)"
          className="h-9 rounded-lg"
          aria-label="Nome da nova disciplina"
        />
        <Select value={cor} onValueChange={setCor}>
          <SelectTrigger size="sm" className="h-9 w-36 rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CORES.map((cc) => (
              <SelectItem key={cc.chave} value={cc.chave}>
                <span className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${cc.ponto}`} aria-hidden />
                  {cc.nome}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={icone} onValueChange={setIcone}>
          <SelectTrigger size="sm" className="h-9 w-40 rounded-lg">
            <SelectValue>
              <ValorIcone nome={icone} />
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {ICONES_DISCIPLINA.map((i) => {
              const Icon = obterIconeDisciplina(i)
              return (
                <SelectItem key={i} value={i}>
                  <span className="flex items-center gap-2">
                    <Icon className="h-4 w-4" aria-hidden /> {i}
                  </span>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
        <Button
          className="h-9 gap-1.5 rounded-lg"
          disabled={!nome.trim() || criar.isPending}
          onClick={async () => {
            try {
              await criar.mutateAsync({ nome: nome.trim(), cor, icone: nomeIconeValido(icone) })
              setNome("")
              toast.success("Disciplina criada")
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Erro ao criar.")
            }
          }}
        >
          <Plus className="h-4 w-4" aria-hidden /> Criar
        </Button>
      </div>
    </section>
  )
}

// Turmas

function SecaoTurmas() {
  const turmasQ = useTurmas()
  const { data: turmas, isLoading: carregando } = turmasQ
  const criar = useCriarTurma()
  const editar = useEditarTurma()
  const excluir = useExcluirTurma()

  const [nome, setNome] = useState("")
  const [serie, setSerie] = useState("1º ano")
  const [anoLetivo, setAnoLetivo] = useState(new Date().getFullYear())
  const [editando, setEditando] = useState<string | null>(null)
  const [nomeEditado, setNomeEditado] = useState("")
  const [serieEditada, setSerieEditada] = useState("")

  const anos = [...new Set((turmas ?? []).map((t) => t.anoLetivo))].sort((a, b) => b - a)

  return (
    <section
      className="na-cascata border-border bg-card rounded-2xl border p-5"
      style={{ "--na-i": 3 } as React.CSSProperties}
    >
      <h2 className="fonte-display flex items-center gap-2 text-lg font-bold">
        <GraduationCap className="h-4.5 w-4.5" aria-hidden /> Turmas
      </h2>
      <p className="text-muted-foreground mt-1 text-sm">
        As turmas alimentam a organização automática (Ano → Turma → Mês) e os links por turma.
      </p>

      {carregando ? (
        <div className="mt-4 space-y-3" aria-busy="true">
          <Skeleton className="h-12 w-40 rounded-xl" />
          <Skeleton className="h-12 w-64 rounded-xl" />
        </div>
      ) : anos.length > 0 ? (
        <div className="mt-4 space-y-3">
          {anos.map((ano) => (
            <div key={ano}>
              <p className="text-muted-foreground text-[0.7rem] font-bold tracking-wider uppercase">
                {ano}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {(turmas ?? [])
                  .filter((t) => t.anoLetivo === ano)
                  .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
                  .map((t) => {
                    const emEdicao = editando === t.id
                    return emEdicao ? (
                      <div
                        key={t.id}
                        className="border-border bg-background flex flex-wrap items-center gap-1.5 rounded-xl border px-3 py-2"
                      >
                        <Input
                          value={nomeEditado}
                          onChange={(e) => setNomeEditado(e.target.value.toUpperCase())}
                          className="h-8 w-20 rounded-lg"
                          aria-label="Novo nome da turma"
                        />
                        <Select value={serieEditada} onValueChange={setSerieEditada}>
                          <SelectTrigger size="sm" className="h-8 w-28 rounded-lg">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SERIES.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          className="h-8 rounded-lg"
                          onClick={async () => {
                            try {
                              await editar.mutateAsync({
                                id: t.id,
                                dados: { nome: nomeEditado, serie: serieEditada },
                              })
                              setEditando(null)
                              toast.success("Turma atualizada")
                            } catch (e) {
                              toast.error("Não foi possível salvar a turma.", {
                                description: e instanceof Error ? e.message : undefined,
                              })
                            }
                          }}
                        >
                          Salvar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 rounded-lg"
                          onClick={() => setEditando(null)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <div
                        key={t.id}
                        className="border-border bg-background flex items-center gap-2 rounded-xl border px-3 py-2"
                      >
                        <span className="fonte-display font-bold">{t.nome}</span>
                        <span className="text-muted-foreground text-[0.72rem]">{t.serie}</span>
                        <span className="text-muted-foreground text-[0.72rem]">
                          · {t.totalNotas} {t.totalNotas === 1 ? "nota" : "notas"}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setEditando(t.id)
                            setNomeEditado(t.nome)
                            setSerieEditada(t.serie)
                          }}
                          className="text-muted-foreground/70 hover:bg-accent hover:text-foreground flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                          aria-label={`Editar turma ${t.nome}`}
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" aria-hidden />
                        </button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button
                              type="button"
                              className="text-muted-foreground/60 hover:bg-destructive/10 hover:text-destructive flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                              aria-label={`Excluir turma ${t.nome}`}
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4" aria-hidden />
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir turma {t.nome}?</AlertDialogTitle>
                              <AlertDialogDescription>
                                {t.totalNotas > 0
                                  ? `Há ${t.totalNotas} nota(s) vinculadas. Elas continuam existindo, apenas perdem esta turma.`
                                  : "A turma será removida."}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive hover:bg-destructive/90 text-white"
                                onClick={async () => {
                                  try {
                                    await excluir.mutateAsync(t.id)
                                    toast.success("Turma excluída")
                                  } catch (e) {
                                    toast.error("Não foi possível excluir a turma.", {
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
                      </div>
                    )
                  })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground mt-3 text-sm">Nenhuma turma cadastrada ainda.</p>
      )}

      <div className="border-border mt-4 grid gap-2.5 rounded-xl border border-dashed p-3.5 sm:grid-cols-[auto_1fr_auto_auto]">
        <Input
          value={nome}
          onChange={(e) => setNome(e.target.value.toUpperCase())}
          placeholder="Turma (ex.: 3A)"
          className="h-9 w-28 rounded-lg"
          aria-label="Nome da nova turma"
        />
        <Select value={serie} onValueChange={setSerie}>
          <SelectTrigger size="sm" className="h-9 w-full rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SERIES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="number"
          value={anoLetivo}
          onChange={(e) => setAnoLetivo(Number(e.target.value) || new Date().getFullYear())}
          className="h-9 w-24 rounded-lg"
          aria-label="Ano letivo"
        />
        <Button
          className="h-9 gap-1.5 rounded-lg"
          disabled={!nome.trim() || criar.isPending}
          onClick={async () => {
            try {
              await criar.mutateAsync({ nome: nome.trim(), serie, anoLetivo })
              setNome("")
              toast.success("Turma criada")
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Erro ao criar.")
            }
          }}
        >
          <Plus className="h-4 w-4" aria-hidden /> Criar
        </Button>
      </div>
    </section>
  )
}

// Backup e importação

function SecaoBackup({ navegar }: { navegar: (para: string) => void }) {
  const qc = useQueryClient()
  const inputBackup = useRef<HTMLInputElement>(null)
  const inputNota = useRef<HTMLInputElement>(null)
  const [importando, setImportando] = useState(false)

  const recarregar = () => {
    qc.invalidateQueries()
    window.location.reload()
  }

  const importarTudo = async (arquivo: File) => {
    setImportando(true)
    try {
      const conteudo = await arquivo.text()
      await importarBackup(conteudo)
      toast.success("Backup importado", { description: "Os dados anteriores foram substituídos." })
      setTimeout(recarregar, 900)
    } catch (e) {
      toast.error("Falha na importação", {
        description: e instanceof Error ? e.message : "Arquivo inválido.",
      })
    } finally {
      setImportando(false)
    }
  }

  const importarNota = async (arquivo: File) => {
    setImportando(true)
    try {
      const conteudo = await arquivo.text()
      const formato = arquivo.name.endsWith(".json") ? "json" : "md"
      const nota = await importarNotaArquivo(conteudo, formato)
      toast.success("Nota importada", { description: nota.titulo })
      navegar(`/editor/${nota.id}`)
    } catch (e) {
      toast.error("Falha na importação", {
        description: e instanceof Error ? e.message : "Verifique o formato do arquivo.",
      })
    } finally {
      setImportando(false)
    }
  }

  return (
    <section
      className="na-cascata border-border bg-card rounded-2xl border p-5"
      style={{ "--na-i": 4 } as React.CSSProperties}
    >
      <h2 className="fonte-display flex items-center gap-2 text-lg font-bold">
        <Download className="h-4.5 w-4.5" aria-hidden /> Backup e importação
      </h2>
      <p className="text-muted-foreground mt-1 text-sm">
        O backup completo inclui disciplinas, turmas, notas, links e imagens. Tudo em um único
        arquivo JSON, pronto para restaurar em qualquer conta.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="border-border space-y-2 rounded-xl border p-4">
          <p className="text-sm font-bold">Exportar tudo</p>
          <p className="text-muted-foreground text-[0.8rem] leading-snug">
            Baixe o arquivo JSON com todos os dados. Guarde uma cópia: é a garantia contra perdas.
          </p>
          <Button
            variant="outline"
            className="gap-2 rounded-lg"
            onClick={() => window.open("/api/backup", "_blank")}
          >
            <FileJson className="h-4 w-4" aria-hidden /> Baixar backup completo
          </Button>
        </div>

        <div className="border-border space-y-2 rounded-xl border p-4">
          <p className="text-sm font-bold">Importar</p>
          <p className="text-muted-foreground text-[0.8rem] leading-snug">
            Restaure um backup (substitui tudo) ou importe uma nota única (.md ou .json gerados pelo
            app, incluindo o formato antigo &ldquo;Notas de Aula&rdquo;).
          </p>
          <input
            ref={inputBackup}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void importarTudo(f)
            }}
          />
          <input
            ref={inputNota}
            type="file"
            accept=".md,.json,text/markdown,application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void importarNota(f)
            }}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="gap-2 rounded-lg"
              disabled={importando}
              onClick={() => inputBackup.current?.click()}
            >
              <Upload className="h-4 w-4" aria-hidden /> Restaurar backup
            </Button>
            <Button
              variant="outline"
              className="gap-2 rounded-lg"
              disabled={importando}
              onClick={() => inputNota.current?.click()}
            >
              <FileText className="h-4 w-4" aria-hidden /> Importar nota
            </Button>
            {importando ? (
              <span className="text-muted-foreground flex items-center gap-1.5 text-sm">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" aria-hidden /> importando…
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}

// Seção de exclusão com carência de 24 horas. Dupla confirmação.
function SecaoExcluirConta() {
  const { perfil, solicitarExclusao, restaurarConta } = useSessao()
  const [senha, setSenha] = useState("")
  const [confirmacao, setConfirmacao] = useState("")
  const [aceita, setAceita] = useState(false)
  const [etapa, setEtapa] = useState<1 | 2>(1)
  const [excluindo, setExcluindo] = useState(false)
  const [aberto, setAberto] = useState(false)

  const pendente = Boolean(
    (perfil as unknown as { exclusaoSolicitadaEm?: string })?.exclusaoSolicitadaEm,
  )
  const expiraEm = (perfil as unknown as { expiraEm?: string })?.expiraEm

  if (pendente) {
    return (
      <section className="rounded-2xl border border-amber-300 bg-amber-50 p-5 dark:border-amber-900 dark:bg-amber-950/30">
        <h2 className="fonte-display flex items-center gap-2 text-lg font-bold text-amber-800 dark:text-amber-300">
          <Trash2 className="h-4.5 w-4.5" aria-hidden /> Exclusão solicitada
        </h2>
        <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
          A conta será removida permanentemente em{" "}
          {expiraEm ? new Date(expiraEm).toLocaleString("pt-BR") : "24 horas"}. Os links públicos
          estão inativos. É possível restaurar dentro do prazo.
        </p>
        <div className="mt-4 flex gap-2">
          <Button
            onClick={async () => {
              try {
                await restaurarConta()
                toast.success("Conta restaurada. O acesso foi restabelecido.")
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Falha ao restaurar.")
              }
            }}
            className="rounded-xl"
          >
            Restaurar conta
          </Button>
        </div>
      </section>
    )
  }

  return (
    <section className="border-destructive/40 bg-destructive/5 rounded-2xl border p-5">
      <h2 className="fonte-display text-destructive flex items-center gap-2 text-lg font-bold">
        <Trash2 className="h-4.5 w-4.5" aria-hidden /> Excluir a conta
      </h2>
      <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
        Solicita a remoção permanente da conta, notas, disciplinas, turmas, links e imagens. Existe
        carência de 24 horas para restauração. Baixe um backup antes de confirmar.
      </p>

      <AlertDialog open={aberto} onOpenChange={setAberto}>
        <AlertDialogTrigger asChild>
          <Button
            variant="destructive"
            className="mt-4 gap-2 rounded-xl"
            onClick={() => {
              setEtapa(1)
              setAceita(false)
              setSenha("")
              setConfirmacao("")
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
                      serão desativados. A remoção é permanente após o prazo.
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
                setAceita(false)
                setSenha("")
                setConfirmacao("")
                setEtapa(1)
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
                    e.preventDefault()
                    setExcluindo(true)
                    try {
                      const r = await solicitarExclusao(senha, confirmacao)
                      toast.success("Solicitação registrada", {
                        description: `Expira em ${new Date(r.expiraEm).toLocaleString("pt-BR")}`,
                      })
                      setAberto(false)
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : "Erro ao solicitar.")
                    } finally {
                      setExcluindo(false)
                      setSenha("")
                      setConfirmacao("")
                      setEtapa(1)
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
  )
}
