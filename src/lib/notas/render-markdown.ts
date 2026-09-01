// Formato de intercâmbio em Markdown. Exportação (.md) e importação (parse) com round-trip da AST. Sintaxe dos contêineres (uma por linha):: copiar Rótulo :: exemplo Rótulo :: dica Rótulo :: atencao | :: diaadia | :: simbolos :: exercicios Fórmula display: $$... $$ | Destaque coral: ==texto==

import {
  AparenciaNota,
  APARENCIA_PADRAO,
  Bloco,
  BlocoExercicios,
  BlocoFilho,
  EstiloChamada,
  NotaDados,
  Questao,
  Rotulo,
  RotuloTipo,
  idBloco,
  normalizarAparencia,
  normalizarBlocos,
} from "./tipos"
import { MESES_CAP } from "./texto"

// Exportação: AST para Markdown

/** inline: mantém $math$ e **negrito**; \resultado{X} vira ==X== e \dest{X} vira **X** */
function inlineParaMd(texto: string): string {
  return texto
    .replace(/\\resultado\{([^}]*)\}/g, "==$1==")
    .replace(/\\dest\{([^}]*)\}/g, "**$1**")
    .replace(/~~([^~]+)~~/g, "~~$1~~")
}

function mdParaInline(texto: string): string {
  // inverso: ==X== vira \resultado{X}
  return texto.replace(/==([^=]+)==/g, "\\resultado{$1}")
}

function rotuloParaMd(rotulo: Rotulo | null | undefined): string {
  if (!rotulo) return ""
  if (rotulo.tipo === "livre") return rotulo.texto ? `**${rotulo.texto}** ` : ""
  const nome = {
    definicao: "Definição.",
    formulas: "Fórmulas.",
    relacoes: "Relações.",
    modelo: "Modelo básico.",
    resolucao: "Resolução.",
  }[rotulo.tipo]
  return nome ? `**${nome}** ` : ""
}

function filhoParaMd(f: BlocoFilho): string {
  switch (f.tipo) {
    case "paragrafo":
      return `${rotuloParaMd(f.rotulo)}${inlineParaMd(f.texto)}`
    case "formula":
      return `$$${f.latex}$$`
    case "lista":
      return f.itens.map((i) => `- ${inlineParaMd(i)}`).join("\n")
    case "tabela": {
      if (f.linhas.length === 0) return ""
      const nCol = Math.max(...f.linhas.map((l) => l.length))
      const norm = f.linhas.map((l) => {
        const c = [...l]
        while (c.length < nCol) c.push("")
        return c.map((x) => inlineParaMd(x).replace(/\|/g, "\\|"))
      })
      const sep = `|${Array.from({ length: nCol }, () => "---").join("|")}|`
      const linhas = norm.map((l) => `| ${l.join(" | ")} |`)
      if (f.comCabecalho) return [linhas[0], sep, ...linhas.slice(1)].join("\n")
      return [sep, ...linhas].join("\n")
    }
    case "chamada":
      return `:: ${f.estilo}\n${inlineParaMd(f.texto)}\n::`
  }
}

function questaoParaMd(q: Questao, numero: number): string {
  let s = `${numero}. ${inlineParaMd(q.enunciado)}`
  if (q.alternativas.length > 0) {
    s +=
      "\n" + q.alternativas.map((a, i) => `   ${"abcd"[i] ?? "?"}) ${inlineParaMd(a)}`).join("\n")
  }
  return s
}

