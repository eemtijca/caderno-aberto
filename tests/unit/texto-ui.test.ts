// Guarda de estilo dos textos de interface: barra caracteres e padrões proibidos
// pela convenção editorial (sem travessão, reticências tipográficas, aspas
// curvas, segunda pessoa explícita ou pluralização com parênteses).

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const RAIZ = path.resolve(fileURLToPath(new URL("../../src", import.meta.url)));

interface Regra {
  nome: string;
  regex: RegExp;
}

const REGRAS: Regra[] = [
  {
    nome: "travessão, meia-risca, reticências tipográficas, aspas curvas, setas ou aspas angulares",
    regex: /[…—–“”‘’→«»]/,
  },
  { nome: "entidades de aspas tipográficas", regex: /&ldquo;|&rdquo;|&lsquo;|&rsquo;/ },
  { nome: "segunda pessoa explícita", regex: /\bvocês?\b/i },
  {
    nome: "pluralização com parênteses",
    regex: /professor\(a\)|\b(?:nota|disciplina|turma|link|aula)\(s\)/,
  },
];

async function listarArquivos(dir: string): Promise<string[]> {
  const entradas = await readdir(dir, { withFileTypes: true });
  const saida: string[] = [];
  for (const entrada of entradas) {
    const completo = path.join(dir, entrada.name);
    if (entrada.isDirectory()) saida.push(...(await listarArquivos(completo)));
    else if (/\.(ts|tsx)$/.test(entrada.name)) saida.push(completo);
  }
  return saida;
}

describe("texto da interface", () => {
  it("segue a convenção editorial em src", async () => {
    const arquivos = await listarArquivos(RAIZ);
    const problemas: string[] = [];
    for (const arquivo of arquivos) {
      const linhas = (await readFile(arquivo, "utf8")).split("\n");
      for (const regra of REGRAS) {
        linhas.forEach((linha, indice) => {
          if (regra.regex.test(linha)) {
            problemas.push(
              `${path.relative(RAIZ, arquivo)}:${indice + 1} [${regra.nome}] ${linha.trim()}`,
            );
          }
        });
      }
    }
    expect(problemas, `Texto de UI fora do padrão:\n${problemas.join("\n")}`).toEqual([]);
  });
});
