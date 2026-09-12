// Lista e cria links públicos de compartilhamento do professor autenticado.

import { NextRequest } from "next/server";
import { banco } from "@/lib/banco";
import { sessaoProfessor, json, erroApi, naoAutenticado } from "@/lib/api/sessao";
import type { LinkLinha } from "@/lib/banco/tipos";
import { gerarToken } from "@/lib/api/token";

export const dynamic = "force-dynamic";

type TipoLink = "nota" | "turma" | "disciplina";

function paraResposta(l: LinkLinha, alvo: string, alvoDetalhe: string) {
  return {
    id: l.id,
    tipo: l.tipo,
    token: l.token,
    nome: l.nome,
    alvo,
    alvoDetalhe,
    notaId: l.notaId,
    turmaId: l.turmaId,
    disciplinaId: l.disciplinaId,
    ativo: l.ativo,
    expiraEm: l.expiraEm,
    acessos: l.acessos,
    criadoEm: l.criadoEm,
  };
}

export async function GET(req: NextRequest) {
  const sessao = await sessaoProfessor(req);
  if (!sessao) return naoAutenticado();
  const { usuario } = sessao;

  const db = await banco();
  const links = (await db.links.findMany({
    where: {
      professorId: usuario.id,
    },
  })) as unknown as LinkLinha[];
  links.sort((a, b) => (a.criadoEm < b.criadoEm ? 1 : -1));
  const notas = await db.notas.findMany({ where: { professorId: usuario.id } });
  const turmas = await db.turmas.findMany({ where: { professorId: usuario.id } });
  const disciplinas = await db.disciplinas.findMany({ where: { professorId: usuario.id } });

  const notaPorId = new Map(notas.map((n) => [n.id, n]));
  const turmaPorId = new Map(turmas.map((t) => [t.id, t]));
  const disciplinaPorId = new Map(disciplinas.map((d) => [d.id, d]));

  // Notas publicadas por disciplina: são as que o link de disciplina expõe.
  const publicadasPorDisciplina = new Map<string, number>();
  for (const n of notas) {
    if (n.status !== "publicada" || !n.disciplinaId) continue;
    publicadasPorDisciplina.set(
      n.disciplinaId,
      (publicadasPorDisciplina.get(n.disciplinaId) ?? 0) + 1,
    );
  }

  // Resolve o nome e o estado do alvo de cada link para a listagem.
  const lista = links.map((l) => {
    let alvo = "";
    let alvoDetalhe = "";
    if (l.tipo === "nota" && l.notaId) {
      const n = notaPorId.get(l.notaId);
      alvo = n?.titulo ?? "(nota excluída)";
      alvoDetalhe = n?.status === "publicada" ? "publicada" : "rascunho";
    } else if (l.tipo === "turma" && l.turmaId) {
      const t = turmaPorId.get(l.turmaId);
      alvo = t ? `Turma ${t.nome}` : "(turma excluída)";
      alvoDetalhe = t ? `${t.serie} · ${t.anoLetivo}` : "";
    } else if (l.tipo === "disciplina" && l.disciplinaId) {
      const d = disciplinaPorId.get(l.disciplinaId);
      alvo = d?.nome ?? "(disciplina excluída)";
      const total = publicadasPorDisciplina.get(l.disciplinaId) ?? 0;
      alvoDetalhe = total > 0 ? `${total} ${total === 1 ? "nota" : "notas"}` : "";
    }
    return paraResposta(l, alvo, alvoDetalhe);
  });

  return json({ links: lista });
}

export async function POST(req: NextRequest) {
  const sessao = await sessaoProfessor(req);
  if (!sessao) return naoAutenticado();
  const { usuario, perfil } = sessao;

  const corpo = await req.json().catch(() => null);
  const tipoBruto: string = corpo?.tipo ?? "";
  if (tipoBruto !== "nota" && tipoBruto !== "turma" && tipoBruto !== "disciplina") {
    return erroApi("Tipo de link inválido.");
  }
  const tipo = tipoBruto as TipoLink;

  // Exige posse do alvo do link.
  const alvoId: string = corpo?.[`${tipo}Id`] ?? corpo?.alvoId ?? "";
  if (!alvoId) return erroApi("Selecione o destino do link.");

  const db = await banco();
  const alvo =
    tipo === "nota"
      ? await db.notas.findFirst({ where: { id: alvoId, professorId: usuario.id } })
      : tipo === "turma"
        ? await db.turmas.findFirst({ where: { id: alvoId, professorId: usuario.id } })
        : await db.disciplinas.findFirst({ where: { id: alvoId, professorId: usuario.id } });
  if (!alvo) return erroApi("Destino não encontrado.", 404);

  // O token é gerado no servidor e não pode ser escolhido pelo cliente.
  const link = (await db.links.create({
    data: {
      professorId: usuario.id,
      tipo,
      token: gerarToken(),
      professorNome: perfil?.nome ?? "",
      nome: typeof corpo?.nome === "string" ? corpo.nome.trim().slice(0, 120) : "",
      notaId: tipo === "nota" ? alvoId : null,
      turmaId: tipo === "turma" ? alvoId : null,
      disciplinaId: tipo === "disciplina" ? alvoId : null,
    },
  })) as unknown as LinkLinha;

  if (!link) return erroApi("Falha ao criar o link.");
  return json({ link: paraResposta(link, "", "") }, 201);
}
