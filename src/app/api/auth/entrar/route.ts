// Autentica o professor e abre a sessão via cookies.

import { NextRequest } from "next/server"
import { banco } from "@/lib/banco"
import { erroApi, json } from "@/lib/api/sessao"
import { cabeNoLimite, chavePorIp } from "@/lib/api/limite"
import { confereSenha, hashDesatualizado, hashSenha } from "@/lib/auth/senha"
import { iniciarSessao } from "@/lib/auth/sessao"
import { normalizarEmail } from "@/lib/auth/validacao"

export const dynamic = "force-dynamic"

// Hash fictício para equiparar o tempo quando o e-mail não existe.
const HASH_FALSO =
  "scrypt$16384$8$1$00000000000000000000000000000000$00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"

// POST /api/auth/entrar. Confere credenciais e abre a sessão (cookies).
// Respostas genéricas para não revelar contas existentes.
export async function POST(req: NextRequest) {
  // Limita tentativas de login por IP.
  const limite = await cabeNoLimite(chavePorIp(req, "entrar"))
  if (!limite.permitido)
    return erroApi("Muitas tentativas. Aguarde um momento e tente novamente.", 429)

  const corpo = await req.json().catch(() => null)
  const email = normalizarEmail(corpo?.email)
  const senha = typeof corpo?.senha === "string" ? corpo.senha : ""
  if (!email || !senha) return erroApi("E-mail ou senha incorretos.", 401)

  const db = banco()
  const usuario = await db.usuarios.findFirst({ where: { email } })
  const confere = await confereSenha(senha, usuario?.senhaHash ?? HASH_FALSO)
  if (!usuario || !confere) {
    return erroApi("E-mail ou senha incorretos.", 401)
  }
  // Conta sem e-mail verificado recebe o mesmo erro genérico.
  if (!usuario.emailVerificadoEm) {
    return erroApi("E-mail ou senha incorretos.", 401)
  }

  const perfil = await db.profiles.findFirst({ where: { id: usuario.id } })
  // Conta em carência de exclusão também é recusada.
  if (perfil?.expiraEm && perfil.expiraEm < new Date()) {
    return erroApi("E-mail ou senha incorretos.", 401)
  }

  // Sobe o hash para os parâmetros atuais sem interromper o login.
  if (hashDesatualizado(usuario.senhaHash)) {
    const novoHash = await hashSenha(senha)
    await db.usuarios
      .update({ where: { id: usuario.id }, data: { senhaHash: novoHash } })
      .catch(() => undefined)
  }

  await iniciarSessao(usuario.id, req)
  return json({ ok: true })
}
