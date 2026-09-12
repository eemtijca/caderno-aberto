// Parser leve de LaTeX próprio do app e conversões para KaTeX e .tex.
export function varrerChaves(s: string, abre: number): { fim: number; conteudo: string } | null {
  if (s[abre] !== "{") return null;
  // Conta chaves respeitando escapes para achar o fecha correspondente.
  let profundidade = 0;
  for (let i = abre; i < s.length; i++) {
    const c = s[i];
    if (c === "\\") {
      i++;
      continue;
    }
    if (c === "{") profundidade++;
    else if (c === "}") {
      profundidade--;
      if (profundidade === 0) {
        return { fim: i, conteudo: s.slice(abre + 1, i) };
      }
    }
  }
  return null;
}

export function substituirComando(
  latex: string,
  cmd: string,
  fn: (conteudo: string) => string,
): string {
  const alvo = `\\${cmd}{`;
  let saida = "";
  let i = 0;
  while (i < latex.length) {
    const idx = latex.indexOf(alvo, i);
    if (idx === -1) {
      saida += latex.slice(i);
      break;
    }
    // evita casar \xcmd{ (ex.: \destilo{ ao procurar \dest{)
    const antes = latex[idx - 1];
    if (antes && /[a-zA-Z]/.test(antes)) {
      saida += latex.slice(i, idx + alvo.length);
      i = idx + alvo.length;
      continue;
    }
    const varredura = varrerChaves(latex, idx + alvo.length - 1);
    if (!varredura) {
      saida += latex.slice(i, idx + alvo.length);
      i = idx + alvo.length;
      continue;
    }
    saida += latex.slice(i, idx) + fn(varredura.conteudo);
    i = varredura.fim + 1;
  }
  return saida;
}

function decParaKatex(conteudo: string): string {
  // KaTeX trata a vírgula decimal como pontuação; agrupar evita o espaço.
  const i = conteudo.indexOf(",");
  if (i === -1) return conteudo;
  return `${conteudo.slice(0, i)}{,}${conteudo.slice(i + 1)}`;
}

// Expande os macros do app para HTML/classe usada na leitura.
export function preprocessarLatex(latex: string): string {
  let r = latex;
  r = substituirComando(r, "dec", decParaKatex);
  r = substituirComando(r, "un", (c) => `\\,\\mathrm{${c}}`);
  r = substituirComando(r, "resultado", (c) => `\\htmlClass{na-resultado}{${c}}`);
  r = substituirComando(r, "dest", (c) => `\\textbf{${c}}`);
  return r;
}

// Mesma expansão, porém com comandos aceitos pelo KaTeX.
export function prepararMatematicaTex(latex: string): string {
  let r = latex;
  r = substituirComando(r, "dec", (c) => c.replace(/,/g, "{,}"));
  r = substituirComando(r, "un", (c) => `\\,\\mathrm{${c}}`);
  r = substituirComando(r, "resultado", (c) => `\\textcolor{caresultado}{${c}}`);
  return r;
}

// Nomes em português que o KaTeX não reconhece por padrão.
export const MACROS_KATEX: Record<string, string> = {
  "\\sen": "\\operatorname{sen}",
  "\\tg": "\\operatorname{tg}",
  "\\cotg": "\\operatorname{cotg}",
  "\\cossec": "\\operatorname{cossec}",
};

const MAPA_ESCAPE_LATEX: Record<string, string> = {
  "\\": "\\textbackslash{}",
  "&": "\\&",
  "%": "\\%",
  "#": "\\#",
  _: "\\_",
  "{": "\\{",
  "}": "\\}",
  "~": "\\textasciitilde{}",
  "^": "\\textasciicircum{}",
};

export function escaparLatex(texto: string): string {
  return texto.replace(/[\\&%#_{}~^]/g, (ch) => MAPA_ESCAPE_LATEX[ch]);
}

// Converte o subconjunto markdown suportado (negrito, itálico, código e $...$).
export function inlineParaLatex(texto: string): string {
  if (!texto) return "";
  let saida = "";
  let i = 0;
  const n = texto.length;
  while (i < n) {
    if (texto[i] === "$") {
      const fim = acharFimMatematica(texto, i);
      if (fim === -1) {
        saida += escaparLatex(texto.slice(i));
        break;
      }
      saida += `$${prepararMatematicaTex(texto.slice(i + 1, fim))}$`;
      i = fim + 1;
      continue;
    }
    const mCmd = /^\\(resultado|dest|textbf|textit|texttt|text|mathrm|mathbf|ce|pu)\b/.exec(
      texto.slice(i),
    );
    if (mCmd) {
      const inicioArg = i + mCmd[0].length;
      let j = inicioArg;
      while (j < n && texto[j] === " ") j++;
      if (texto[j] === "{") {
        const v = varrerChaves(texto, j);
        if (v) {
          saida += texto.slice(i, v.fim + 1);
          i = v.fim + 1;
          continue;
        }
      }
      saida += mCmd[0];
      i = inicioArg;
      continue;
    }
    if (texto.startsWith("**", i)) {
      const fim = texto.indexOf("**", i + 2);
      if (fim !== -1) {
        saida += `\\textbf{${inlineParaLatex(texto.slice(i + 2, fim))}}`;
        i = fim + 2;
        continue;
      }
    }
    if (texto[i] === "*") {
      const fim = texto.indexOf("*", i + 1);
      if (fim !== -1 && texto[fim + 1] !== "*") {
        saida += `\\textit{${inlineParaLatex(texto.slice(i + 1, fim))}}`;
        i = fim + 1;
        continue;
      }
    }
    if (texto[i] === "`") {
      const fim = texto.indexOf("`", i + 1);
      if (fim !== -1) {
        saida += `\\texttt{${escaparLatex(texto.slice(i + 1, fim))}}`;
        i = fim + 1;
        continue;
      }
    }
    let j = i;
    while (j < n && texto[j] !== "$" && texto[j] !== "*" && texto[j] !== "`" && texto[j] !== "\\") {
      j++;
    }
    if (j === i) j++;
    saida += escaparLatex(texto.slice(i, j));
    i = j;
  }
  return saida;
}

// Ignora $ escapado ao procurar o fecha da expressão matemática.
function acharFimMatematica(texto: string, ini: number): number {
  const n = texto.length;
  let i = ini + 1;
  while (i < n) {
    if (texto[i] === "\\") {
      i += 2;
      continue;
    }
    if (texto[i] === "$") return i;
    i++;
  }
  return -1;
}

export function escaparCaminhoLatex(texto: string): string {
  return texto.replace(/[\\{}$&#^_~%]/g, "");
}
