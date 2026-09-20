"use client";

// Peças reutilizáveis do editor: textarea que cresce sozinha e barra de
// formatação inline que envolve a seleção atual.

import { useEffect, useRef, useState } from "react";
import { Bold, Italic, Percent, Sigma, Highlighter } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface PropsTextareaAuto {
  valor: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  mono?: boolean;
  onFocus?: () => void;
  rowsMin?: number;
  ariaLabel?: string;
  ref?: React.Ref<HTMLTextAreaElement>;
}

export function TextareaAuto({
  valor,
  onChange,
  placeholder,
  className,
  mono,
  onFocus,
  rowsMin = 1,
  ariaLabel,
  ref,
}: PropsTextareaAuto) {
  const interno = useRef<HTMLTextAreaElement | null>(null);

  // Repassa o nó para o ref interno (altura automática) e para o externo
  // (barra de formatação), sem depender de encaminhamento implícito.
  const definirRef = (el: HTMLTextAreaElement | null) => {
    interno.current = el;
    if (typeof ref === "function") ref(el);
    else if (ref) (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = el;
  };

  // Recalcula a altura a cada mudança de valor para acompanhar o conteúdo.
  useEffect(() => {
    const el = interno.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [valor]);

  // Recalcula quando a largura muda (rotação de tela, colunas, fontes).
  useEffect(() => {
    const el = interno.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    let largura = el.clientWidth;
    const observador = new ResizeObserver(() => {
      const alvo = interno.current;
      if (!alvo || alvo.clientWidth === largura) return;
      largura = alvo.clientWidth;
      alvo.style.height = "auto";
      alvo.style.height = `${alvo.scrollHeight}px`;
    });
    observador.observe(el);
    return () => observador.disconnect();
  }, []);

  return (
    <textarea
      ref={definirRef}
      value={valor}
      onChange={(e) => onChange(e.target.value)}
      onFocus={onFocus}
      placeholder={placeholder}
      aria-label={ariaLabel}
      rows={rowsMin}
      className={`placeholder:text-muted-foreground/70 hover:border-border/70 focus:border-border focus:bg-card w-full resize-none rounded-lg border border-transparent bg-transparent px-2 py-1.5 leading-relaxed transition-colors outline-none ${
        mono ? "font-mono text-[0.88rem]" : ""
      } ${className ?? ""}`}
    />
  );
}

/** Campo de texto com a barra de formatação inline flutuante ao focar. */
export function CampoInline({
  valor,
  onChange,
  className,
  ariaLabel,
  ...props
}: Omit<PropsTextareaAuto, "ref">) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [focado, setFocado] = useState(false);

  return (
    <div
      className={`relative min-w-0 flex-1 ${className ?? ""}`}
      onFocus={() => setFocado(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocado(false);
      }}
    >
      <TextareaAuto ref={ref} valor={valor} onChange={onChange} ariaLabel={ariaLabel} {...props} />
      {focado ? (
        <div className="border-border bg-card absolute -top-9 right-0 z-20 flex rounded-lg border px-0.5 py-0.5 shadow-md">
          <BarraInline alvo={ref} onAplicar={(v) => onChange(v)} />
        </div>
      ) : null}
    </div>
  );
}

// Envolve o trecho selecionado (ou um placeholder) com marcadores e devolve o
// novo texto e a posição do cursor após a inserção.
export function inserirNoTextarea(
  el: HTMLTextAreaElement | null,
  antes: string,
  depois: string = antes,
  placeholder = "",
): { valor: string; pos: number } | null {
  if (!el) return null;
  const inicio = el.selectionStart ?? el.value.length;
  const fim = el.selectionEnd ?? inicio;
  const selecionado = el.value.slice(inicio, fim);
  const texto = selecionado || placeholder;
  const novo = el.value.slice(0, inicio) + antes + texto + depois + el.value.slice(fim);
  const pos = inicio + antes.length + texto.length;
  return { valor: novo, pos };
}

export function BarraInline({
  alvo,
  onAplicar,
}: {
  alvo: React.RefObject<HTMLTextAreaElement | null>;
  onAplicar: (valor: string, pos: number) => void;
}) {
  const aplicar = (antes: string, depois: string, placeholder: string) => {
    const el = alvo.current;
    if (!el) return;
    const r = inserirNoTextarea(el, antes, depois, placeholder);
    if (r) {
      onAplicar(r.valor, r.pos);
      // Reposiciona o cursor depois que o React aplica o novo valor.
      requestAnimationFrame(() => {
        el.focus();
        if (r.pos >= 0) el.setSelectionRange(r.pos, r.pos);
      });
    }
  };

  const itens = [
    { icone: Bold, rotulo: "Negrito", antes: "**", depois: "**", placeholder: "palavra-chave" },
    { icone: Italic, rotulo: "Itálico", antes: "*", depois: "*", placeholder: "texto" },
    {
      icone: Sigma,
      rotulo: "Fórmula no texto",
      antes: "$",
      depois: "$",
      placeholder: "x^2",
    },
    {
      icone: Highlighter,
      rotulo: "Resposta em destaque",
      antes: "\\resultado{",
      depois: "}",
      placeholder: "resposta",
    },
    {
      icone: Percent,
      rotulo: "Fórmula química",
      antes: "$\\ce{",
      depois: "}$",
      placeholder: "H2O",
    },
  ];

  return (
    <div className="flex items-center gap-0.5" role="toolbar" aria-label="Formatação inline">
      {itens.map((item) => (
        <Tooltip key={item.rotulo}>
          <TooltipTrigger asChild>
            <button
              type="button"
              // Impede que o textarea perca a seleção antes do clique.
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => aplicar(item.antes, item.depois, item.placeholder)}
              className="text-muted-foreground hover:bg-accent hover:text-foreground flex h-7 w-7 items-center justify-center rounded-md transition-colors pointer-coarse:h-9 pointer-coarse:w-9"
              aria-label={item.rotulo}
            >
              <item.icone className="h-3.5 w-3.5" aria-hidden />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            {item.rotulo}
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
