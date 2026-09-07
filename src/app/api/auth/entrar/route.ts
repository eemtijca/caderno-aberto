import { NextRequest } from "next/server"
import { banco } from "@/lib/banco"
import { erroApi, json } from "@/lib/api/sessao"
import { cabeNoLimite, chavePorIp } from "@/lib/api/limite"
import { confereSenha } from "@/lib/auth/senha"
import { iniciarSessao } from "@/lib/auth/sessao"
import { normalizarEmail } from "@/lib/auth/validacao"

export const dynamic = "force-dynamic"

// POST /api/auth/entrar. Confere credenciais e abre a sessão (cookies).
export async function POST(req: NextRequest) {
  const limite = cabeNoLimite(chavePorIp(req, "entrar"))
  if (!limite.permitido)
    return erroApi("Muitas tentativas. Aguarde um momento e tente novamente.", 429)

  const corpo = await req.json().catch(() => null)
  const email = normalizarEmail(corpo?.email)
  const senha = typeof corpo?.senha === "string" ? corpo.senha : ""
  if (!email || !senha) return erroApi("E-mail ou senha incorretos.", 401)

  const db = await banco()
  const usuario = await db.orm.public.Usuarios.where({ email }).first()
  if (!usuario || !(await confereSenha(senha, usuario.senhaHash))) {
    return erroApi("E-mail ou senha incorretos.", 401)
  }
  if (!usuario.emailVerificadoEm) {
    return erroApi("Confirme o e-mail antes de entrar. Verifique a caixa de entrada.", 403)
  }

  const perfil = await db.orm.public.Profiles.where({ id: usuario.id }).first()
  if (perfil?.expiraEm && new Date(perfil.expiraEm) < new Date()) {
    return erroApi("Esta conta foi removida.", 410)
  }

  await iniciarSessao(usuario.id, req)
  return json({ ok: true })
}
