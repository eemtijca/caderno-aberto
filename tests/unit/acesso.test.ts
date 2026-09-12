// Testes unitários do código de acesso e dos utilitários de validação.
import { describe, expect, it } from "vitest";
import { confereCodigo, gerarCodigo, hashCodigo, normalizarCodigo } from "@/lib/auth/codigo";
import { mascararEmail } from "@/lib/auth/validacao";
import { restaDaJanelaMs } from "@/lib/api/limite";

const ALFABETO = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/;

describe("código de acesso", () => {
  it("gera 8 caracteres do alfabeto seguro", () => {
    for (let i = 0; i < 200; i++) {
      const c = gerarCodigo();
      expect(c).toMatch(ALFABETO);
      expect(c).not.toMatch(/[01IO]/);
    }
  });

  it("normaliza para maiúsculas e remove espaços", () => {
    expect(normalizarCodigo("  abcd efgh ")).toBe("ABCDEFGH");
  });

  it("recusa formatos inválidos", () => {
    expect(normalizarCodigo("ABC")).toBe(null);
    expect(normalizarCodigo("ABCDEFG0")).toBe(null);
    expect(normalizarCodigo("ABCDEFGI")).toBe(null);
    expect(normalizarCodigo(12345678)).toBe(null);
  });

  it("confere o HMAC com e-mail e tipo", () => {
    const hash = hashCodigo("prof@exemplo.br", "primeiro_acesso", "ABCDEFGH");
    expect(confereCodigo("prof@exemplo.br", "primeiro_acesso", "ABCDEFGH", hash)).toBe(true);
    expect(confereCodigo("PROF@EXEMPLO.BR", "primeiro_acesso", "abcdefgh", hash)).toBe(true);
    expect(confereCodigo("prof@exemplo.br", "recuperacao", "ABCDEFGH", hash)).toBe(false);
    expect(confereCodigo("outro@exemplo.br", "primeiro_acesso", "ABCDEFGH", hash)).toBe(false);
    expect(confereCodigo("prof@exemplo.br", "primeiro_acesso", "ABCDEFGJ", hash)).toBe(false);
  });
});

describe("máscara de e-mail", () => {
  it("preserva o domínio e oculta o restante", () => {
    expect(mascararEmail("maria.silva@escola.br")).toBe("m***@escola.br");
    expect(mascararEmail("semarroba")).toBe("***");
  });
});

describe("janela de limite", () => {
  it("calcula o tempo restante e nunca fica negativo", () => {
    expect(restaDaJanelaMs(1000, 2000, 5000)).toBe(4000);
    expect(restaDaJanelaMs(1000, 7000, 5000)).toBe(0);
  });
});
