"use client"

// Shell da aplicação. Sidebar no desktop, bottom navigation no celular (mobile-first), busca global (Ctrl+K), menu do professor e seletor de tema.

import { useEffect, useRef, useState } from "react"
import { useTheme } from "next-themes"
import { VERSAO_CURTA } from "@/lib/versao"
import {
  BookOpenText,
  CalendarRange,
  Home,
  Link2,
  Loader2,
  LogOut,
  Moon,
  NotebookPen,
  Plus,
  Search,
  Settings,
  Sun,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useBusca } from "@/lib/notas/api-client"
import { useSessao } from "@/hooks/use-sessao"
import { corDisciplina } from "@/lib/notas/cores"
import { MESES_CAP } from "@/lib/notas/texto"
import type { Rota } from "@/lib/rota"

const ITENS_NAV: { rotulo: string; icone: typeof Home; hash: string; vistas: Rota["vista"][] }[] = [
  { rotulo: "Início", icone: Home, hash: "/", vistas: ["inicio"] },
  { rotulo: "Notas", icone: BookOpenText, hash: "/notas", vistas: ["notas"] },
  { rotulo: "Turmas", icone: CalendarRange, hash: "/organizacao", vistas: ["organizacao"] },
  { rotulo: "Links", icone: Link2, hash: "/links", vistas: ["links"] },
  { rotulo: "Conta", icone: Settings, hash: "/conta", vistas: ["conta", "editor"] },
]

interface PropsShell {
  rota: Rota
  navegar: (para: string) => void
  onNovaNota: () => void
  children: React.ReactNode
}

