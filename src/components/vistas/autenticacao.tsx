"use client";

// Porta de entrada sem sessão: login, uso de código de acesso e pedido de código.

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  NotebookPen,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { useSessao } from "@/hooks/use-sessao";
import type { Rota } from "@/lib/rota";

type Modo = "entrar" | "codigo" | "solicitar";
type TipoSolicitacao = "primeiro_acesso" | "recuperacao";

export function VistaAutenticação({
  rota,
  navegar,
}: {
  rota: Rota;
  navegar: (para: string) => void;
}) {
  if (rota.vista === "codigo") return <PainelAuth modo="codigo" navegar={navegar} />;
  if (rota.vista === "solicitar") return <PainelAuth modo="solicitar" navegar={navegar} />;
  return <PainelAuth modo="entrar" navegar={navegar} />;
}

// Força relativa da senha a partir de comprimento e mistura de letras e números.
function forcaSenha(senha: string): { nivel: 0 | 1 | 2 | 3; rotulo: string; cor: string } {
  let pontos = 0;
  if (senha.length >= 6) pontos++;
  if (senha.length >= 10) pontos++;
  if (/[a-zA-Z]/.test(senha) && /\d/.test(senha)) pontos++;
  if (senha.length === 0) return { nivel: 0, rotulo: "", cor: "" };
  const niveis = [
    { nivel: 1 as const, rotulo: "fraca", cor: "bg-rose-400" },
    { nivel: 2 as const, rotulo: "média", cor: "bg-amber-400" },
    { nivel: 3 as const, rotulo: "boa", cor: "bg-emerald-500" },
  ];
  return niveis[Math.max(0, pontos - 1)] ?? niveis[0];
}

function tipoDoHash(): TipoSolicitacao {
  if (typeof window === "undefined") return "primeiro_acesso";
  return window.location.hash.includes("recuperacao=1") ? "recuperacao" : "primeiro_acesso";
}

