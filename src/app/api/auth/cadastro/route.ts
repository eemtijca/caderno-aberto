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
  const limite = cabeNoLimite(chavePorIp(req, "cadastro"))
  if (!limite.permitido)
    return erroApi("Muitas tentativas. Aguarde um momento e tente novamente.", 429)

  const corpo = await req.json().catch(() => null)
  const nome = normalizarNome(corpo?.nome)
  const email = normalizarEmail(corpo?.email)
  const senha = typeof corpo?.senha === "string" ? corpo.senha : ""
  if (!nome) return erroApi("Informe seu nome.")
  if (!email) return erroApi("E-mail inválido. Confira o endereço digitado.")
  if (!senhaValida(senha)) return erroApi("A senha deve ter pelo menos 6 caracteres.")

  const db = await banco()
  const existente = await db.orm.public.Usuarios.where({ email }).first()
  if (existente) return erroApi("Já existe uma conta com este e-mail.")

  const senhaHash = await hashSenha(senha)
  const usuario = await db.transaction(async (tx: any) => {
    const criado = await tx.orm.public.Usuarios.create({ email, senhaHash })
    await tx.orm.public.Profiles.create({ id: criado.id, nome, email })
    return criado
  })

  const { token, hash } = gerarTokenEmail()
  const expira = new Date(Date.now() + 24 * 60 * 60 * 1000)
  await db.orm.public.TokensVerificacao.create({
    usuarioId: usuario.id,
    tipo: "verificacao",
    tokenHash: hash,
    expiraEm: expira.toISOString(),
  })

  const url = `${origemApp(req)}/api/auth/verificar?token=${token}`
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
