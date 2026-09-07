import { NextRequest, NextResponse } from "next/server"
import { banco } from "@/lib/banco"
import { sessaoProfessor, json, erroApi, naoAutenticado } from "@/lib/api/sessao"
import { obterArmazenamento } from "@/lib/armazenamento"
import { camposDenormalizados, paraJson } from "@/lib/api/serializacao"
import type { DisciplinaLinha, TurmaLinha } from "@/lib/banco/tipos"
import { normalizarAparencia, normalizarBlocos } from "@/lib/notas/tipos"
import { normalizar, textoDeBusca } from "@/lib/notas/texto"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const sessao = await sessaoProfessor(req)
  if (!sessao) return naoAutenticado()
  const { usuario, perfil } = sessao

  const db = await banco()
  const disciplinas = await db.orm.public.Disciplinas.where({ professorId: usuario.id }).all()
  const turmas = await db.orm.public.Turmas.where({ professorId: usuario.id }).all()
  const notas = await db.orm.public.Notas.where({ professorId: usuario.id }).all()
  const links = await db.orm.public.Links.where({ professorId: usuario.id }).all()

  const objetos = await obterArmazenamento().listar(usuario.id)
  const imagens: { nome: string; mime: string; dados: string; caminho: string }[] = []
  for (const obj of objetos.slice(0, 1000)) {
    const arquivo = await obterArmazenamento().ler(obj.caminho)
    if (!arquivo) continue
    imagens.push({
      nome: obj.caminho.split("/").pop() ?? "imagem.png",
      mime: arquivo.mime,
      dados: arquivo.bytes.toString("base64"),
      caminho: obj.caminho,
    })
  }

  const corpo = {
    versao: 2,
    exportadoEm: new Date().toISOString(),
    professor: { nome: perfil?.nome ?? "", escola: perfil?.escola ?? "" },
    disciplinas: disciplinas.map((d) => ({
      id: d.id,
      nome: d.nome,
      cor: d.cor,
      icone: d.icone,
      ordem: d.ordem,
    })),
    turmas: turmas.map((t) => ({
      id: t.id,
      nome: t.nome,
      serie: t.serie,
      anoLetivo: t.anoLetivo,
    })),
    notas: notas.map((n) => ({
      id: n.id,
      titulo: n.titulo,
      disciplinaId: n.disciplinaId,
      anoLetivo: n.anoLetivo,
      mes: n.mes,
      sobre: n.sobre,
      habilidades: n.habilidades,
      status: n.status,
      turmasIds: n.turmasIds,
      blocos: n.blocos,
      aparencia: n.aparencia,
    })),
    links: links.map((l) => ({
      tipo: l.tipo,
      token: l.token,
      nome: l.nome,
      ativo: l.ativo,
      expiraEm: l.expiraEm,
      notaId: l.notaId,
      turmaId: l.turmaId,
      disciplinaId: l.disciplinaId,
    })),
    imagens,
  }

  return new NextResponse(JSON.stringify(corpo, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="backup-caderno-${new Date()
        .toISOString()
        .slice(0, 10)}.json"`,
      "Cache-Control": "private, no-store",
    },
  })
}

