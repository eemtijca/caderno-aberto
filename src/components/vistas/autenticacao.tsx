"use client"

// Autenticação. Landing pública e formulários de entrada, cadastro e redefinição de senha.

import { useEffect, useState } from "react"
import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  Eye,
  EyeOff,
  FileDown,
  Link2,
  Loader2,
  Lock,
  MailCheck,
  MonitorSmartphone,
  NotebookPen,
  ShieldCheck,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useSessao } from "@/hooks/use-sessao"
import type { Rota } from "@/lib/rota"
import { DEMO_NOTA } from "@/lib/notas/demo"
import { BlocosView } from "@/components/notas/blocos-view"
import { corDisciplina } from "@/lib/notas/cores"

export function VistaAutenticação({
  rota,
  navegar,
}: {
  rota: Rota
  navegar: (para: string) => void
}) {
  const { modoRecuperacao } = useSessao()

  if (modoRecuperacao) return <PainelAuth modo="redefinir" navegar={navegar} />
  if (rota.vista === "entrar") return <PainelAuth modo="entrar" navegar={navegar} />
  if (rota.vista === "cadastro") return <PainelAuth modo="cadastro" navegar={navegar} />
  if (rota.vista === "redefinir") return <PainelAuth modo="redefinir" navegar={navegar} />
  return <Landing navegar={navegar} />
}

// Landing. Apresentação do aplicativo para visitantes não autenticados.

