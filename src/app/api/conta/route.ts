import { NextRequest } from "next/server"
import { banco } from "@/lib/banco"
import { sessaoProfessor, json, erroApi, naoAutenticado } from "@/lib/api/sessao"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const sessao = await sessaoProfessor(req)
  if (!sessao) {
    return json({ usuario: null, perfil: null })
  }
  const { usuario, perfil } = sessao
  return json({
    usuario: {
      id: usuario.id,
      email: usuario.email,
      emailConfirmado: Boolean(usuario.emailVerificadoEm),
      criadoEm: usuario.criadoEm,
    },
    perfil: perfil
      ? {
          nome: perfil.nome,
          escola: perfil.escola,
          email: perfil.email,
          exclusaoSolicitadaEm: perfil.exclusaoSolicitadaEm ?? null,
          expiraEm: perfil.expiraEm ?? null,
        }
      : null,
  })
}

export async function PATCH(req: NextRequest) {
  const sessao = await sessaoProfessor(req)
  if (!sessao) return naoAutenticado()
  const { usuario } = sessao

  const corpo = await req.json().catch(() => null)
  if (!corpo) return erroApi("Corpo inválido.")

  const dados: { nome?: string; escola?: string } = {}
  if (typeof corpo.nome === "string") dados.nome = corpo.nome.trim().slice(0, 120)
  if (typeof corpo.escola === "string") dados.escola = corpo.escola.trim().slice(0, 160)

  if (Object.keys(dados).length === 0) return erroApi("Nada para atualizar.")

  const db = await banco()
  const perfil = await db.orm.public.Profiles.where({ id: usuario.id }).update(dados)
  if (!perfil) return erroApi("Falha ao salvar o perfil.")
  return json({ perfil: { nome: perfil.nome, escola: perfil.escola, email: perfil.email } })
}
