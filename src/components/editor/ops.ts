// Operações imutáveis sobre a árvore de blocos (editor).

import type { Bloco, BlocoFilho } from "@/lib/notas/tipos"

type Caixa = Extract<Bloco, { tipo: "copiar" | "exemplo" | "dica" }>

function ehCaixa(b: Bloco): b is Caixa {
  return b.tipo === "copiar" || b.tipo === "exemplo" || b.tipo === "dica"
}

/** Atualiza um bloco de nível superior (por id) com um patch parcial. */
export function atualizarBloco<T extends Bloco>(
  blocos: Bloco[],
  id: string,
  patch: Partial<T>,
): Bloco[] {
  return blocos.map((b) => (b.id === id ? ({ ...b, ...patch } as Bloco) : b))
}

/** Atualiza um filho dentro de uma caixa. */
export function atualizarFilho<T extends BlocoFilho>(
  blocos: Bloco[],
  caixaId: string,
  filhoId: string,
  patch: Partial<T>,
): Bloco[] {
  return blocos.map((b) => {
    if (b.id !== caixaId || !ehCaixa(b)) return b
    return {
      ...b,
      filhos: b.filhos.map((f) => (f.id === filhoId ? ({ ...f, ...patch } as BlocoFilho) : f)),
    }
  })
}

/** Insere um bloco de nível superior na posição dada. */
export function inserirBloco(blocos: Bloco[], indice: number, bloco: Bloco): Bloco[] {
  const copia = [...blocos]
  copia.splice(Math.max(0, Math.min(indice, copia.length)), 0, bloco)
  return copia
}

/** Insere um filho dentro de uma caixa. */
export function inserirFilho(
  blocos: Bloco[],
  caixaId: string,
  indice: number,
  filho: BlocoFilho,
): Bloco[] {
  return blocos.map((b) => {
    if (b.id !== caixaId || !ehCaixa(b)) return b
    const filhos = [...b.filhos]
    filhos.splice(Math.max(0, Math.min(indice, filhos.length)), 0, filho)
    return { ...b, filhos }
  })
}

export function removerBloco(blocos: Bloco[], id: string): Bloco[] {
  return blocos.filter((b) => b.id !== id)
}

export function removerFilho(blocos: Bloco[], caixaId: string, filhoId: string): Bloco[] {
  return blocos.map((b) => {
    if (b.id !== caixaId || !ehCaixa(b)) return b
    return { ...b, filhos: b.filhos.filter((f) => f.id !== filhoId) }
  })
}

/** Move um bloco de nível superior (troca com o vizinho). */
export function moverBloco(blocos: Bloco[], id: string, delta: number): Bloco[] {
  const i = blocos.findIndex((b) => b.id === id)
  const j = i + delta
  if (i === -1 || j < 0 || j >= blocos.length) return blocos
  const copia = [...blocos]
  ;[copia[i], copia[j]] = [copia[j], copia[i]]
  return copia
}

/** Move um filho dentro de uma caixa. */
export function moverFilho(
  blocos: Bloco[],
  caixaId: string,
  filhoId: string,
  delta: number,
): Bloco[] {
  return blocos.map((b) => {
    if (b.id !== caixaId || !ehCaixa(b)) return b
    const i = b.filhos.findIndex((f) => f.id === filhoId)
    const j = i + delta
    if (i === -1 || j < 0 || j >= b.filhos.length) return b
    const filhos = [...b.filhos]
    ;[filhos[i], filhos[j]] = [filhos[j], filhos[i]]
    return { ...b, filhos }
  })
}

/** Divide um parágrafo filho no cursor (Enter): o texto antes permanece
 * no filho atual e o depois abre um novo parágrafo logo abaixo. */
export function dividirFilho(
  blocos: Bloco[],
  caixaId: string,
  filhoId: string,
  antes: string,
  depois: string,
): Bloco[] {
  return blocos.map((b) => {
    if (b.id !== caixaId || !ehCaixa(b)) return b
    const i = b.filhos.findIndex((f) => f.id === filhoId)
    if (i === -1) return b
    const atual = b.filhos[i]
    if (atual.tipo !== "paragrafo") return b
    const atualizado: BlocoFilho = { ...atual, texto: antes }
    const novo: BlocoFilho = {
      id: novoIdBloco(),
      tipo: "paragrafo",
      texto: depois,
      rotulo: null,
    }
    const filhos = [...b.filhos]
    filhos[i] = atualizado
    filhos.splice(i + 1, 0, novo)
    return { ...b, filhos }
  })
}

/** Duplica um bloco (ids novos para o bloco e filhos). */
export function duplicarBloco(blocos: Bloco[], id: string): Bloco[] {
  const i = blocos.findIndex((b) => b.id === id)
  if (i === -1) return blocos
  const novoId = (): string => `b-${Math.random().toString(36).slice(2, 9)}`
  const clone = JSON.parse(JSON.stringify(blocos[i])) as Bloco
  clone.id = novoId()
  if (ehCaixa(clone)) {
    clone.filhos = clone.filhos.map((f) => ({ ...f, id: novoId() }))
  }
  if (clone.tipo === "exercicios") {
    clone.niveis = clone.niveis.map((n) => ({
      ...n,
      questoes: n.questoes.map((q) => ({ ...q, id: novoId() })),
    }))
  }
  const copia = [...blocos]
  copia.splice(i + 1, 0, clone)
  return copia
}

/** Reordena por drop do dnd-kit (top-level). */
export function reordenar(blocos: Bloco[], de: number, para: number): Bloco[] {
  const copia = [...blocos]
  const [item] = copia.splice(de, 1)
  copia.splice(para, 0, item)
  return copia
}

export function novoIdBloco(): string {
  return `b-${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-3)}`
}

/**
 * Divide um parágrafo no cursor (Enter). O texto `antes` permanece no
 * bloco atual e o `depois` abre um novo parágrafo logo abaixo, como no
 * Notion/Obsidian.
 */
export function dividirParagrafo(
  blocos: Bloco[],
  id: string,
  antes: string,
  depois: string,
): Bloco[] {
  const i = blocos.findIndex((b) => b.id === id)
  if (i === -1) return blocos
  const atual = blocos[i]
  if (atual.tipo !== "paragrafo") return blocos
  const atualizado: Bloco = { ...atual, texto: antes }
  const novo: Bloco = {
    id: novoIdBloco(),
    tipo: "paragrafo",
    texto: depois,
    rotulo: null,
  }
  const copia = [...blocos]
  copia[i] = atualizado
  copia.splice(i + 1, 0, novo)
  return copia
}
