"use client";

// Paleta de inserção de blocos: busca, ícones e categorias. Bottom sheet no
// mobile e diálogo no desktop, com o mesmo conteúdo nos dois formatos.

import { useEffect, useState } from "react";
import {
  BadgeCheck,
  ClipboardCopy,
  Heading2,
  Image,
  Lightbulb,
  List,
  ListChecks,
  PenTool,
  Pilcrow,
  Sigma,
  Table,
  TriangleAlert,
} from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
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
import type { Bloco } from "@/lib/notas/tipos";

export interface ItemPaleta {
  tipo: Bloco["tipo"];
  rotulo: string;
  descricao: string;
  icone: typeof Heading2;
  grupo: string;
}

export const PALETA: ItemPaleta[] = [
  {
    tipo: "secao",
    rotulo: "Seção",
    descricao: "Título numerado de tópico",
    icone: Heading2,
    grupo: "Estrutura",
  },
  {
    tipo: "paragrafo",
    rotulo: "Parágrafo",
    descricao: "Texto corrido com rótulo opcional",
    icone: Pilcrow,
    grupo: "Texto",
  },
  {
    tipo: "lista",
    rotulo: "Lista",
    descricao: "Itens com marcadores",
    icone: List,
    grupo: "Texto",
  },
  {
    tipo: "tabela",
    rotulo: "Tabela",
    descricao: "Linhas e colunas",
    icone: Table,
    grupo: "Texto",
  },
  {
    tipo: "chamada",
    rotulo: "Atenção / Símbolos",
    descricao: "Alerta, dia a dia ou símbolos",
    icone: TriangleAlert,
    grupo: "Texto",
  },
  {
    tipo: "formula",
    rotulo: "Fórmula",
    descricao: "Equação em destaque",
    icone: Sigma,
    grupo: "Conteúdo",
  },
  {
    tipo: "figura",
    rotulo: "Figura",
    descricao: "Imagem com legenda",
    icone: Image,
    grupo: "Conteúdo",
  },
  {
    tipo: "tikz",
    rotulo: "Diagrama",
    descricao: "Ilustração geométrica criada com TikZ",
    icone: PenTool,
    grupo: "Conteúdo",
  },
  {
    tipo: "copiar",
    rotulo: "COPIAR",
    descricao: "O que o aluno leva para o caderno",
    icone: ClipboardCopy,
    grupo: "Caixas",
  },
  {
    tipo: "exemplo",
    rotulo: "Exemplo",
    descricao: "Exemplo resolvido passo a passo",
    icone: BadgeCheck,
    grupo: "Caixas",
  },
  {
    tipo: "dica",
    rotulo: "Dica",
    descricao: "Dica ou erro comum",
    icone: Lightbulb,
    grupo: "Caixas",
  },
  {
    tipo: "exercicios",
    rotulo: "Exercícios",
    descricao: "Lista com níveis e gabarito",
    icone: ListChecks,
    grupo: "Prática",
  },
];

const GRUPOS = ["Estrutura", "Texto", "Conteúdo", "Caixas", "Prática"];

// Só teclados físicos (ponteiro fino) recebem foco automático: no toque, o
// teclado virtual não deve abrir ao abrir a paleta.
function usePonteiroFino(): boolean {
  const [fino, setFino] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(pointer: fine)");
    const atualizar = () => setFino(mql.matches);
    atualizar();
    mql.addEventListener("change", atualizar);
    return () => mql.removeEventListener("change", atualizar);
  }, []);
  return fino;
}

function ConteudoPaleta({
  autoFocar,
  onEscolher,
}: {
  autoFocar: boolean;
  onEscolher: (tipo: Bloco["tipo"]) => void;
}) {
  return (
    <Command className="bg-transparent">
      <CommandInput placeholder="Buscar bloco..." autoFocus={autoFocar} />
      <CommandList className="max-h-[min(60vh,26rem)]">
        <CommandEmpty>Nenhum bloco encontrado.</CommandEmpty>
        {GRUPOS.map((grupo) => (
          <CommandGroup key={grupo} heading={grupo}>
            {PALETA.filter((item) => item.grupo === grupo).map((item) => (
              <CommandItem
                key={item.tipo}
                value={`${item.rotulo} ${item.descricao} ${item.grupo}`}
                onSelect={() => onEscolher(item.tipo)}
                className="items-center gap-3 rounded-lg px-2 py-2.5"
              >
                <span className="bg-muted text-muted-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                  <item.icone className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{item.rotulo}</span>
                  <span className="text-muted-foreground block truncate text-xs">
                    {item.descricao}
                  </span>
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </Command>
  );
}

function subtitulo(posicao: number, total: number, rotuloAnterior?: string): string {
  if (total === 0) return "Escolha o primeiro bloco da nota.";
  if (posicao >= total) return "Inserir no final da nota.";
  return rotuloAnterior ? `Inserir após "${rotuloAnterior}".` : "Inserir nesta posição.";
}

export function PaletaBlocos({
  aberta,
  posicao,
  total,
  rotuloAnterior,
  ehMobile,
  onEscolher,
  onFechar,
}: {
  aberta: boolean;
  posicao: number;
  total: number;
  rotuloAnterior?: string;
  ehMobile: boolean;
  onEscolher: (tipo: Bloco["tipo"]) => void;
  onFechar: () => void;
}) {
  const descricao = subtitulo(posicao, total, rotuloAnterior);
  // No mobile o campo nunca recebe foco; em telas largas, só com ponteiro fino.
  const autoFocar = usePonteiroFino() && !ehMobile;

  if (ehMobile) {
    return (
      <Drawer open={aberta} onOpenChange={(v) => !v && onFechar()}>
        <DrawerContent
          className="pb-[env(safe-area-inset-bottom)]"
          // Impede o foco automático no campo de busca (teclado virtual).
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DrawerHeader className="group-data-[vaul-drawer-direction=bottom]/drawer-content:text-left">
            <DrawerTitle className="fonte-display">Adicionar bloco</DrawerTitle>
            <DrawerDescription>{descricao}</DrawerDescription>
          </DrawerHeader>
          <div className="min-h-0 px-2 pb-2">
            <ConteudoPaleta autoFocar={autoFocar} onEscolher={onEscolher} />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={aberta} onOpenChange={(v) => !v && onFechar()}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="px-4 pt-4 pb-1 text-left">
          <DialogTitle className="fonte-display">Adicionar bloco</DialogTitle>
          <DialogDescription>{descricao}</DialogDescription>
        </DialogHeader>
        <div className="p-2">
          <ConteudoPaleta autoFocar={autoFocar} onEscolher={onEscolher} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
