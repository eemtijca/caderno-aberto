import { NextRequest } from "next/server"
import { banco } from "@/lib/banco"
import { sessaoProfessor, json, erroApi, naoAutenticado } from "@/lib/api/sessao"
import type { LinkLinha } from "@/lib/banco/tipos"
import { gerarToken } from "@/lib/api/token"

export const dynamic = "force-dynamic"

type TipoLink = "nota" | "turma" | "disciplina"

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
  }
}

export async function GET(req: NextRequest) {
  const sessao = await sessaoProfessor(req)
  if (!sessao) return naoAutenticado()
  const { usuario } = sessao

  const db = await banco()
  const links = (await db.orm.public.Links.where({
    professorId: usuario.id,
  }).all()) as unknown as LinkLinha[]
  links.sort((a, b) => (a.criadoEm < b.criadoEm ? 1 : -1))
  const notas = await db.orm.public.Notas.where({ professorId: usuario.id }).all()
  const turmas = await db.orm.public.Turmas.where({ professorId: usuario.id }).all()
  const disciplinas = await db.orm.public.Disciplinas.where({ professorId: usuario.id }).all()

  const notaPorId = new Map(notas.map((n) => [n.id, n]))
  const turmaPorId = new Map(turmas.map((t) => [t.id, t]))
  const disciplinaPorId = new Map(disciplinas.map((d) => [d.id, d]))

  const lista = links.map((l) => {
    let alvo = ""
    let alvoDetalhe = ""
    if (l.tipo === "nota" && l.notaId) {
      const n = notaPorId.get(l.notaId)
      alvo = n?.titulo ?? "(nota excluída)"
      alvoDetalhe = n?.status === "publicada" ? "publicada" : "rascunho"
    } else if (l.tipo === "turma" && l.turmaId) {
      const t = turmaPorId.get(l.turmaId)
      alvo = t ? `Turma ${t.nome}` : "(turma excluída)"
      alvoDetalhe = t ? `${t.serie} · ${t.anoLetivo}` : ""
    } else if (l.tipo === "disciplina" && l.disciplinaId) {
      const d = disciplinaPorId.get(l.disciplinaId)
      alvo = d?.nome ?? "(disciplina excluída)"
      alvoDetalhe = d ? String(disciplinaPorId.size) : ""
    }
    return paraResposta(l, alvo, alvoDetalhe)
  })

  return json({ links: lista })
}

export async function POST(req: NextRequest) {
  const sessao = await sessaoProfessor(req)
  if (!sessao) return naoAutenticado()
  const { usuario, perfil } = sessao

  const corpo = await req.json().catch(() => null)
  const tipoBruto: string = corpo?.tipo ?? ""
  if (tipoBruto !== "nota" && tipoBruto !== "turma" && tipoBruto !== "disciplina") {
    return erroApi("Tipo de link inválido.")
  }
  const tipo = tipoBruto as TipoLink

  // Exige posse do alvo do link.
  const alvoId: string = corpo?.[`${tipo}Id`] ?? corpo?.alvoId ?? ""
  if (!alvoId) return erroApi("Selecione o destino do link.")

  const db = await banco()
  const alvo =
    tipo === "nota"
      ? await db.orm.public.Notas.where({ id: alvoId, professorId: usuario.id }).first()
      : tipo === "turma"
        ? await db.orm.public.Turmas.where({ id: alvoId, professorId: usuario.id }).first()
        : await db.orm.public.Disciplinas.where({ id: alvoId, professorId: usuario.id }).first()
  if (!alvo) return erroApi("Destino não encontrado.", 404)

  const link = (await db.orm.public.Links.create({
    professorId: usuario.id,
    tipo,
    token: gerarToken(),
    professorNome: perfil?.nome ?? "",
    nome: typeof corpo?.nome === "string" ? corpo.nome.trim().slice(0, 120) : "",
    notaId: tipo === "nota" ? alvoId : null,
    turmaId: tipo === "turma" ? alvoId : null,
    disciplinaId: tipo === "disciplina" ? alvoId : null,
  })) as unknown as LinkLinha

  if (!link) return erroApi("Falha ao criar o link.")
  return json({ link: paraResposta(link, "", "") }, 201)
}
