import { NextRequest } from "next/server"
import { sessaoProfessor, json, erroApi, naoAutenticado } from "@/lib/api/sessao"
import { clienteAdmin } from "@/lib/supabase/admin"
import { SUPABASE_URL, SUPABASE_CHAVE_ANON } from "@/lib/supabase/ambiente"

export const dynamic = "force-dynamic"

/**
 * POST /api/conta/excluir. Solicita exclusão com carência de 24 horas.
 * Exige senha atual e confirmação com texto EXCLUIR.
 */
export async function POST(req: NextRequest) {
  const sessao = await sessaoProfessor()
  if (!sessao) return naoAutenticado()
  const { usuario } = sessao

  const corpo = await req.json().catch(() => null)
  const senha = typeof corpo?.senha === "string" ? corpo.senha : ""
  const confirmacao = typeof corpo?.confirmacao === "string" ? corpo.confirmacao : ""
  if (!senha) return erroApi("Confirme com a senha para solicitar a exclusão.")
  if (confirmacao !== "EXCLUIR") return erroApi("Digite EXCLUIR para confirmar.")

  const resposta = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_CHAVE_ANON,
      Authorization: `Bearer ${SUPABASE_CHAVE_ANON}`,
    },
    body: JSON.stringify({ email: usuario.email, password: senha }),
  })
  if (!resposta.ok) return erroApi("Senha incorreta.", 403)

  const admin = clienteAdmin()
  const agora = new Date()
  const expira = new Date(agora.getTime() + 24 * 60 * 60 * 1000)

  const { error } = await admin
    .from("profiles")
    .update({
      exclusao_solicitada_em: agora.toISOString(),
      expira_em: expira.toISOString(),
    } as never)
    .eq("id", usuario.id)

  if (error) return erroApi("Falha ao solicitar exclusão: " + error.message)

  await admin
    .from("links")
    .update({ ativo: false } as never)
    .eq("professor_id", usuario.id)

  return json({ ok: true, expiraEm: expira.toISOString() })
}
