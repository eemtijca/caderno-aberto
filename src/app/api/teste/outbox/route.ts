import { json } from "@/lib/api/sessao"
import { limparOutbox, listarOutbox } from "@/lib/email/outbox"

export const dynamic = "force-dynamic"

// GET /api/teste/outbox. Caixa de e-mails em memória fora de produção.
export async function GET() {
  if (process.env.NODE_ENV === "production") return json({ erro: "Não encontrado." }, 404)
  return json({ emails: listarOutbox() })
}

// DELETE /api/teste/outbox. Limpa a caixa.
export async function DELETE() {
  if (process.env.NODE_ENV === "production") return json({ erro: "Não encontrado." }, 404)
  limparOutbox()
  return json({ ok: true })
}
