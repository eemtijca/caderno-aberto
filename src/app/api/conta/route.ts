import { NextRequest } from "next/server"
import { sessaoProfessor, json, erroApi, naoAutenticado } from "@/lib/api/sessao"

export const dynamic = "force-dynamic"

/** GET /api/conta . Sessão + perfil do professor logado */
export async function GET() {
  const sessao = await sessaoProfessor()
  if (!sessao) {
    return json({ usuario: null, perfil: null })
  }
  const { usuario, perfil } = sessao
  return json({
    usuario: {
      id: usuario.id,
      email: usuario.email ?? "",
      emailConfirmado: Boolean(usuario.email_confirmed_at),
      criadoEm: usuario.created_at ?? "",
    },
    perfil: perfil
      ? {
          nome: perfil.nome,
          escola: perfil.escola,
          email: perfil.email,
          exclusaoSolicitadaEm:
            (perfil as unknown as { exclusao_solicitada_em?: string }).exclusao_solicitada_em ??
            null,
          expiraEm: (perfil as unknown as { expira_em?: string }).expira_em ?? null,
        }
      : null,
  })
}

/** PATCH /api/conta . Atualiza nome/escola do perfil */
export async function PATCH(req: NextRequest) {
  const sessao = await sessaoProfessor()
  if (!sessao) return naoAutenticado()
  const { cliente, usuario } = sessao

  const corpo = await req.json().catch(() => null)
  if (!corpo) return erroApi("Corpo inválido.")

  const dados: Partial<Pick<import("@/lib/supabase/tipos").PerfilLinha, "nome" | "escola">> = {}
  if (typeof corpo.nome === "string") dados.nome = corpo.nome.trim().slice(0, 120)
  if (typeof corpo.escola === "string") dados.escola = corpo.escola.trim().slice(0, 160)

  if (Object.keys(dados).length === 0) return erroApi("Nada para atualizar.")

  const { data: perfil, error } = await cliente
    .from("profiles")
    .update(dados)
    .eq("id", usuario.id)
    .select("nome, escola, email")
    .maybeSingle()

  if (error || !perfil) return erroApi("Falha ao salvar o perfil.")
  return json({ perfil })
}
