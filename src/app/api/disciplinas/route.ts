import { NextRequest } from "next/server"
import { sessaoProfessor, json, erroApi, naoAutenticado } from "@/lib/api/sessao"

export const dynamic = "force-dynamic"

/** GET /api/disciplinas . Lista com contagem de notas */
export async function GET() {
  const sessao = await sessaoProfessor()
  if (!sessao) return naoAutenticado()
  const { cliente, usuario } = sessao

  const [{ data: disciplinas }, { data: notas }] = await Promise.all([
    cliente.from("disciplinas").select("*").eq("professor_id", usuario.id).order("ordem"),
    cliente.from("notas").select("disciplina_id").eq("professor_id", usuario.id),
  ])

  const contagem = new Map<string, number>()
  for (const n of notas ?? []) {
    if (n.disciplina_id) contagem.set(n.disciplina_id, (contagem.get(n.disciplina_id) ?? 0) + 1)
  }

  return json({
    disciplinas: (disciplinas ?? []).map((d) => ({
      id: d.id,
      nome: d.nome,
      cor: d.cor,
      icone: d.icone,
      ordem: d.ordem,
      totalNotas: contagem.get(d.id) ?? 0,
    })),
  })
}

/** POST /api/disciplinas . Cria disciplina */
export async function POST(req: NextRequest) {
  const sessao = await sessaoProfessor()
  if (!sessao) return naoAutenticado()
  const { cliente, usuario } = sessao

  const corpo = await req.json().catch(() => null)
  const nome = typeof corpo?.nome === "string" ? corpo.nome.trim() : ""
  if (!nome) return erroApi("Informe o nome da disciplina.")

  const { data: disciplina, error } = await cliente
    .from("disciplinas")
    .insert({
      professor_id: usuario.id,
      nome,
      cor: typeof corpo?.cor === "string" ? corpo.cor : "verde",
      icone: typeof corpo?.icone === "string" ? corpo.icone : "BookOpen",
    })
    .select("*")
    .single()

  if (error || !disciplina) {
    if (error?.code === "23505") return erroApi("Já existe uma disciplina com esse nome.")
    return erroApi("Falha ao criar a disciplina.")
  }

  return json({ disciplina }, 201)
}
