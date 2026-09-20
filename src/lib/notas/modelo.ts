// Esboços de blocos usados ao criar uma nota nova.
import { Bloco, idBloco } from "./tipos";

/** Modelo guiado com todos os tipos de bloco e textos que explicam o preenchimento. */
export function notaModelo(titulo: string): Bloco[] {
  return [
    { id: idBloco(), tipo: "secao", titulo: titulo || "Primeiro tópico" },
    {
      id: idBloco(),
      tipo: "paragrafo",
      texto:
        "Abra a aula em duas ou três frases: o que a turma vai aprender e por que isso importa. Substitua este texto pelo conteúdo real.",
      rotulo: null,
    },
    {
      id: idBloco(),
      tipo: "copiar",
      rotulo: "Conceito principal",
      filhos: [
        {
          id: idBloco(),
          tipo: "paragrafo",
          texto: "Definição em uma ou duas frases, com as **palavras-chave** em negrito.",
          rotulo: { tipo: "definicao" },
        },
        { id: idBloco(), tipo: "formula", latex: "y = f(x)" },
        {
          id: idBloco(),
          tipo: "chamada",
          estilo: "simbolos",
          texto: "$y$ (unidade); $x$ (unidade). Liste cada símbolo e sua unidade.",
        },
        {
          id: idBloco(),
          tipo: "chamada",
          estilo: "diaadia",
          texto: "Uma frase ligando o conceito a uma situação do cotidiano da turma.",
        },
      ],
    },
    {
      id: idBloco(),
      tipo: "exemplo",
      rotulo: "Exemplo resolvido",
      filhos: [
        {
          id: idBloco(),
          tipo: "paragrafo",
          texto: "Enunciado do exemplo, com os dados organizados.",
        },
        {
          id: idBloco(),
          tipo: "paragrafo",
          texto: "Passo 1: ... Passo 2: ... \\resultado{Resposta em destaque.}",
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
              enunciado: "Questão objetiva sobre o conceito da aula.",
              alternativas: [
                "Alternativa correta",
                "Alternativa incorreta",
                "Alternativa incorreta",
              ],
              correta: 0,
            },
          ],
        },
        {
          numero: 2,
          titulo: "Aplicação",
          questoes: [
            {
              id: idBloco(),
              enunciado: "Questão para aplicar o conceito em uma situação nova.",
              alternativas: [],
              correta: null,
            },
          ],
        },
        { numero: 3, titulo: "Síntese", questoes: [] },
      ],
      gabarito:
        "2) Resposta esperada da questão aberta. As alternativas marcadas entram automaticamente.",
    },
  ];
}

/** Versão mínima: apenas uma seção e um parágrafo. */
export function notaVazia(titulo: string): Bloco[] {
  return [
    { id: idBloco(), tipo: "secao", titulo: titulo || "Primeiro tópico" },
    { id: idBloco(), tipo: "paragrafo", texto: "", rotulo: null },
  ];
}
