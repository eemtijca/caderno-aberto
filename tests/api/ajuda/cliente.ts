// Cliente HTTP com jar de cookies para os testes de contrato.

export const BASE = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";

export interface Resposta {
  status: number;
  dados: any;
  cabecalhos: Headers;
}

export class Cliente {
  private jar: Record<string, string> = {};

  async pedir(
    metodo: string,
    caminho: string,
    corpo?: unknown,
    tipo?: string,
    cabecalhosExtras?: Record<string, string>,
  ): Promise<Resposta> {
    const cabecalhos: Record<string, string> = { ...cabecalhosExtras };
    const cookies = Object.entries(this.jar)
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");
    if (cookies) cabecalhos.cookie = cookies;
    let payload: BodyInit | undefined;
    if (tipo === "form") {
      payload = corpo as BodyInit;
    } else if (corpo !== undefined) {
      cabecalhos["content-type"] = "application/json";
      payload = JSON.stringify(corpo);
    }
    const r = await fetch(`${BASE}${caminho}`, {
      method: metodo,
      headers: cabecalhos,
      body: payload,
      redirect: "manual",
    });
    const brutas = r.headers.getSetCookie?.() ?? [];
    for (const c of brutas) {
      const [par] = c.split(";");
      const i = par.indexOf("=");
      this.jar[par.slice(0, i).trim()] = par.slice(i + 1).trim();
    }
    const texto = await r.text();
    let dados: any = null;
    try {
      dados = texto ? JSON.parse(texto) : null;
    } catch {
      dados = { _texto: texto };
    }
    return { status: r.status, dados, cabecalhos: r.headers };
  }

  get(c: string, h?: Record<string, string>) {
    return this.pedir("GET", c, undefined, undefined, h);
  }
  post(c: string, b?: unknown, h?: Record<string, string>) {
    return this.pedir("POST", c, b, undefined, h);
  }
  put(c: string, b?: unknown) {
    return this.pedir("PUT", c, b);
  }
  patch(c: string, b?: unknown) {
    return this.pedir("PATCH", c, b);
  }
  del(c: string) {
    return this.pedir("DELETE", c);
  }

  cookie(nome: string): string | undefined {
    return this.jar[nome];
  }
  definirCookie(nome: string, valor: string): void {
    this.jar[nome] = valor;
  }
}
