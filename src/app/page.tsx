"use client";

// Ponto de entrada do app do professor. Escolhe a vista a partir da rota hash e
// protege o acesso quando não há sessão ou quando a conta está em recuperação.

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { DialogoNovaNota } from "@/components/dialogo-nova-nota";
import { VistaAutenticação } from "@/components/vistas/autenticacao";
import { VistaPublica } from "@/components/vistas/publica";
import { VistaInicio } from "@/components/vistas/inicio";
import { VistaNotas } from "@/components/vistas/notas";
import { VistaOrganizacao } from "@/components/vistas/organizacao";
import { VistaLeitura } from "@/components/vistas/leitura";
import { VistaLinks } from "@/components/vistas/links";
import { VistaLixeira } from "@/components/vistas/lixeira";
import { VistaConfiguracoes } from "@/components/vistas/configuracoes";
import { VistaRecuperacao } from "@/components/vistas/recuperacao";
import { VistaEditor } from "@/components/editor/editor-nota";
import { VistaAdmin } from "@/components/vistas/admin/painel";
import { useRota, ROTULOS_CONFIG, type Rota } from "@/lib/rota";
import { useSessao } from "@/hooks/use-sessao";
import { useTituloAba } from "@/hooks/use-titulo-aba";
import { Skeleton } from "@/components/ui/skeleton";
import { TelaEstado } from "@/components/tela-estado";

function tituloDaRota(rota: Rota): string | null {
  switch (rota.vista) {
    case "inicio":
      return "Início";
    case "notas":
      return "Notas";
    case "organizacao":
      return "Turmas e calendário";
    case "links":
      return "Links";
    case "lixeira":
      return "Lixeira";
    case "editor":
      return "Editor";
    case "leitura":
      return "Leitura";
    case "configuracoes":
      return rota.secao === "visao" ? "Configurações" : ROTULOS_CONFIG[rota.secao];
    case "recuperacao":
      return "Recuperação de conta";
    case "admin":
      return "Administração";
    case "entrar":
      return "Entrar";
    case "codigo":
      return "Código de acesso";
    case "solicitar":
      return "Solicitar acesso";
    // A página pública define o título com os metadados do link.
    case "publica":
      return null;
  }
}

export default function Home() {
  const { rota, navegar } = useRota();
  const [novaNotaAberta, setNovaNotaAberta] = useState(false);
  const { usuario, perfil, carregando, ehAdmin } = useSessao();
  // O hash só existe no cliente: renderiza o mesmo esqueleto no servidor e no
  // primeiro render do cliente para não haver divergência de hidratação.
  const [montado, setMontado] = useState(false);

  useEffect(() => setMontado(true), []);
  useTituloAba(tituloDaRota(rota));

  if (!montado) return <EsqueletoInicial />;

  if (rota.vista === "publica") {
    return <VistaPublica token={rota.token} aulaId={rota.aulaId} navegar={navegar} />;
  }

  if (carregando) {
    return <EsqueletoInicial />;
  }

  if (!usuario) {
    return <VistaAutenticação rota={rota} navegar={navegar} />;
  }
  // Carência de exclusão: acesso ao app fica suspenso até restaurar ou sair.
  if (perfil?.exclusaoSolicitadaEm) {
    return <VistaRecuperacao navegar={navegar} />;
  }
  // Sem carência pendente, a rota de recuperação volta ao início.
  if (rota.vista === "recuperacao") return <Redirecionar ao={"/"} navegar={navegar} />;
  if (rota.vista === "leitura") {
    return <VistaLeitura id={rota.id} navegar={navegar} />;
  }
  const rotaDeAuth =
    rota.vista === "entrar" || rota.vista === "codigo" || rota.vista === "solicitar";
  if (rotaDeAuth) return <Redirecionar ao={"/"} navegar={navegar} />;
  if (rota.vista === "admin" && !ehAdmin)
    return (
      <TelaEstado
        variante="sem_permissao"
        acao={{ rotulo: "Ir para o início", onClick: () => navegar("/") }}
      />
    );

  const conteudo =
    rota.vista === "inicio" ? (
      <VistaInicio navegar={navegar} onNovaNota={() => setNovaNotaAberta(true)} />
    ) : rota.vista === "notas" ? (
      <VistaNotas navegar={navegar} onNovaNota={() => setNovaNotaAberta(true)} />
    ) : rota.vista === "organizacao" ? (
      <VistaOrganizacao navegar={navegar} />
    ) : rota.vista === "links" ? (
      <VistaLinks />
    ) : rota.vista === "lixeira" ? (
      <VistaLixeira />
    ) : rota.vista === "configuracoes" ? (
      <VistaConfiguracoes secao={rota.secao} navegar={navegar} />
    ) : rota.vista === "editor" ? (
      <VistaEditor id={rota.id} navegar={navegar} />
    ) : rota.vista === "admin" ? (
      <VistaAdmin />
    ) : null;

  // A chave inclui o id no editor e a seção nas configurações para remontar a vista.
  const chaveVista =
    rota.vista === "editor"
      ? `${rota.vista}:${rota.id}`
      : rota.vista === "configuracoes"
        ? `${rota.vista}:${rota.secao}`
        : rota.vista;

  return (
    <AppShell rota={rota} navegar={navegar} onNovaNota={() => setNovaNotaAberta(true)}>
      <div key={chaveVista} className="na-entra">
        {conteudo}
      </div>
      {novaNotaAberta ? (
        <DialogoNovaNota
          aberto
          aoFechar={() => setNovaNotaAberta(false)}
          aoCriar={(id) => navegar(`/editor/${id}`)}
        />
      ) : null}
    </AppShell>
  );
}

function EsqueletoInicial() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10 sm:px-6" aria-busy="true">
      <Skeleton className="h-16 w-2/3 rounded-2xl" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  );
}

function Redirecionar({ ao, navegar }: { ao: string; navegar: (para: string) => void }) {
  useEffect(() => {
    navegar(ao);
  }, [ao, navegar]);
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Skeleton className="h-16 w-2/3 rounded-2xl" />
    </div>
  );
}
