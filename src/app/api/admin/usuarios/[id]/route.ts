// Edita, suspende, reativa ou remove um usuário, com guardrails de administração.

import { NextRequest } from "next/server";
import { banco } from "@/lib/banco";
import { erroApi, json } from "@/lib/api/sessao";
import { exigirAdmin } from "@/lib/api/admin";
import { registrarEvento } from "@/lib/api/auditoria";
import { APROVACAO_DUPLA } from "@/lib/ambiente";
import { confereSenhaAdmin, ehAdminBootstrap, ehUltimoAdmin } from "@/lib/api/admin-guarda";
import {
  alvoDeLinha,
  criarAprovacao,
  excluirUsuario,
  reativarUsuario,
  suspenderUsuario,
} from "@/lib/api/admin-usuarios";
import { normalizarEmail, normalizarNome } from "@/lib/auth/validacao";
import { codigoPrisma } from "@/lib/api/erro";
import { ehUuid } from "@/lib/identificador";

export const dynamic = "force-dynamic";

const PAPEIS = new Set(["admin", "professor"]);

type Ctx = { params: Promise<{ id: string }> };

function motivoValido(bruto: unknown): string | null {
  const motivo = typeof bruto === "string" ? bruto.trim().slice(0, 300) : "";
  return motivo.length >= 5 ? motivo : null;
}

// PATCH /api/admin/usuarios/[id] {nome?, email?, papel?, ativado?, statusConta?, motivo?, senha?}.
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const guarda = await exigirAdmin(req);
  if (!guarda.ok) return guarda.resposta;

  const { id } = await ctx.params;
  const eu = guarda.sessao.usuario.id;
  if (!ehUuid(id)) return erroApi("Usuário não encontrado.", 404, "NAO_ENCONTRADO");
  const corpo = await req.json().catch(() => null);
  const db = banco();
  const usuario = await db.usuarios.findFirst({ where: { id } });
  if (!usuario) return erroApi("Usuário não encontrado.", 404, "NAO_ENCONTRADO");
  const perfil = await db.profiles.findFirst({ where: { id } });
  const alvo = alvoDeLinha({ id: usuario.id, email: usuario.email, papel: usuario.papel });

  // Desativar (suspender) exige motivo e senha do administrador.
  if (corpo?.statusConta === "suspenso") {
    if (id === eu) return erroApi("Não é possível desativar a própria conta.");
    if (ehAdminBootstrap(usuario.email))
      return erroApi(
        "A conta de administração inicial não pode ser desativada.",
        403,
        "SEM_PERMISSAO",
      );
    if (usuario.papel === "admin" && (await ehUltimoAdmin(id)))
      return erroApi("Não é possível desativar o último administrador ativo.");
    if (!(await confereSenhaAdmin(eu, corpo.senha)))
      return erroApi("Senha incorreta.", 403, "SEM_PERMISSAO");
    const motivo = motivoValido(corpo.motivo);
    if (!motivo) return erroApi("Informe o motivo da desativação (mínimo de 5 caracteres).");

    if (APROVACAO_DUPLA) {
      const aprovacao = await criarAprovacao({
        tipo: "suspender",
        alvo,
        motivo,
        solicitanteId: eu,
      });
      return json({ ok: true, pendente: true, aprovacaoId: aprovacao.id }, 202);
    }
    await suspenderUsuario({ atorId: eu, alvo, motivo, req });
    return json({ ok: true });
  }

  // Reativar uma conta suspensa.
  if (corpo?.statusConta === "ativo" && perfil?.statusConta === "suspenso") {
    if (!(await confereSenhaAdmin(eu, corpo.senha)))
      return erroApi("Senha incorreta.", 403, "SEM_PERMISSAO");
    await reativarUsuario({ atorId: eu, alvo, req });
    return json({ ok: true });
  }

  const dados: { email?: string; papel?: string; ativadoEm?: Date | null } = {};
  const perfilDados: { nome?: string; email?: string } = {};

  if (typeof corpo?.nome === "string") {
    const nome = normalizarNome(corpo.nome);
    if (!nome) return erroApi("Nome inválido.");
    perfilDados.nome = nome;
  }

  if (typeof corpo?.email === "string") {
    const email = normalizarEmail(corpo.email);
    if (!email) return erroApi("E-mail inválido.");
    if (email !== usuario.email) {
      const ocupado = await db.usuarios.findFirst({ where: { email } });
      if (ocupado && ocupado.id !== id) return erroApi("E-mail já em uso.");
      dados.email = email;
      perfilDados.email = email;
    }
  }

  if (typeof corpo?.papel === "string") {
    if (!PAPEIS.has(corpo.papel)) return erroApi("Papel inválido.");
    if (id === eu && corpo.papel !== "admin")
      return erroApi("Não é possível remover o próprio acesso de administrador.");
    if (ehAdminBootstrap(usuario.email) && corpo.papel !== "admin")
      return erroApi("A conta de administração inicial deve permanecer administradora.", 403);
    if (usuario.papel === "admin" && corpo.papel !== "admin" && (await ehUltimoAdmin(id)))
      return erroApi("Não é possível rebaixar o último administrador ativo.");
    if (corpo.papel !== usuario.papel) dados.papel = corpo.papel;
  }

  if (typeof corpo?.ativado === "boolean") {
    if (id === eu && !corpo.ativado) return erroApi("Não é possível desativar a própria conta.");
    if (corpo.ativado && !usuario.ativadoEm) dados.ativadoEm = new Date();
    if (!corpo.ativado && usuario.ativadoEm) dados.ativadoEm = null;
  }

  if (Object.keys(dados).length === 0 && Object.keys(perfilDados).length === 0) {
    return erroApi("Nada para atualizar.");
  }

  // Mudar papel ou desativar derruba as sessões; desativar revoga códigos.
  const derrubaSessoes = "papel" in dados || dados.ativadoEm === null;
  try {
    await db.$transaction(async (tx) => {
      if (Object.keys(dados).length) await tx.usuarios.update({ where: { id }, data: dados });
      if (Object.keys(perfilDados).length)
        await tx.profiles.update({ where: { id }, data: perfilDados });
      if (derrubaSessoes) await tx.sessoes.deleteMany({ where: { usuarioId: id } });
      if (dados.ativadoEm === null) {
        await tx.codigosAcesso.deleteMany({ where: { usuarioId: id, usadoEm: null } });
      }
    });
  } catch (erro) {
    // Corrida com uma exclusão concorrente: a conta deixou de existir.
    if (codigoPrisma(erro) === "P2025")
      return erroApi("Usuário não encontrado.", 404, "NAO_ENCONTRADO");
    throw erro;
  }

  await registrarEvento({
    atorId: eu,
    acao: "EDITAR_USUARIO",
    email: dados.email ?? usuario.email,
    req,
    detalhe: { campos: Object.keys({ ...dados, ...perfilDados }) },
  });
  return json({ ok: true });
}

