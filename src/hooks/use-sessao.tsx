"use client"

// Contexto global de autenticação do professor.

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"

export interface UsuarioSessao {
  id: string
  email: string
}

export interface PerfilProfessor {
  nome: string
  escola: string
  email: string
}

interface SessaoValor {
  carregando: boolean
  usuario: UsuarioSessao | null
  perfil: PerfilProfessor | null
  modoRecuperacao: boolean
  entrar: (email: string, senha: string) => Promise<void>
  /** Cadastro sempre resolve "confirmar". */
  cadastrar: (nome: string, email: string, senha: string) => Promise<"entrar" | "confirmar">
  sair: () => Promise<void>
  atualizarPerfil: (dados: { nome?: string; escola?: string }) => Promise<void>
  trocarSenha: (novaSenha: string) => Promise<void>
  trocarEmail: (novoEmail: string) => Promise<void>
  pedirRedefinicao: (email: string) => Promise<void>
  /** Conclusão exige token válido prévio. */
  concluirRedefinicao: (novaSenha: string) => Promise<void>
  reenviarConfirmacao: (email: string) => Promise<void>
  excluirConta: (senha: string, confirmacao?: string) => Promise<void>
  /** Solicitação resolve a expiração da carência. */
  solicitarExclusao: (senha: string, confirmacao: string) => Promise<{ expiraEm: string }>
  restaurarConta: () => Promise<void>
  recarregarPerfil: () => Promise<void>
}

const ContextoSessao = createContext<SessaoValor | null>(null)

// Token de recuperação lido do hash da URL.
function tokenRecuperacaoDoHash(): string | null {
  if (typeof window === "undefined") return null
  const hash = window.location.hash
  if (!hash.startsWith("#/redefinir")) return null
  const query = hash.split("?")[1] ?? ""
  const token = new URLSearchParams(query).get("token") ?? ""
  return /^[0-9a-f]{64}$/.test(token) ? token : null
}

async function lerErro(resposta: Response, padrao: string): Promise<string> {
  try {
    const corpo = (await resposta.json()) as { erro?: string }
    return corpo.erro ?? padrao
  } catch {
    return padrao
  }
}

