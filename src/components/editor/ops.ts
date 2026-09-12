// Operações imutáveis sobre a lista de blocos do editor (atualizar, inserir,
// remover, mover e duplicar), preservando a referência do que não mudou.

import type { Bloco, BlocoFilho } from "@/lib/notas/tipos";

type Caixa = Extract<Bloco, { tipo: "copiar" | "exemplo" | "dica" }>;

// Restringe o tratamento de filhos às caixas que os possuem.
function ehCaixa(b: Bloco): b is Caixa {
  return b.tipo === "copiar" || b.tipo === "exemplo" || b.tipo === "dica";
}

export function atualizarBloco<T extends Bloco>(
  blocos: Bloco[],
  id: string,
  patch: Partial<T>,
): Bloco[] {
  return blocos.map((b) => (b.id === id ? ({ ...b, ...patch } as Bloco) : b));
}

export function atualizarFilho<T extends BlocoFilho>(
  blocos: Bloco[],
  caixaId: string,
  filhoId: string,
  patch: Partial<T>,
): Bloco[] {
  return blocos.map((b) => {
    if (b.id !== caixaId || !ehCaixa(b)) return b;
    return {
      ...b,
      filhos: b.filhos.map((f) => (f.id === filhoId ? ({ ...f, ...patch } as BlocoFilho) : f)),
    };
  });
}

export function inserirBloco(blocos: Bloco[], indice: number, bloco: Bloco): Bloco[] {
  const copia = [...blocos];
  copia.splice(Math.max(0, Math.min(indice, copia.length)), 0, bloco);
  return copia;
}

export function inserirFilho(
  blocos: Bloco[],
  caixaId: string,
  indice: number,
  filho: BlocoFilho,
): Bloco[] {
  return blocos.map((b) => {
    if (b.id !== caixaId || !ehCaixa(b)) return b;
    const filhos = [...b.filhos];
    filhos.splice(Math.max(0, Math.min(indice, filhos.length)), 0, filho);
    return { ...b, filhos };
  });
}

export function removerBloco(blocos: Bloco[], id: string): Bloco[] {
  return blocos.filter((b) => b.id !== id);
}

export function removerFilho(blocos: Bloco[], caixaId: string, filhoId: string): Bloco[] {
  return blocos.map((b) => {
    if (b.id !== caixaId || !ehCaixa(b)) return b;
    return { ...b, filhos: b.filhos.filter((f) => f.id !== filhoId) };
  });
}

export function moverBloco(blocos: Bloco[], id: string, delta: number): Bloco[] {
  const i = blocos.findIndex((b) => b.id === id);
  const j = i + delta;
  if (i === -1 || j < 0 || j >= blocos.length) return blocos;
  const copia = [...blocos];
  [copia[i], copia[j]] = [copia[j], copia[i]];
  return copia;
}

export function moverFilho(
  blocos: Bloco[],
  caixaId: string,
  filhoId: string,
  delta: number,
): Bloco[] {
  return blocos.map((b) => {
    if (b.id !== caixaId || !ehCaixa(b)) return b;
    const i = b.filhos.findIndex((f) => f.id === filhoId);
    const j = i + delta;
    if (i === -1 || j < 0 || j >= b.filhos.length) return b;
    const filhos = [...b.filhos];
    [filhos[i], filhos[j]] = [filhos[j], filhos[i]];
    return { ...b, filhos };
  });
}

export function duplicarBloco(blocos: Bloco[], id: string): Bloco[] {
  const i = blocos.findIndex((b) => b.id === id);
  if (i === -1) return blocos;
  const novoId = (): string => `b-${Math.random().toString(36).slice(2, 9)}`;
  // Clona em profundidade e renova os ids para evitar colisão com o original.
  const clone = JSON.parse(JSON.stringify(blocos[i])) as Bloco;
  clone.id = novoId();
  if (ehCaixa(clone)) {
    clone.filhos = clone.filhos.map((f) => ({ ...f, id: novoId() }));
  }
  if (clone.tipo === "exercicios") {
    clone.niveis = clone.niveis.map((n) => ({
      ...n,
      questoes: n.questoes.map((q) => ({ ...q, id: novoId() })),
    }));
  }
  const copia = [...blocos];
  copia.splice(i + 1, 0, clone);
  return copia;
}

export function reordenar(blocos: Bloco[], de: number, para: number): Bloco[] {
  const copia = [...blocos];
  const [item] = copia.splice(de, 1);
  copia.splice(para, 0, item);
  return copia;
}
