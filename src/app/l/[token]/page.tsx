// Página do link público (/l/<token>). Gera metadados/OG e delega a nota à vista
// hash do app por meio de um redirecionamento client-side.

import type { Metadata } from "next";
import { NotebookPen } from "lucide-react";
import { buscarDadosOg } from "./dados";
import { RedirecionarVista } from "./redirecionar";
import { separarHabilidades } from "@/lib/notas/texto";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ token: string }> };

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
];

function resumir(texto: string, max = 150): string {
  const limpo = texto.replace(/\s+/g, " ").trim();
  return limpo.length > max ? `${limpo.slice(0, max - 1).trimEnd()}...` : limpo;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  // Link inválido cai em metadados genéricos sem indexação.
  const dados = await buscarDadosOg(token).catch(() => null);

  if (!dados || !dados.nota) {
    return {
      title: "Link indisponível",
      description:
        "Este link não existe, foi revogado pelo professor ou expirou. Notas de aula que chegam aos alunos.",
      robots: { index: false },
    };
  }

  const { nota, link } = dados;
  const periodo = `${MESES_CURTOS[nota.mes - 1] ?? ""}/${nota.anoLetivo}`;
  const subtitulo = [nota.disciplinaNome, periodo].filter(Boolean).join(" · ");
  const turmas = nota.turmasNomes.length > 0 ? nota.turmasNomes.join(", ") : "";
  const professor = link.professorNome ? `Prof. ${link.professorNome}` : "";
  const habilidades = separarHabilidades(nota.habilidades);
  // A descrição reúne os metadados da nota e, quando houver, o resumo.
  const metadados = [nota.disciplinaNome, periodo, turmas, professor].filter(Boolean).join(" · ");
  const descricao = [metadados, nota.sobre ? resumir(nota.sobre, 140) : ""]
    .filter(Boolean)
    .join(" - ");

  const imagem = {
    url: `/l/${token}/opengraph-image`,
    width: 1200,
    height: 630,
    alt: `${nota.titulo} · ${subtitulo}`,
  };

  return {
    title: nota.titulo,
    description: descricao,
    keywords: [nota.disciplinaNome, ...nota.turmasNomes, ...habilidades].filter(Boolean),
    authors: link.professorNome ? [{ name: link.professorNome }] : undefined,
    robots: { index: true, follow: true },
    openGraph: {
      title: nota.titulo,
      description: descricao,
      type: "article",
      locale: "pt_BR",
      siteName: "Caderno Aberto",
      url: `/l/${token}`,
      images: [imagem],
      authors: link.professorNome ? [link.professorNome] : undefined,
      publishedTime: nota.atualizadoEm,
      modifiedTime: nota.atualizadoEm,
      tags: habilidades.length > 0 ? habilidades : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: nota.titulo,
      description: descricao,
      images: [imagem],
    },
  };
}

export default async function PaginaLink({ params }: Props) {
  const { token } = await params;
  const dados = await buscarDadosOg(token).catch(() => null);
  const titulo = dados?.nota?.titulo ?? "Nota de aula";

  return (
    <main className="bg-background flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
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
        <p className="text-muted-foreground text-sm">Abrindo a nota de aula...</p>
      </div>
      {/* sem JavaScript, o redirecionamento client-side não roda: link direto na hash */}
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
  );
}
