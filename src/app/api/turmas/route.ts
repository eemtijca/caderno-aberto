import { NextRequest } from "next/server"
import { sessaoProfessor, json, erroApi, naoAutenticado } from "@/lib/api/sessao"

export const dynamic = "force-dynamic"

/** GET /api/turmas . Lista com contagem de notas (?ano=) */
export async function GET(req: NextRequest) {
  const sessao = await sessaoProfessor()
  if (!sessao) return naoAutenticado()
  const { cliente, usuario } = sessao

  const ano = Number(req.nextUrl.searchParams.get("ano")) || undefined

  let consulta = cliente.from("turmas").select("*").eq("professor_id", usuario.id)
  if (ano) consulta = consulta.eq("ano_letivo", ano)
  consulta = consulta.order("ano_letivo", { ascending: false }).order("nome")

  const [{ data: turmas }, { data: notas }] = await Promise.all([
    consulta,
    cliente.from("notas").select("turmas_ids").eq("professor_id", usuario.id),
  ])

  const contagem = new Map<string, number>()
  for (const n of notas ?? []) {
    for (const tid of n.turmas_ids ?? []) {
      contagem.set(tid, (contagem.get(tid) ?? 0) + 1)
    }
  }

  return json({
    turmas: (turmas ?? []).map((t) => ({
      id: t.id,
      nome: t.nome,
      serie: t.serie,
      anoLetivo: t.ano_letivo,
      totalNotas: contagem.get(t.id) ?? 0,
    })),
  })
}

/** POST /api/turmas . Cria turma */
export async function POST(req: NextRequest) {
  const sessao = await sessaoProfessor()
  if (!sessao) return naoAutenticado()
  const { cliente, usuario } = sessao

  const corpo = await req.json().catch(() => null)
  const nome = typeof corpo?.nome === "string" ? corpo.nome.trim().toUpperCase() : ""
  if (!nome) return erroApi("Informe o nome da turma (ex.: 3A).")

  const serie =
    typeof corpo?.serie === "string" && corpo.serie
      ? corpo.serie
      : nome.startsWith("1")
        ? "1º ano"
        : nome.startsWith("2")
          ? "2º ano"
          : nome.startsWith("3")
            ? "3º ano"
            : "Outro"

  const { data: turma, error } = await cliente
    .from("turmas")
    .insert({
      professor_id: usuario.id,
      nome,
      serie,
      ano_letivo: Number(corpo?.anoLetivo) || new Date().getFullYear(),
    })
    .select("*")
    .single()

  if (error || !turma) {
    if (error?.code === "23505") return erroApi("Essa turma já existe no ano letivo.")
    return erroApi("Falha ao criar a turma.")
  }

  return json({ turma }, 201)
}
