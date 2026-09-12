// Edita ou remove um usuário.

import { NextRequest } from "next/server";
import { banco } from "@/lib/banco";
import { erroApi, json } from "@/lib/api/sessao";
import { exigirAdmin } from "@/lib/api/admin";
import { registrarEvento } from "@/lib/api/auditoria";
import { normalizarEmail, normalizarNome } from "@/lib/auth/validacao";

export const dynamic = "force-dynamic";

const PAPEIS = new Set(["admin", "professor"]);

type Ctx = { params: Promise<{ id: string }> };

// PATCH /api/admin/usuarios/[id] {nome?, email?, papel?, ativado?}.
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const guarda = await exigirAdmin(req);
  if (!guarda.ok) return guarda.resposta;

  const { id } = await ctx.params;
  const eu = guarda.sessao.usuario.id;
  const corpo = await req.json().catch(() => null);
  const db = banco();
  const usuario = await db.usuarios.findFirst({ where: { id } });
  if (!usuario) return erroApi("Usuário não encontrado.", 404);

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
  await db.$transaction(async (tx) => {
    if (Object.keys(dados).length) await tx.usuarios.update({ where: { id }, data: dados });
    if (Object.keys(perfilDados).length)
      await tx.profiles.update({ where: { id }, data: perfilDados });
    if (derrubaSessoes) await tx.sessoes.deleteMany({ where: { usuarioId: id } });
    if (dados.ativadoEm === null) {
      await tx.codigosAcesso.deleteMany({ where: { usuarioId: id, usadoEm: null } });
    }
  });

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

  const db = banco();
  const usuario = await db.usuarios.findFirst({ where: { id } });
  if (!usuario) return erroApi("Usuário não encontrado.", 404);

  await db.usuarios.delete({ where: { id } });
  await registrarEvento({ atorId: eu, acao: "EXCLUIR_USUARIO", email: usuario.email, req });
  return json({ ok: true });
}