function PainelAuth({ modo, navegar }: { modo: Modo; navegar: (para: string) => void }) {
  const sessao = useSessao();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [senha2, setSenha2] = useState("");
  const [nome, setNome] = useState("");
  const [codigo, setCodigo] = useState("");
  const [tipo, setTipo] = useState<TipoSolicitacao>(() => tipoDoHash());
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  useEffect(() => {
    setErro("");
    setSucesso("");
    if (modo === "solicitar") setTipo(tipoDoHash());
  }, [modo]);

  const submeter = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setSucesso("");
    setEnviando(true);
    try {
      if (modo === "entrar") {
        await sessao.entrar(email.trim(), senha);
        navegar("/");
      } else if (modo === "codigo") {
        if (senha.length < 8) throw new Error("A senha deve ter pelo menos 8 caracteres.");
        if (senha !== senha2) throw new Error("As senhas não conferem.");
        await sessao.usarCodigo(email.trim(), codigo.trim(), senha);
        setSucesso("Senha definida. O acesso foi restabelecido.");
        setTimeout(() => navegar("/"), 1200);
      } else if (tipo === "primeiro_acesso") {
        if (nome.trim().length < 2) throw new Error("Informe seu nome completo.");
        await sessao.solicitarAcesso(nome.trim(), email.trim());
        setSucesso("Solicitação enviada. Procure a administração para receber o código.");
      } else {
        await sessao.solicitarCodigo(email.trim());
        setSucesso("Se existir conta com este e-mail, a administração será avisada.");
      }
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro inesperado. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  };

  const titulo =
    modo === "entrar"
      ? "Entrar"
      : modo === "codigo"
        ? "Tenho um código"
        : tipo === "primeiro_acesso"
          ? "Solicitar acesso"
          : "Esqueci minha senha";

  const descricao =
    modo === "entrar"
      ? "Acesse suas notas, turmas e links de compartilhamento."
      : modo === "codigo"
        ? "Informe o e-mail, o código de 8 caracteres e a nova senha."
        : tipo === "primeiro_acesso"
          ? "Envie seu nome e e-mail. A administração entregará o código de acesso."
          : "Informe seu e-mail. Se houver conta, a administração gerará um código.";

  const botao =
    modo === "entrar" ? "Entrar" : modo === "codigo" ? "Definir senha" : "Enviar solicitação";

  const desabilitado =
    enviando ||
    (modo === "entrar" && (!email.trim() || !senha)) ||
    (modo === "codigo" && (!email.trim() || codigo.length !== 8 || senha.length < 8)) ||
    (modo === "solicitar" && !!sucesso) ||
    (modo === "solicitar" && tipo === "primeiro_acesso" && (!nome.trim() || !email.trim())) ||
    (modo === "solicitar" && tipo === "recuperacao" && !email.trim());

  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-4 py-10">
      <div className="na-entra w-full max-w-sm">
        <button
          type="button"
          onClick={() => navegar("/")}
          className="mx-auto flex items-center gap-2.5"
          aria-label="Página inicial"
        >
          <span className="bg-primary text-primary-foreground flex h-10 w-10 items-center justify-center rounded-xl">
            <NotebookPen className="h-5 w-5" aria-hidden />
          </span>
          <span className="fonte-display text-lg font-bold">Caderno Aberto</span>
        </button>

        <div className="border-border bg-card mt-6 rounded-2xl border p-6 shadow-sm">
          <h1 className="fonte-display text-xl font-bold">{titulo}</h1>
          <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">{descricao}</p>

          {modo === "solicitar" ? (
            <div className="bg-muted mt-4 grid grid-cols-2 gap-1 rounded-xl p-1" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={tipo === "primeiro_acesso"}
                onClick={() => {
                  setTipo("primeiro_acesso");
                  setSucesso("");
                  setErro("");
                }}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                  tipo === "primeiro_acesso"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground"
                }`}
              >
                Primeiro acesso
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tipo === "recuperacao"}
                onClick={() => {
                  setTipo("recuperacao");
                  setSucesso("");
                  setErro("");
                }}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                  tipo === "recuperacao"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground"
                }`}
              >
                Recuperar senha
              </button>
            </div>
          ) : null}

          <form onSubmit={submeter} className="mt-5 space-y-3.5">
            {modo === "solicitar" && tipo === "primeiro_acesso" ? (
              <Campo
                id="nome"
                rotulo="Seu nome"
                tipo="text"
                valor={nome}
                onChange={setNome}
                placeholder="Prof. Maria da Silva"
                autoFocus
              />
            ) : null}

            {!sucesso ? (
              <Campo
                id="email"
                rotulo="E-mail"
                tipo="email"
                valor={email}
                onChange={setEmail}
                placeholder="nome@escola.br"
                autoFocus={modo !== "solicitar" || tipo === "recuperacao"}
              />
            ) : null}

            {modo === "entrar" ? (
              <Campo
                id="senha"
                rotulo="Senha"
                tipo="password"
                valor={senha}
                onChange={setSenha}
                placeholder="••••••••"
                olho
                autoComplete="current-password"
              />
            ) : null}

            {modo === "codigo" ? (
              <>
                <div className="grid gap-1.5">
                  <Label htmlFor="codigo">Código de acesso</Label>
                  <InputOTP
                    id="codigo"
                    maxLength={8}
                    value={codigo}
                    onChange={(v) => setCodigo(v.toUpperCase())}
                    autoFocus
                    inputMode="text"
                    autoComplete="one-time-code"
                    containerClassName="justify-between"
                    aria-label="Código de acesso de 8 caracteres"
                  >
                    <InputOTPGroup className="w-full justify-between">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <InputOTPSlot key={i} index={i} className="h-10 w-8 rounded-md text-sm" />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                  <p className="text-muted-foreground text-[0.72rem]">
                    O código tem 8 caracteres e expira em 60 minutos.
                  </p>
                </div>
                <Campo
                  id="senha"
                  rotulo="Nova senha"
                  tipo="password"
                  valor={senha}
                  onChange={setSenha}
                  placeholder="••••••••"
                  olho
                  autoComplete="new-password"
                />
                <Campo
                  id="senha2"
                  rotulo="Confirmar senha"
                  tipo="password"
                  valor={senha2}
                  onChange={setSenha2}
                  placeholder="••••••••"
                  olho
                  autoComplete="new-password"
                />
                {senha ? (
                  <div className="space-y-1.5" aria-live="polite">
                    <div className="flex items-center justify-between text-[0.72rem]">
                      <span className="text-muted-foreground">Força da senha</span>
                      <span className="font-semibold">{forcaSenha(senha).rotulo}</span>
                    </div>
                    <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
                      <div
                        className={`h-full rounded-full transition-all ${forcaSenha(senha).cor}`}
                        style={{ width: `${(forcaSenha(senha).nivel / 3) * 100}%` }}
                      />
                    </div>
                    {senha2 && senha !== senha2 ? (
                      <p className="text-destructive text-[0.72rem]">As senhas não conferem.</p>
                    ) : null}
                  </div>
                ) : null}
              </>
            ) : null}

            {erro ? (
              <p role="alert" className="text-destructive text-sm font-medium">
                {erro}
              </p>
            ) : null}
            {sucesso ? (
              <p className="text-brand-700 dark:text-brand-300 flex items-start gap-1.5 text-sm font-medium">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                {sucesso}
              </p>
            ) : null}

            {!sucesso ? (
              <Button type="submit" className="w-full gap-2 rounded-xl" disabled={desabilitado}>
                {enviando ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
                {botao}
              </Button>
            ) : null}
          </form>

          <div className="border-border mt-5 space-y-1.5 border-t pt-4 text-center text-sm">
            {modo === "entrar" ? (
              <>
                <p>
                  <button
                    type="button"
                    onClick={() => navegar("/codigo")}
                    className="text-primary inline-flex items-center gap-1 font-semibold hover:underline"
                  >
                    <KeyRound className="h-3 w-3" aria-hidden /> Tenho um código
                  </button>
                </p>
                <p>
                  <button
                    type="button"
                    onClick={() => navegar("/solicitar?recuperacao=1")}
                    className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 hover:underline"
                  >
                    <Lock className="h-3 w-3" aria-hidden /> Esqueci minha senha
                  </button>
                </p>
                <p>
                  <button
                    type="button"
                    onClick={() => navegar("/solicitar")}
                    className="text-muted-foreground hover:text-foreground hover:underline"
                  >
                    Solicitar acesso
                  </button>
                </p>
              </>
            ) : (
              <p>
                <button
                  type="button"
                  onClick={() => navegar("/")}
                  className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 hover:underline"
                >
                  <ArrowLeft className="h-3 w-3" aria-hidden /> Voltar ao login
                </button>
              </p>
            )}
          </div>
        </div>

        <p className="text-muted-foreground mt-4 flex items-center justify-center gap-1.5 text-center text-[0.72rem]">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
          <span>Acesso restrito à comunidade da escola</span>
        </p>
      </div>
    </div>
  );
}

function Campo({
  id,
  rotulo,
  tipo,
  valor,
  onChange,
  placeholder,
  autoFocus,
  olho,
  autoComplete,
}: {
  id: string;
  rotulo: string;
  tipo: string;
  valor: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  olho?: boolean;
  autoComplete?: string;
}) {
  const [visivel, setVisivel] = useState(false);
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{rotulo}</Label>
      <div className="relative">
        <Input
          id={id}
          type={olho && visivel ? "text" : tipo}
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={olho ? "rounded-xl pr-10" : "rounded-xl"}
          autoFocus={autoFocus}
          autoComplete={autoComplete ?? (tipo === "password" ? "current-password" : "on")}
        />
        {olho ? (
          <button
            type="button"
            onClick={() => setVisivel(!visivel)}
            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md p-1"
            aria-label={visivel ? "Ocultar a senha" : "Mostrar a senha"}
            title={visivel ? "Ocultar a senha" : "Mostrar a senha"}
          >
            {visivel ? (
              <EyeOff className="h-4 w-4" aria-hidden />
            ) : (
              <Eye className="h-4 w-4" aria-hidden />
            )}
          </button>
        ) : null}
      </div>
    </div>
  );
}
