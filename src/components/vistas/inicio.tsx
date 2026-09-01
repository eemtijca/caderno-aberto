"use client"

// Vista Início. Cabeçalho minimalista com saudação, números, ações
// rápidas e últimas notas.

import { ArrowRight, BookOpenText, CalendarRange, Eye, Link2, Plus, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useDisciplinas, useLinks, useNotas } from "@/lib/notas/api-client"
import { useSessao } from "@/hooks/use-sessao"
import { CartaoNota } from "@/components/notas/cartao-nota"
import { MESES_CAP } from "@/lib/notas/texto"

export function VistaInicio({
  navegar,
  onNovaNota,
}: {
  navegar: (para: string) => void
  onNovaNota: () => void
}) {
  // cada consulta carrega de forma independente: o painel inteiro não
  // espera o conjunto — cada número/Lista tem seu esqueleto próprio
  const notasQ = useNotas()
  const disciplinasQ = useDisciplinas()
  const linksQ = useLinks()
  const { perfil } = useSessao()

  const notas = notasQ.data
  const mesAtual = new Date().getMonth() + 1
  const anoAtual = new Date().getFullYear()
  const publicadas = (notas ?? []).filter((n) => n.status === "publicada").length
  const doMes = (notas ?? []).filter((n) => n.mes === mesAtual && n.anoLetivo === anoAtual)
  const recentes = [...(notas ?? [])]
    .sort((a, b) => (a.atualizadoEm < b.atualizadoEm ? 1 : -1))
    .slice(0, 4)

  const hora = new Date().getHours()
  const saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite"
  const professor = perfil?.nome?.trim()

  return (
    <div className="space-y-8">
      {/* cabeçalho minimalista */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-sm">
            {MESES_CAP[mesAtual - 1]} de {anoAtual}
            {perfil?.escola ? ` · ${perfil.escola}` : ""}
          </p>
          <h1 className="fonte-display mt-0.5 text-2xl font-bold tracking-tight sm:text-3xl">
            {saudacao}
            {professor ? `, ${professor.replace(/^Prof(?:essor|essora|a|o)?\.?\s*/i, "")}` : ""}!
          </h1>
        </div>
        <Button onClick={onNovaNota} className="gap-2 rounded-xl">
          <Plus className="h-4 w-4" aria-hidden /> Nova nota
        </Button>
      </div>

      {/* números */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Numero
          icone={BookOpenText}
          carregando={notasQ.isLoading}
          valor={notas?.length ?? 0}
          rotulo="notas"
          onClick={() => navegar("/notas")}
          indice={0}
        />
        <Numero
          icone={Eye}
          carregando={notasQ.isLoading}
          valor={publicadas}
          rotulo="publicadas"
          onClick={() => navegar("/notas")}
          indice={1}
        />
        <Numero
          icone={CalendarRange}
          carregando={disciplinasQ.isLoading}
          valor={disciplinasQ.data?.length ?? 0}
          rotulo="disciplinas"
          onClick={() => navegar("/conta")}
          indice={2}
        />
        <Numero
          icone={Link2}
          carregando={linksQ.isLoading}
          valor={linksQ.data?.length ?? 0}
          rotulo="links para os alunos"
          onClick={() => navegar("/links")}
          indice={3}
        />
      </section>

      {/* do mês */}
      {doMes.length > 0 ? (
        <section className="space-y-3">
          <CabecalhoSecao
            titulo={`Notas de ${MESES_CAP[mesAtual - 1]}`}
            acao={{ rotulo: "Ver turmas", onClick: () => navegar("/organizacao") }}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {doMes.map((n, i) => (
              <CartaoNota
                key={n.id}
                nota={n}
                indice={i}
                onAbrir={() => navegar(`/nota/${n.id}`)}
                onEditar={() => navegar(`/editor/${n.id}`)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {/* recentes */}
      <section className="space-y-3">
        <CabecalhoSecao titulo="Últimas edições" />
        {notasQ.isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Skeleton className="h-40 rounded-2xl" />
            <Skeleton className="h-40 rounded-2xl" />
          </div>
        ) : recentes.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {recentes.map((n, i) => (
              <CartaoNota
                key={n.id}
                nota={n}
                indice={i}
                onAbrir={() => navegar(`/nota/${n.id}`)}
                onEditar={() => navegar(`/editor/${n.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="na-cascata border-border rounded-2xl border border-dashed p-8 text-center">
            <p className="font-semibold">Nenhuma nota ainda</p>
            <p className="text-muted-foreground mx-auto mt-1 max-w-md text-sm">
              Comece criando sua primeira disciplina em Conta, ou crie a nota agora e defina a
              disciplina na hora.
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <Button onClick={onNovaNota} className="gap-2 rounded-xl">
                <Plus className="h-4 w-4" aria-hidden /> Nova nota
              </Button>
              <Button
                variant="outline"
                onClick={() => navegar("/conta")}
                className="gap-2 rounded-xl"
              >
                <Settings className="h-4 w-4" aria-hidden /> Conta
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

function Numero({
  icone: Icone,
  valor,
  rotulo,
  onClick,
  carregando,
  indice,
}: {
  icone: typeof BookOpenText
  valor: number
  rotulo: string
  onClick: () => void
  carregando?: boolean
  indice?: number
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="na-cascata border-border bg-card flex min-h-[5.75rem] flex-col items-start gap-1 rounded-2xl border p-4 text-left transition-shadow hover:shadow-md"
      style={{ "--na-i": indice ?? 0 } as React.CSSProperties}
      aria-busy={carregando || undefined}
    >
      <Icone className="text-muted-foreground h-4 w-4" aria-hidden />
      {carregando ? (
        <span className="na-pulso fonte-display text-2xl font-bold text-stone-300 tabular-nums dark:text-stone-600">
          –
        </span>
      ) : (
        <span className="fonte-display text-2xl font-bold tabular-nums">{valor}</span>
      )}
      <span className="text-muted-foreground text-[0.78rem]">{rotulo}</span>
    </button>
  )
}

function CabecalhoSecao({
  titulo,
  acao,
}: {
  titulo: string
  acao?: { rotulo: string; onClick: () => void }
}) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="fonte-display text-lg font-bold">{titulo}</h2>
      {acao ? (
        <button
          type="button"
          onClick={acao.onClick}
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm font-semibold transition-colors"
        >
          {acao.rotulo} <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </button>
      ) : null}
    </div>
  )
}
