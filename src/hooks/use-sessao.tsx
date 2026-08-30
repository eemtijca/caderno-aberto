"use client"

// Sessão do professor. Contexto global de autenticação com ciclo completo de conta.

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import type { Session, User } from "@supabase/supabase-js"
import { useQueryClient } from "@tanstack/react-query"
import { supabaseNavegador } from "@/lib/supabase/cliente"

export interface PerfilProfessor {
  nome: string
  escola: string
  email: string
}

interface SessaoValor {
  carregando: boolean
  usuario: User | null
  perfil: PerfilProfessor | null
  modoRecuperacao: boolean
  entrar: (email: string, senha: string) => Promise<void>
  cadastrar: (nome: string, email: string, senha: string) => Promise<"entrar" | "confirmar">
  sair: () => Promise<void>
  atualizarPerfil: (dados: { nome?: string; escola?: string }) => Promise<void>
  trocarSenha: (novaSenha: string) => Promise<void>
  trocarEmail: (novoEmail: string) => Promise<void>
  pedirRedefinicao: (email: string) => Promise<void>
  concluirRedefinicao: (novaSenha: string) => Promise<void>
  reenviarConfirmacao: (email: string) => Promise<void>
  excluirConta: (senha: string, confirmacao?: string) => Promise<void>
  solicitarExclusao: (senha: string, confirmacao: string) => Promise<{ expiraEm: string }>
  restaurarConta: () => Promise<void>
  recarregarPerfil: () => Promise<void>
}

const ContextoSessao = createContext<SessaoValor | null>(null)

function traduzirErro(mensagem: string): string {
  const m = mensagem.toLowerCase()
  if (m.includes("invalid login credentials")) return "E-mail ou senha incorretos."
  if (m.includes("user already registered") || m.includes("already been registered"))
    return "Já existe uma conta com este e-mail."
  if (m.includes("password should be at least")) return "A senha deve ter pelo menos 6 caracteres."
  if (m.includes("email not confirmed"))
    return "Confirme o e-mail antes de entrar. Verifique a caixa de entrada."
  if (m.includes("rate limit")) return "Muitas tentativas. Aguarde um momento e tente novamente."
  if (m.includes("new email address is the same")) return "O novo e-mail é igual ao atual."
  if (m.includes("same password")) return "A nova senha é igual à atual."
  if (m.includes("email address is invalid")) return "E-mail inválido."
  return mensagem
}