function Landing({ navegar }: { navegar: (para: string) => void }) {
  const [showDemo, setShowDemo] = useState(false)
  return (
    <div className="bg-background min-h-screen">
      <header className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="flex items-center gap-2.5">
          <span className="bg-primary text-primary-foreground flex h-9 w-9 items-center justify-center rounded-xl">
            <NotebookPen className="h-4.5 w-4.5" aria-hidden />
          </span>
          <span className="fonte-display text-lg font-bold">Caderno Aberto</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => navegar("/entrar")} className="rounded-xl">
            Entrar
          </Button>
          <Button onClick={() => navegar("/cadastro")} className="rounded-xl">
            Criar conta
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 pt-10 pb-20 sm:px-6 sm:pt-16 lg:px-8 lg:pt-20 xl:px-10 xl:pt-24">
        <section className="mx-auto max-w-3xl text-center lg:max-w-4xl xl:max-w-5xl">
          <p className="border-brand-200 bg-brand-50 text-brand-800 dark:border-brand-900 dark:bg-brand-950/60 dark:text-brand-300 mx-auto inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[0.72rem] font-bold tracking-wider uppercase">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden /> Aberto e gratuito
          </p>
          <h1 className="fonte-display mx-auto mt-5 max-w-3xl text-4xl leading-tight font-extrabold tracking-tight sm:text-5xl lg:max-w-4xl lg:text-6xl xl:max-w-5xl xl:text-7xl">
            Suas notas de aula, <span className="text-primary">abertas para os alunos</span>
          </h1>
          <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-base leading-relaxed sm:text-lg lg:max-w-3xl lg:text-xl">
            Escreva com o editor visual de blocos. Caixas de conceito, exemplos, fórmulas e
            exercícios em três níveis. O Caderno Aberto gera a versão web, o PDF de impressão A4 e
            os arquivos de impressão e de texto, e entrega o conteúdo aos estudantes por links
            únicos com controle do professor.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Button
              onClick={() => navegar("/cadastro")}
              className="h-11 gap-2 rounded-xl px-6 text-base"
            >
              Começar agora <ArrowRight className="h-4.5 w-4.5" aria-hidden />
            </Button>
            <Button
              variant="outline"
              onClick={() => navegar("/l/demo-landing")}
              className="h-11 gap-2 rounded-xl px-6 text-base"
            >
              Ver exemplo como aluno
            </Button>
          </div>
          <p className="text-muted-foreground mt-3 text-center text-sm">
            Já tem conta?{" "}
            <button
              type="button"
              onClick={() => navegar("/entrar")}
              className="text-primary font-semibold hover:underline"
            >
              Entrar
            </button>
          </p>
        </section>

        <section className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:gap-6">
          <Recurso
            icone={BookOpenCheck}
            titulo="Editor de blocos"
            texto="Rótulos de definição, caixas COPIAR, exemplos, dicas, tabelas, figuras e diagramas. Sem precisar digitar códigos."
          />
          <Recurso
            icone={Link2}
            titulo="Links gerenciáveis"
            texto="Compartilhe uma nota, uma turma ou a disciplina inteira. Pause, gere um novo endereço ou defina validade com controle total."
          />
          <Recurso
            icone={FileDown}
            titulo="Exportação completa"
            texto="PDF A4 em duas colunas pronto para impressão, arquivo para impressão e arquivo de texto. Tudo com um toque."
          />
        </section>

        <section className="mt-14 grid gap-6 lg:mt-20">
          <div className="text-center">
            <p className="text-brand-700 dark:text-brand-300 text-[0.72rem] font-bold tracking-widest uppercase">
              Como funciona
            </p>
            <h2 className="fonte-display mt-2 text-2xl font-bold lg:text-3xl">
              Três passos, do quadro ao celular
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:gap-6">
            <Recurso
              icone={NotebookPen}
              titulo="1. Escreva"
              texto="Arraste blocos, veja a prévia ao vivo e use o corretor de fórmulas. O editor cuida da formatação."
            />
            <Recurso
              icone={BookOpenCheck}
              titulo="2. Organize"
              texto="Ano letivo, turma e disciplina organizam tudo automaticamente. Rascunhos ficam só com você."
            />
            <Recurso
              icone={Link2}
              titulo="3. Entregue"
              texto="Gere um link único por nota, turma ou disciplina. Pause, reative ou acompanhe os acessos."
            />
          </div>
        </section>

        {!showDemo ? (
          <section className="bg-card mt-14 rounded-3xl border border-dashed p-8 text-center">
            <h3 className="fonte-display text-lg font-bold">Veja como o aluno vê</h3>
            <p className="text-muted-foreground mt-1 text-sm">
              Prévia com fórmulas, gráfico e exercícios — sem sair da página.
            </p>
            <Button onClick={() => setShowDemo(true)} className="mt-4 gap-2 rounded-xl">
              <Eye className="h-4 w-4" aria-hidden /> Ver prévia como aluno aqui
            </Button>
            <p className="text-muted-foreground mt-2 text-xs">
              ou{" "}
              <button onClick={() => navegar("/l/demo-landing")} className="underline">
                Abrir como aluno (página cheia)
              </button>
            </p>
          </section>
        ) : (
          <section className="mt-14" id="demo-preview">
            <DemoPreview navegar={navegar} onFechar={() => setShowDemo(false)} />
          </section>
        )}

        <section className="border-border bg-card mt-14 grid gap-4 rounded-3xl border p-6 sm:grid-cols-2 sm:p-8 lg:mt-20 lg:p-10 xl:p-12">
          <div className="flex gap-3">
            <MonitorSmartphone className="text-primary mt-0.5 h-5 w-5 shrink-0" aria-hidden />
            <div>
              <p className="font-bold">Leitura pensada para o celular</p>
              <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                Os alunos abrem o link no celular. Fórmulas nítidas, quiz com correção na hora e
                gabarito que pode ser ocultado.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <ShieldCheck className="text-primary mt-0.5 h-5 w-5 shrink-0" aria-hidden />
            <div>
              <p className="font-bold">Cada conta é um espaço privado</p>
              <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                Cada professor tem seu espaço isolado. A mesma plataforma atende qualquer comunidade
                com segurança garantida pelo banco de dados.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-14 lg:mt-20">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="fonte-display text-2xl font-bold lg:text-3xl">Perguntas frequentes</h2>
            <p className="text-muted-foreground mt-2 text-sm">
              Tire as dúvidas mais comuns antes de começar.
            </p>
          </div>
          <div className="mx-auto mt-6 max-w-3xl space-y-3">
            <details className="border-border bg-card rounded-xl border p-4">
              <summary className="cursor-pointer font-semibold">
                Preciso saber programar ou digitar códigos?
              </summary>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                Não. O editor é visual. Use os botões para negrito, fórmula e destaque. O sistema
                cuida do resto.
              </p>
            </details>
            <details className="border-border bg-card rounded-xl border p-4">
              <summary className="cursor-pointer font-semibold">
                O aluno precisa criar conta?
              </summary>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                Não. Basta abrir o link. Você acompanha quantos acessos cada link recebeu.
              </p>
            </details>
            <details className="border-border bg-card rounded-xl border p-4">
              <summary className="cursor-pointer font-semibold">
                Posso imprimir ou usar sem internet?
              </summary>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                Sim. A versão de leitura é feita para impressão em A4 com duas colunas. Use o botão
                Imprimir do navegador.
              </p>
            </details>
            <details className="border-border bg-card rounded-xl border p-4">
              <summary className="cursor-pointer font-semibold">
                Meus rascunhos aparecem para os alunos?
              </summary>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                Nunca. Apenas notas publicadas ficam visíveis. Links pausados mostram Link
                indisponível.
              </p>
            </details>
            <details className="border-border bg-card rounded-xl border p-4">
              <summary className="cursor-pointer font-semibold">É realmente gratuito?</summary>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                Sim. Código aberto com licença MIT. Você pode usar a instância pública ou hospedar a
                sua.
              </p>
            </details>
          </div>
        </section>

        <section className="mt-14 text-center lg:mt-20">
          <h2 className="fonte-display text-2xl font-bold lg:text-3xl">
            Comece pela primeira nota. Leva dois minutos.
          </h2>
          <p className="text-muted-foreground mx-auto mt-2 max-w-xl text-sm">
            Confirmação por e-mail. Sem cartão. Sem complicação.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button
              onClick={() => navegar("/cadastro")}
              className="h-11 gap-2 rounded-xl px-6 text-base"
            >
              Criar conta gratuita <ArrowRight className="h-4.5 w-4.5" aria-hidden />
            </Button>
            <Button
              variant="outline"
              onClick={() => navegar("/l/demo-landing")}
              className="h-11 rounded-xl px-6 text-base"
            >
              Ver exemplo como aluno
            </Button>
          </div>
          <p className="text-muted-foreground mt-6 flex items-center justify-center gap-1.5 text-[0.72rem]">
            <a
              href="https://github.com/eemtijca/caderno-aberto"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 hover:underline"
            >
              <span className="h-3 w-3 rounded-sm border border-current" aria-hidden /> Código no
              GitHub
            </a>
            <span>·</span>
            <span>Código aberto MIT</span>
          </p>
        </section>

        <footer className="border-border text-muted-foreground mt-12 flex flex-col items-center justify-between gap-2 border-t pt-6 text-center text-[0.75rem] sm:flex-row">
          <span>Caderno Aberto · Código aberto · Licença MIT</span>
          <a
            href="https://github.com/eemtijca/caderno-aberto"
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground hover:underline"
          >
            github.com/eemtijca/caderno-aberto
          </a>
        </footer>
      </main>
    </div>
  )
}

