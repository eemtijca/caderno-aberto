// Esboços de blocos usados ao criar uma nota nova.
import { Bloco, idBloco } from "./tipos"

/** Modelo guiado com todos os tipos de bloco. */
export function notaModelo(titulo: string): Bloco[] {
  return [
    { id: idBloco(), tipo: "secao", titulo: titulo || "Primeiro tópico" },
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

/** Versão mínima: apenas uma seção e um parágrafo. */
export function notaVazia(titulo: string): Bloco[] {
  return [
    { id: idBloco(), tipo: "secao", titulo: titulo || "Primeiro tópico" },
    { id: idBloco(), tipo: "paragrafo", texto: "", rotulo: null },
  ]
}
