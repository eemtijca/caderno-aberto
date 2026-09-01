"use client"

// Vista de leitura. Renderização dos blocos (redesenho). Inclui quiz interativo, gabarito ocultável e estilos de impressão A4.

import { useState, type ReactNode } from "react"
import {
  BookMarked,
  CheckCircle2,
  EyeOff,
  Lightbulb,
  ListChecks,
  PencilLine,
  Ruler,
  Sprout,
  TriangleAlert,
} from "lucide-react"
import type { Bloco, BlocoFilho, Questao, Rotulo } from "@/lib/notas/tipos"
import { textoRotulo } from "@/lib/notas/tipos"
import { Inline, renderizarInline } from "./inline"
import { Matematica } from "./matematica"
import { Tikz } from "./tikz"

const CORES_ROTULO: Record<string, string> = {
  definicao: "text-sky-700 dark:text-sky-300",
  formulas: "text-sky-700 dark:text-sky-300",
  relacoes: "text-sky-700 dark:text-sky-300",
  modelo: "text-sky-700 dark:text-sky-300",
  resolucao: "text-sky-700 dark:text-sky-300",
  livre: "text-sky-700 dark:text-sky-300",
}

function RotuloPrefixo({ rotulo }: { rotulo: Rotulo | null | undefined }) {
  const texto = textoRotulo(rotulo)
  if (!texto) return null
  return <span className={`font-bold ${CORES_ROTULO[rotulo?.tipo ?? "livre"]}`}>{texto} </span>
}

const CHAMADAS: Record<
  string,
  { icone: typeof TriangleAlert; classe: string; titulo: string; tituloClasse: string }
> = {
  atencao: {
    icone: TriangleAlert,
    classe: "border-amber-300/70 bg-amber-50 dark:border-amber-800/60 dark:bg-amber-950/30",
    titulo: "Atenção:",
    tituloClasse: "text-amber-800 dark:text-amber-300",
  },
  diaadia: {
    icone: Sprout,
    classe: "border-emerald-300/70 bg-emerald-50 dark:border-emerald-800/60 dark:bg-emerald-950/30",
    titulo: "No dia a dia:",
    tituloClasse: "text-emerald-800 dark:text-emerald-300",
  },
  simbolos: {
    icone: Ruler,
    classe: "border-violet-300/70 bg-violet-50 dark:border-violet-800/60 dark:bg-violet-950/30",
    titulo: "Símbolos:",
    tituloClasse: "text-violet-800 dark:text-violet-300",
  },
}

function ChamadaView({ estilo, texto }: { estilo: string; texto: string }) {
  const conf = CHAMADAS[estilo] ?? CHAMADAS.atencao
  const Icone = conf.icone
  return (
    <div
      className={`na-imprime-caixa flex gap-2.5 rounded-xl border px-3.5 py-3 text-[0.95rem] leading-relaxed ${conf.classe}`}
    >
      <Icone className={`mt-0.5 h-4 w-4 shrink-0 ${conf.tituloClasse}`} aria-hidden />
      <p>
        <span className={`font-bold italic ${conf.tituloClasse}`}>{conf.titulo} </span>
        <Inline texto={texto} />
      </p>
    </div>
  )
}

function FilhoView({ filho }: { filho: BlocoFilho }): ReactNode {
  switch (filho.tipo) {
    case "paragrafo":
      return (
        <p className="leading-relaxed">
          <RotuloPrefixo rotulo={filho.rotulo} />
          <Inline texto={filho.texto} />
        </p>
      )
    case "formula":
      return (
        <div className="na-formula-display my-1 overflow-x-auto py-1 text-center">
          <Matematica latex={filho.latex} bloco />
        </div>
      )
    case "lista":
      return (
        <ul className="space-y-1.5">
          {filho.itens.map((item, i) => (
            <li key={i} className="flex gap-2.5 leading-relaxed">
              <span
                className="mt-[0.55rem] h-1.5 w-1.5 shrink-0 rounded-full bg-stone-400 dark:bg-stone-500"
                aria-hidden
              />
              <span>
                <Inline texto={item} />
              </span>
            </li>
          ))}
        </ul>
      )
    case "tabela":
      return <TabelaView comCabecalho={filho.comCabecalho} linhas={filho.linhas} />
    case "chamada":
      return <ChamadaView estilo={filho.estilo} texto={filho.texto} />
  }
}

