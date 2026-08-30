// Gerador de.tex. A nota volta ao formato da classe notaaula.cls, mantendo o pipeline LaTeX original intacto.

import { Bloco, BlocoFilho, NotaDados, ROTULOS_FIXOS, textoRotulo } from "./tipos"
import { escaparLatex, inlineParaLatex } from "./latex"
import { MESES_CAP } from "./texto"

function nomeArquivoImagem(url: string): { caminho: string; comentario: string } {
  if (url.startsWith("/api/imagens/")) {
    const id = url.split("/").pop() ?? "imagem"
    return {
      caminho: `imagens/${id}`,
      comentario: `% imagem enviada ao app . Baixe em ${url} e salve em imagens/${id}`,
    }
  }
  return { caminho: url, comentario: `% imagem externa: ${url}` }
}

function filhoParaLatex(f: BlocoFilho): string {
  switch (f.tipo) {
    case "paragrafo": {
      const rotulo = f.rotulo
      let prefixo = ""
      if (rotulo) {
        if (rotulo.tipo === "livre") prefixo = `\\rotulo{${inlineParaLatex(rotulo.texto ?? "")}} `
        else {
          const nome = ROTULOS_FIXOS.find((r) => r.tipo === rotulo.tipo)?.tipo ?? "rotulo"
          prefixo = `\\${nome} `
        }
      }
      return `${prefixo}${inlineParaLatex(f.texto)}\n\n`
    }
    case "formula":
      return `\\[\n  ${f.latex}\n\\]\n\n`
    case "lista":
      return `\\begin{itens}\n${f.itens
        .map((i) => `\\item ${inlineParaLatex(i)};`)
        .join("\n")}\n\\end{itens}\n\n`
    case "tabela": {
      const nCol = Math.max(1, ...f.linhas.map((l) => l.length))
      const spec = Array.from({ length: nCol }, (_, i) => (i === 0 ? "l" : "c")).join("")
      const linhas = f.linhas
        .map((linha) => linha.map((c) => inlineParaLatex(c)).join(" & "))
        .join(" \\\\\n")
      const corpo = f.comCabecalho ? linhas.replace(" \\\\\n", " \\\\\n\\midrule\n") : linhas
      return `\\begin{center}\\footnotesize\n\\begin{tabular}{${spec}}\n\\toprule\n${corpo}\n\\bottomrule\n\\end{tabular}\n\\end{center}\n\n`
    }
    case "chamada": {
      const cmd =
        f.estilo === "atencao" ? "atencao" : f.estilo === "diaadia" ? "diaadia" : "simbolos"
      return `\\${cmd}{${inlineParaLatex(f.texto)}}\n\n`
    }
  }
}

function garantirTikz(codigo: string): string {
  const c = codigo.trim()
  if (!c) return ""
  if (c.includes("\\begin{tikzpicture}") || c.includes("\\begin{axis}")) return c
  return `\\begin{tikzpicture}\n${c}\n\\end{tikzpicture}`
}

