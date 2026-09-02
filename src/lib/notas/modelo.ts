// Modelo de nota nova. O esqueleto equivalente ao modelo.tex original: seção, caixa COPIAR com definição/fórmula/símbolos, exemplo, dica e exercícios com três níveis.

import { Bloco, idBloco } from "./tipos"

export function notaModelo(_titulo: string): Bloco[] {
  return [
    { id: idBloco(), tipo: "secao", titulo: "Primeiro tópico" },
    {
      id: idBloco(),
      tipo: "copiar",
      rotulo: "Nome curto do bloco",
      filhos: [
        {
          id: idBloco(),
          tipo: "paragrafo",
          texto: "Definição em uma ou duas frases. Use **negrito** nas palavras-chave.",
          rotulo: { tipo: "definicao" },
        },
        { id: idBloco(), tipo: "formula", latex: "y = ax + b" },
        {
          id: idBloco(),
          tipo: "chamada",
          estilo: "simbolos",
          texto: "$y$ (unidade); $x$ (unidade); $a$ e $b$ (unidade).",
        },
        {
          id: idBloco(),
          tipo: "chamada",
          estilo: "diaadia",
          texto: "Uma frase ligando o conceito ao cotidiano.",
        },
      ],
    },
    {
      id: idBloco(),
      tipo: "exemplo",
      rotulo: "Exemplo resolvido",
      filhos: [
        { id: idBloco(), tipo: "paragrafo", texto: "Enunciado do exemplo." },
        {
          id: idBloco(),
          tipo: "paragrafo",
          texto: "Desenvolvimento da resolução. \\resultado{Resposta em destaque.}",
          rotulo: { tipo: "resolucao" },
        },
      ],
    },
    {
      id: idBloco(),
      tipo: "dica",
      rotulo: "Dica / erro comum",
      filhos: [
        {
          id: idBloco(),
          tipo: "paragrafo",
          texto: "O engano que a turma costuma cometer, e como evitar.",
        },
      ],
    },
    {
      id: idBloco(),
      tipo: "exercicios",
      rotulo: "Exercícios propostos",
      niveis: [
        {
          numero: 1,
          titulo: "Conceitos",
          questoes: [
            {
              id: idBloco(),
              enunciado: "Primeira questão. Conceito da aula.",
              alternativas: [],
              correta: null,
            },
          ],
        },
        { numero: 2, titulo: "Aplicação", questoes: [] },
        { numero: 3, titulo: "Síntese", questoes: [] },
      ],
      gabarito: "",
    },
  ]
}

/** Nota vazia . Só a estrutura mínima. */
export function notaVazia(_titulo: string): Bloco[] {
  return [
    { id: idBloco(), tipo: "secao", titulo: "Primeiro tópico" },
    { id: idBloco(), tipo: "paragrafo", texto: "", rotulo: null },
  ]
}
