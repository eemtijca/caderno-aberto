// Gestão de usuários: listar e criar contas.

import { NextRequest } from "next/server";
import { banco } from "@/lib/banco";
import { erroApi, json } from "@/lib/api/sessao";
import { exigirAdmin } from "@/lib/api/admin";
import { registrarEvento } from "@/lib/api/auditoria";
import { normalizarEmail, normalizarNome } from "@/lib/auth/validacao";
import { criarContaInativa } from "@/lib/auth/contas";
import { emitirCodigo } from "@/lib/auth/codigos";
import { parametrosPagina } from "@/lib/api/paginacao";

export const dynamic = "force-dynamic";

const PAPEIS = new Set(["admin", "professor"]);

// GET /api/admin/usuarios. Lista contas com perfil, paginadas.
export async function GET(req: NextRequest) {
  const guarda = await exigirAdmin(req);
  if (!guarda.ok) return guarda.resposta;

  const { pagina, porPagina, skip, take } = parametrosPagina(req);
  const db = banco();
  const [linhas, total] = await Promise.all([
    db.usuarios.findMany({
      include: { perfil: true },
      orderBy: [{ criadoEm: "desc" }, { id: "desc" }],
      skip,
      take,
    }),
    db.usuarios.count(),
  ]);
  return json({
    usuarios: linhas.map((u) => ({
      id: u.id,
      email: u.email,
      nome: u.perfil?.nome ?? "",
      papel: u.papel,
      ativado: Boolean(u.ativadoEm),
      statusConta: u.perfil?.statusConta ?? "ativo",
      motivo: u.perfil?.motivo ?? "",
      suspensoEm: u.perfil?.suspensoEm?.toISOString() ?? null,
      criadoEm: u.criadoEm.toISOString(),
    })),
    total,
    pagina,
    porPagina,
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