function blocoParaLatex(b: Bloco): string {
  switch (b.tipo) {
    case "secao":
      return `\\section{${inlineParaLatex(b.titulo)}}\n\n`
    case "paragrafo":
    case "formula":
    case "lista":
    case "tabela":
    case "chamada":
      return filhoParaLatex(b)
    case "figura": {
      if (!b.url) return ""
      const { caminho, comentario } = nomeArquivoImagem(b.url)
      return `% ${comentario}\n\\begin{figuranota}{${inlineParaLatex(b.legenda)}}\n\\includegraphics[width=0.85\\linewidth]{${caminho}}\n\\end{figuranota}\n\n`
    }
    case "tikz": {
      const raw = b.codigo.trim()
      if (!raw) return ""
      const corpo = garantirTikz(raw)
      if (b.legenda.trim()) {
        return `\\begin{figuranota}{${inlineParaLatex(b.legenda)}}\n\\begin{center}\n${corpo}\n\\end{center}\n\\end{figuranota}\n\n`
      }
      return `\\begin{center}\n${corpo}\n\\end{center}\n\n`
    }
    case "copiar":
      return `\\begin{copiar}{${inlineParaLatex(b.rotulo || "Bloco")}}\n${b.filhos
        .map(filhoParaLatex)
        .join("")}\\end{copiar}\n\n`
    case "exemplo":
      return `\\begin{exemplo}${b.rotulo && b.rotulo !== "Exemplo resolvido" ? `[${inlineParaLatex(b.rotulo)}]` : ""}\n${b.filhos
        .map(filhoParaLatex)
        .join("")}\\end{exemplo}\n\n`
    case "dica":
      return `\\begin{dica}${b.rotulo && b.rotulo !== "Dica / erro comum" ? `[${inlineParaLatex(b.rotulo)}]` : ""}\n${b.filhos
        .map(filhoParaLatex)
        .join("")}\\end{dica}\n\n`
    case "exercicios": {
      let corpo = ""
      let aberto = false
      for (const nivel of b.niveis) {
        if (nivel.questoes.length === 0) continue
        if (!aberto) {
          corpo += `\\begin{questoes}\n`
          aberto = true
        }
        corpo += `\\nivel{${nivel.numero}}{${inlineParaLatex(nivel.titulo)}}\n`
        for (const q of nivel.questoes) {
          corpo += `\\item ${inlineParaLatex(q.enunciado)}\n`
          if (q.alternativas.length > 0) {
            corpo += `  \\begin{alternativas}\n${q.alternativas
              .map((a) => `  \\item ${inlineParaLatex(a)};`)
              .join("\n")}\n  \\end{alternativas}\n`
          }
        }
      }
      if (aberto) corpo += `\\end{questoes}\n`
      const gab = montarGabarito(b)
      if (gab) corpo += `\\gabarito{${gab}}\n`
      return `\\begin{exercicios}${b.rotulo && b.rotulo !== "Exercícios propostos" ? `[${inlineParaLatex(b.rotulo)}]` : ""}\n${corpo}\\end{exercicios}\n\n`
    }
  }
}

function montarGabarito(b: Extract<Bloco, { tipo: "exercicios" }>): string {
  const itens: string[] = []
  let numero = 0
  for (const nivel of b.niveis) {
    for (const q of nivel.questoes) {
      numero++
      if (q.alternativas.length > 0 && q.correta !== null) {
        itens.push(`${numero}${"abcd"[q.correta] ?? ""}`)
      }
    }
  }
  const partes: string[] = []
  if (itens.length > 0) partes.push(itens.join(" \u00b7 "))
  if (b.gabarito.trim()) partes.push(inlineParaLatex(b.gabarito.trim()))
  return partes.join(" \u00b7 ")
}

/** Linha de créditos igual à do sistema original. */
export function montarCreditos(nota: NotaDados, professor: string): string {
  const partes: string[] = []
  if (nota.turmas.length === 1) partes.push(`Turma ${nota.turmas[0].nome}`)
  else if (nota.turmas.length > 1)
    partes.push(`Turmas ${nota.turmas.map((t) => t.nome).join(" e ")}`)
  partes.push(nota.disciplina?.nome ?? "")
  partes.push(`${MESES_CAP[nota.mes - 1] ?? ""}/${nota.anoLetivo}`)
  if (professor.trim()) partes.push(professor.trim())
  return partes.filter(Boolean).join(" \u00b7 ")
}

/** Gera o documento .tex completo de uma nota. */
export function gerarTex(nota: NotaDados, professor: string): string {
  const creditos = montarCreditos(nota, professor)
  const habilidades = nota.habilidades.trim()
    ? ` Habilidades em foco: ${escaparLatex(nota.habilidades.trim())}.`
    : ""
  const sobre = nota.sobre.trim()
    ? `\\begin{sobre}\n${inlineParaLatex(nota.sobre.trim())}${habilidades}\n\\end{sobre}\n\n`
    : ""
  const corpo = nota.blocos.map(blocoParaLatex).join("").trimEnd()

  return `% Gerado automaticamente pelo Caderno Aberto\n\\documentclass{notaaula}\n\n\\titulonota{${inlineParaLatex(
    nota.titulo,
  )}}\n\\creditos{${inlineParaLatex(creditos)}}\n\n\\begin{document}\n\\cabecalho\n\n${sobre}${corpo}\n\n\\end{document}\n`
}

export { textoRotulo }
