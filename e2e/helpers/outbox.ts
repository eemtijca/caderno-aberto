// Leitura da caixa de e-mails em memória para testes.
const BASE = process.env.TEST_BASE_URL || "http://127.0.0.1:3000"

interface EmailOutbox {
  para: string[]
  assunto: string
  html: string
  texto?: string
}

export async function buscarEmail(destinatario: string, assuntoInclui?: string, timeoutMs = 15000) {
  const inicio = Date.now()
  while (Date.now() - inicio < timeoutMs) {
    const r = await fetch(`${BASE}/api/teste/outbox`).catch(() => null)
    if (!r?.ok) {
      await new Promise((res) => setTimeout(res, 500))
      continue
    }
    const dados = (await r.json()) as { emails?: EmailOutbox[] }
    if (!Array.isArray(dados.emails)) {
      await new Promise((res) => setTimeout(res, 500))
      continue
    }
    const msg = [...dados.emails]
      .reverse()
      .find(
        (m) =>
          m.para.some((t) => t.toLowerCase() === destinatario.toLowerCase()) &&
          (!assuntoInclui || m.assunto.includes(assuntoInclui)),
      )
    if (msg) {
      const href = msg.html.match(/href="([^"]+)"/)?.[1] ?? ""
      return { html: msg.html, text: msg.texto ?? "", href: href.replace(/&amp;/g, "&") }
    }
    await new Promise((res) => setTimeout(res, 500))
  }
  throw new Error(`E-mail não encontrado para ${destinatario} em ${timeoutMs}ms`)
}

export async function limparOutbox() {
  await fetch(`${BASE}/api/teste/outbox`, { method: "DELETE" }).catch(() => undefined)
}

// Ajusta o host do link ao baseURL do teste.
export function corrigirRedirect(href: string, baseUrl?: string) {
  const base = baseUrl || "http://127.0.0.1:3000"
  try {
    const u = new URL(href, base)
    const b = new URL(base)
    u.protocol = b.protocol
    u.host = b.host
    return u.toString()
  } catch {
    return href
  }
}
