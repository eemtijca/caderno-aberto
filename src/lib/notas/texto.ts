// Utilitários de texto: slugs, busca sem acento, extração de texto puro da AST (para a busca global).

import { Bloco, BlocoFilho, NotaDados } from "./tipos"

/** Remove acentos e deixa minúsculo. */
export function normalizar(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}

/** Gera um slug a partir de um título. */
export function slugificar(titulo: string): string {
  return (
    normalizar(titulo)
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "nota"
  )
}

/** Remove a marcação inline, mantendo o texto puro. */
export function textoPuro(texto: string): string {
  return texto
    .replace(/\$\$([^$]+)\$\$/g, " $1 ")
    .replace(/\$([^$\n]+)\$/g, " $1 ")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*\n]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/~~([^~\n]+)~~/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 $2")
    .replace(/\\(?:resultado|dest|textbf|textit)\{([^}]*)\}/g, "$1")
    .replace(/\\[a-zA-Z]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/** Extrai todo o texto indexável de uma lista de blocos. */
export function extrairTextoBlocos(blocos: Bloco[]): string {
  const partes: string[] = []
  const visita = (lista: Bloco[]): void => {
    for (const b of lista) {
      switch (b.tipo) {
        case "secao":
          partes.push(b.titulo)
          break
        case "paragrafo":
          if (b.rotulo?.texto) partes.push(b.rotulo.texto)
          partes.push(textoPuro(b.texto))
          break
        case "formula":
          partes.push(b.latex)
          break
        case "lista":
          partes.push(...b.itens.map(textoPuro))
          break
        case "tabela":
          for (const linha of b.linhas) partes.push(...linha.map(textoPuro))
          break
        case "chamada":
          partes.push(textoPuro(b.texto))
          break
        case "figura":
          partes.push(textoPuro(b.legenda))
          break
        case "tikz":
          partes.push(textoPuro(b.legenda))
          partes.push(b.codigo)
          break
        case "copiar":
        case "exemplo":
        case "dica":
          partes.push(b.rotulo)
          visitaFilhos(b.filhos)
          break
        case "exercicios":
          partes.push(b.rotulo, b.gabarito)
          for (const nivel of b.niveis) {
            partes.push(`Nível ${nivel.numero} ${nivel.titulo}`)
            for (const q of nivel.questoes) {
              partes.push(textoPuro(q.enunciado))
              partes.push(...q.alternativas.map(textoPuro))
            }
          }
          break
      }
    }
  }
  const visitaFilhos = (filhos: BlocoFilho[]): void => {
    for (const f of filhos) {
      if (f.tipo === "paragrafo") {
        if (f.rotulo?.texto) partes.push(f.rotulo.texto)
        partes.push(textoPuro(f.texto))
      } else if (f.tipo === "formula") partes.push(f.latex)
      else if (f.tipo === "lista") partes.push(...f.itens.map(textoPuro))
      else if (f.tipo === "tabela") {
        for (const linha of f.linhas) partes.push(...linha.map(textoPuro))
      } else if (f.tipo === "chamada") partes.push(textoPuro(f.texto))
    }
  }
  visita(blocos)
  return partes.filter(Boolean).join(" \u00b7 ")
}

/** Texto de busca completo de uma nota (metadados + conteúdo). */
export function textoDeBusca(nota: {
  titulo: string
  sobre: string
  habilidades: string
  blocos: Bloco[]
  disciplina?: { nome: string } | null
  turmas?: { nome: string; serie?: string }[]
}): string {
  const meta = [
    nota.titulo,
    nota.sobre,
    nota.habilidades,
    nota.disciplina?.nome ?? "",
    ...(nota.turmas ?? []).map((t) => `${t.nome} ${t.serie}`),
  ]
  return normalizar([...meta, extrairTextoBlocos(nota.blocos)].join(" \u00b7 "))
}

/** Quantos blocos de conteúdo uma nota tem (para exibir resumo). */
export function contarBlocos(blocos: Bloco[]): number {
  let total = 0
  for (const b of blocos) {
    total++
    if (b.tipo === "copiar" || b.tipo === "exemplo" || b.tipo === "dica") {
      total += b.filhos.length
    }
    if (b.tipo === "exercicios") {
      total += b.niveis.reduce((s, n) => s + n.questoes.length, 0)
    }
  }
  return total
}

/** Nomes dos meses em português. */
export const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
]

export const MESES_CAP = MESES.map((m) => m.charAt(0).toUpperCase() + m.slice(1))

/** Lista de habilidades separadas por vírgula. */
export function separarHabilidades(h: string): string[] {
  return h
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean)
}

/** Gabarito automático a partir das alternativas marcadas como corretas. */
export function gabaritoAutomatico(
  niveis: {
    numero: number
    titulo: string
    questoes: { alternativas: string[]; correta: number | null }[]
  }[],
): string[] {
  const itens: string[] = []
  let numero = 0
  for (const nivel of niveis) {
    for (const q of nivel.questoes) {
      numero++
      if (q.alternativas.length > 0 && q.correta !== null) {
        itens.push(`${numero}${"abcd"[q.correta] ?? ""}`)
      }
    }
  }
  return itens
}

/** Conta questões em todos os níveis. */
export function contarQuestoes(nota: NotaDados): number {
  let total = 0
  for (const b of nota.blocos) {
    if (b.tipo === "exercicios") {
      total += b.niveis.reduce((s, n) => s + n.questoes.length, 0)
    }
  }
  return total
}
