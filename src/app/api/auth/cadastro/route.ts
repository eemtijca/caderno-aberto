// Cadastra um professor e envia o e-mail de verificação.

import { NextRequest } from "next/server"
import { banco } from "@/lib/banco"
import { erroApi, json } from "@/lib/api/sessao"
import { cabeNoLimite, chavePorIp } from "@/lib/api/limite"
import { hashSenha, senhaValida } from "@/lib/auth/senha"
import { gerarTokenEmail } from "@/lib/auth/sessao"
import { normalizarEmail, normalizarNome, origemApp } from "@/lib/auth/validacao"
import { enviarEmail } from "@/lib/email"
import { emailVerificacao } from "@/lib/email/modelos"

export const dynamic = "force-dynamic"

// POST /api/auth/cadastro. Cria usuário e perfil; responde sempre "confirmar".
export async function POST(req: NextRequest) {
  // Limita tentativas de cadastro por IP.
  const limite = await cabeNoLimite(chavePorIp(req, "cadastro"))
  if (!limite.permitido)
    return erroApi("Muitas tentativas. Aguarde um momento e tente novamente.", 429)

  const corpo = await req.json().catch(() => null)
  const nome = normalizarNome(corpo?.nome)
  const email = normalizarEmail(corpo?.email)
  const senha = typeof corpo?.senha === "string" ? corpo.senha : ""
  if (!nome) return erroApi("Informe seu nome.")
  if (!email) return erroApi("E-mail inválido. Confira o endereço digitado.")
  if (!senhaValida(senha)) return erroApi("A senha deve ter pelo menos 8 caracteres.")

  const db = await banco()
  const existente = await db.usuarios.findFirst({ where: { email } })
  // Resposta igual para e-mail novo ou existente (sem enumeração).
  if (existente) return json({ estado: "confirmar" }, 201)

  const senhaHash = await hashSenha(senha)
  const usuario = await db.$transaction(async (tx) => {
    const criado = await tx.usuarios.create({ data: { email, senhaHash } })
    await tx.profiles.create({ data: { id: criado.id, nome, email } })
    return criado
  })

  const { token, hash } = gerarTokenEmail()
  const expira = new Date(Date.now() + 24 * 60 * 60 * 1000)
  // Tokens anteriores do mesmo tipo perdem a validade.
  await db.tokensVerificacao.deleteMany({ where: { usuarioId: usuario.id, tipo: "verificacao" } })
  await db.tokensVerificacao.create({
    data: {
      usuarioId: usuario.id,
      tipo: "verificacao",
      tokenHash: hash,
      expiraEm: expira.toISOString(),
    },
  })

  const url = `${origemApp(req)}/api/auth/verificar?token=${token}`
  // Falha no envio não impede a criação da conta.
  try {
    const modelo = emailVerificacao(nome, url)
    await enviarEmail({
      para: [email],
      assunto: modelo.assunto,
      html: modelo.html,
      chaveIdempotencia: `verificacao/${usuario.id}`,
      etiquetas: [{ nome: "categoria", valor: "verificacao" }],
    })
  } catch (erro) {
    console.error("[cadastro] Falha no e-mail de verificação:", (erro as Error).message)
  }

  return json({ estado: "confirmar" }, 201)
}