export function AppShell({ rota, navegar, onNovaNota, children }: PropsShell) {
  const { setTheme } = useTheme()
  const { perfil, usuario, sair } = useSessao()
  const [buscaAberta, setBuscaAberta] = useState(false)
  const [saindo, setSaindo] = useState(false)

  // Ctrl+K / Cmd+K abre a busca
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setBuscaAberta(true)
      }
    }
    window.addEventListener("keydown", aoTeclar)
    return () => window.removeEventListener("keydown", aoTeclar)
  }, [])

  const vistaAtual = rota.vista
  const iniciais = (perfil?.nome ?? usuario?.email ?? "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("")

  const sairDaConta = async () => {
    setSaindo(true)
    await sair()
    navegar("/entrar")
  }

  return (
    <div className="bg-background min-h-screen">
      {/* ---------------- Sidebar (desktop) ---------------- */}
      <aside className="border-sidebar-border bg-sidebar fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r lg:flex">
        <button
          type="button"
          onClick={() => navegar("/")}
          className="flex items-center gap-3 px-5 pt-6 pb-5 text-left"
        >
          <span className="bg-primary text-primary-foreground flex h-10 w-10 items-center justify-center rounded-xl">
            <NotebookPen className="h-5 w-5" aria-hidden />
          </span>
          <span>
            <span className="fonte-display block text-[1.05rem] leading-tight font-bold">
              Caderno Aberto
            </span>
            <span className="text-muted-foreground block text-xs">notas que chegam aos alunos</span>
          </span>
        </button>

        <div className="px-4">
          <Button onClick={onNovaNota} className="w-full gap-2 rounded-xl" size="default">
            <Plus className="h-4 w-4" aria-hidden /> Nova nota
          </Button>
        </div>

        <nav className="mt-5 flex-1 space-y-1 px-3" aria-label="Navegação principal">
          {ITENS_NAV.map((item) => {
            const ativo = item.vistas.includes(vistaAtual)
            return (
              <button
                key={item.hash}
                type="button"
                onClick={() => navegar(item.hash)}
                aria-current={ativo ? "page" : undefined}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[0.95rem] font-medium transition-colors ${
                  ativo
                    ? "bg-primary text-primary-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                <item.icone className="h-[1.1rem] w-[1.1rem]" aria-hidden />
                {item.rotulo}
              </button>
            )
          })}
          <button
            type="button"
            onClick={() => setBuscaAberta(true)}
            className="text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[0.95rem] font-medium transition-colors"
          >
            <Search className="h-[1.1rem] w-[1.1rem]" aria-hidden />
            Buscar
            <kbd className="border-sidebar-border bg-background text-muted-foreground ml-auto rounded-md border px-1.5 py-0.5 text-[0.65rem] font-medium">
              Ctrl K
            </kbd>
          </button>
        </nav>

        {/* professor */}
        <div className="border-sidebar-border border-t p-4">
          <div className="flex items-center gap-2.5">
            <span className="bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold">
              {iniciais || "?"}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm leading-tight font-semibold">
                {perfil?.nome || "Professor(a)"}
              </span>
              <span className="text-muted-foreground block truncate text-[0.7rem]">
                {usuario?.email}
              </span>
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive h-8 w-8 rounded-lg"
              aria-label="Sair da conta"
              title="Sair da conta"
              disabled={saindo}
              onClick={sairDaConta}
            >
              {saindo ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <LogOut className="h-4 w-4" aria-hidden />
              )}
            </Button>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <BotaoTema setTheme={setTheme} />
            <span className="text-muted-foreground text-[0.7rem]">{VERSAO_CURTA}</span>
          </div>
        </div>
      </aside>

      {/* ---------------- Topbar (mobile) ---------------- */}
      <header className="border-border bg-background/90 sticky top-0 z-40 flex h-14 items-center justify-between border-b px-4 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => navegar("/")}
          className="flex items-center gap-2.5"
          aria-label="Ir para o início"
        >
          <span className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-lg">
            <NotebookPen className="h-4 w-4" aria-hidden />
          </span>
          <span className="fonte-display text-base font-bold">Caderno Aberto</span>
        </button>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setBuscaAberta(true)}
            aria-label="Buscar"
          >
            <Search className="h-5 w-5" aria-hidden />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={sairDaConta}
            aria-label="Sair da conta"
            disabled={saindo}
          >
            <LogOut className="h-5 w-5" aria-hidden />
          </Button>
          <BotaoTema setTheme={setTheme} />
        </div>
      </header>

      {/* ---------------- Conteúdo ---------------- */}
      <main className="pb-24 lg:pb-10 lg:pl-64">
        <div className="mx-auto w-full max-w-5xl px-4 pt-6 sm:px-6 lg:px-10 lg:pt-10">
          {children}
        </div>
      </main>

      {/* ---------------- Bottom nav (mobile) ---------------- */}
      <nav
        className="border-border bg-background/95 fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t backdrop-blur lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Navegação inferior"
      >
        <ItemNavBaixo
          icone={Home}
          rotulo="Início"
          ativo={vistaAtual === "inicio"}
          onClick={() => navegar("/")}
        />
        <ItemNavBaixo
          icone={BookOpenText}
          rotulo="Notas"
          ativo={vistaAtual === "notas"}
          onClick={() => navegar("/notas")}
        />
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={onNovaNota}
            aria-label="Nova nota"
            className="bg-primary text-primary-foreground -mt-5 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform active:scale-95"
          >
            <Plus className="h-6 w-6" aria-hidden />
          </button>
        </div>
        <ItemNavBaixo
          icone={Link2}
          rotulo="Links"
          ativo={vistaAtual === "links"}
          onClick={() => navegar("/links")}
        />
        <ItemNavBaixo
          icone={Settings}
          rotulo="Conta"
          ativo={vistaAtual === "conta" || vistaAtual === "editor"}
          onClick={() => navegar("/conta")}
        />
      </nav>

      {buscaAberta ? (
        <BuscaGlobal aberta aoFechar={() => setBuscaAberta(false)} navegar={navegar} />
      ) : null}
    </div>
  )
}

function BotaoTema({ setTheme }: { setTheme: (t: string) => void }) {
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => {
        const escuro = document.documentElement.classList.contains("dark")
        setTheme(escuro ? "light" : "dark")
      }}
      aria-label="Alternar tema claro/escuro"
      className="rounded-lg"
    >
      <Sun className="hidden h-[1.1rem] w-[1.1rem] dark:block" aria-hidden />
      <Moon className="h-[1.1rem] w-[1.1rem] dark:hidden" aria-hidden />
    </Button>
  )
}

