import { ImageResponse } from "next/og"
import { buscarDadosOg } from "./dados"

export const alt = "Nota de aula do Caderno Aberto"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export const dynamic = "force-dynamic"

/** Hexes das cores de disciplina (mesmas chaves de lib/notas/cores). */
const HEX_COR: Record<string, string> = {
  verde: "#008241",
  teal: "#0D9488",
  violeta: "#8B5CF6",
  rosa: "#F43F5E",
  ambar: "#F59E0B",
  laranja: "#F97316",
  ciano: "#06B6D4",
  fucsia: "#D946EF",
  lima: "#84CC16",
  pedra: "#78716C",
}

const MESES_CAP = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
]

function limitar(texto: string, max: number): string {
  const t = texto.replace(/\s+/g, " ").trim()
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t
}

// Imagem de preview (OpenGraph/Twitter) gerada por link: título da nota,
// disciplina com a cor escolhida, turmas e nome do professor.
export default async function ImagemOg({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const dados = await buscarDadosOg(token).catch(() => null)
  const nota = dados?.nota
  const link = dados?.link

  const cor = HEX_COR[nota?.disciplinaCor ?? "verde"] ?? HEX_COR.verde
  const titulo = limitar(nota?.titulo ?? "Nota de aula", 110)
  const disciplina = nota?.disciplinaNome ?? "Aula"
  const rodape = [
    nota ? `${MESES_CAP[nota.mes - 1] ?? ""}/${nota.anoLetivo}` : "",
    (nota?.turmasNomes ?? []).join(", "),
    link?.professorNome ? `Prof. ${link.professorNome}` : "",
  ]
    .filter(Boolean)
    .join("  ·  ")

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#FAFAF8",
      }}
    >
      {/* faixa da disciplina */}
      <div style={{ display: "flex", height: 16, backgroundColor: cor }} />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          padding: "52px 64px 40px",
        }}
      >
        {/* marca */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              display: "flex",
              width: 64,
              height: 64,
              borderRadius: 16,
              backgroundColor: "#008241",
              color: "#FFFFFF",
              fontSize: 34,
              fontWeight: 700,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            CA
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 30, fontWeight: 700, color: "#1C1C1A" }}>Caderno Aberto</div>
            <div style={{ fontSize: 21, color: "#6B6B66" }}>notas que chegam aos alunos</div>
          </div>
        </div>

        {/* título */}
        <div
          style={{
            display: "flex",
            marginTop: 48,
            fontSize: nota && titulo.length > 60 ? 52 : 62,
            fontWeight: 800,
            lineHeight: 1.15,
            color: "#1C1C1A",
            letterSpacing: "-0.02em",
          }}
        >
          {titulo}
        </div>

        {/* espaço flexível para o rodapé */}
        <div style={{ display: "flex", flex: 1 }} />

        {/* disciplina */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              display: "flex",
              backgroundColor: cor,
              color: "#FFFFFF",
              borderRadius: 999,
              padding: "10px 26px",
              fontSize: 26,
              fontWeight: 700,
            }}
          >
            {limitar(disciplina, 30)}
          </div>
          {dados && dados.totalNotas > 1 ? (
            <div style={{ fontSize: 26, color: "#6B6B66", display: "flex" }}>
              +{dados.totalNotas - 1} aula{dados.totalNotas > 2 ? "s" : ""}
            </div>
          ) : null}
        </div>

        {/* turmas · data · professor */}
        {rodape ? (
          <div style={{ display: "flex", marginTop: 20, fontSize: 24, color: "#55554F" }}>
            {limitar(rodape, 90)}
          </div>
        ) : null}
      </div>
    </div>,
    { ...size },
  )
}
