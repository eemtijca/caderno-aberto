"use client";

// Tela reutilizável de erro/aviso. Padroniza os estados de status e domínio.

import {
  AlertTriangle,
  CloudOff,
  FileQuestion,
  Hourglass,
  KeyRound,
  Lock,
  NotebookPen,
  ServerCrash,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export type VarianteEstado =
  | "nao_encontrado"
  | "sessao_expirada"
  | "sem_permissao"
  | "removido"
  | "limite"
  | "erro_interno"
  | "indisponivel"
  | "offline"
  | "link_invalido"
  | "link_pausado"
  | "link_expirado"
  | "conta_pendente"
  | "conta_suspensa"
  | "carencia";

type Tom = "neutro" | "aviso" | "perigo";

const PRESETS: Record<
  VarianteEstado,
  { icone: typeof AlertTriangle; titulo: string; descricao: string; tom: Tom }
> = {
  nao_encontrado: {
    icone: FileQuestion,
    titulo: "Página não encontrada",
    descricao: "O endereço pode estar errado ou o conteúdo foi removido.",
    tom: "neutro",
  },
  sessao_expirada: {
    icone: KeyRound,
    titulo: "Sessão expirada",
    descricao: "Sua sessão terminou. Entre novamente para continuar.",
    tom: "aviso",
  },
  sem_permissao: {
    icone: Lock,
    titulo: "Acesso restrito",
    descricao: "Sua conta não tem permissão para acessar esta área.",
    tom: "perigo",
  },
  removido: {
    icone: Trash2,
    titulo: "Conteúdo removido",
    descricao: "Este recurso foi removido e não está mais disponível.",
    tom: "neutro",
  },
  limite: {
    icone: Hourglass,
    titulo: "Muitas tentativas",
    descricao: "Aguarde alguns minutos antes de tentar novamente.",
    tom: "aviso",
  },
  erro_interno: {
    icone: ServerCrash,
    titulo: "Algo deu errado",
    descricao: "Ocorreu um erro inesperado. Tente novamente em instantes.",
    tom: "perigo",
  },
  indisponivel: {
    icone: CloudOff,
    titulo: "Serviço indisponível",
    descricao: "A aplicação está temporariamente fora do ar. Tente mais tarde.",
    tom: "aviso",
  },
  offline: {
    icone: CloudOff,
    titulo: "Sem conexão",
    descricao: "Verifique sua internet e tente novamente.",
    tom: "aviso",
  },
  link_invalido: {
    icone: FileQuestion,
    titulo: "Link indisponível",
    descricao: "Este link não existe, foi revogado pelo professor ou expirou.",
    tom: "neutro",
  },
  link_pausado: {
    icone: Hourglass,
    titulo: "Link pausado",
    descricao: "O professor pausou este link. Volte mais tarde.",
    tom: "aviso",
  },
  link_expirado: {
    icone: Hourglass,
    titulo: "Link expirado",
    descricao: "A validade deste link terminou. Peça um novo endereço ao professor.",
    tom: "aviso",
  },
  conta_pendente: {
    icone: KeyRound,
    titulo: "Conta pendente de ativação",
    descricao:
      "Use o código de primeiro acesso fornecido pela administração para definir sua senha.",
    tom: "aviso",
  },
  conta_suspensa: {
    icone: ShieldAlert,
    titulo: "Conta desativada",
    descricao: "A administração desativou esta conta. Procure a administração da escola.",
    tom: "perigo",
  },
  carencia: {
    icone: AlertTriangle,
    titulo: "Exclusão solicitada",
    descricao: "Esta conta está em carência de exclusão.",
    tom: "aviso",
  },
};

const TONS: Record<Tom, string> = {
  neutro: "bg-muted text-muted-foreground",
  aviso: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  perigo: "bg-destructive/10 text-destructive",
};

interface Props {
  variante: VarianteEstado;
  titulo?: string;
  descricao?: React.ReactNode;
  acao?: { rotulo: string; onClick: () => void };
  acaoSecundaria?: { rotulo: string; onClick: () => void };
  /** Sem centralização vertical de tela cheia (para uso dentro do shell). */
  incorporado?: boolean;
  children?: React.ReactNode;
}

export function TelaEstado({
  variante,
  titulo,
  descricao,
  acao,
  acaoSecundaria,
  incorporado,
  children,
}: Props) {
  const preset = PRESETS[variante];
  const Icone = preset.icone;
  return (
    <div
      className={
        incorporado
          ? "mx-auto max-w-xl px-4 py-16 text-center"
          : "flex min-h-screen flex-col items-center justify-center px-4 py-16 text-center"
      }
      role="status"
    >
      <span
        className={`flex h-14 w-14 items-center justify-center rounded-2xl ${TONS[preset.tom]}`}
        aria-hidden
      >
        <Icone className="h-6 w-6" />
      </span>
      <h1 className="fonte-display mt-4 text-xl font-bold">{titulo ?? preset.titulo}</h1>
      <div className="text-muted-foreground mt-2 max-w-md text-sm leading-relaxed">
        {descricao ?? preset.descricao}
      </div>
      {children ? <div className="mt-5 w-full max-w-md text-left">{children}</div> : null}
      {acao || acaoSecundaria ? (
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {acao ? (
            <Button onClick={acao.onClick} className="gap-2 rounded-xl">
              {acao.rotulo}
            </Button>
          ) : null}
          {acaoSecundaria ? (
            <Button variant="outline" onClick={acaoSecundaria.onClick} className="rounded-xl">
              {acaoSecundaria.rotulo}
            </Button>
          ) : null}
        </div>
      ) : null}
      <span className="text-muted-foreground/70 mt-8 inline-flex items-center gap-1.5 text-[0.7rem]">
        <NotebookPen className="h-3.5 w-3.5" aria-hidden /> Caderno Aberto
      </span>
    </div>
  );
}

/** Aviso compacto para blocos dentro do shell, sem ocupar a tela inteira. */
export function AvisoCompacto({
  variante,
  titulo,
  descricao,
  acao,
}: {
  variante: VarianteEstado;
  titulo?: string;
  descricao?: React.ReactNode;
  acao?: { rotulo: string; onClick: () => void };
}) {
  const preset = PRESETS[variante];
  const Icone = preset.icone;
  return (
    <div className="border-border bg-card rounded-2xl border p-5 text-center">
      <span
        className={`mx-auto flex h-10 w-10 items-center justify-center rounded-xl ${TONS[preset.tom]}`}
        aria-hidden
      >
        <Icone className="h-5 w-5" />
      </span>
      <p className="fonte-display mt-3 font-bold">{titulo ?? preset.titulo}</p>
      <p className="text-muted-foreground mt-1 text-sm">{descricao ?? preset.descricao}</p>
      {acao ? (
        <Button onClick={acao.onClick} className="mt-4 rounded-xl">
          {acao.rotulo}
        </Button>
      ) : null}
    </div>
  );
}