export async function POST(req: NextRequest) {
  const sessao = await sessaoProfessor(req)
  if (!sessao) return naoAutenticado()
  const { usuario } = sessao

  const corpo = await req.json().catch(() => null)
  if (!corpo || !Array.isArray(corpo.notas)) return erroApi("Arquivo de backup inválido.")
  const versao = Number(corpo.versao) === 2 ? 2 : 1

  const db = await banco()
  await db.orm.public.Links.where({ professorId: usuario.id }).deleteAll()
  await db.orm.public.Notas.where({ professorId: usuario.id }).deleteAll()
  await db.orm.public.Turmas.where({ professorId: usuario.id }).deleteAll()
  await db.orm.public.Disciplinas.where({ professorId: usuario.id }).deleteAll()

  const mapaImagens = new Map<string, string>()
  const armazenamento = obterArmazenamento()
  for (const img of corpo.imagens ?? []) {
    if (typeof img?.dados !== "string") continue
    try {
      const buf = Buffer.from(img.dados, "base64")
      if (buf.length === 0) continue
      const mime = typeof img.mime === "string" ? img.mime : "image/png"
      const nomeArq = typeof img.nome === "string" ? img.nome : "imagem.png"
      const ext = (nomeArq.split(".").pop() ?? "png").toLowerCase().replace("jpeg", "jpg")
      const caminho = `${usuario.id}/${Date.now().toString(36)}-${Math.random()
        .toString(36)
        .slice(2, 8)}.${ext}`
      await armazenamento.salvar(caminho, buf, mime)
      const urlNova = `/api/imagens?path=${encodeURIComponent(caminho)}`
      if (versao === 2 && typeof img.caminho === "string") {
        mapaImagens.set(`/api/imagens?path=${encodeURIComponent(img.caminho)}`, urlNova)
        mapaImagens.set(img.caminho, caminho)
      } else if (img.id) {
        mapaImagens.set(`/api/imagens/${img.id}`, urlNova)
      }
    } catch {}
  }

  const reescreverBlocos = (blocos: unknown): unknown => {
    let texto = JSON.stringify(blocos ?? [])
    for (const [antiga, nova] of mapaImagens) {
      if (antiga.startsWith("/api/imagens?path=")) {
        texto = texto.split(antiga).join(nova)
      }
    }
    return JSON.parse(texto)
  }

  const idDisc = new Map<string, string>() // id antigo -> novo
  const nomeDisc = new Map<string, string>() // nome -> novo id
  const listaDisc: DisciplinaLinha[] = []
  for (const d of corpo.disciplinas ?? []) {
    if (typeof d?.nome !== "string" || !d.nome.trim()) continue
    try {
      const criada = (await db.orm.public.Disciplinas.create({
        professorId: usuario.id,
        nome: d.nome.trim(),
        cor: typeof d.cor === "string" ? d.cor : "verde",
        icone: typeof d.icone === "string" && d.icone ? d.icone : "BookOpen",
        ordem: Number(d.ordem) || 0,
      })) as unknown as DisciplinaLinha
      if (d.id) idDisc.set(String(d.id), criada.id)
      nomeDisc.set(d.nome.trim(), criada.id)
      listaDisc.push(criada)
    } catch {}
  }

  const idTurma = new Map<string, string>()
  const listaTurmas: TurmaLinha[] = []
  const turmasV1 = new Map<string, string>() // "NOME-ANO" -> id
  for (const t of corpo.turmas ?? []) {
    if (typeof t?.nome !== "string" || !t.nome.trim()) continue
    const ano = Number(t.anoLetivo) || new Date().getFullYear()
    try {
      const criada = (await db.orm.public.Turmas.create({
        professorId: usuario.id,
        nome: t.nome.trim().toUpperCase(),
        serie: typeof t.serie === "string" ? t.serie : "Outro",
        anoLetivo: ano,
      })) as unknown as TurmaLinha
      if (t.id) idTurma.set(String(t.id), criada.id)
      turmasV1.set(`${t.nome.trim().toUpperCase()}-${ano}`, criada.id)
      listaTurmas.push(criada)
    } catch {}
  }

  const idNota = new Map<string, string>()
  const notasCriadas: { id: string; titulo: string }[] = []
  for (const n of corpo.notas) {
    const titulo = String(n.titulo ?? "Nota").trim() || "Nota"
    const disciplinaId =
      (versao === 2 && n.disciplinaId ? idDisc.get(String(n.disciplinaId)) : undefined) ??
      nomeDisc.get(String(n.disciplina ?? "").trim()) ??
      null
    const disciplina =
      listaDisc.find((d) => d.id === disciplinaId) ??
      (n.disciplina && typeof n.disciplina === "string"
        ? listaDisc.find((d) => d.nome === String(n.disciplina).trim())
        : undefined) ??
      null

    let turmasIds: string[] = []
    if (versao === 2 && Array.isArray(n.turmasIds)) {
      turmasIds = n.turmasIds.map((id: unknown) => idTurma.get(String(id))).filter(Boolean)
    } else if (Array.isArray(n.turmas)) {
      const anoNota = Number(n.anoLetivo) || new Date().getFullYear()
      turmasIds = n.turmas
        .map((t: unknown) => {
          const nome = typeof t === "string" ? t : String((t as { nome?: string })?.nome ?? "")
          return turmasV1.get(`${String(nome).trim().toUpperCase()}-${anoNota}`)
        })
        .filter(Boolean)
    }
    const turmasNota = listaTurmas.filter((t) => turmasIds.includes(t.id))

    const blocos = reescreverBlocos(normalizarBlocos(n.blocos))
    const sobre = String(n.sobre ?? "")
    const habilidades = String(n.habilidades ?? "")
    const aparencia = normalizarAparencia(n.aparencia)

    try {
      const criada = (await db.orm.public.Notas.create({
        professorId: usuario.id,
        titulo,
        ...camposDenormalizados(disciplina ?? null, turmasNota),
        anoLetivo: Number(n.anoLetivo) || new Date().getFullYear(),
        mes: Math.min(12, Math.max(1, Number(n.mes) || 1)),
        sobre,
        habilidades,
        status: n.status === "publicada" ? "publicada" : "rascunho",
        blocos: paraJson(blocos),
        aparencia: paraJson(aparencia),
        busca: normalizar(
          textoDeBusca({
            titulo,
            sobre,
            habilidades,
            blocos: normalizarBlocos(n.blocos),
            disciplina: disciplina ? { nome: disciplina.nome } : null,
            turmas: turmasNota.map((t) => ({ nome: t.nome, serie: t.serie })),
          }),
        ),
      })) as unknown as { id: string; titulo: string }
      if (n.id) idNota.set(String(n.id), criada.id)
      notasCriadas.push({ id: criada.id, titulo })
    } catch {}
  }

  if (Array.isArray(corpo.links)) {
    const perfil = await db.orm.public.Profiles.where({ id: usuario.id }).first()
    for (const l of corpo.links) {
      if (!l || typeof l.token !== "string") continue
      if (!["nota", "turma", "disciplina"].includes(l.tipo)) continue
      const alvoOk =
        (l.tipo === "nota" && l.notaId && idNota.get(String(l.notaId))) ||
        (l.tipo === "turma" && l.turmaId && idTurma.get(String(l.turmaId))) ||
        (l.tipo === "disciplina" && l.disciplinaId && idDisc.get(String(l.disciplinaId)))
      if (!alvoOk) continue
      const dadosBase = {
        professorId: usuario.id,
        tipo: l.tipo,
        notaId: l.tipo === "nota" ? (idNota.get(String(l.notaId)) ?? null) : null,
        turmaId: l.tipo === "turma" ? (idTurma.get(String(l.turmaId)) ?? null) : null,
        disciplinaId: l.tipo === "disciplina" ? (idDisc.get(String(l.disciplinaId)) ?? null) : null,
        token: l.token,
        professorNome: perfil?.nome ?? "",
        nome: typeof l.nome === "string" ? l.nome : "",
        ativo: l.ativo !== false,
        expiraEm: typeof l.expiraEm === "string" && l.expiraEm ? l.expiraEm : null,
      }
      try {
        await db.orm.public.Links.create(dadosBase)
      } catch {
        // Token em colisão é regenerado.
        try {
          await db.orm.public.Links.create({
            ...dadosBase,
            token: `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`,
          })
        } catch {}
      }
    }
  }

  const dadosPerfil: { nome?: string; escola?: string } = {}
  if (versao === 1 && corpo.config && typeof corpo.config === "object") {
    const cfg = corpo.config as Record<string, unknown>
    if (typeof cfg.professor === "string" && cfg.professor) dadosPerfil.nome = cfg.professor
    if (typeof cfg.escola === "string" && cfg.escola) dadosPerfil.escola = cfg.escola
  } else if (corpo.professor && typeof corpo.professor === "object") {
    const p = corpo.professor as Record<string, unknown>
    if (typeof p.nome === "string" && p.nome) dadosPerfil.nome = p.nome
    if (typeof p.escola === "string" && p.escola) dadosPerfil.escola = p.escola
  }
  if (Object.keys(dadosPerfil).length > 0) {
    await db.orm.public.Profiles.where({ id: usuario.id }).update(dadosPerfil)
  }

  return json({ ok: true, notas: notasCriadas.length })
}
