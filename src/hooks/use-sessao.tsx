"use client";

// Contexto global de autenticação do usuário.

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { EVENTO_SESSAO_EXPIRADA } from "@/lib/notas/api-client";
import { mapearErro } from "@/lib/api/erro";

export type Papel = "admin" | "professor";

export interface UsuarioSessao {
  id: string;
  email: string;
  papel: Papel;
}

export interface PerfilProfessor {
  nome: string;
  escola: string;
  email: string;
  /** Início da carência de exclusão, quando solicitada. */
  exclusaoSolicitadaEm?: string | null;
  /** Fim da carência, base para a purga. */
  expiraEm?: string | null;
}

interface SessaoValor {
  carregando: boolean;
  usuario: UsuarioSessao | null;
  perfil: PerfilProfessor | null;
  ehAdmin: boolean;
  entrar: (email: string, senha: string, manterConectado?: boolean) => Promise<void>;
  sair: () => Promise<void>;
  atualizarPerfil: (dados: { nome?: string; escola?: string }) => Promise<void>;
  trocarSenha: (senhaAtual: string, novaSenha: string, manterConectado?: boolean) => Promise<void>;
  solicitarAcesso: (nome: string, email: string) => Promise<void>;
  solicitarCodigo: (email: string) => Promise<void>;
  usarCodigo: (
    email: string,
    codigo: string,
    novaSenha: string,
    manterConectado?: boolean,
  ) => Promise<void>;
  /** Solicitação resolve a expiração da carência. */
  solicitarExclusao: (senha: string, confirmacao: string) => Promise<{ expiraEm: string }>;
  restaurarConta: () => Promise<void>;
  recarregarPerfil: () => Promise<void>;
  /** True quando a sessão expirou em uma chamada de API. */
  sessaoExpirada: boolean;
  limparAvisoSessao: () => void;
}

const ContextoSessao = createContext<SessaoValor | null>(null);

async function lerErro(resposta: Response, padrao: string): Promise<string> {
  try {
    const corpo = (await resposta.json()) as { erro?: string };
    return corpo.erro ?? padrao;
  } catch {
    return padrao;
  }
}

/** Fetch com mensagem amigável quando o servidor está inacessível. */
async function pedir(url: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch {
    throw new Error("Não foi possível falar com o servidor. Verifique sua conexão.");
  }
}

/** Erro da resposta, distinguindo indisponibilidade de entrada inválida. */
async function erroDe(resposta: Response, padrao: string): Promise<Error> {
  if (resposta.status >= 500) {
    return new Error("Serviço indisponível no momento. Tente novamente em instantes.");
  }
  return new Error(await lerErro(resposta, padrao));
}