export function ProvedorSessao({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient()
  const [carregando, setCarregando] = useState(true)
  const [usuario, setUsuario] = useState<UsuarioSessao | null>(null)
  const [perfil, setPerfil] = useState<PerfilProfessor | null>(null)
  const [modoRecuperacao, setModoRecuperacao] = useState(false)
  const [tokenRecuperacao, setTokenRecuperacao] = useState<string | null>(null)
  const usuarioRef = useRef<string | null>(null)

  const aplicarConta = useCallback(
    (conta: { usuario: { id: string; email: string } | null; perfil: PerfilProfessor | null }) => {
      const novo = conta.usuario ? { id: conta.usuario.id, email: conta.usuario.email } : null
      const trocou = (novo?.id ?? null) !== usuarioRef.current
      setUsuario(novo)
      usuarioRef.current = novo?.id ?? null
      setPerfil(conta.perfil)
      if (trocou) qc.clear()
    },
    [qc],
  )

  const carregarConta = useCallback(async () => {
    const ler = async () => {
      const r = await fetch("/api/conta", { cache: "no-store" })
      if (!r.ok) return null
      return (await r.json()) as {
        usuario: { id: string; email: string } | null
        perfil: PerfilProfessor | null
      }
    }
    let conta = await ler().catch(() => null)
    if (!conta?.usuario) {
      await fetch("/api/auth/renovar", { method: "POST" }).catch(() => null)
      conta = await ler().catch(() => null)
    }
    if (conta) aplicarConta(conta)
    else {
      setUsuario(null)
      usuarioRef.current = null
      setPerfil(null)
    }
  }, [aplicarConta])

  const sincronizarRecuperacao = useCallback(async () => {
    const token = tokenRecuperacaoDoHash()
    if (!token) {
      setModoRecuperacao(false)
      setTokenRecuperacao(null)
      return
    }
    try {
      const r = await fetch(`/api/auth/redefinir?token=${token}`, { cache: "no-store" })
      const corpo = (await r.json()) as { valido?: boolean }
      setModoRecuperacao(corpo.valido === true)
      setTokenRecuperacao(corpo.valido === true ? token : null)
    } catch {
      setModoRecuperacao(false)
      setTokenRecuperacao(null)
    }
  }, [])

  useEffect(() => {
    void carregarConta().finally(() => setCarregando(false))
    void sincronizarRecuperacao()
    const aoMudarHash = () => void sincronizarRecuperacao()
    window.addEventListener("hashchange", aoMudarHash)
    return () => window.removeEventListener("hashchange", aoMudarHash)
  }, [carregarConta, sincronizarRecuperacao])

  const valor: SessaoValor = {
    carregando,
    usuario,
    perfil,
    modoRecuperacao,

    async entrar(email, senha) {
      const r = await fetch("/api/auth/entrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      })
      if (!r.ok) throw new Error(await lerErro(r, "E-mail ou senha incorretos."))
      await carregarConta()
    },

    async cadastrar(nome, email, senha) {
      const r = await fetch("/api/auth/cadastro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, senha }),
      })
      if (!r.ok) throw new Error(await lerErro(r, "Falha ao criar a conta."))
      return "confirmar"
    },

    async sair() {
      await fetch("/api/auth/sair", { method: "POST" }).catch(() => null)
      qc.clear()
      setPerfil(null)
      setUsuario(null)
      usuarioRef.current = null
    },

    async atualizarPerfil(dados) {
      const r = await fetch("/api/conta", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      })
      if (!r.ok) throw new Error(await lerErro(r, "Falha ao salvar o perfil."))
      await carregarConta()
    },

    async trocarSenha(novaSenha) {
      const r = await fetch("/api/auth/trocar-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nova: novaSenha }),
      })
      if (!r.ok) throw new Error(await lerErro(r, "Falha ao alterar a senha."))
    },

    async trocarEmail(novoEmail) {
      const r = await fetch("/api/auth/trocar-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ novoEmail }),
      })
      if (!r.ok) throw new Error(await lerErro(r, "Falha ao enviar a confirmação."))
    },

    async pedirRedefinicao(email) {
      const r = await fetch("/api/auth/redefinir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      if (!r.ok) throw new Error(await lerErro(r, "Falha ao pedir a redefinição."))
    },

    async reenviarConfirmacao(email) {
      const r = await fetch("/api/auth/reenviar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      if (!r.ok) throw new Error(await lerErro(r, "Falha ao reenviar."))
    },

    async concluirRedefinicao(novaSenha) {
      if (!tokenRecuperacao) throw new Error("Link inválido ou expirado.")
      const r = await fetch("/api/auth/concluir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenRecuperacao, novaSenha }),
      })
      if (!r.ok) throw new Error(await lerErro(r, "Falha ao redefinir a senha."))
      setModoRecuperacao(false)
      setTokenRecuperacao(null)
      await carregarConta()
    },

    async solicitarExclusao(senha, confirmacao) {
      const r = await fetch("/api/conta/excluir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha, confirmacao }),
      })
      if (!r.ok) throw new Error(await lerErro(r, "Falha ao solicitar exclusão."))
      const d = (await r.json()) as { expiraEm: string }
      return d
    },

    async excluirConta(senha, confirmacao) {
      const r = await fetch("/api/conta/excluir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha, confirmacao }),
      })
      if (!r.ok) throw new Error(await lerErro(r, "Falha ao excluir a conta."))
    },

    async restaurarConta() {
      const r = await fetch("/api/conta/restaurar", { method: "POST" })
      if (!r.ok) throw new Error(await lerErro(r, "Falha ao restaurar a conta."))
      await carregarConta()
    },

    async recarregarPerfil() {
      await carregarConta()
    },
  }

  return <ContextoSessao.Provider value={valor}>{children}</ContextoSessao.Provider>
}

/** Sessão do professor. Lança erro fora do ProvedorSessao. */
export function useSessao(): SessaoValor {
  const ctx = useContext(ContextoSessao)
  if (!ctx) throw new Error("useSessao precisa do ProvedorSessao.")
  return ctx
}
