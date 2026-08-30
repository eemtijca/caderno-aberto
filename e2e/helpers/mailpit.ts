// Helper Mailpit para testes de confirmação. Consome API local.
export async function buscarEmail(destinatario: string, assuntoInclui?: string, timeoutMs = 15000) {
  const inicio = Date.now()
  while (Date.now() - inicio < timeoutMs) {
    const r = await fetch("http://127.0.0.1:54324/api/v1/messages")
    if (!r.ok) {
      await new Promise((res) => setTimeout(res, 500))
      continue
    }
    const dados = (await r.json()) as {
      messages: { ID: string; To: { Address: string }[]; Subject: string }[]
    }
    const msg = dados.messages.find(
      (m) =>
        m.To.some((t) => t.Address === destinatario) &&
        (!assuntoInclui || m.Subject.includes(assuntoInclui)),
    )
    if (msg) {
      const detalhe = await fetch(`http://127.0.0.1:54324/api/v1/message/${msg.ID}`)
      const corpo = (await detalhe.json()) as { HTML: string; Text: string }
      const href =
        corpo.HTML.match(/href="([^"]+)"/)?.[1] ??
        corpo.Text.match(/https?:\/\/[^\s"']+/)?.[0] ??
        ""
      return { id: msg.ID, html: corpo.HTML, text: corpo.Text, href: href.replace(/&amp;/g, "&") }
    }
    await new Promise((res) => setTimeout(res, 500))
  }
  throw new Error(`E-mail não encontrado para ${destinatario} em ${timeoutMs}ms`)
}

export async function limparMailpit() {
  await fetch("http://127.0.0.1:54324/api/v1/messages", { method: "DELETE" }).catch(() => undefined)
}

export function corrigirRedirect(href: string, baseUrl?: string) {
  const base = baseUrl || "http://127.0.0.1:3000"
  try {
    const u = new URL(href)
    const redirect = u.searchParams.get("redirect_to")
    if (redirect && redirect.includes("127.0.0.1")) {
      u.searchParams.set("redirect_to", base)
      return u.toString()
    }
    return href
  } catch {
    return href
  }
}