function ItemNavBaixo({
  icone: Icone,
  rotulo,
  ativo,
  onClick,
}: {
  icone: typeof Home
  rotulo: string
  ativo: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={ativo ? "page" : undefined}
      className={`flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 py-1 text-[0.68rem] font-medium transition-colors ${
        ativo ? "text-foreground" : "text-muted-foreground"
      }`}
    >
      <Icone className={`h-5 w-5 ${ativo ? "" : "opacity-70"}`} aria-hidden />
      {rotulo}
    </button>
  )
}

// Busca global (dialog com resultados instantâneos)

function BuscaGlobal({
  aberta,
  aoFechar,
  navegar,
}: {
  aberta: boolean
  aoFechar: () => void
  navegar: (para: string) => void
}) {
  const [termo, setTermo] = useState("")
  const [debounce, setDebounce] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const { data: resultados, isFetching } = useBusca(debounce)
  const { perfil } = useSessao()

  useEffect(() => {
    const t = setTimeout(() => setDebounce(termo), 250)
    return () => clearTimeout(t)
  }, [termo])

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 60)
    return () => clearTimeout(t)
  }, [])

  return (
    <Dialog open={aberta} onOpenChange={(v) => !v && aoFechar()}>
      <DialogContent className="top-[12%] max-w-xl translate-y-0 gap-0 p-0">
        <DialogHeader className="border-border border-b px-4 py-3">
          <DialogTitle className="sr-only">Busca global</DialogTitle>
          <DialogDescription className="sr-only">
            Pesquise em todas as suas notas por título, conteúdo, fórmulas e habilidades.
          </DialogDescription>
          <div className="flex items-center gap-2.5">
            <Search className="text-muted-foreground h-4 w-4" aria-hidden />
            <Input
              ref={inputRef}
              value={termo}
              onChange={(e) => setTermo(e.target.value)}
              placeholder="Buscar em todas as notas…"
              className="h-8 border-0 bg-transparent px-0 text-base shadow-none focus-visible:ring-0"
            />
            {isFetching ? (
              <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" aria-hidden />
            ) : null}
          </div>
        </DialogHeader>

        <div className="max-h-[55vh] overflow-y-auto p-2">
          {debounce.trim().length < 2 ? (
            <p className="text-muted-foreground px-3 py-6 text-center text-sm">
              Digite ao menos 2 caracteres. A busca cobre títulos, conteúdo, fórmulas, gabaritos e
              habilidades (BNCC/ENEM).
            </p>
          ) : resultados && resultados.length > 0 ? (
            <ul className="space-y-1">
              {resultados.map((r) => {
                const cor = corDisciplina(r.cor)
                return (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => {
                        aoFechar()
                        navegar(`/nota/${r.id}`)
                      }}
                      className="hover:bg-accent w-full rounded-xl px-3 py-2.5 text-left transition-colors"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">{r.titulo}</span>
                        <Badge
                          className={`rounded-md text-[0.68rem] ${cor.chip}`}
                          variant="secondary"
                        >
                          {r.disciplina}
                        </Badge>
                        {r.status === "rascunho" ? (
                          <Badge variant="outline" className="text-[0.62rem]">
                            Rascunho
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-muted-foreground mt-1 line-clamp-2 text-[0.82rem] leading-snug">
                        <span className="font-medium">{r.campo}: </span>
                        {r.trecho}
                      </p>
                      <p className="text-muted-foreground mt-0.5 text-[0.7rem]">
                        {MESES_CAP[r.mes - 1]}/{r.anoLetivo}
                        {r.turmas.length > 0 ? ` · ${r.turmas.join(", ")}` : ""}
                      </p>
                    </button>
                  </li>
                )
              })}
            </ul>
          ) : !isFetching ? (
            <p className="text-muted-foreground px-3 py-6 text-center text-sm">
              Nenhuma nota encontrada para &ldquo;{debounce}&rdquo;.
            </p>
          ) : null}
        </div>

        <div className="border-border text-muted-foreground border-t px-4 py-2.5 text-[0.72rem]">
          {perfil?.escola ? <span>{perfil.escola} · </span> : null}A busca ignora acentos e cobre
          todo o conteúdo das suas notas.
        </div>
      </DialogContent>
    </Dialog>
  )
}
