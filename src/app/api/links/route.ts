import { NextRequest } from "next/server"
import { sessaoProfessor, json, erroApi, naoAutenticado } from "@/lib/api/sessao"
import { gerarToken } from "@/lib/api/token"

export const dynamic = "force-dynamic"

/** GET /api/links . Links do professor com rótulo do alvo */
export async function GET() {
  const sessao = await sessaoProfessor()
  if (!sessao) return naoAutenticado()
  const { cliente, usuario } = sessao

  const [{ data: links }, { data: notas }, { data: turmas }, { data: disciplinas }] =
    await Promise.all([
      cliente
        .from("links")
        .select("*")
        .eq("professor_id", usuario.id)
        .order("criado_em", { ascending: false }),
      cliente.from("notas").select("id, titulo, status").eq("professor_id", usuario.id),
      cliente.from("turmas").select("id, nome, serie, ano_letivo").eq("professor_id", usuario.id),
      cliente.from("disciplinas").select("id, nome, cor").eq("professor_id", usuario.id),
    ])

  const notaPorId = new Map((notas ?? []).map((n) => [n.id, n]))
  const turmaPorId = new Map((turmas ?? []).map((t) => [t.id, t]))
  const disciplinaPorId = new Map((disciplinas ?? []).map((d) => [d.id, d]))

  const lista = (links ?? []).map((l) => {
    let alvo = ""
    let alvoDetalhe = ""
    if (l.tipo === "nota" && l.nota_id) {
      const n = notaPorId.get(l.nota_id)
      alvo = n?.titulo ?? "(nota excluída)"
      alvoDetalhe = n?.status === "publicada" ? "publicada" : "rascunho"
    } else if (l.tipo === "turma" && l.turma_id) {
      const t = turmaPorId.get(l.turma_id)
      alvo = t ? `Turma ${t.nome}` : "(turma excluída)"
      alvoDetalhe = t ? `${t.serie} · ${t.ano_letivo}` : ""
    } else if (l.tipo === "disciplina" && l.disciplina_id) {
      const d = disciplinaPorId.get(l.disciplina_id)
      alvo = d?.nome ?? "(disciplina excluída)"
      alvoDetalhe = d ? String(disciplinaPorId.size) : ""
    }
    return {
      id: l.id,
      tipo: l.tipo,
      token: l.token,
      nome: l.nome,
      alvo,
      alvoDetalhe,
      notaId: l.nota_id,
      turmaId: l.turma_id,
      disciplinaId: l.disciplina_id,
      ativo: l.ativo,
      expiraEm: l.expira_em,
      acessos: l.acessos,
      criadoEm: l.criado_em,
    }
  })

  return json({ links: lista })
}

/** POST /api/links . Cria link p/ nota, turma ou disciplina */
export async function POST(req: NextRequest) {
  const sessao = await sessaoProfessor()
  if (!sessao) return naoAutenticado()
  const { cliente, usuario, perfil } = sessao

  const corpo = await req.json().catch(() => null)
  const tipoBruto: string = corpo?.tipo ?? ""
  if (tipoBruto !== "nota" && tipoBruto !== "turma" && tipoBruto !== "disciplina") {
    return erroApi("Tipo de link inválido.")
  }
  const tipo = tipoBruto

  // valida a posse do alvo (a RLS reforça no INSERT)
  const alvoId: string = corpo?.[`${tipo}Id`] ?? corpo?.alvoId ?? ""
  if (!alvoId) return erroApi("Selecione o destino do link.")

  const tabela = tipo === "nota" ? "notas" : tipo === "turma" ? "turmas" : "disciplinas"
  const { data: alvo } = await cliente
    .from(tabela)
    .select("id")
    .eq("id", alvoId)
    .eq("professor_id", usuario.id)
    .maybeSingle()
  if (!alvo) return erroApi("Destino não encontrado.", 404)

  const dados: Partial<import("@/lib/supabase/tipos").LinkLinha> & {
    professor_id: string
    tipo: "nota" | "turma" | "disciplina"
    token: string
  } = {
    professor_id: usuario.id,
    tipo,
    token: gerarToken(),
    professor_nome: perfil?.nome ?? "",
    nome: typeof corpo?.nome === "string" ? corpo.nome.trim().slice(0, 120) : "",
    ...(tipo === "nota" ? { nota_id: alvoId } : {}),
    ...(tipo === "turma" ? { turma_id: alvoId } : {}),
    ...(tipo === "disciplina" ? { disciplina_id: alvoId } : {}),
  }

  const { data: link, error } = await cliente.from("links").insert(dados).select("*").single()

  if (error || !link) return erroApi("Falha ao criar o link.")
  return json({ link }, 201)
}
