"use client";

// Moldura do app autenticado: navegação lateral (desktop), topbar e barra inferior
// (mobile), além da busca global com atalho de teclado.

import { useEffect, useRef, useState, type ComponentProps } from "react";
import { VERSAO_CURTA } from "@/lib/versao";
import {
  BookOpenText,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Home,
  Link2,
  Loader2,
  LogOut,
  MoreHorizontal,
  NotebookPen,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SeletorTema } from "@/components/seletor-tema";
import { useBusca } from "@/lib/notas/api-client";
import { useSessao } from "@/hooks/use-sessao";
import { corDisciplina } from "@/lib/notas/cores";
import { MESES_CAP } from "@/lib/notas/texto";
import { cn } from "@/lib/utils";
import type { Rota } from "@/lib/rota";

type ItemNav = { rotulo: string; icone: typeof Home; hash: string; vistas: Rota["vista"][] };

const ITENS_NAV: ItemNav[] = [
  { rotulo: "Início", icone: Home, hash: "/", vistas: ["inicio"] },
  { rotulo: "Notas", icone: BookOpenText, hash: "/notas", vistas: ["notas", "editor", "leitura"] },
  { rotulo: "Turmas", icone: CalendarRange, hash: "/organizacao", vistas: ["organizacao"] },
  { rotulo: "Links", icone: Link2, hash: "/links", vistas: ["links"] },
  { rotulo: "Lixeira", icone: Trash2, hash: "/lixeira", vistas: ["lixeira"] },
  { rotulo: "Configurações", icone: Settings, hash: "/configuracoes", vistas: ["configuracoes"] },
];

const ITEM_ADMIN: ItemNav = {
  rotulo: "Administração",
  icone: ShieldCheck,
  hash: "/admin",
  vistas: ["admin"],
};

// Opções que não cabem na barra inferior (a Conta fica no menu de perfil).
const ITENS_MAIS: ItemNav[] = [
  { rotulo: "Turmas", icone: CalendarRange, hash: "/organizacao", vistas: ["organizacao"] },
  { rotulo: "Lixeira", icone: Trash2, hash: "/lixeira", vistas: ["lixeira"] },
];

const CHAVE_MENU = "caderno.menu.recolhido";

interface PropsShell {
  rota: Rota;
  navegar: (para: string) => void;
  onNovaNota: () => void;
  children: React.ReactNode;
}