function blocoParaMd(b: Bloco): string {
  switch (b.tipo) {
    case "secao":
      return `## ${b.titulo}`
    case "paragrafo":
    case "formula":
    case "lista":
    case "tabela":
    case "chamada":
      return filhoParaMd(b)
    case "figura":
      return `![${inlineParaMd(b.legenda)}](${b.url})`
    case "tikz":
      return [
        "```tikz",
        b.codigo.trim(),
        "```",
        b.legenda.trim() ? `*${inlineParaMd(b.legenda)}*` : "",
      ]
        .filter(Boolean)
        .join("\n")
    case "copiar":
    case "exemplo":
    case "dica":
      return [
        `:: ${b.tipo}${b.rotulo ? ` ${b.rotulo}` : ""}`,
        ...b.filhos.map(filhoParaMd),
        "::",
      ].join("\n\n")
    case "exercicios": {
      const partes: string[] = [
        `:: exercicios${b.rotulo && b.rotulo !== "Exercícios propostos" ? ` ${b.rotulo}` : ""}`,
      ]
      let numero = 0
      for (const nivel of b.niveis) {
        if (nivel.questoes.length === 0) continue
        partes.push(`### Nível ${nivel.numero} · ${nivel.titulo}`)
        for (const q of nivel.questoes) {
          numero++
          partes.push(questaoParaMd(q, numero))
        }
      }
      const gabAuto: string[] = []
      let n = 0
      for (const nivel of b.niveis) {
        for (const q of nivel.questoes) {
          n++
          if (q.alternativas.length > 0 && q.correta !== null)
            gabAuto.push(`${n}${"abcd"[q.correta] ?? ""}`)
        }
      }
      const gab = [gabAuto.join(" · "), inlineParaMd(b.gabarito.trim())].filter(Boolean).join(" · ")
      if (gab) partes.push(`**Gabarito:** ${gab}`)
      partes.push("::")
      return partes.join("\n\n")
    }
  }
}

export interface MarkdownNota {
  titulo: string
  disciplina: string
  anoLetivo: number
  mes: number
  turmas: string[]
  habilidades: string
  sobre: string
  status: string
  slug?: string
  aparencia?: AparenciaNota
  blocos: Bloco[]
}

/** Front-matter da aparência: só escreve chaves com valor não padrão. */
function aparenciaParaMd(ap: AparenciaNota | null | undefined): string[] {
  const linhas: string[] = []
  if (ap?.fonte && ap.fonte !== APARENCIA_PADRAO.fonte) linhas.push(`fonte: ${ap.fonte}`)
  if (ap?.escala && ap.escala !== APARENCIA_PADRAO.escala) linhas.push(`escala: ${ap.escala}`)
  if (ap?.entrelinha && ap.entrelinha !== APARENCIA_PADRAO.entrelinha)
    linhas.push(`entrelinha: ${ap.entrelinha}`)
  return linhas
}

export function gerarMarkdown(nota: NotaDados): string {
  const fm: string[] = [
    "---",
    `titulo: ${nota.titulo}`,
    `disciplina: ${nota.disciplina?.nome ?? ""}`,
    `ano: ${nota.anoLetivo}`,
    `mes: ${nota.mes}`,
    `turmas: ${nota.turmas.map((t) => t.nome).join(", ")}`,
    `habilidades: ${nota.habilidades}`,
    `status: ${nota.status}`,
    `slug: ${nota.slug}`,
    ...aparenciaParaMd(nota.aparencia),
    "---",
  ]
  const cabecalho = fm.join("\n")
  const sobre = nota.sobre.trim() ? `> ${nota.sobre.trim().replace(/\n/g, "\n> ")}` : ""
  const corpo = nota.blocos.map(blocoParaMd).join("\n\n")
  return [cabecalho, "", `# ${nota.titulo}`, "", sobre, "", corpo, ""]
    .filter((x) => x !== undefined)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
}

// Importação: Markdown para AST

const ROTULO_MD: Record<string, RotuloTipo> = {
  "definição.": "definicao",
  "definicao.": "definicao",
  "fórmulas.": "formulas",
  "formulas.": "formulas",
  "relações.": "relacoes",
  "relacoes.": "relacoes",
  "modelo básico.": "modelo",
  "modelo basico.": "modelo",
  "resolução.": "resolucao",
  "resolucao.": "resolucao",
}

function extrairRotuloMd(linha: string): { rotulo: Rotulo | null; resto: string } {
  const m = /^\*\*([^*]+)\*\*\s*([\s\S]*)$/.exec(linha.trim())
  if (!m) return { rotulo: null, resto: linha }
  const nome = m[1].trim().toLowerCase()
  if (ROTULO_MD[nome]) return { rotulo: { tipo: ROTULO_MD[nome] }, resto: m[2] }
  return { rotulo: { tipo: "livre", texto: m[1] }, resto: m[2] }
}

interface PilhaContainer {
  tipo: "copiar" | "exemplo" | "dica" | "exercicios" | "raiz"
  rotulo?: string
  destino: Bloco[] | BlocoFilho[]
  filhos?: BlocoFilho[]
  exercicios?: BlocoExercicios
  nivelAtual?: { numero: 1 | 2 | 3; titulo: string; questoes: Questao[] }
  /** acumulador de linhas de parágrafo */
  buffer: string[]
  /** linhas "cruas" (tabela) */
  linhasTabela: string[]
}