export function ProvedorSessao({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient()
  const [carregando, setCarregando] = useState(true)
  const [usuario, setUsuario] = useState<User | null>(null)
  const [perfil, setPerfil] = useState<PerfilProfessor | null>(null)
  const [modoRecuperacao, setModoRecuperacao] = useState(false)
  const usuarioRef = useRef<string | null>(null)

  const carregarPerfil = useCallback(async () => {
    try {
      const r = await fetch("/api/conta", { cache: "no-store" })
      if (!r.ok) {
        setPerfil(null)
        return
      }
      const c = (await r.json()) as {
        usuario: { id: string } | null
        perfil:
          | (PerfilProfessor & { exclusaoSolicitadaEm?: string | null; expiraEm?: string | null })
          | null
      }
      setPerfil(c.perfil ?? null)
    } catch {
      setPerfil(null)
    }
  }, [])

  useEffect(() => {
    const supabase = supabaseNavegador()
    const { data: sub } = supabase.auth.onAuthStateChange((evento, sessao) => {
      const novoUsuario = sessao?.user ?? null
      const trocou = (novoUsuario?.id ?? null) !== usuarioRef.current

      if (evento === "PASSWORD_RECOVERY") {
        setModoRecuperacao(true)
        setUsuario(novoUsuario)
        usuarioRef.current = novoUsuario?.id ?? null
        setCarregando(false)
        return
      }

      setUsuario(novoUsuario)
      usuarioRef.current = novoUsuario?.id ?? null
      setCarregando(false)

      if (trocou) {
        qc.clear()
        if (novoUsuario) void carregarPerfil()
        else setPerfil(null)
      } else if (
        novoUsuario &&
        (evento === "USER_UPDATED" || evento === "SIGNED_IN" || evento === "INITIAL_SESSION")
      ) {
        void carregarPerfil()
      }
    })

    supabase.auth
      .getSession()
      .then(({ data }: { data: { session: Session | null } }) => {
        setUsuario(data.session?.user ?? null)
        usuarioRef.current = data.session?.user?.id ?? null
      })
      .finally(() => setCarregando(false))

    return () => sub.subscription.unsubscribe()
  }, [qc, carregarPerfil])

  const valor: SessaoValor = {
    carregando,
    usuario,
    perfil,
    modoRecuperacao,

    async entrar(email, senha) {
      const supabase = supabaseNavegador()
      const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
      if (error) throw new Error(traduzirErro(error.message))
    },

    async cadastrar(nome, email, senha) {
      const supabase = supabaseNavegador()
      const { error } = await supabase.auth.signUp({
        email,
        password: senha,
        options: { data: { nome } },
      })
      if (error) throw new Error(traduzirErro(error.message))
      return "confirmar"
    },

    async sair() {
      const supabase = supabaseNavegador()
      await supabase.auth.signOut()
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
      if (!r.ok) {
        const c = await r.json().catch(() => ({}))
        throw new Error(c.erro ?? "Falha ao salvar o perfil.")
      }
      await carregarPerfil()
    },

    async trocarSenha(novaSenha) {
      const supabase = supabaseNavegador()
      const { error } = await supabase.auth.updateUser({ password: novaSenha })
      if (error) throw new Error(traduzirErro(error.message))
    },

    async trocarEmail(novoEmail) {
      const supabase = supabaseNavegador()
      const { error } = await supabase.auth.updateUser({ email: novoEmail })
      if (error) throw new Error(traduzirErro(error.message))
    },

    async pedirRedefinicao(email) {
      const supabase = supabaseNavegador()
      const origem = typeof window !== "undefined" ? window.location.origin : undefined
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: origem ? `${origem}/` : undefined,
      })
      if (error) throw new Error(traduzirErro(error.message))
    },

    async reenviarConfirmacao(email) {
      const supabase = supabaseNavegador()
      const { error } = await supabase.auth.resend({ type: "signup", email })
      if (error) throw new Error(traduzirErro(error.message))
    },

    async concluirRedefinicao(novaSenha) {
      const supabase = supabaseNavegador()
      const { error } = await supabase.auth.updateUser({ password: novaSenha })
      if (error) throw new Error(traduzirErro(error.message))
      setModoRecuperacao(false)
    },

    async solicitarExclusao(senha, confirmacao) {
      const r = await fetch("/api/conta/excluir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha, confirmacao }),
      })
      if (!r.ok) {
        const c = await r.json().catch(() => ({}))
        throw new Error(c.erro ?? "Falha ao solicitar exclusão.")
      }
      const d = (await r.json()) as { expiraEm: string }
      return d
    },

    async excluirConta(senha, confirmacao) {
      const r = await fetch("/api/conta/excluir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha, confirmacao }),
      })
      if (!r.ok) {
        const c = await r.json().catch(() => ({}))
        throw new Error(c.erro ?? "Falha ao excluir a conta.")
      }
    },

    async restaurarConta() {
      const r = await fetch("/api/conta/restaurar", { method: "POST" })
      if (!r.ok) {
        const c = await r.json().catch(() => ({}))
        throw new Error(c.erro ?? "Falha ao restaurar a conta.")
      }
      await carregarPerfil()
    },

    async recarregarPerfil() {
      await carregarPerfil()
    },
  }

  return <ContextoSessao.Provider value={valor}>{children}</ContextoSessao.Provider>
}

export function useSessao(): SessaoValor {
  const ctx = useContext(ContextoSessao)
  if (!ctx) throw new Error("useSessao precisa do ProvedorSessao.")
  return ctx
}
