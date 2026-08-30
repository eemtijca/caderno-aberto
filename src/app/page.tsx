"use client"

// SPA com roteamento por hash. Professores autenticados acessam notas e links. Alunos acessam via token público.

import { useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { DialogoNovaNota } from "@/components/dialogo-nova-nota"
import { VistaAutenticação } from "@/components/vistas/autenticacao"
import { VistaPublica } from "@/components/vistas/publica"
import { VistaInicio } from "@/components/vistas/inicio"
import { VistaNotas } from "@/components/vistas/notas"
import { VistaOrganizacao } from "@/components/vistas/organizacao"
import { VistaLeitura } from "@/components/vistas/leitura"
import { VistaLinks } from "@/components/vistas/links"
import { VistaConta } from "@/components/vistas/conta"
import { VistaEditor } from "@/components/editor/editor-nota"
import { useRota } from "@/lib/rota"
import { useSessao } from "@/hooks/use-sessao"
import { Skeleton } from "@/components/ui/skeleton"

export default function Home() {
  const { rota, navegar } = useRota()
  const [novaNotaAberta, setNovaNotaAberta] = useState(false)
  const { usuario, perfil, carregando, modoRecuperacao, restaurarConta } = useSessao()
  const [restaurando, setRestaurando] = useState(false)

  if (rota.vista === "publica") {
    return <VistaPublica token={rota.token} navegar={navegar} />
  }
  if (modoRecuperacao) {
    return <VistaAutenticação rota={rota} navegar={navegar} />
  }

  if (carregando) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-10 sm:px-6">
        <Skeleton className="h-16 w-2/3 rounded-2xl" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    )
  }

  if (!usuario) {
    return <VistaAutenticação rota={rota} navegar={navegar} />
  }
  if (rota.vista === "leitura") {
    return <VistaLeitura id={rota.id} navegar={navegar} />
  }
  const rotaDeAuth =
    rota.vista === "entrar" || rota.vista === "cadastro" || rota.vista === "redefinir"
  if (rotaDeAuth) return <Redirecionar ao={"/"} navegar={navegar} />
  const exclusaoPendente = Boolean(
    (perfil as unknown as { exclusaoSolicitadaEm?: string })?.exclusaoSolicitadaEm,
  )
  const expiraEm = (perfil as unknown as { expiraEm?: string })?.expiraEm

  const conteudo =
    rota.vista === "inicio" ? (
      <VistaInicio navegar={navegar} onNovaNota={() => setNovaNotaAberta(true)} />
    ) : rota.vista === "notas" ? (
      <VistaNotas navegar={navegar} onNovaNota={() => setNovaNotaAberta(true)} />
    ) : rota.vista === "organizacao" ? (
      <VistaOrganizacao navegar={navegar} />
    ) : rota.vista === "links" ? (
      <VistaLinks />
    ) : rota.vista === "conta" ? (
      <VistaConta navegar={navegar} />
    ) : rota.vista === "editor" ? (
      <VistaEditor id={rota.id} navegar={navegar} />
    ) : null

  return (
    <AppShell rota={rota} navegar={navegar} onNovaNota={() => setNovaNotaAberta(true)}>
      {exclusaoPendente ? (
        <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
            Exclusão solicitada. A conta será removida em{" "}
            {expiraEm ? new Date(expiraEm).toLocaleString("pt-BR") : "24 horas"}.
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            É possível restaurar a conta dentro do prazo.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={async () => {
                setRestaurando(true)
                try {
                  await restaurarConta()
                } finally {
                  setRestaurando(false)
                }
              }}
              disabled={restaurando}
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
            >
              {restaurando ? "Restaurando..." : "Restaurar conta"}
            </button>
            <button
              onClick={() => navegar("/conta")}
              className="border-border rounded-lg border px-4 py-2 text-sm"
            >
              Ver detalhes
            </button>
          </div>
        </div>
      ) : null}
      {conteudo}
      {novaNotaAberta ? (
        <DialogoNovaNota
          aberto
          aoFechar={() => setNovaNotaAberta(false)}
          aoCriar={(id) => navegar(`/editor/${id}`)}
        />
      ) : null}
    </AppShell>
  )
}

function Redirecionar({ ao, navegar }: { ao: string; navegar: (para: string) => void }) {
  useEffect(() => {
    navegar(ao)
  }, [ao, navegar])
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Skeleton className="h-16 w-2/3 rounded-2xl" />
    </div>
  )
}