// DELETE /api/admin/usuarios/[id]. Remove a conta em cascata.
export async function DELETE(req: NextRequest, ctx: Ctx) {
  const guarda = await exigirAdmin(req);
  if (!guarda.ok) return guarda.resposta;

  const { id } = await ctx.params;
  const eu = guarda.sessao.usuario.id;
  if (id === eu) return erroApi("Não é possível excluir a própria conta.");
  if (!ehUuid(id)) return erroApi("Usuário não encontrado.", 404, "NAO_ENCONTRADO");

  const db = banco();
  const usuario = await db.usuarios.findFirst({ where: { id } });
  if (!usuario) return erroApi("Usuário não encontrado.", 404, "NAO_ENCONTRADO");

  if (ehAdminBootstrap(usuario.email))
    return erroApi("A conta de administração inicial não pode ser excluída.", 403, "SEM_PERMISSAO");
  if (usuario.papel === "admin" && (await ehUltimoAdmin(id)))
    return erroApi("Não é possível excluir o último administrador ativo.");

  const corpo = await req.json().catch(() => null);
  if (!(await confereSenhaAdmin(eu, corpo?.senha)))
    return erroApi("Senha incorreta.", 403, "SEM_PERMISSAO");
  const motivo = motivoValido(corpo?.motivo);
  if (!motivo) return erroApi("Informe o motivo da exclusão (mínimo de 5 caracteres).");

  const alvo = alvoDeLinha({ id: usuario.id, email: usuario.email, papel: usuario.papel });
  if (APROVACAO_DUPLA) {
    const aprovacao = await criarAprovacao({ tipo: "excluir", alvo, motivo, solicitanteId: eu });
    return json({ ok: true, pendente: true, aprovacaoId: aprovacao.id }, 202);
  }

  await excluirUsuario({ atorId: eu, alvo, motivo, req });
  return json({ ok: true });
}
