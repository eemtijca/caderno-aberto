// Gestão de usuários: listar e criar contas.

import { NextRequest } from "next/server";
import { banco } from "@/lib/banco";
import { erroApi, json } from "@/lib/api/sessao";
import { exigirAdmin } from "@/lib/api/admin";
import { registrarEvento } from "@/lib/api/auditoria";
import { normalizarEmail, normalizarNome } from "@/lib/auth/validacao";
import { criarContaInativa } from "@/lib/auth/contas";
import { emitirCodigo } from "@/lib/auth/codigos";

export const dynamic = "force-dynamic";

const PAPEIS = new Set(["admin", "professor"]);

// GET /api/admin/usuarios. Lista contas com perfil.
export async function GET(req: NextRequest) {
  const guarda = await exigirAdmin(req);
  if (!guarda.ok) return guarda.resposta;

  const db = banco();
  const linhas = await db.usuarios.findMany({
    include: { perfil: true },
    orderBy: { criadoEm: "desc" },
    take: 300,
  });
  return json({
    usuarios: linhas.map((u) => ({
      id: u.id,
      email: u.email,
      nome: u.perfil?.nome ?? "",
      papel: u.papel,
      ativado: Boolean(u.ativadoEm),
      criadoEm: u.criadoEm.toISOString(),
    })),
  });
}

// POST /api/admin/usuarios {nome, email, papel}. Cria conta inativa e devolve o código.
export async function POST(req: NextRequest) {
  const guarda = await exigirAdmin(req);
  if (!guarda.ok) return guarda.resposta;

  const corpo = await req.json().catch(() => null);
  const email = normalizarEmail(corpo?.email);
  const nome = normalizarNome(corpo?.nome);
  const papel = typeof corpo?.papel === "string" ? corpo.papel : "professor";
  if (!email || !nome || !PAPEIS.has(papel)) return erroApi("Dados inválidos.");

  const db = banco();
  const existente = await db.usuarios.findFirst({ where: { email } });
  if (existente) return erroApi("Já existe uma conta com este e-mail.");

  const criado = await criarContaInativa(email, nome, papel as "admin" | "professor");
  const { codigo, expiraEm } = await emitirCodigo(
    criado.id,
    criado.email,
    "primeiro_acesso",
    guarda.sessao.usuario.id,
  );
  await registrarEvento({
    atorId: guarda.sessao.usuario.id,
    acao: "CRIAR_USUARIO",
    email,
    req,
    detalhe: { papel },
  });

  return json(
    {
      usuario: { id: criado.id, email, nome, papel, ativado: false },
      codigo,
      expiraEm: expiraEm.toISOString(),
    },
    201,
  );
}
