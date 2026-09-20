"use client";

// Área de impressão: o documento A4 vive em um portal no body para que o
// restante do aplicativo não ocupe espaço no papel (evita páginas em branco).

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { BlocosView } from "./blocos-view";
import { corDisciplina } from "@/lib/notas/cores";
import { MESES_CAP, separarHabilidades } from "@/lib/notas/texto";
import { variaveisAparencia, type AparenciaNota, type Bloco } from "@/lib/notas/tipos";

export function AreaImpressao({ children }: { children: React.ReactNode }) {
  const [montado, setMontado] = useState(false);
  useEffect(() => setMontado(true), []);
  if (!montado) return null;
  return createPortal(
    <div className="area-impressao hidden print:block">{children}</div>,
    document.body,
  );
}

export interface DadosImpressao {
  titulo: string;
  disciplinaNome: string;
  disciplinaCor?: string;
  mes: number;
  anoLetivo: number;
  turmas: string[];
  sobre: string;
  habilidades: string;
  professor: string;
  blocos: Bloco[];
  aparencia?: AparenciaNota;
  mostrarGabarito: boolean;
}

/** Documento A4 de duas colunas com cabeçalho e rodapé próprios da impressão. */
export function DocumentoImpresso({ dados }: { dados: DadosImpressao }) {
  const cor = corDisciplina(dados.disciplinaCor);
  const habilidades = separarHabilidades(dados.habilidades);

  return (
    <div className="na-nota" style={variaveisAparencia(dados.aparencia) as React.CSSProperties}>
      <header className="mb-5 border-b-2 border-stone-300 pb-4">
        <div className="flex flex-wrap items-center gap-2 text-[0.72rem]">
          {dados.disciplinaNome ? (
            <span className={`rounded-md px-2 py-0.5 font-bold ${cor.chip}`}>
              {dados.disciplinaNome}
            </span>
          ) : null}
          <span className="rounded-md border border-stone-300 px-2 py-0.5 font-medium text-stone-700">
            {MESES_CAP[dados.mes - 1]}/{dados.anoLetivo}
          </span>
          {dados.turmas.length > 0 ? (
            <span className="rounded-md border border-stone-300 px-2 py-0.5 font-medium text-stone-700">
              {dados.turmas.join(" · ")}
            </span>
          ) : null}
        </div>

        <h1 className="mt-2.5 text-[1.65em] leading-tight font-extrabold tracking-tight text-stone-900">
          {dados.titulo}
        </h1>

        {dados.professor ? (
          <p className="mt-1 text-[0.85em] text-stone-600">{dados.professor}</p>
        ) : null}

        {dados.sobre ? (
          <div className={`mt-3 rounded-lg border-l-4 px-3 py-2 ${cor.borda} ${cor.fundoSuave}`}>
            <p className="text-[0.62em] font-bold tracking-[0.16em] text-stone-500 uppercase">
              Sobre esta nota
            </p>
            <p className="mt-0.5 leading-relaxed text-stone-800">{dados.sobre}</p>
          </div>
        ) : null}

        {habilidades.length > 0 ? (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <span className="text-[0.62em] font-bold tracking-wider text-stone-500 uppercase">
              Habilidades:
            </span>
            {habilidades.map((h) => (
              <span
                key={h}
                className="rounded-md bg-stone-200 px-1.5 py-0.5 font-mono text-[0.62em] text-stone-700"
              >
                {h}
              </span>
            ))}
          </div>
        ) : null}
      </header>

      <div className="imprime-colunas space-y-4">
        <BlocosView blocos={dados.blocos} mostrarGabarito={dados.mostrarGabarito} />
      </div>

      <footer className="na-rodape-impressao mt-6 border-t border-stone-300 pt-2 text-center text-[0.68em] text-stone-500">
        {dados.professor ? `${dados.professor} · ` : ""}
        {dados.disciplinaNome ? `${dados.disciplinaNome} · ` : ""}
        {MESES_CAP[dados.mes - 1]}/{dados.anoLetivo} · Gerado por Caderno Aberto
      </footer>
    </div>
  );
}