/** Analisa o Markdown de uma nota (formato gerado pelo próprio app). */
export function analisarMarkdown(md: string): MarkdownNota {
  const linhas = md.replace(/\r\n/g, "\n").split("\n")
  const meta: Record<string, string> = {}
  let i = 0

  // front-matter
  if (linhas[0]?.trim() === "---") {
    i = 1
    while (i < linhas.length && linhas[i].trim() !== "---") {
      const m = /^([a-zA-Zà-úÀ-Ú]+)\s*:\s*(.*)$/.exec(linhas[i])
      if (m) meta[m[1].toLowerCase()] = m[2].trim()
      i++
    }
    i++
  }

  // título (# ...)
  let titulo = meta["titulo"] ?? ""
  if (!titulo) {
    while (i < linhas.length) {
      const m = /^#\s+(.*)$/.exec(linhas[i])
      if (m) {
        titulo = m[1].trim()
        i++
        break
      }
      i++
    }
  }

  const sobreLinhas: string[] = []
  let emCite = false
  while (i < linhas.length) {
    const l = linhas[i]
    // título principal (# ...): o título já veio no front-matter, pula
    if (!emCite && /^#\s+/.test(l.trim())) {
      i++
      continue
    }
    if (/^>\s?/.test(l)) {
      emCite = true
      sobreLinhas.push(l.replace(/^>\s?/, ""))
      i++
    } else if (emCite && l.trim() === "") {
      break
    } else if (emCite) {
      // citação de várias linhas
      sobreLinhas.push(l)
      i++
    } else if (l.trim() === "") {
      i++
    } else {
      break
    }
  }
  const sobre = sobreLinhas.join(" ").trim()

  // blocos
  const raiz: Bloco[] = []
  const pilha: PilhaContainer[] = [{ tipo: "raiz", destino: raiz, buffer: [], linhasTabela: [] }]

  const destinoAtual = (): Bloco[] | BlocoFilho[] =>
    pilha[pilha.length - 1].tipo === "raiz"
      ? (pilha[pilha.length - 1].destino as Bloco[])
      : (pilha[pilha.length - 1].filhos ?? pilha[pilha.length - 1].destino)

  const flushParagrafo = (): void => {
    const topo = pilha[pilha.length - 1]
    const texto = topo.buffer.join("\n").trim()
    topo.buffer = []
    if (!texto) return
    const { rotulo, resto } = extrairRotuloMd(texto)
    const bloco: BlocoFilho = {
      id: idBloco(),
      tipo: "paragrafo",
      texto: mdParaInline(resto),
      rotulo,
    }
    ;(destinoAtual() as BlocoFilho[]).push(bloco)
  }

  const flushTabela = (): void => {
    const topo = pilha[pilha.length - 1]
    const linhas = topo.linhasTabela
    topo.linhasTabela = []
    if (linhas.length === 0) return
    const celulas = linhas
      .filter((l) => !/^\|[\s:|-]+\|?$/.test(l.trim()))
      .map((l) =>
        l
          .trim()
          .replace(/^\|/, "")
          .replace(/\|$/, "")
          .split("|")
          .map((c) => mdParaInline(c.trim())),
      )
    if (celulas.length === 0) return
    const ehSep = linhas.some((l) => /^\|[\s:|-]+\|?$/.test(l.trim()))
    const idxSep = linhas.findIndex((l) => /^\|[\s:|-]+\|?$/.test(l.trim()))
    const comCabecalho = ehSep && idxSep === 1
    ;(destinoAtual() as BlocoFilho[]).push({
      id: idBloco(),
      tipo: "tabela",
      comCabecalho,
      linhas: celulas,
    })
  }

  const flushExercicioAtual = (): void => {
    const topo = pilha[pilha.length - 1]
    if (topo.nivelAtual && topo.exercicios) {
      topo.exercicios.niveis.push(topo.nivelAtual)
      topo.nivelAtual = undefined
    }
  }

  while (i < linhas.length) {
    const linha = linhas[i]

    // :: fechamento
    if (/^::\s*$/.test(linha.trim())) {
      flushParagrafo()
      flushTabela()
      const topo = pilha.pop()
      if (topo && topo.tipo !== "raiz") {
        if (topo.tipo === "exercicios" && topo.exercicios) {
          flushExercicioAtual()
          raiz.push(topo.exercicios)
        } else {
          raiz.push({
            id: idBloco(),
            tipo: topo.tipo as "copiar" | "exemplo" | "dica",
            rotulo: topo.rotulo ?? "",
            filhos: topo.filhos ?? [],
          } as Bloco)
        }
      }
      i++
      continue
    }

    // :: abertura
    const mAbertura =
      /^::\s*(copiar|exemplo|dica|exercicios|atencao|diaadia|simbolos)\s*(.*)$/.exec(linha.trim())
    if (mAbertura) {
      flushParagrafo()
      flushTabela()
      const tipo = mAbertura[1] as PilhaContainer["tipo"] | EstiloChamada
      const rotulo = mAbertura[2].trim()
      if (tipo === "atencao" || tipo === "diaadia" || tipo === "simbolos") {
        // contêiner de uma chamada: coletar texto até ::
        let texto = ""
        i++
        while (i < linhas.length && !/^::\s*$/.test(linhas[i].trim())) {
          texto += (texto ? "\n" : "") + linhas[i]
          i++
        }
        i++ // pula o ::
        ;(destinoAtual() as BlocoFilho[]).push({
          id: idBloco(),
          tipo: "chamada",
          estilo: tipo as EstiloChamada,
          texto: mdParaInline(texto.trim()),
        })
        continue
      }
      if (tipo === "exercicios") {
        pilha.push({
          tipo: "exercicios",
          destino: raiz,
          exercicios: {
            id: idBloco(),
            tipo: "exercicios",
            rotulo: rotulo || "Exercícios propostos",
            niveis: [],
            gabarito: "",
          },
          buffer: [],
          linhasTabela: [],
        })
      } else {
        pilha.push({
          tipo,
          rotulo,
          destino: raiz,
          filhos: [],
          buffer: [],
          linhasTabela: [],
        })
      }
      i++
      continue
    }

    // dentro de exercícios
    const topo = pilha[pilha.length - 1]
    if (topo.tipo === "exercicios" && topo.exercicios) {
      const mNivel = /^###\s*N[íi]vel\s*([123])\s*[·:\-.]?\s*(.*)$/.exec(linha.trim())
      if (mNivel) {
        flushExercicioAtual()
        topo.nivelAtual = {
          numero: Number(mNivel[1]) as 1 | 2 | 3,
          // tolera separadores antigos ("Nível 1 . Conceitos")
          titulo: mNivel[2].trim().replace(/^[·:\-.]+\s*/, "") || "Conceitos",
          questoes: [],
        }
        i++
        continue
      }
      const mGab = /^\*\*Gabarito:\*\*\s*(.*)$/.exec(linha.trim())
      if (mGab) {
        flushExercicioAtual()
        topo.exercicios.gabarito = mdParaInline(mGab[1].trim())
        i++
        continue
      }
      const mQuestao = /^(\d+)[.)]\s+(.*)$/.exec(linha.trim())
      if (mQuestao && topo.nivelAtual) {
        topo.nivelAtual.questoes.push({
          id: idBloco(),
          enunciado: mdParaInline(mQuestao[2].trim()),
          alternativas: [],
          correta: null,
        })
        i++
        continue
      }
      const mAlt = /^([a-d])[.)]\s+(.*)$/.exec(linha.trim())
      if (mAlt && topo.nivelAtual && topo.nivelAtual.questoes.length > 0) {
        topo.nivelAtual.questoes[topo.nivelAtual.questoes.length - 1].alternativas.push(
          mdParaInline(mAlt[2].trim()),
        )
        i++
        continue
      }
      i++
      continue
    }

    // seções
    const mSecao = /^##\s+(.*)$/.exec(linha.trim())
    if (mSecao) {
      flushParagrafo()
      flushTabela()
      const tituloSecao = mSecao[1].replace(/^\d+[.)]\s*/, "").trim()
      ;(pilha[0].destino as Bloco[]).push({ id: idBloco(), tipo: "secao", titulo: tituloSecao })
      i++
      continue
    }

    // fórmula $$
    if (linha.trim().startsWith("$$")) {
      flushParagrafo()
      flushTabela()
      let latex = linha.trim().slice(2)
      if (latex.endsWith("$$")) {
        latex = latex.slice(0, -2)
      } else {
        i++
        while (i < linhas.length && !linhas[i].trim().endsWith("$$")) {
          latex += "\n" + linhas[i]
          i++
        }
        if (i < linhas.length) latex += "\n" + linhas[i].trim().replace(/\$\$$/, "")
      }
      ;(destinoAtual() as BlocoFilho[]).push({
        id: idBloco(),
        tipo: "formula",
        latex: latex.trim(),
      })
      i++
      continue
    }

    // tikz fenced ```tikz
    if (linha.trim().startsWith("```")) {
      const lang = linha.trim().slice(3).trim().toLowerCase()
      if (lang === "tikz" || lang === "tikzjax") {
        flushParagrafo()
        flushTabela()
        let codigo = ""
        i++
        while (i < linhas.length && !linhas[i].trim().startsWith("```")) {
          codigo += (codigo ? "\n" : "") + linhas[i]
          i++
        }
        i++
        let legenda = ""
        if (i < linhas.length && /^\*.*\*$/.test(linhas[i].trim())) {
          legenda = mdParaInline(linhas[i].trim().replace(/^\*|\*$/g, ""))
          i++
        }
        ;(pilha[0].destino as Bloco[]).push({
          id: idBloco(),
          tipo: "tikz",
          codigo: codigo.trim(),
          legenda,
        })
        continue
      }
    }

    // lista
    if (/^[-*]\s+/.test(linha.trim())) {
      flushParagrafo()
      flushTabela()
      const itens: string[] = []
      while (i < linhas.length && /^[-*]\s+/.test(linhas[i].trim())) {
        itens.push(mdParaInline(linhas[i].trim().replace(/^[-*]\s+/, "")))
        i++
      }
      ;(destinoAtual() as BlocoFilho[]).push({ id: idBloco(), tipo: "lista", itens })
      continue
    }

    // tabela
    if (linha.trim().startsWith("|")) {
      flushParagrafo()
      while (i < linhas.length && linhas[i].trim().startsWith("|")) {
        pilha[pilha.length - 1].linhasTabela.push(linhas[i])
        i++
      }
      flushTabela()
      continue
    }

    // figura ![legenda](url)
    const mFig = /^!\[([^\]]*)\]\(([^)]+)\)$/.exec(linha.trim())
    if (mFig) {
      flushParagrafo()
      flushTabela()
      ;(pilha[0].destino as Bloco[]).push({
        id: idBloco(),
        tipo: "figura",
        url: mFig[2],
        legenda: mdParaInline(mFig[1]),
      })
      i++
      continue
    }

    // linha vazia => fim de parágrafo
    if (linha.trim() === "") {
      flushParagrafo()
      i++
      continue
    }

    // título principal # (ignora, já lido)
    if (/^#\s+/.test(linha.trim())) {
      i++
      continue
    }

    // linha comum => acumula
    pilha[pilha.length - 1].buffer.push(linha)
    i++
  }
  while (pilha.length > 1) {
    const topo = pilha.pop()
    if (topo && topo.tipo !== "raiz") {
      if (topo.tipo === "exercicios" && topo.exercicios) {
        flushExercicioAtual()
        raiz.push(topo.exercicios)
      } else {
        raiz.push({
          id: idBloco(),
          tipo: topo.tipo as "copiar" | "exemplo" | "dica",
          rotulo: topo.rotulo ?? "",
          filhos: topo.filhos ?? [],
        } as Bloco)
      }
    }
  }
  flushParagrafo()
  flushTabela()

  return {
    titulo: titulo || "Nota sem título",
    disciplina: meta["disciplina"] ?? "",
    anoLetivo: Number(meta["ano"]) || new Date().getFullYear(),
    mes: Number(meta["mes"]) || new Date().getMonth() + 1,
    turmas: (meta["turmas"] ?? "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    habilidades: meta["habilidades"] ?? "",
    sobre,
    status: meta["status"] === "publicada" ? "publicada" : "rascunho",
    slug: meta["slug"],
    aparencia: normalizarAparencia({
      fonte: meta["fonte"],
      escala: meta["escala"],
      entrelinha: meta["entrelinha"],
    }),
    blocos: normalizarBlocos(raiz),
  }
}
