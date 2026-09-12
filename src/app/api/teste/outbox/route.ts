// Caixa de e-mails em memória para testes, ativa apenas com a flag e fora de produção.

import { PERMITE_OUTBOX_TESTE } from "@/lib/ambiente"
import { json } from "@/lib/api/sessao"
import { limparOutbox, listarOutbox } from "@/lib/email/outbox"

export const dynamic = "force-dynamic"

/** Caixa ligada só nos testes e nunca na produção da Vercel. */
function liberada(): boolean {
  if (!PERMITE_OUTBOX_TESTE) return false
  if (process.env.VERCEL_ENV === "production") return false
  return true
}

// GET /api/teste/outbox. Caixa de e-mails em memória, somente com ALLOW_TEST_OUTBOX=1.
export async function GET() {
  if (!liberada()) return json({ erro: "Não encontrado." }, 404)
  return json({ emails: listarOutbox() })
}

// DELETE /api/teste/outbox. Limpa a caixa, somente com ALLOW_TEST_OUTBOX=1.
export async function DELETE() {
  if (!liberada()) return json({ erro: "Não encontrado." }, 404)
  limparOutbox()
  return json({ ok: true })
}
