import type { Metadata } from "next"
import { NotebookPen } from "lucide-react"
import { buscarDadosOg } from "./dados"
import { RedirecionarVista } from "./redirecionar"

export const dynamic = "force-dynamic"

type Props = { params: Promise<{ token: string }> }

const MESES_CURTOS = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
]

function resumir(texto: string, max = 150): string {
  const limpo = texto.replace(/\s+/g, " ").trim()
  return limpo.length > max ? `${limpo.slice(0, max - 1).trimEnd()}…` : limpo
}

/**
 * Página de entrada pública /l/<token>. Serve os metadados OpenGraph
 * (título, descrição e imagem dinâmica por nota) para WhatsApp, Telegram
 * e redes, e redireciona o visitante para a vista de leitura do SPA.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params
  const dados = await buscarDadosOg(token).catch(() => null)

  if (!dados || !dados.nota) {
    return {
      title: "Link indisponível",
      description:
        "Este link não existe, foi revogado pelo professor ou expirou. Notas de aula que chegam aos alunos.",
      robots: { index: false },
    }
  }

  const { nota, link } = dados
  const subtitulo = [nota.disciplinaNome, `${MESES_CURTOS[nota.mes - 1] ?? ""}/${nota.anoLetivo}`]
    .filter(Boolean)
    .join(" · ")
  const turmas = nota.turmasNomes.length > 0 ? ` · ${nota.turmasNomes.join(", ")}` : ""
  const professor = link.professorNome ? ` · Prof. ${link.professorNome}` : ""
  const descricao = nota.sobre
    ? resumir(nota.sobre)
    : `Nota de aula de ${nota.disciplinaNome || "ensino médio"}${turmas}${professor}`

  return {
    title: nota.titulo,
    description: `${subtitulo}${turmas}${professor} — ${descricao}`.replace(/\s+/g, " ").trim(),
    openGraph: {
      title: nota.titulo,
      description: descricao,
      type: "article",
      siteName: "Caderno Aberto",
    },
    twitter: {
      card: "summary_large_image",
      title: nota.titulo,
      description: descricao,
    },
  }
}

export default async function PaginaLink({ params }: Props) {
  const { token } = await params
  const dados = await buscarDadosOg(token).catch(() => null)
  const titulo = dados?.nota?.titulo ?? "Nota de aula"

  return (
    <main className="bg-background flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      {/* splash mínimo enquanto o redirecionamento acontece */}
      <div className="flex flex-col items-center gap-3">
        <span className="bg-primary text-primary-foreground flex h-14 w-14 items-center justify-center rounded-2xl">
          <NotebookPen className="h-7 w-7" aria-hidden />
        </span>
        <span
          className="border-primary border-t-primary h-6 w-6 animate-spin rounded-full border-2 border-b-transparent"
          role="status"
          aria-label="Abrindo a nota"
        />
      </div>
      <div className="space-y-1">
        <h1 className="fonte-display text-lg font-bold">{titulo}</h1>
        <p className="text-muted-foreground text-sm">Abrindo a nota de aula…</p>
      </div>
      <noscript>
        <a
          href={`/#/l/${encodeURIComponent(token)}`}
          className="text-primary text-sm font-semibold underline"
        >
          Continuar para a nota
        </a>
      </noscript>
      <RedirecionarVista token={token} />
    </main>
  )
}
