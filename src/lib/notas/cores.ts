// Paleta de cores das disciplinas. Classes Tailwind estáticas para seleção do professor.

export interface CorDisciplina {
  chave: string
  nome: string
  chip: string
  chipContorno: string
  ponto: string
  texto: string
  borda: string
  fundoSuave: string
  barra: string
}

export const CORES: CorDisciplina[] = [
  {
    chave: "verde",
    nome: "Verde (institucional)",
    chip: "bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300",
    chipContorno:
      "border border-brand-300 dark:border-brand-800 text-brand-700 dark:text-brand-300",
    ponto: "bg-brand-600",
    texto: "text-brand-700 dark:text-brand-300",
    borda: "border-brand-200 dark:border-brand-900",
    fundoSuave: "bg-brand-50 dark:bg-brand-950/40",
    barra: "bg-brand-600",
  },
  {
    chave: "teal",
    nome: "Verde-petróleo",
    chip: "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300",
    chipContorno: "border border-teal-300 dark:border-teal-800 text-teal-700 dark:text-teal-300",
    ponto: "bg-teal-500",
    texto: "text-teal-700 dark:text-teal-300",
    borda: "border-teal-200 dark:border-teal-800",
    fundoSuave: "bg-teal-50 dark:bg-teal-950/40",
    barra: "bg-teal-500",
  },
  {
    chave: "violeta",
    nome: "Violeta",
    chip: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
    chipContorno:
      "border border-violet-300 dark:border-violet-800 text-violet-700 dark:text-violet-300",
    ponto: "bg-violet-500",
    texto: "text-violet-700 dark:text-violet-300",
    borda: "border-violet-200 dark:border-violet-800",
    fundoSuave: "bg-violet-50 dark:bg-violet-950/40",
    barra: "bg-violet-500",
  },
  {
    chave: "rosa",
    nome: "Rosa",
    chip: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
    chipContorno: "border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300",
    ponto: "bg-rose-500",
    texto: "text-rose-700 dark:text-rose-300",
    borda: "border-rose-200 dark:border-rose-800",
    fundoSuave: "bg-rose-50 dark:bg-rose-950/40",
    barra: "bg-rose-500",
  },
  {
    chave: "ambar",
    nome: "Âmbar",
    chip: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
    chipContorno:
      "border border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300",
    ponto: "bg-amber-500",
    texto: "text-amber-700 dark:text-amber-300",
    borda: "border-amber-200 dark:border-amber-800",
    fundoSuave: "bg-amber-50 dark:bg-amber-950/40",
    barra: "bg-amber-500",
  },
  {
    chave: "laranja",
    nome: "Laranja",
    chip: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
    chipContorno:
      "border border-orange-300 dark:border-orange-800 text-orange-700 dark:text-orange-300",
    ponto: "bg-orange-500",
    texto: "text-orange-700 dark:text-orange-300",
    borda: "border-orange-200 dark:border-orange-800",
    fundoSuave: "bg-orange-50 dark:bg-orange-950/40",
    barra: "bg-orange-500",
  },
  {
    chave: "ciano",
    nome: "Ciano",
    chip: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300",
    chipContorno: "border border-cyan-300 dark:border-cyan-800 text-cyan-700 dark:text-cyan-300",
    ponto: "bg-cyan-500",
    texto: "text-cyan-700 dark:text-cyan-300",
    borda: "border-cyan-200 dark:border-cyan-800",
    fundoSuave: "bg-cyan-50 dark:bg-cyan-950/40",
    barra: "bg-cyan-500",
  },
  {
    chave: "fucsia",
    nome: "Fúcsia",
    chip: "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-950 dark:text-fuchsia-300",
    chipContorno:
      "border border-fuchsia-300 dark:border-fuchsia-800 text-fuchsia-700 dark:text-fuchsia-300",
    ponto: "bg-fuchsia-500",
    texto: "text-fuchsia-700 dark:text-fuchsia-300",
    borda: "border-fuchsia-200 dark:border-fuchsia-800",
    fundoSuave: "bg-fuchsia-50 dark:bg-fuchsia-950/40",
    barra: "bg-fuchsia-500",
  },
  {
    chave: "lima",
    nome: "Lima",
    chip: "bg-lime-100 text-lime-800 dark:bg-lime-950 dark:text-lime-300",
    chipContorno: "border border-lime-300 dark:border-lime-800 text-lime-700 dark:text-lime-300",
    ponto: "bg-lime-500",
    texto: "text-lime-700 dark:text-lime-300",
    borda: "border-lime-200 dark:border-lime-800",
    fundoSuave: "bg-lime-50 dark:bg-lime-950/40",
    barra: "bg-lime-500",
  },
  {
    chave: "pedra",
    nome: "Neutro",
    chip: "bg-stone-200 text-stone-800 dark:bg-stone-800 dark:text-stone-200",
    chipContorno:
      "border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300",
    ponto: "bg-stone-500",
    texto: "text-stone-700 dark:text-stone-300",
    borda: "border-stone-200 dark:border-stone-700",
    fundoSuave: "bg-stone-100 dark:bg-stone-800/40",
    barra: "bg-stone-500",
  },
]

export function corDisciplina(chave: string | undefined | null): CorDisciplina {
  return CORES.find((c) => c.chave === chave) ?? CORES[0] ?? CORS_PADRAO
}

// fallback estático quando a lista de cores estiver vazia (tipagem estrita)
const CORS_PADRAO: CorDisciplina = {
  chave: "pedra",
  nome: "Neutro",
  chip: "bg-stone-200 text-stone-800 dark:bg-stone-800 dark:text-stone-200",
  chipContorno: "border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300",
  ponto: "bg-stone-500",
  texto: "text-stone-700 dark:text-stone-300",
  borda: "border-stone-200 dark:border-stone-700",
  fundoSuave: "bg-stone-100 dark:bg-stone-800/40",
  barra: "bg-stone-500",
}

export const ICONES_DISCIPLINA = [
  "BookOpen",
  "FlaskConical",
  "Atom",
  "Calculator",
  "Pi",
  "Dna",
  "Globe2",
  "Landmark",
  "Languages",
  "PenLine",
  "Palette",
  "Music",
  "Dumbbell",
  "Laptop",
  "Scale",
  "Map",
] as const

export function nomeIconeValido(nome: string | undefined): string {
  return (ICONES_DISCIPLINA as readonly string[]).includes(nome ?? "")
    ? (nome as string)
    : "BookOpen"
}

// Mapa de componentes Lucide para renderizacao de icones.
import {
  BookOpen,
  FlaskConical,
  Atom,
  Calculator,
  Pi,
  Dna,
  Globe2,
  Landmark,
  Languages,
  PenLine,
  Palette,
  Music,
  Dumbbell,
  Laptop,
  Scale,
  Map as MapIcon,
} from "lucide-react"
import type { ComponentType } from "react"
export const MAPA_ICONES: Record<string, ComponentType<{ className?: string }>> = {
  BookOpen,
  FlaskConical,
  Atom,
  Calculator,
  Pi,
  Dna,
  Globe2,
  Landmark,
  Languages,
  PenLine,
  Palette,
  Music,
  Dumbbell,
  Laptop,
  Scale,
  Map: MapIcon,
}
export function obterIconeDisciplina(
  nome: string | undefined | null,
): ComponentType<{ className?: string }> {
  const n = nomeIconeValido(nome ?? undefined)
  return MAPA_ICONES[n] ?? BookOpen
}
