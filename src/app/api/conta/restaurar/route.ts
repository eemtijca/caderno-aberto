import { sessaoProfessor, json, erroApi, naoAutenticado } from "@/lib/api/sessao"
import { clienteAdmin } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

// POST /api/conta/restaurar. Cancela solicitação de exclusão dentro da carência.
export async function POST() {
  const sessao = await sessaoProfessor()
  if (!sessao) return naoAutenticado()
  const { usuario } = sessao
  const admin = clienteAdmin()
  const { data: perfil } = (await admin
    .from("profiles")
    .select("exclusao_solicitada_em,expira_em")
    .eq("id", usuario.id)
    .maybeSingle()) as {
    data: { exclusao_solicitada_em: string | null; expira_em: string | null } | null
  }
  if (!perfil?.exclusao_solicitada_em) return erroApi("Nenhuma solicitação de exclusão pendente.")
  if (perfil.expira_em && new Date(perfil.expira_em) < new Date())
    return erroApi("Prazo de carência expirado. A conta será removida.", 410)
  const { error } = await admin
    .from("profiles")
    .update({ exclusao_solicitada_em: null, expira_em: null } as never)
    .eq("id", usuario.id)
  if (error) return erroApi("Falha ao restaurar: " + error.message)
  await admin
    .from("links")
    .update({ ativo: true } as never)
    .eq("professor_id", usuario.id)
    .eq("ativo", false)
  return json({ ok: true })
}

// POST /api/conta/purge. Executa purga de contas expiradas (chamado por cron).
export async function DELETE() {
  const admin = clienteAdmin()
  const { data, error } = await admin.rpc("purge_exclusoes_expiradas" as never)
  if (error) return erroApi("Falha na purga: " + error.message)
  return json({ removidas: data })
}
