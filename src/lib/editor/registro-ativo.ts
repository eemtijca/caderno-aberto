// Registro do editor Lexical em foco. A barra de formatação única consulta
// este registro para despachar comandos ao editor certo (documento ou
// qualquer editor aninhado de legenda/enunciado), em qualquer dispositivo.

import { useSyncExternalStore } from "react"
import type { LexicalEditor } from "lexical"

type Ouvinte = () => void

const ouvintes = new Set<Ouvinte>()
let ativo: LexicalEditor | null = null

function notificar(): void {
  for (const ouvinte of ouvintes) ouvinte()
}

// define o editor em foco (navegar entre editores troca o alvo da barra)
export function setEditorAtivo(editor: LexicalEditor | null): void {
  if (ativo === editor) return
  ativo = editor
  notificar()
}

// devolve o editor atualmente em foco (ou null quando fora do editor)
export function getEditorAtivo(): LexicalEditor | null {
  return ativo
}

// assina mudanças do editor ativo; devolve a função de cancelamento
export function inscreverEditorAtivo(ouvinte: Ouvinte): () => void {
  ouvintes.add(ouvinte)
  return () => {
    ouvintes.delete(ouvinte)
  }
}

// hook React com o editor em foco para a barra de formatação única
export function useEditorAtivo(): LexicalEditor | null {
  return useSyncExternalStore(inscreverEditorAtivo, getEditorAtivo, () => null)
}

// liga os listeners de foco à raiz do editor dado; devolve a limpeza
export function ligarEventosDeFoco(editor: LexicalEditor, raiz: HTMLElement): () => void {
  const aoEntrar = (): void => setEditorAtivo(editor)
  const aoSair = (evento: FocusEvent): void => {
    const destino = evento.relatedTarget
    if (destino instanceof Node) return
    setEditorAtivo(null)
  }
  raiz.addEventListener("focusin", aoEntrar)
  raiz.addEventListener("focusout", aoSair)
  return () => {
    raiz.removeEventListener("focusin", aoEntrar)
    raiz.removeEventListener("focusout", aoSair)
    if (getEditorAtivo() === editor) setEditorAtivo(null)
  }
}