function DemoPreview({
  navegar,
  onFechar,
}: {
  navegar: (para: string) => void
  onFechar?: () => void
}) {
  const [mostrarGabarito, setMostrarGabarito] = useState(false)
  return (
    <section className="border-border bg-card overflow-hidden rounded-3xl border">
      <div className="border-border bg-muted/30 flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:px-6">
        <p className="text-muted-foreground text-[0.72rem] font-bold tracking-widest uppercase">
          Prévia — como o aluno vê
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 rounded-lg text-xs"
            onClick={() => setMostrarGabarito(!mostrarGabarito)}
          >
            {mostrarGabarito ? (
              <>
                <EyeOff className="mr-1 h-3.5 w-3.5" aria-hidden /> Ocultar gabarito
              </>
            ) : (
              <>
                <Eye className="mr-1 h-3.5 w-3.5" aria-hidden /> Mostrar gabarito
              </>
            )}
          </Button>
          <Button
            size="sm"
            className="h-8 rounded-lg text-xs"
            onClick={() => navegar("/l/demo-landing")}
          >
            Abrir como aluno
          </Button>
          {onFechar ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1 rounded-lg text-xs"
              onClick={onFechar}
            >
              <X className="h-3.5 w-3.5" aria-hidden /> Fechar prévia
            </Button>
          ) : null}
        </div>
      </div>
      <div className="p-4 sm:p-6">
        <DemoNotaView mostrarGabarito={mostrarGabarito} />
      </div>
    </section>
  )
}