export function AppShell({ rota, navegar, onNovaNota, children }: PropsShell) {
  const { perfil, usuario, sair, ehAdmin } = useSessao();
  const [buscaAberta, setBuscaAberta] = useState(false);
  const [saindo, setSaindo] = useState(false);
  const [maisAberto, setMaisAberto] = useState(false);
  const [recolhida, setRecolhida] = useState(false);

  const itensNav = ehAdmin ? [...ITENS_NAV, ITEM_ADMIN] : ITENS_NAV;
  const itensMais = ehAdmin ? [...ITENS_MAIS, ITEM_ADMIN] : ITENS_MAIS;

  // Preferência de menu recolhido lida após montar (evita divergência de hidratação).
  useEffect(() => {
    setRecolhida(localStorage.getItem(CHAVE_MENU) === "1");
  }, []);

  const alternarMenu = () => {
    setRecolhida((v) => {
      const novo = !v;
      localStorage.setItem(CHAVE_MENU, novo ? "1" : "0");
      return novo;
    });
  };

  // Atalho global Ctrl/Cmd+K abre a busca.
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setBuscaAberta(true);
      }
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, []);

  const vistaAtual = rota.vista;
  // Iniciais do avatar: duas primeiras palavras do nome ou do e-mail.
  const iniciais = (perfil?.nome ?? usuario?.email ?? "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  const sairDaConta = async () => {
    setSaindo(true);
    await sair();
    navegar("/entrar");
  };

  return (
    <div className="bg-background min-h-dvh">
      {/* ---------------- Sidebar (desktop) ---------------- */}
      <aside
        className={cn(
          "border-sidebar-border bg-sidebar fixed inset-y-0 left-0 z-40 hidden flex-col border-r transition-[width] duration-200 lg:flex",
          recolhida ? "w-[4.75rem]" : "w-64",
        )}
      >
        <button
          type="button"
          onClick={alternarMenu}
          aria-label={recolhida ? "Expandir menu" : "Recolher menu"}
          title={recolhida ? "Expandir menu" : "Recolher menu"}
          className="border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground absolute top-7 -right-3 z-50 hidden h-6 w-6 items-center justify-center rounded-full border shadow-sm transition-colors lg:flex"
        >
          {recolhida ? (
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
          )}
        </button>

        <button
          type="button"
          onClick={() => navegar("/")}
          className={cn(
            "flex items-center gap-3 pt-6 pb-5 text-left",
            recolhida ? "justify-center px-2" : "px-5",
          )}
          aria-label="Ir para o início"
        >
          <span className="bg-primary text-primary-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
            <NotebookPen className="h-5 w-5" aria-hidden />
          </span>
          {!recolhida ? (
            <span className="fonte-display text-[1.05rem] leading-tight font-bold">
              Caderno Aberto
            </span>
          ) : null}
        </button>

        <div className={cn(recolhida ? "flex justify-center px-2" : "px-4")}>
          <Button
            onClick={onNovaNota}
            className={cn("rounded-xl", recolhida ? "px-0" : "w-full gap-2")}
            size={recolhida ? "icon" : "default"}
            aria-label="Nova nota"
            title="Nova nota"
          >
            <Plus className="h-4 w-4" aria-hidden />
            {!recolhida ? "Nova nota" : null}
          </Button>
        </div>

        <nav
          className={cn("mt-5 flex-1 space-y-1", recolhida ? "px-2" : "px-3")}
          aria-label="Navegação principal"
        >
          {itensNav.map((item) => {
            const ativo = item.vistas.includes(vistaAtual);
            return (
              <button
                key={item.hash}
                type="button"
                onClick={() => navegar(item.hash)}
                aria-current={ativo ? "page" : undefined}
                title={recolhida ? item.rotulo : undefined}
                className={cn(
                  "flex w-full items-center rounded-xl py-2.5 text-[0.95rem] font-medium transition-colors",
                  recolhida ? "justify-center px-0" : "gap-3 px-3",
                  ativo
                    ? "bg-primary text-primary-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <item.icone className="h-[1.1rem] w-[1.1rem] shrink-0" aria-hidden />
                {!recolhida ? item.rotulo : null}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setBuscaAberta(true)}
            title={recolhida ? "Buscar" : undefined}
            className={cn(
              "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex w-full items-center rounded-xl py-2.5 text-[0.95rem] font-medium transition-colors",
              recolhida ? "justify-center px-0" : "gap-3 px-3",
            )}
          >
            <Search className="h-[1.1rem] w-[1.1rem] shrink-0" aria-hidden />
            {!recolhida ? (
              <>
                Buscar
                <kbd className="border-sidebar-border bg-background text-muted-foreground ml-auto rounded-md border px-1.5 py-0.5 text-[0.65rem] font-medium">
                  Ctrl K
                </kbd>
              </>
            ) : null}
          </button>
        </nav>

        {/* professor */}
        <div className="border-sidebar-border border-t p-4">
          {recolhida ? (
            <div className="flex flex-col items-center gap-3">
              <span
                className="bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                title={perfil?.nome || "Professor"}
              >
                {iniciais || "?"}
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
              <SeletorTema variant="ghost" className="h-8 w-8 rounded-lg" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2.5">
                <span className="bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold">
                  {iniciais || "?"}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm leading-tight font-semibold">
                    {perfil?.nome || "Professor"}
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
                <SeletorTema className="rounded-lg" />
                <span className="text-muted-foreground text-[0.7rem]">{VERSAO_CURTA}</span>
              </div>
            </>
          )}
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
            className="h-11 w-11"
          >
            <Search className="h-5 w-5" aria-hidden />
          </Button>
          <SeletorTema variant="ghost" className="h-11 w-11" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11 rounded-full"
                aria-label={`Perfil de ${perfil?.nome || usuario?.email || "professor"}`}
                aria-haspopup="menu"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                    {iniciais || "?"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel className="flex flex-col gap-0.5">
                <span className="truncate text-sm font-semibold">
                  {perfil?.nome || "Professor"}
                </span>
                <span className="text-muted-foreground truncate text-xs font-normal">
                  {usuario?.email}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2" onClick={() => navegar("/configuracoes")}>
                <Settings className="h-4 w-4" aria-hidden />
                Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive gap-2"
                disabled={saindo}
                onClick={sairDaConta}
              >
                {saindo ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <LogOut className="h-4 w-4" aria-hidden />
                )}
                Sair da conta
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* ---------------- Conteúdo ---------------- */}
      <main
        className={cn(
          "pb-24 transition-[padding] duration-200 lg:pb-10",
          recolhida ? "lg:pl-[4.75rem]" : "lg:pl-64",
        )}
      >
        <div className="na-entra mx-auto w-full max-w-5xl px-4 pt-6 sm:px-6 lg:px-10 lg:pt-10">
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
          ativo={vistaAtual === "notas" || vistaAtual === "editor"}
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
          icone={MoreHorizontal}
          rotulo="Mais"
          ativo={itensMais.some((item) => item.vistas.includes(vistaAtual))}
          onClick={() => setMaisAberto(true)}
          aria-haspopup="dialog"
          aria-expanded={maisAberto}
        />
      </nav>

      {/* ---------------- Mais opções (mobile) ---------------- */}
      <Drawer open={maisAberto} onOpenChange={setMaisAberto}>
        <DrawerContent className="pb-[env(safe-area-inset-bottom)]">
          <DrawerHeader className="group-data-[vaul-drawer-direction=bottom]/drawer-content:text-left">
            <DrawerTitle className="fonte-display">Mais opções</DrawerTitle>
            <DrawerDescription className="sr-only">
              Opções de navegação que não cabem na barra inferior.
            </DrawerDescription>
          </DrawerHeader>
          <nav className="space-y-1 px-4 pb-4" aria-label="Mais opções">
            {itensMais.map((item) => {
              const ativo = item.vistas.includes(vistaAtual);
              return (
                <button
                  key={item.hash}
                  type="button"
                  onClick={() => {
                    setMaisAberto(false);
                    navegar(item.hash);
                  }}
                  aria-current={ativo ? "page" : undefined}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-[0.95rem] font-medium transition-colors ${
                    ativo
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground/80 hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <item.icone className="h-[1.1rem] w-[1.1rem]" aria-hidden />
                  {item.rotulo}
                </button>
              );
            })}
          </nav>
        </DrawerContent>
      </Drawer>

      {buscaAberta ? (
        <BuscaGlobal aberta aoFechar={() => setBuscaAberta(false)} navegar={navegar} />
      ) : null}
    </div>
  );
}

function ItemNavBaixo({
  icone: Icone,
  rotulo,
  ativo,
  onClick,
  ...props
}: {
  icone: typeof Home;
  rotulo: string;
  ativo: boolean;
  onClick: () => void;
} & ComponentProps<"button">) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={ativo ? "page" : undefined}
      className={`flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 py-1 text-[0.68rem] font-medium transition-colors ${
        ativo ? "text-foreground" : "text-muted-foreground"
      }`}
      {...props}
    >
      <Icone className={`h-5 w-5 ${ativo ? "" : "opacity-70"}`} aria-hidden />
      {rotulo}
    </button>
  );
}

function BuscaGlobal({
  aberta,
  aoFechar,
  navegar,
}: {
  aberta: boolean;
  aoFechar: () => void;
  navegar: (para: string) => void;
}) {
  const [termo, setTermo] = useState("");
  const [debounce, setDebounce] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: resultados, isFetching } = useBusca(debounce);
  const { perfil } = useSessao();

  // Espera a digitação parar antes de consultar a API de busca.
  useEffect(() => {
    const t = setTimeout(() => setDebounce(termo), 250);
    return () => clearTimeout(t);
  }, [termo]);

  // Foca o campo após a animação de abertura do diálogo.
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, []);

  return (
    <Dialog open={aberta} onOpenChange={(v) => !v && aoFechar()}>
      <DialogContent
        className="top-[12%] max-w-xl translate-y-0 gap-0 overflow-hidden p-0"
        showCloseButton={false}
      >
        <DialogHeader className="border-border gap-0 border-b p-0">
          <DialogTitle className="sr-only">Busca global</DialogTitle>
          <DialogDescription className="sr-only">
            Pesquise em todas as suas notas por título, conteúdo, fórmulas e habilidades.
          </DialogDescription>
          <div className="flex items-center gap-3 px-4 py-3">
            <Search className="text-muted-foreground h-4.5 w-4.5 shrink-0" aria-hidden />
            <Input
              ref={inputRef}
              value={termo}
              onChange={(e) => setTermo(e.target.value)}
              placeholder="Buscar em todas as notas..."
              className="h-9 flex-1 border-0 bg-transparent px-0 text-base shadow-none focus-visible:ring-0 dark:bg-transparent"
            />
            {isFetching ? (
              <Loader2
                className="text-muted-foreground h-4 w-4 shrink-0 animate-spin"
                aria-hidden
              />
            ) : null}
            <DialogClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground h-8 w-8 shrink-0 rounded-lg"
                aria-label="Fechar busca"
                title="Fechar"
              >
                <X className="h-4 w-4" aria-hidden />
              </Button>
            </DialogClose>
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
                const cor = corDisciplina(r.cor);
                return (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => {
                        aoFechar();
                        navegar(`/nota/${r.id}`);
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
                );
              })}
            </ul>
          ) : !isFetching ? (
            <p className="text-muted-foreground px-3 py-6 text-center text-sm">
              Nenhuma nota encontrada para "{debounce}".
            </p>
          ) : null}
        </div>

        <div className="border-border text-muted-foreground border-t px-4 py-2.5 text-[0.72rem]">
          {perfil?.escola ? <span>{perfil.escola} · </span> : null}A busca ignora acentos e cobre
          todo o conteúdo das suas notas.
        </div>
      </DialogContent>
    </Dialog>
  );
}
