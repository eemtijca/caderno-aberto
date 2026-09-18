// Imagem Open Graph gerada por requisição para o link público (1200x630).

import { ImageResponse } from "next/og";
import { buscarDadosOg } from "./dados";
import { separarHabilidades } from "@/lib/notas/texto";

export const alt = "Nota de aula do Caderno Aberto";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export const dynamic = "force-dynamic";

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
};

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
];

// Ícone da aplicação, o mesmo de public/icon.svg, embutido como data URI.
const ICONE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><rect x="4" y="4" width="56" height="56" rx="14" fill="#008241"/><rect x="16" y="13" width="30" height="38" rx="4" stroke="#FAFAF8" stroke-width="3.5" fill="none"/><line x1="23" y1="24" x2="39" y2="24" stroke="#FAFAF8" stroke-width="3.5" stroke-linecap="round"/><line x1="23" y1="33" x2="35" y2="33" stroke="#D5EEDF" stroke-width="3.5" stroke-linecap="round"/><path d="M42 44 L52 34 L56 38 L46 48 L41 49 Z" fill="#15894F" stroke="#FAFAF8" stroke-width="2" stroke-linejoin="round"/></svg>`;
const ICONE_DATA = `data:image/svg+xml;base64,${Buffer.from(ICONE_SVG).toString("base64")}`;

function limitar(texto: string, max: number): string {
  const t = texto.replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}...` : t;
}

export default async function ImagemOg({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const dados = await buscarDadosOg(token).catch(() => null);
  const nota = dados?.nota;
  const link = dados?.link;

  // Cor desconhecida ou link inválido recai no verde da marca.
  const cor = HEX_COR[nota?.disciplinaCor ?? "verde"] ?? HEX_COR.verde;
  const titulo = limitar(nota?.titulo ?? "Nota de aula", 110);
  const disciplina = nota?.disciplinaNome ?? "Aula";
  const habilidades = separarHabilidades(nota?.habilidades ?? "").slice(0, 5);
  const sobre = nota?.sobre ? limitar(nota.sobre, 170) : "";
  const rodape = [
    nota ? `${MESES_CAP[nota.mes - 1] ?? ""}/${nota.anoLetivo}` : "",
    (nota?.turmasNomes ?? []).join(", "),
    link?.professorNome ? `Prof. ${link.professorNome}` : "",
  ]
    .filter(Boolean)
    .join("  ·  ");

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
          padding: "48px 64px 40px",
        }}
      >
        {/* marca */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <img src={ICONE_DATA} width={64} height={64} alt="" />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 30, fontWeight: 700, color: "#1C1C1A" }}>Caderno Aberto</div>
            <div style={{ fontSize: 21, color: "#6B6B66" }}>Notas de aula</div>
          </div>
        </div>

        {/* título */}
        <div
          style={{
            display: "flex",
            marginTop: 40,
            fontSize: nota && titulo.length > 60 ? 50 : 60,
            fontWeight: 800,
            lineHeight: 1.15,
            color: "#1C1C1A",
            letterSpacing: "-0.02em",
          }}
        >
          {titulo}
        </div>

        {/* resumo */}
        {sobre ? (
          <div style={{ display: "flex", marginTop: 20, fontSize: 26, color: "#55554F" }}>
            {sobre}
          </div>
        ) : null}

        {/* espaço flexível para o rodapé */}
        <div style={{ display: "flex", flex: 1 }} />

        {/* habilidades */}
        {habilidades.length > 0 ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
            {habilidades.map((h) => (
              <div
                key={h}
                style={{
                  display: "flex",
                  backgroundColor: "#E7E5E4",
                  color: "#44403C",
                  borderRadius: 8,
                  padding: "6px 14px",
                  fontSize: 22,
                  fontWeight: 600,
                }}
              >
                {h}
              </div>
            ))}
          </div>
        ) : null}

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
  );
}