function TabelaView({ comCabecalho, linhas }: { comCabecalho: boolean; linhas: string[][] }) {
  if (linhas.length === 0) return null
  const nCol = Math.max(...linhas.map((l) => l.length))
  return (
    <div className="na-imprime-caixa overflow-x-auto rounded-xl border border-stone-200 dark:border-stone-800">
      <table className="w-full border-collapse text-[0.92rem]">
        {comCabecalho && linhas.length > 0 ? (
          <thead>
            <tr className="bg-stone-100 dark:bg-stone-800/70">
              {Array.from({ length: nCol }).map((_, j) => (
                <th
                  key={j}
                  className="border-b border-stone-200 px-3 py-2 text-left font-bold dark:border-stone-700"
                >
                  <Inline texto={linhas[0][j] ?? ""} />
                </th>
              ))}
            </tr>
          </thead>
        ) : null}
        <tbody>
          {linhas.slice(comCabecalho ? 1 : 0).map((linha, i) => (
            <tr key={i} className="odd:bg-stone-50/60 dark:odd:bg-stone-900/40">
              {Array.from({ length: nCol }).map((_, j) => (
                <td key={j} className="px-3 py-1.5 align-top">
                  <Inline texto={linha[j] ?? ""} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CabecalhoCaixa({
  icone: Icone,
  titulo,
  destaque,
}: {
  icone: typeof PencilLine
  titulo: string
  destaque?: ReactNode
}) {
  return (
    <div className="mb-2.5 flex flex-wrap items-center gap-2">
      <span className="flex items-center gap-1.5 text-[0.7rem] font-bold tracking-[0.14em] text-stone-500 uppercase dark:text-stone-400">
        <Icone className="h-3.5 w-3.5" aria-hidden />
        {destaque}
        {titulo}
      </span>
    </div>
  )
}

function CaixaCopiar({ rotulo, filhos }: { rotulo: string; filhos: BlocoFilho[] }) {
  return (
    <section className="na-imprime-caixa rounded-2xl border-2 border-dashed border-stone-400 bg-white/60 px-4 py-4 sm:px-5 dark:border-stone-600 dark:bg-stone-900/40">
      <CabecalhoCaixa
        icone={PencilLine}
        titulo={rotulo || "Bloco"}
        destaque={
          <span className="rounded-md bg-stone-900 px-1.5 py-0.5 text-[0.62rem] tracking-[0.18em] text-stone-50 dark:bg-stone-100 dark:text-stone-900">
            COPIAR
          </span>
        }
      />
      <div className="space-y-3">
        {filhos.map((f) => (
          <FilhoView key={f.id} filho={f} />
        ))}
      </div>
    </section>
  )
}

function CaixaExemplo({ rotulo, filhos }: { rotulo: string; filhos: BlocoFilho[] }) {
  return (
    <section className="na-imprime-caixa rounded-2xl border border-l-4 border-emerald-300/70 border-l-emerald-500 bg-emerald-50/70 px-4 py-4 sm:px-5 dark:border-emerald-800/60 dark:border-l-emerald-500 dark:bg-emerald-950/25">
      <CabecalhoCaixa
        icone={CheckCircle2}
        titulo={rotulo || "Exemplo resolvido"}
        destaque={<span className="text-emerald-700 dark:text-emerald-300"> </span>}
      />
      <div className="space-y-3">
        {filhos.map((f) => (
          <FilhoView key={f.id} filho={f} />
        ))}
      </div>
    </section>
  )
}

function CaixaDica({ rotulo, filhos }: { rotulo: string; filhos: BlocoFilho[] }) {
  return (
    <section className="na-imprime-caixa rounded-2xl border border-l-4 border-amber-300/70 border-l-amber-500 bg-amber-50/70 px-4 py-4 sm:px-5 dark:border-amber-800/60 dark:border-l-amber-500 dark:bg-amber-950/25">
      <CabecalhoCaixa
        icone={Lightbulb}
        titulo={rotulo || "Dica / erro comum"}
        destaque={<span className="text-amber-700 dark:text-amber-300"> </span>}
      />
      <div className="space-y-3">
        {filhos.map((f) => (
          <FilhoView key={f.id} filho={f} />
        ))}
      </div>
    </section>
  )
}

function QuestaoView({ questao, numero }: { questao: Questao; numero: number }) {
  const [escolhida, setEscolhida] = useState<number | null>(null)
  const temCorreta = questao.correta !== null && questao.correta < questao.alternativas.length

  return (
    <li className="space-y-2">
      <p className="leading-relaxed">
        <span className="mr-1.5 font-bold">{numero}.</span>
        <Inline texto={questao.enunciado} />
      </p>
      {questao.alternativas.length > 0 ? (
        <>
          <div className="space-y-1.5 pl-5 print:hidden">
            {questao.alternativas.map((alt, i) => {
              const letra = "abcd"[i] ?? "?"
              const selecionada = escolhida === i
              let classe =
                "border-stone-200 bg-white hover:border-stone-400 dark:border-stone-700 dark:bg-stone-900 dark:hover:border-stone-500"
              if (escolhida !== null && temCorreta) {
                if (i === questao.correta)
                  classe =
                    "border-emerald-500 bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-950/40"
                else if (selecionada)
                  classe = "border-rose-400 bg-rose-50 dark:border-rose-600 dark:bg-rose-950/40"
              } else if (selecionada) {
                classe = "border-stone-900 bg-stone-100 dark:border-stone-300 dark:bg-stone-800"
              }
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setEscolhida(escolhida === i ? null : i)}
                  className={`na-quiz-alternativa flex w-full items-start gap-2.5 rounded-xl border px-3 py-2 text-left text-[0.94rem] transition-colors ${classe}`}
                >
                  <span className="font-semibold text-stone-500 dark:text-stone-400">
                    ({letra})
                  </span>
                  <span className="flex-1">
                    <Inline texto={alt} />
                  </span>
                  {escolhida !== null && temCorreta && i === questao.correta ? (
                    <CheckCircle2
                      className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                      aria-hidden
                    />
                  ) : null}
                  {escolhida !== null && temCorreta && selecionada && i !== questao.correta ? (
                    <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" aria-hidden />
                  ) : null}
                </button>
              )
            })}
          </div>
          <p className="hidden pl-5 leading-relaxed print:block">
            {questao.alternativas.map((alt, i) => `(${"abcd"[i] ?? "?"}) ${alt}   `).join("")}
          </p>
        </>
      ) : null}
    </li>
  )
}

const CORES_NIVEL: Record<number, string> = {
  1: "border-sky-500/30 bg-sky-50 text-sky-800 dark:border-sky-500/30 dark:bg-sky-950/40 dark:text-sky-300",
  2: "border-amber-500/30 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-300",
  3: "border-rose-500/30 bg-rose-50 text-rose-800 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-300",
}

function ExerciciosView({
  bloco,
  mostrarGabarito,
}: {
  bloco: Extract<Bloco, { tipo: "exercicios" }>
  mostrarGabarito: boolean
}) {
  const gabAuto: string[] = []
  let nGab = 0
  for (const nivel of bloco.niveis) {
    for (const q of nivel.questoes) {
      nGab++
      if (q.alternativas.length > 0 && q.correta !== null) {
        gabAuto.push(`${nGab}${"abcd"[q.correta] ?? ""}`)
      }
    }
  }
  const gabarito = [gabAuto.join(" · "), bloco.gabarito.trim()].filter(Boolean).join(" · ")
  let numero = 0

  return (
    <section className="na-imprime-caixa rounded-2xl border border-stone-200 bg-stone-50/80 px-4 py-4 sm:px-5 dark:border-stone-800 dark:bg-stone-900/50">
      <CabecalhoCaixa icone={ListChecks} titulo={bloco.rotulo || "Exercícios propostos"} />
      <div className="space-y-4">
        {bloco.niveis.map((nivel) =>
          nivel.questoes.length === 0 ? null : (
            <div key={`${nivel.numero}-${nivel.titulo}`} className="space-y-3">
              <p
                className={`inline-block rounded-lg border px-2.5 py-1 text-[0.82rem] font-bold tracking-wide uppercase ${CORES_NIVEL[nivel.numero] ?? CORES_NIVEL[1]}`}
              >
                Nível {nivel.numero} · {nivel.titulo}
              </p>
              <ol className="space-y-3">
                {nivel.questoes.map((q) => {
                  numero++
                  return <QuestaoView key={q.id} questao={q} numero={numero} />
                })}
              </ol>
            </div>
          ),
        )}
        {gabarito ? (
          mostrarGabarito ? (
            <div className="rounded-xl border border-stone-300 bg-white px-3.5 py-3 text-[0.9rem] dark:border-stone-700 dark:bg-stone-900">
              <p className="mb-1 flex items-center gap-1.5 text-[0.7rem] font-bold tracking-[0.14em] text-stone-500 uppercase dark:text-stone-400">
                <BookMarked className="h-3.5 w-3.5" aria-hidden /> Gabarito
              </p>
              <p className="leading-relaxed">{renderizarInline(gabarito)}</p>
            </div>
          ) : (
            <p className="flex items-center gap-2 text-[0.82rem] text-stone-400 dark:text-stone-500 print:hidden">
              <EyeOff className="h-3.5 w-3.5" aria-hidden /> Gabarito oculto. Toque em
              &ldquo;Mostrar gabarito&rdquo; na barra acima para revelar.
            </p>
          )
        ) : null}
      </div>
    </section>
  )
}

export function BlocoView({
  bloco,
  numeroSecao,
  mostrarGabarito,
}: {
  bloco: Bloco
  numeroSecao: number
  mostrarGabarito: boolean
}) {
  switch (bloco.tipo) {
    case "secao":
      return (
        <h2 className="na-secao flex items-baseline gap-3 border-t border-stone-200 pt-6 text-xl font-bold tracking-tight first:border-t-0 first:pt-0 sm:text-2xl dark:border-stone-800">
          <span className="rounded-lg bg-stone-900 px-2 py-0.5 text-sm font-extrabold text-stone-50 tabular-nums sm:text-base dark:bg-stone-100 dark:text-stone-900">
            {numeroSecao}
          </span>
          <Inline texto={bloco.titulo} />
        </h2>
      )
    case "paragrafo":
    case "formula":
    case "lista":
    case "tabela":
    case "chamada":
      return <FilhoView filho={bloco} />
    case "figura":
      if (!bloco.url) return null
      return (
        <figure className="na-imprime-caixa space-y-2">
          <div className="flex justify-center overflow-hidden rounded-xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
            <img
              src={bloco.url}
              alt={bloco.legenda || "Figura da nota"}
              className="max-h-[30rem] w-auto max-w-full object-contain"
              loading="lazy"
            />
          </div>
          {bloco.legenda ? (
            <figcaption className="text-center text-[0.85rem] text-stone-500 dark:text-stone-400">
              <Inline texto={bloco.legenda} />
            </figcaption>
          ) : null}
        </figure>
      )
    case "tikz":
      if (!bloco.codigo.trim()) return null
      return (
        <figure className="na-imprime-caixa space-y-2">
          <div className="overflow-hidden rounded-xl border border-stone-200 bg-white p-2 dark:border-stone-800 dark:bg-stone-900">
            <Tikz codigo={bloco.codigo} />
          </div>
          {bloco.legenda ? (
            <figcaption className="text-center text-[0.85rem] text-stone-500 dark:text-stone-400">
              <Inline texto={bloco.legenda} />
            </figcaption>
          ) : null}
        </figure>
      )
    case "copiar":
      return <CaixaCopiar rotulo={bloco.rotulo} filhos={bloco.filhos} />
    case "exemplo":
      return <CaixaExemplo rotulo={bloco.rotulo} filhos={bloco.filhos} />
    case "dica":
      return <CaixaDica rotulo={bloco.rotulo} filhos={bloco.filhos} />
    case "exercicios":
      return <ExerciciosView bloco={bloco} mostrarGabarito={mostrarGabarito} />
  }
}

/** Lista completa de blocos com numeração contínua de seções. */
export function BlocosView({
  blocos,
  mostrarGabarito,
}: {
  blocos: Bloco[]
  mostrarGabarito: boolean
}) {
  let numeroSecao = 0
  return (
    <div className="space-y-5">
      {blocos.map((b) => {
        if (b.tipo === "secao") numeroSecao++
        return (
          <BlocoView
            key={b.id}
            bloco={b}
            numeroSecao={numeroSecao}
            mostrarGabarito={mostrarGabarito}
          />
        )
      })}
    </div>
  )
}
