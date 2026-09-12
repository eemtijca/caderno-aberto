// Importa uma nota em Markdown ou JSON para o professor autenticado.

import { NextRequest } from "next/server";
import { banco } from "@/lib/banco";
import { sessaoProfessor, json, erroApi, naoAutenticado } from "@/lib/api/sessao";
import {
  linhaParaNota,
  mapaTurmasProfessor,
  camposDenormalizados,
  paraJson,
} from "@/lib/api/serializacao";
import type { DisciplinaLinha, TurmaLinha } from "@/lib/banco/tipos";
import { normalizarAparencia, normalizarBlocos, type AparenciaNota } from "@/lib/notas/tipos";
import { analisarMarkdown } from "@/lib/notas/render-markdown";
import { normalizar, textoDeBusca } from "@/lib/notas/texto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const sessao = await sessaoProfessor(req);
  if (!sessao) return naoAutenticado();
  const { usuario } = sessao;

  const corpo = await req.json().catch(() => null);
  if (!corpo || typeof corpo.conteudo !== "string") return erroApi("Conteúdo inválido.");
  // Formato ausente ou desconhecido cai em Markdown.
  const formato = corpo.formato === "json" ? "json" : "md";

  let dados: {
    titulo: string;
    disciplina: string;
    anoLetivo: number;
    mes: number;
    sobre: string;
    habilidades: string;
    status: "rascunho" | "publicada";
    turmas: string[];
    blocos: unknown;
    aparencia: AparenciaNota;
  };

  if (formato === "json") {
    let obj: { nota?: Record<string, unknown> } | Record<string, unknown>;
    try {
      obj = JSON.parse(corpo.conteudo);
    } catch {
      return erroApi("JSON inválido.");
    }
    const n = (obj as { nota?: Record<string, unknown> }).nota ?? (obj as Record<string, unknown>);
    dados = {
      titulo: String(n.titulo ?? "Nota importada"),
      disciplina:
        typeof n.disciplina === "object" && n.disciplina
          ? String((n.disciplina as { nome?: string }).nome ?? "")
          : String(n.disciplina ?? ""),
      anoLetivo: Number(n.anoLetivo) || new Date().getFullYear(),
      mes: Math.min(12, Math.max(1, Number(n.mes) || new Date().getMonth() + 1)),
      sobre: String(n.sobre ?? ""),
      habilidades: String(n.habilidades ?? ""),
      status: n.status === "publicada" ? "publicada" : "rascunho",
      turmas: Array.isArray(n.turmas)
        ? n.turmas.map((t: unknown) =>
            typeof t === "string" ? t : String((t as { nome?: string })?.nome ?? ""),
          )
        : [],
      blocos: n.blocos,
      aparencia: normalizarAparencia(n.aparencia),
    };
  } else {
    const md = analisarMarkdown(corpo.conteudo);
    dados = {
      titulo: md.titulo,
      disciplina: md.disciplina,
      anoLetivo: md.anoLetivo,
      mes: md.mes,
      sobre: md.sobre,
      habilidades: md.habilidades,
      status: md.status === "publicada" ? "publicada" : "rascunho",
      turmas: md.turmas,
      blocos: md.blocos,
      aparencia: normalizarAparencia(md.aparencia),
    };
  }

  if (!dados.titulo.trim()) return erroApi("Arquivo sem título identificável.");

  const db = await banco();

  // disciplina: cria se não existir (do próprio professor)
  const nomeDisc = dados.disciplina.trim() || "Sem disciplina";
  const candidatas = (await db.disciplinas.findMany({
    where: {
      professorId: usuario.id,
    },
  })) as unknown as DisciplinaLinha[];
  let disciplina = candidatas.find((d) => d.nome.toLowerCase() === nomeDisc.toLowerCase()) ?? null;
  if (!disciplina) {
    try {
      disciplina = (await db.disciplinas.create({
        data: {
          professorId: usuario.id,
          nome: nomeDisc,
          cor: "verde",
          icone: "BookOpen",
        },
      })) as unknown as DisciplinaLinha;
    } catch {
      return erroApi("Falha ao criar a disciplina.");
    }
  }

  // turmas: cria as que faltarem no ano letivo da nota
  const turmasDoAno = (await db.turmas.findMany({
    where: {
      professorId: usuario.id,
    },
  })) as unknown as TurmaLinha[];
  const porNome = new Map(
    turmasDoAno
      .filter((t) => t.anoLetivo === dados.anoLetivo)
      .map((t) => [t.nome.toUpperCase(), t]),
  );

  const turmasFinais: TurmaLinha[] = [];
  for (const nome of dados.turmas) {
    const nomeUp = nome.trim().toUpperCase();
    if (!nomeUp) continue;
    let turma = porNome.get(nomeUp);
    if (!turma) {
      const serie = nomeUp.startsWith("1")
        ? "1º ano"
        : nomeUp.startsWith("2")
          ? "2º ano"
          : nomeUp.startsWith("3")
            ? "3º ano"
            : "Outro";
      try {
        turma = (await db.turmas.create({
          data: {
            professorId: usuario.id,
            nome: nomeUp,
            serie,
            anoLetivo: dados.anoLetivo,
          },
        })) as unknown as TurmaLinha;
        porNome.set(nomeUp, turma);
      } catch {
        turma = undefined;
      }
    }
    if (turma) turmasFinais.push(turma);
  }

  const blocos = normalizarBlocos(dados.blocos);
  // Cria a nota com o índice de busca denormalizado.
  const linha = (await db.notas
    .create({
      data: {
        professorId: usuario.id,
        titulo: dados.titulo.trim(),
        ...camposDenormalizados(disciplina, turmasFinais),
        anoLetivo: dados.anoLetivo,
        mes: dados.mes,
        sobre: dados.sobre,
        habilidades: dados.habilidades,
        status: dados.status,
        blocos: paraJson(blocos),
        aparencia: paraJson(dados.aparencia),
        busca: normalizar(
          textoDeBusca({
            titulo: dados.titulo,
            sobre: dados.sobre,
            habilidades: dados.habilidades,
            blocos,
            disciplina: { nome: disciplina.nome },
            turmas: turmasFinais.map((t) => ({ nome: t.nome, serie: t.serie })),
          }),
        ),
      },
    })
    .catch(() => null)) as unknown as Parameters<typeof linhaParaNota>[0] | null;

  if (!linha) return erroApi("Falha ao importar a nota.");

  const mapaTurmas = await mapaTurmasProfessor(usuario.id);
  return json({ nota: linhaParaNota(linha, mapaTurmas) }, 201);
}
