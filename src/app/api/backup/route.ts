import { NextRequest, NextResponse } from "next/server"
import { sessaoProfessor, json, erroApi, naoAutenticado } from "@/lib/api/sessao"
import { clienteAdmin } from "@/lib/supabase/admin"
import { camposDenormalizados } from "@/lib/api/serializacao"
import { normalizarAparencia, normalizarBlocos } from "@/lib/notas/tipos"
import { normalizar, textoDeBusca } from "@/lib/notas/texto"

export const dynamic = "force-dynamic"

// GET /api/backup . Exporta TUDO do professor:
// perfil, disciplinas, turmas, notas, links e imagens (base64).
export async function GET() {
  const sessao = await sessaoProfessor()
  if (!sessao) return naoAutenticado()
  const { cliente, usuario, perfil } = sessao

  const [{ data: disciplinas }, { data: turmas }, { data: notas }, { data: links }] =
    await Promise.all([
      cliente.from("disciplinas").select("*").eq("professor_id", usuario.id).order("ordem"),
      cliente.from("turmas").select("*").eq("professor_id", usuario.id).order("nome"),
      cliente
        .from("notas")
        .select("*, disciplina:disciplinas(*)")
        .eq("professor_id", usuario.id)
        .order("criado_em"),
      cliente.from("links").select("*").eq("professor_id", usuario.id).order("criado_em"),
    ])

  // imagens do Storage (download via cliente do professor . RLS)
  const { data: objetos } = await cliente.storage.from("imagens").list(usuario.id, { limit: 1000 })
  const imagens: { nome: string; mime: string; dados: string; caminho: string }[] = []
  for (const obj of objetos ?? []) {
    if (!obj.name || obj.id === null) continue // pasta
    const caminho = `${usuario.id}/${obj.name}`
    const { data: arquivo } = await cliente.storage.from("imagens").download(caminho)
    if (!arquivo) continue
    const buf = Buffer.from(await arquivo.arrayBuffer())
    const mime =
      obj.metadata && typeof obj.metadata === "object" && "mimetype" in obj.metadata
        ? String((obj.metadata as Record<string, unknown>).mimetype ?? "image/png")
        : "image/png"
    imagens.push({ nome: obj.name, mime, dados: buf.toString("base64"), caminho })
  }

  const corpo = {
    versao: 2,
    exportadoEm: new Date().toISOString(),
    professor: { nome: perfil?.nome ?? "", escola: perfil?.escola ?? "" },
    disciplinas: (disciplinas ?? []).map((d) => ({
      id: d.id,
      nome: d.nome,
      cor: d.cor,
      icone: d.icone,
      ordem: d.ordem,
    })),
    turmas: (turmas ?? []).map((t) => ({
      id: t.id,
      nome: t.nome,
      serie: t.serie,
      anoLetivo: t.ano_letivo,
    })),
    notas: (notas ?? []).map((n) => ({
      id: n.id,
      titulo: n.titulo,
      disciplinaId: n.disciplina_id,
      anoLetivo: n.ano_letivo,
      mes: n.mes,
      sobre: n.sobre,
      habilidades: n.habilidades,
      status: n.status,
      turmasIds: n.turmas_ids,
      blocos: n.blocos,
      aparencia: n.aparencia,
    })),
    links: (links ?? []).map((l) => ({
      tipo: l.tipo,
      token: l.token,
      nome: l.nome,
      ativo: l.ativo,
      expiraEm: l.expira_em,
      notaId: l.nota_id,
      turmaId: l.turma_id,
      disciplinaId: l.disciplina_id,
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

// POST /api/backup . Restaura um backup (v2 do app atual ou v1
// do app antigo de arquivo único), SUBSTITUINDO os dados atuais.
export async function POST(req: NextRequest) {
  const sessao = await sessaoProfessor()
  if (!sessao) return naoAutenticado()
  const { cliente, usuario } = sessao

  const corpo = await req.json().catch(() => null)
  if (!corpo || !Array.isArray(corpo.notas)) return erroApi("Arquivo de backup inválido.")
  const versao = Number(corpo.versao) === 2 ? 2 : 1

  await cliente.from("links").delete().neq("id", "00000000-0000-0000-0000-000000000000")
  await cliente.from("notas").delete().neq("id", "00000000-0000-0000-0000-000000000000")
  await cliente.from("turmas").delete().neq("id", "00000000-0000-0000-0000-000000000000")
  await cliente.from("disciplinas").delete().neq("id", "00000000-0000-0000-0000-000000000000")

  // mapa: URL antiga -> caminho novo no Storage deste professor
  const mapaImagens = new Map<string, string>()
  const admin = clienteAdmin()
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
      const { error } = await admin.storage
        .from("imagens")
        .upload(caminho, buf, { contentType: mime })
      if (error) continue
      const urlNova = `/api/imagens?path=${encodeURIComponent(caminho)}`
      if (versao === 2 && typeof img.caminho === "string") {
        mapaImagens.set(`/api/imagens?path=${encodeURIComponent(img.caminho)}`, urlNova)
        mapaImagens.set(img.caminho, caminho)
      } else if (img.id) {
        mapaImagens.set(`/api/imagens/${img.id}`, urlNova)
      }
    } catch {
      // ignora imagem corrompida e segue
    }
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
  const listaDisc: import("@/lib/supabase/tipos").DisciplinaLinha[] = []
  for (const d of corpo.disciplinas ?? []) {
    if (typeof d?.nome !== "string" || !d.nome.trim()) continue
    const { data: criada, error } = await cliente
      .from("disciplinas")
      .insert({
        professor_id: usuario.id,
        nome: d.nome.trim(),
        cor: typeof d.cor === "string" ? d.cor : "verde",
        icone: typeof d.icone === "string" && d.icone ? d.icone : "BookOpen",
        ordem: Number(d.ordem) || 0,
      })
      .select("*")
      .single()
    if (error || !criada) continue
    if (d.id) idDisc.set(String(d.id), criada.id)
    nomeDisc.set(d.nome.trim(), criada.id)
    listaDisc.push(criada)
  }

  const idTurma = new Map<string, string>()
  const listaTurmas: import("@/lib/supabase/tipos").TurmaLinha[] = []
  const turmasV1 = new Map<string, string>() // "NOME-ANO" -> id
  for (const t of corpo.turmas ?? []) {
    if (typeof t?.nome !== "string" || !t.nome.trim()) continue
    const ano = Number(t.anoLetivo) || new Date().getFullYear()
    const { data: criada, error } = await cliente
      .from("turmas")
      .insert({
        professor_id: usuario.id,
        nome: t.nome.trim().toUpperCase(),
        serie: typeof t.serie === "string" ? t.serie : "Outro",
        ano_letivo: ano,
      })
      .select("*")
      .single()
    if (error || !criada) continue
    if (t.id) idTurma.set(String(t.id), criada.id)
    turmasV1.set(`${t.nome.trim().toUpperCase()}-${ano}`, criada.id)
    listaTurmas.push(criada)
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

    // turmas da nota
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

    const { data: criada, error } = await cliente
      .from("notas")
      .insert({
        professor_id: usuario.id,
        titulo,
        ...camposDenormalizados(disciplina ?? null, turmasNota),
        ano_letivo: Number(n.anoLetivo) || new Date().getFullYear(),
        mes: Math.min(12, Math.max(1, Number(n.mes) || 1)),
        sobre,
        habilidades,
        status: n.status === "publicada" ? "publicada" : "rascunho",
        blocos,
        aparencia,
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
      })
      .select("*")
      .single()
    if (error || !criada) continue
    if (n.id) idNota.set(String(n.id), criada.id)
    notasCriadas.push({ id: criada.id, titulo })
  }

  if (Array.isArray(corpo.links)) {
    const { data: perfil } = await cliente
      .from("profiles")
      .select("nome")
      .eq("id", usuario.id)
      .maybeSingle()
    for (const l of corpo.links) {
      if (!l || typeof l.token !== "string") continue
      if (!["nota", "turma", "disciplina"].includes(l.tipo)) continue
      const alvoOk =
        (l.tipo === "nota" && l.notaId && idNota.get(String(l.notaId))) ||
        (l.tipo === "turma" && l.turmaId && idTurma.get(String(l.turmaId))) ||
        (l.tipo === "disciplina" && l.disciplinaId && idDisc.get(String(l.disciplinaId)))
      if (!alvoOk) continue
      await cliente
        .from("links")
        .insert({
          professor_id: usuario.id,
          tipo: l.tipo,
          nota_id: l.tipo === "nota" ? idNota.get(String(l.notaId)) : null,
          turma_id: l.tipo === "turma" ? idTurma.get(String(l.turmaId)) : null,
          disciplina_id: l.tipo === "disciplina" ? idDisc.get(String(l.disciplinaId)) : null,
          token: l.token,
          professor_nome: perfil?.nome ?? "",
          nome: typeof l.nome === "string" ? l.nome : "",
          ativo: l.ativo !== false,
          expira_em: typeof l.expiraEm === "string" && l.expiraEm ? l.expiraEm : null,
        })
        .then(({ error }) => {
          if (error && error.code === "23505") {
            // token repetido (restauração dupla): regenera
            return cliente.from("links").insert({
              professor_id: usuario.id,
              tipo: l.tipo,
              nota_id: l.tipo === "nota" ? idNota.get(String(l.notaId)) : null,
              turma_id: l.tipo === "turma" ? idTurma.get(String(l.turmaId)) : null,
              disciplina_id: l.tipo === "disciplina" ? idDisc.get(String(l.disciplinaId)) : null,
              token: `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`,
              professor_nome: perfil?.nome ?? "",
              nome: typeof l.nome === "string" ? l.nome : "",
              ativo: l.ativo !== false,
              expira_em: typeof l.expiraEm === "string" && l.expiraEm ? l.expiraEm : null,
            })
          }
          return null
        })
    }
  }

  type AtualizacaoPerfil = Partial<
    Pick<import("@/lib/supabase/tipos").PerfilLinha, "nome" | "escola">
  >
  const dadosPerfil: AtualizacaoPerfil = {}
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
    await cliente.from("profiles").update(dadosPerfil).eq("id", usuario.id)
  }

  return json({ ok: true, notas: notasCriadas.length })
}