export function ProvedorSessao({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();
  const [carregando, setCarregando] = useState(true);
  const [usuario, setUsuario] = useState<UsuarioSessao | null>(null);
  const [perfil, setPerfil] = useState<PerfilProfessor | null>(null);
  const [sessaoExpirada, setSessaoExpirada] = useState(false);
  const usuarioRef = useRef<string | null>(null);

  const aplicarConta = useCallback(
    (conta: {
      usuario: { id: string; email: string; papel?: Papel } | null;
      perfil: PerfilProfessor | null;
    }) => {
      const novo = conta.usuario
        ? {
            id: conta.usuario.id,
            email: conta.usuario.email,
            papel: conta.usuario.papel === "admin" ? ("admin" as const) : ("professor" as const),
          }
        : null;
      const trocou = (novo?.id ?? null) !== usuarioRef.current;
      setUsuario(novo);
      usuarioRef.current = novo?.id ?? null;
      setPerfil(conta.perfil);
      // Troca de conta descarta o cache de consultas do usuário anterior.
      if (trocou) qc.clear();
    },
    [qc],
  );

  const carregarConta = useCallback(async () => {
    const ler = async () => {
      const r = await pedir("/api/conta", { cache: "no-store" });
      if (!r.ok) return null;
      return (await r.json()) as {
        usuario: { id: string; email: string; papel?: Papel } | null;
        perfil: PerfilProfessor | null;
      };
    };
    let conta = await ler().catch(() => null);
    // Sem sessão válida, tenta renovar o token uma vez antes de desistir.
    if (!conta?.usuario) {
      await pedir("/api/auth/renovar", { method: "POST" }).catch(() => null);
      conta = await ler().catch(() => null);
    }
    if (conta) aplicarConta(conta);
    else {
      setUsuario(null);
      usuarioRef.current = null;
      setPerfil(null);
    }
  }, [aplicarConta]);

  useEffect(() => {
    void carregarConta().finally(() => setCarregando(false));
  }, [carregarConta]);

  // Uma resposta 401 em qualquer chamada limpa a sessão e volta ao login.
  useEffect(() => {
    const aoExpirar = () => {
      qc.clear();
      setUsuario(null);
      setPerfil(null);
      usuarioRef.current = null;
      setSessaoExpirada(true);
      if (typeof window !== "undefined" && !window.location.hash.startsWith("#/entrar")) {
        window.location.hash = "#/entrar";
      }
    };
    window.addEventListener(EVENTO_SESSAO_EXPIRADA, aoExpirar);
    return () => window.removeEventListener(EVENTO_SESSAO_EXPIRADA, aoExpirar);
  }, [qc]);

  const valor: SessaoValor = {
    carregando,
    usuario,
    perfil,
    ehAdmin: usuario?.papel === "admin",

    async entrar(email, senha, manterConectado = true) {
      const r = await pedir("/api/auth/entrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha, manterConectado }),
      });
      if (!r.ok) {
        if (r.status >= 500) throw await erroDe(r, "E-mail ou senha incorretos.");
        const corpo = await r.json().catch(() => null);
        throw mapearErro(r.status, corpo, "E-mail ou senha incorretos.");
      }
      setSessaoExpirada(false);
      await carregarConta();
    },

    async sair() {
      await pedir("/api/auth/sair", { method: "POST" }).catch(() => null);
      qc.clear();
      setPerfil(null);
      setUsuario(null);
      usuarioRef.current = null;
    },

    async atualizarPerfil(dados) {
      const r = await pedir("/api/conta", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      });
      if (!r.ok) throw await erroDe(r, "Falha ao salvar o perfil.");
      await carregarConta();
    },

    async trocarSenha(senhaAtual, novaSenha, manterConectado = true) {
      const r = await pedir("/api/auth/trocar-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ atual: senhaAtual, nova: novaSenha, manterConectado }),
      });
      if (!r.ok) throw await erroDe(r, "Falha ao alterar a senha.");
    },

    async solicitarAcesso(nome, email) {
      const r = await pedir("/api/auth/solicitar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, tipo: "primeiro_acesso" }),
      });
      if (!r.ok) throw await erroDe(r, "Falha ao enviar a solicitação.");
    },

    async solicitarCodigo(email) {
      const r = await pedir("/api/auth/solicitar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, tipo: "recuperacao" }),
      });
      if (!r.ok) throw await erroDe(r, "Falha ao solicitar o código.");
    },

    async usarCodigo(email, codigo, novaSenha, manterConectado = true) {
      const r = await pedir("/api/auth/usar-codigo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, codigo, novaSenha, manterConectado }),
      });
      if (!r.ok) throw await erroDe(r, "Código inválido ou expirado.");
      await carregarConta();
    },

    async solicitarExclusao(senha, confirmacao) {
      const r = await pedir("/api/conta/excluir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha, confirmacao }),
      });
      if (!r.ok) throw await erroDe(r, "Falha ao solicitar exclusão.");
      const d = (await r.json()) as { expiraEm: string };
      return d;
    },

    async restaurarConta() {
      const r = await pedir("/api/conta/restaurar", { method: "POST" });
      if (!r.ok) throw await erroDe(r, "Falha ao restaurar a conta.");
      await carregarConta();
    },

    async recarregarPerfil() {
      await carregarConta();
    },

    sessaoExpirada,
    limparAvisoSessao: () => setSessaoExpirada(false),
  };

  return <ContextoSessao.Provider value={valor}>{children}</ContextoSessao.Provider>;
}

/** Sessão do usuário. Lança erro fora do ProvedorSessao. */
export function useSessao(): SessaoValor {
  const ctx = useContext(ContextoSessao);
  if (!ctx) throw new Error("useSessao precisa do ProvedorSessao.");
  return ctx;
}
