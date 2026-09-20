"use client";

// Vista Configurações: hub com as seções e navegação secundária entre telas.

import { useEffect, useRef } from "react";
import {
  CalendarRange,
  ChevronRight,
  GraduationCap,
  HardDrive,
  ShieldAlert,
  Trash2,
  UserRound,
} from "lucide-react";
import { ROTULOS_CONFIG, type SecaoConfig } from "@/lib/rota";
import { SecaoPerfil } from "./perfil";
import { SecaoSeguranca } from "./seguranca";
import { SecaoDisciplinas } from "./disciplinas";
import { SecaoTurmas } from "./turmas";
import { SecaoDados } from "./dados";
import { SecaoExclusao } from "./exclusao";

const DESCRICOES: Record<SecaoConfig, string> = {
  visao: "Perfil, segurança, disciplinas, turmas, dados e exclusão.",
  perfil: "Como o professor aparece nas notas compartilhadas e nos arquivos gerados.",
  seguranca: "Troca de senha e dados de acesso da conta.",
  disciplinas: "Componentes curriculares, cada um com cor e ícone próprios.",
  turmas: "Turmas que alimentam a organização automática e os links por turma.",
  dados: "Backup completo dos seus dados e restauração.",
  exclusao: "Remoção permanente da conta com carência de 24 horas.",
};

const ITENS: {
  secao: Exclude<SecaoConfig, "visao">;
  icone: typeof UserRound;
  descricao: string;
}[] = [
  {
    secao: "perfil",
    icone: UserRound,
    descricao: "Nome e escola exibidos nas notas e nos arquivos.",
  },
  {
    secao: "seguranca",
    icone: ShieldAlert,
    descricao: "Trocar senha e conferir os dados de acesso.",
  },
  {
    secao: "disciplinas",
    icone: GraduationCap,
    descricao: "Componentes curriculares, cores e ícones.",
  },
  {
    secao: "turmas",
    icone: CalendarRange,
    descricao: "Turmas e anos letivos usados na organização.",
  },
  {
    secao: "dados",
    icone: HardDrive,
    descricao: "Backup completo e restauração dos dados.",
  },
  {
    secao: "exclusao",
    icone: Trash2,
    descricao: "Solicitar a remoção da conta com carência.",
  },
];

export function VistaConfiguracoes({
  secao,
  navegar,
}: {
  secao: SecaoConfig;
  navegar: (para: string) => void;
}) {
  return (
    <div className="space-y-6 pb-8">
      <header>
        <h1 className="fonte-display text-2xl font-bold">{ROTULOS_CONFIG[secao]}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{DESCRICOES[secao]}</p>
      </header>

      <NavConfig secao={secao} navegar={navegar} />

      {secao === "visao" ? (
        <Hub navegar={navegar} />
      ) : secao === "perfil" ? (
        <SecaoPerfil />
      ) : secao === "seguranca" ? (
        <SecaoSeguranca />
      ) : secao === "disciplinas" ? (
        <SecaoDisciplinas />
      ) : secao === "turmas" ? (
        <SecaoTurmas />
      ) : secao === "dados" ? (
        <SecaoDados />
      ) : (
        <SecaoExclusao navegar={navegar} />
      )}
    </div>
  );
}

function NavConfig({ secao, navegar }: { secao: SecaoConfig; navegar: (para: string) => void }) {
  const ativoRef = useRef<HTMLButtonElement>(null);

  // Mantém a aba ativa visível na rolagem horizontal do mobile.
  useEffect(() => {
    ativoRef.current?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [secao]);

  return (
    <nav
      aria-label="Seções das configurações"
      className="border-border bg-card flex w-full gap-1 overflow-x-auto rounded-xl border p-1"
    >
      {(Object.keys(ROTULOS_CONFIG) as SecaoConfig[]).map((chave) => {
        const ativo = chave === secao;
        return (
          <button
            key={chave}
            ref={ativo ? ativoRef : undefined}
            type="button"
            onClick={() => navegar(`/configuracoes/${chave === "visao" ? "" : chave}`)}
            aria-current={ativo ? "page" : undefined}
            className={`shrink-0 rounded-lg px-3.5 py-1.5 text-sm font-semibold whitespace-nowrap transition-colors ${
              ativo
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            {ROTULOS_CONFIG[chave]}
          </button>
        );
      })}
    </nav>
  );
}

function Hub({ navegar }: { navegar: (para: string) => void }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {ITENS.map(({ secao, icone: Icone, descricao }, i) => {
        const perigo = secao === "exclusao";
        return (
          <button
            key={secao}
            type="button"
            onClick={() => navegar(`/configuracoes/${secao}`)}
            className={`na-cascata group border-border bg-card flex items-start gap-3.5 rounded-2xl border p-4 text-left transition-shadow hover:shadow-md ${
              perigo ? "border-destructive/40 bg-destructive/5" : ""
            }`}
            style={{ "--na-i": i } as React.CSSProperties}
          >
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                perigo ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
              }`}
            >
              <Icone className="h-5 w-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="fonte-display flex items-center gap-1 font-bold">
                {ROTULOS_CONFIG[secao]}
                <ChevronRight
                  className="text-muted-foreground h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </span>
              <span className="text-muted-foreground mt-0.5 block text-[0.82rem] leading-snug">
                {descricao}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
