"use client"

// Vista Início. Painel com saudação, números, ações rápidas e últimas notas.

import { ArrowRight, BookOpenText, CalendarRange, Eye, Link2, Plus, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useDisciplinas, useLinks, useNotas, useTurmas } from "@/lib/notas/api-client"
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
  const { data: notas } = useNotas()
  const { data: disciplinas } = useDisciplinas()
  const { data: turmas } = useTurmas()
  const { data: links } = useLinks()
  const { perfil } = useSessao()

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
      {/* cabeçalho */}
      <section className="bg-primary text-primary-foreground rounded-3xl p-6 sm:p-8">
        <p className="text-sm font-medium opacity-80">
          {MESES_CAP[mesAtual - 1]} de {anoAtual}
          {perfil?.escola ? ` · ${perfil.escola}` : ""}
        </p>
        <h1 className="fonte-display mt-1 text-2xl font-bold sm:text-3xl">
          {saudacao}
          {professor ? `, ${professor.replace(/^Prof(?:essor|essora|a|o)?\.?\s*/i, "")}` : ""}!
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed opacity-85">
          Escreva a nota de qualquer disciplina . O sistema gera a versão web responsiva, o PDF de
          impressão e os arquivos de impressão e de texto automaticamente.
        </p>
        <div className="mt-5 flex flex-wrap gap-2.5">
          <Button variant="secondary" onClick={onNovaNota} className="gap-2 rounded-xl">
            <Plus className="h-4 w-4" aria-hidden /> Nova nota
          </Button>
          {(notas ?? []).length > 0 ? (
            <Button
              variant="outline"
              onClick={() => navegar("/notas")}
              className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground gap-2 rounded-xl bg-transparent"
            >
              Ver todas <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          ) : null}
        </div>
      </section>

      {/* números */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Numero
          icone={BookOpenText}
          valor={notas?.length ?? 0}
          rotulo="notas"
          onClick={() => navegar("/notas")}
        />
        <Numero
          icone={Eye}
          valor={publicadas}
          rotulo="públicas"
          onClick={() => navegar("/notas")}
        />
        <Numero
          icone={CalendarRange}
          valor={disciplinas?.length ?? 0}
          rotulo="disciplinas"
          onClick={() => navegar("/conta")}
        />
        <Numero
          icone={Link2}
          valor={links?.length ?? 0}
          rotulo="links para os alunos"
          onClick={() => navegar("/links")}
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
            {doMes.map((n) => (
              <CartaoNota
                key={n.id}
                nota={n}
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
        {recentes.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {recentes.map((n) => (
              <CartaoNota
                key={n.id}
                nota={n}
                onAbrir={() => navegar(`/nota/${n.id}`)}
                onEditar={() => navegar(`/editor/${n.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="border-border rounded-2xl border border-dashed p-8 text-center">
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
}: {
  icone: typeof BookOpenText
  valor: number
  rotulo: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="border-border bg-card flex flex-col items-start gap-1 rounded-2xl border p-4 text-left transition-shadow hover:shadow-md"
    >
      <Icone className="text-muted-foreground h-4 w-4" aria-hidden />
      <span className="fonte-display text-2xl font-bold tabular-nums">{valor}</span>
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
