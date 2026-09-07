import { NextRequest } from "next/server"
import { banco } from "@/lib/banco"
import { erroApi, json, naoAutenticado, sessaoProfessor } from "@/lib/api/sessao"
import { confereSenha, hashSenha, senhaValida } from "@/lib/auth/senha"
import { COOKIE_REFRESH } from "@/lib/auth/sessao"
import { createHash } from "crypto"

export const dynamic = "force-dynamic"

// POST /api/auth/trocar-senha {nova}. Troca a senha da sessão atual.
export async function POST(req: NextRequest) {
  const sessao = await sessaoProfessor(req)
  if (!sessao) return naoAutenticado()

  const corpo = await req.json().catch(() => null)
  const nova = typeof corpo?.nova === "string" ? corpo.nova : ""
  if (!nova) return erroApi("Informe a nova senha.")
  if (!senhaValida(nova)) return erroApi("A senha deve ter pelo menos 6 caracteres.")

  const db = await banco()
  const usuario = await db.orm.public.Usuarios.where({ id: sessao.usuario.id }).first()
  if (!usuario) return naoAutenticado()
  if (await confereSenha(nova, usuario.senhaHash)) {
    return erroApi("A nova senha é igual à atual.")
  }

  const refreshAtual = req.cookies.get(COOKIE_REFRESH)?.value
  const hashAtual = refreshAtual ? createHash("sha256").update(refreshAtual).digest("hex") : ""
  const sessoes = await db.orm.public.Sessoes.where({ usuarioId: usuario.id }).all()
  for (const s of sessoes) {
    if (s.tokenHash !== hashAtual) {
      try {
        await db.orm.public.Sessoes.where({ id: s.id }).deleteAll()
      } catch {
        // Sessões órfãs não bloqueiam a troca.
      }
    }
  }
  await db.orm.public.Usuarios.where({ id: usuario.id }).update({
    senhaHash: await hashSenha(nova),
  })

  return json({ ok: true })
}
