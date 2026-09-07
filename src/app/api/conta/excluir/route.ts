import { NextRequest } from "next/server"
import { banco } from "@/lib/banco"
import { sessaoProfessor, json, erroApi, naoAutenticado } from "@/lib/api/sessao"
import { confereSenha } from "@/lib/auth/senha"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const sessao = await sessaoProfessor(req)
  if (!sessao) return naoAutenticado()
  const { usuario } = sessao

  const corpo = await req.json().catch(() => null)
  const senha = typeof corpo?.senha === "string" ? corpo.senha : ""
  const confirmacao = typeof corpo?.confirmacao === "string" ? corpo.confirmacao : ""
  if (!senha) return erroApi("Confirme com a senha para solicitar a exclusão.")
  if (confirmacao !== "EXCLUIR") return erroApi("Digite EXCLUIR para confirmar.")

  const db = await banco()
  const linha = await db.orm.public.Usuarios.where({ id: usuario.id }).first()
  if (!linha || !(await confereSenha(senha, linha.senhaHash))) {
    return erroApi("Senha incorreta.", 403)
  }

  const agora = new Date()
  const expira = new Date(agora.getTime() + 24 * 60 * 60 * 1000)

  await db.transaction(async (tx: any) => {
    await tx.orm.public.Profiles.where({ id: usuario.id }).update({
      exclusaoSolicitadaEm: agora.toISOString(),
      expiraEm: expira.toISOString(),
    })
    const links = await tx.orm.public.Links.where({ professorId: usuario.id }).all()
    for (const link of links) {
      await tx.orm.public.Links.where({ id: link.id }).update({ ativo: false })
    }
  })

  return json({ ok: true, expiraEm: expira.toISOString() })
}