function DemoNotaView({ mostrarGabarito }: { mostrarGabarito: boolean }) {
  const cor = corDisciplina(DEMO_NOTA.disciplina?.cor)
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-md px-2 py-1 text-xs font-semibold ${cor.chip}`}>
          {DEMO_NOTA.disciplina?.nome}
        </span>
        <span className="text-muted-foreground text-xs">
          {DEMO_NOTA.turmas.map((t) => t.nome).join(", ")} · {DEMO_NOTA.mes}/{DEMO_NOTA.anoLetivo}
        </span>
      </div>
      <h3 className="fonte-display text-xl font-bold sm:text-2xl">{DEMO_NOTA.titulo}</h3>
      <p className="text-muted-foreground text-sm">{DEMO_NOTA.sobre}</p>
      <BlocosView blocos={DEMO_NOTA.blocos} mostrarGabarito={mostrarGabarito} />
    </div>
  )
}

function Recurso({
  icone: Icone,
  titulo,
  texto,
}: {
  icone: typeof BookOpenCheck
  titulo: string
  texto: string
}) {
  return (
    <div className="border-border bg-card rounded-2xl border p-5">
      <span className="bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300 flex h-10 w-10 items-center justify-center rounded-xl">
        <Icone className="h-5 w-5" aria-hidden />
      </span>
      <p className="fonte-display mt-3 font-bold">{titulo}</p>
      <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">{texto}</p>
    </div>
  )
}

// Painel de autenticação. Formulários de entrada, cadastro e redefinição.

type Modo = "entrar" | "cadastro" | "redefinir"

function PainelAuth({ modo, navegar }: { modo: Modo; navegar: (para: string) => void }) {
  const sessao = useSessao()
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [senha2, setSenha2] = useState("")
  const [nome, setNome] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState("")
  const [sucesso, setSucesso] = useState("")

  // limpa mensagens ao trocar de modo
  useEffect(() => {
    setErro("")
    setSucesso("")
  }, [modo])

  const [reenvioOk, setReenvioOk] = useState(false)
  const submeter = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro("")
    setSucesso("")
    setEnviando(true)
    try {
      if (modo === "entrar") {
        await sessao.entrar(email.trim(), senha)
        navegar("/")
      } else if (modo === "cadastro") {
        if (senha.length < 6) throw new Error("A senha deve ter pelo menos 6 caracteres.")
        if (senha !== senha2) throw new Error("As senhas não conferem.")
        await sessao.cadastrar(nome.trim(), email.trim(), senha)
        setSucesso("Conta criada. Confirme o e-mail para ativar o acesso.")
      } else {
        if (sessao.usuario && sessao.modoRecuperacao) {
          if (senha.length < 6) throw new Error("A senha deve ter pelo menos 6 caracteres.")
          if (senha !== senha2) throw new Error("As senhas não conferem.")
          await sessao.concluirRedefinicao(senha)
          setSucesso("Senha redefinida. O acesso foi restabelecido.")
          setTimeout(() => navegar("/"), 1200)
        } else {
          await sessao.pedirRedefinicao(email.trim())
          setSucesso("Se existir conta com este e-mail, o link de redefinição será enviado.")
        }
      }
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro inesperado.")
    } finally {
      setEnviando(false)
    }
  }
  const reenviar = async () => {
    try {
      setEnviando(true)
      await sessao.reenviarConfirmacao(email.trim())
      setReenvioOk(true)
      setSucesso("E-mail de confirmação reenviado. Verifique a caixa de entrada.")
      setTimeout(() => setReenvioOk(false), 3000)
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Falha ao reenviar.")
    } finally {
      setEnviando(false)
    }
  }

  const emRecuperacao = Boolean(modo === "redefinir" && sessao.usuario && sessao.modoRecuperacao)

  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <button
          type="button"
          onClick={() => navegar("/")}
          className="mx-auto flex items-center gap-2.5"
          aria-label="Página inicial"
        >
          <span className="bg-primary text-primary-foreground flex h-10 w-10 items-center justify-center rounded-xl">
            <NotebookPen className="h-5 w-5" aria-hidden />
          </span>
          <span className="fonte-display text-lg font-bold">Caderno Aberto</span>
        </button>

        <div className="border-border bg-card mt-6 rounded-2xl border p-6 shadow-sm">
          <h1 className="fonte-display text-xl font-bold">
            {modo === "entrar"
              ? "Entrar"
              : modo === "cadastro"
                ? "Criar conta de professor"
                : emRecuperacao
                  ? "Definir nova senha"
                  : "Redefinir a senha"}
          </h1>
          <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
            {modo === "entrar"
              ? "Acesse suas notas, turmas e links de compartilhamento."
              : modo === "cadastro"
                ? "Gratuito. Cada professor tem seus dados isolados e privados."
                : emRecuperacao
                  ? "Escolha a nova senha da sua conta."
                  : "Enviaremos um link de redefinição para o seu e-mail."}
          </p>

          <form onSubmit={submeter} className="mt-5 space-y-3.5">
            {modo === "cadastro" ? (
              <Campo
                id="nome"
                rotulo="Seu nome"
                tipo="text"
                valor={nome}
                onChange={setNome}
                placeholder="Prof. Maria da Silva"
                autoFocus
              />
            ) : null}

            {!emRecuperacao ? (
              <Campo
                id="email"
                rotulo="E-mail"
                tipo="email"
                valor={email}
                onChange={setEmail}
                placeholder="nome@escola.br"
                autoFocus={modo !== "cadastro"}
              />
            ) : null}

            {modo !== "redefinir" || emRecuperacao ? (
              <>
                <Campo
                  id="senha"
                  rotulo={emRecuperacao ? "Nova senha" : "Senha"}
                  tipo="password"
                  valor={senha}
                  onChange={setSenha}
                  placeholder="••••••••"
                />
                {modo !== "entrar" ? (
                  <Campo
                    id="senha2"
                    rotulo="Confirmar senha"
                    tipo="password"
                    valor={senha2}
                    onChange={setSenha2}
                    placeholder="••••••••"
                  />
                ) : null}
              </>
            ) : null}

            {erro ? (
              <p role="alert" className="text-destructive text-sm font-medium">
                {erro}
              </p>
            ) : null}
            {sucesso ? (
              <div className="space-y-2">
                <p className="text-brand-700 dark:text-brand-300 flex items-start gap-1.5 text-sm font-medium">
                  {sucesso.includes("Conta criada") || sucesso.includes("reenviado") ? (
                    <MailCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  ) : (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  )}
                  {sucesso}
                </p>
                {modo === "cadastro" && sucesso.includes("Conta criada") ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full rounded-xl"
                    onClick={reenviar}
                    disabled={enviando || reenvioOk || !email.trim()}
                  >
                    {reenvioOk ? "E-mail reenviado" : "Reenviar e-mail de confirmação"}
                  </Button>
                ) : null}
              </div>
            ) : null}

            <Button
              type="submit"
              className="w-full gap-2 rounded-xl"
              disabled={
                enviando ||
                (modo === "cadastro" && (!nome.trim() || !email.trim() || !senha)) ||
                (modo === "entrar" && (!email.trim() || !senha)) ||
                (modo === "redefinir" && !emRecuperacao && !email.trim()) ||
                (emRecuperacao && !senha)
              }
            >
              {enviando ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              {modo === "entrar"
                ? "Entrar"
                : modo === "cadastro"
                  ? "Criar conta"
                  : emRecuperacao
                    ? "Salvar nova senha"
                    : "Enviar link de redefinição"}
            </Button>
          </form>

          <div className="border-border mt-5 space-y-1.5 border-t pt-4 text-center text-sm">
            {modo === "entrar" ? (
              <>
                <p className="text-muted-foreground">
                  Não tem conta?{" "}
                  <button
                    type="button"
                    onClick={() => navegar("/cadastro")}
                    className="text-primary font-semibold hover:underline"
                  >
                    Criar agora
                  </button>
                </p>
                <p>
                  <button
                    type="button"
                    onClick={() => navegar("/redefinir")}
                    className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 hover:underline"
                  >
                    <Lock className="h-3 w-3" aria-hidden /> Esqueci minha senha
                  </button>
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">
                Já tem conta?{" "}
                <button
                  type="button"
                  onClick={() => navegar("/entrar")}
                  className="text-primary font-semibold hover:underline"
                >
                  Entrar
                </button>
              </p>
            )}
          </div>
        </div>

        <p className="text-muted-foreground mt-4 flex items-center justify-center gap-1.5 text-center text-[0.72rem]">
          <span>Caderno Aberto · Código aberto · Licença MIT</span>
          <span>·</span>
          <a
            href="https://github.com/eemtijca/caderno-aberto"
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground hover:underline"
          >
            GitHub
          </a>
        </p>
      </div>
    </div>
  )
}

function Campo({
  id,
  rotulo,
  tipo,
  valor,
  onChange,
  placeholder,
  autoFocus,
}: {
  id: string
  rotulo: string
  tipo: string
  valor: string
  onChange: (v: string) => void
  placeholder?: string
  autoFocus?: boolean
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{rotulo}</Label>
      <Input
        id={id}
        type={tipo}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-xl"
        autoFocus={autoFocus}
        autoComplete={tipo === "password" ? "current-password" : "on"}
      />
    </div>
  )
}
