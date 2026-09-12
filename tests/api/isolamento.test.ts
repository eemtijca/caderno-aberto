// Prova das políticas com o papel restrito app_teste.
// Uso: npm run test:api (aplica prisma/scripts/rls-teste.sql antes)
// O papel de teste não contorna o RLS. Só existe em local/CI.
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.DATABASE_URL || "postgresql://caderno:caderno@localhost:5432/caderno";

// Massa de dois professores.
const a = "11111111-1111-1111-1111-111111111111";
const bId = "22222222-2222-2222-2222-222222222222";

let admin: pg.Client;

beforeAll(async () => {
  admin = new pg.Client({ connectionString: url });
  await admin.connect();
  await admin.query(
    `insert into usuarios (id, email, senha_hash, ativado_em) values ($1, 'iso_a@exemplo.br', 'x', now()), ($2, 'iso_b@exemplo.br', 'x', now()) on conflict (id) do nothing`,
    [a, bId],
  );
  await admin.query(
    `insert into profiles (id, nome, email) values ($1, 'A', 'iso_a@exemplo.br'), ($2, 'B', 'iso_b@exemplo.br') on conflict (id) do nothing`,
    [a, bId],
  );
  await admin.query(
    `insert into notas (id, professor_id, titulo, status) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', $1, 'Nota A', 'rascunho'), ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', $2, 'Nota B', 'rascunho') on conflict (id) do nothing`,
    [a, bId],
  );
  await admin.query(
    `insert into codigos_acesso (id, usuario_id, email, tipo, codigo_hash, expira_em)
     values ('cccccccc-cccc-cccc-cccc-cccccccccccc', $1, 'iso_a@exemplo.br', 'recuperacao', 'hash', now() + interval '1 hour')
     on conflict (id) do nothing`,
    [a],
  );
  await admin.query(
    `insert into eventos_seguranca (id, acao, email) values ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'LOGIN_OK', 'iso_a@exemplo.br')
     on conflict (id) do nothing`,
  );
});

afterAll(async () => {
  // Remove a massa.
  await admin.query(
    `delete from eventos_seguranca where email in ('iso_a@exemplo.br', 'iso_b@exemplo.br')`,
  );
  await admin.query(`delete from usuarios where id in ($1, $2)`, [a, bId]);
  await admin.end();
});

// Conexão com papel e contexto fixados.
async function como<T>(usuarioId: string | null, fn: (c: pg.Client) => Promise<T>): Promise<T> {
  const c = new pg.Client({ connectionString: url });
  await c.connect();
  try {
    await c.query(`set role app_teste`);
    if (usuarioId) await c.query(`select set_config('app.usuario_atual', $1, false)`, [usuarioId]);
    return await fn(c);
  } finally {
    await c.end().catch(() => undefined);
  }
}

describe("isolamento RLS", () => {
  it("sem contexto, zero linhas", async () => {
    await como(null, async (c) => {
      const r = await c.query(`select count(*)::int as n from notas`);
      expect(r.rows[0].n).toBe(0);
    });
  });

  it("A vê só a nota A", async () => {
    await como(a, async (c) => {
      const r = await c.query(`select id from notas order by id`);
      expect(r.rows.length).toBe(1);
      expect(r.rows[0].id).toBe("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
      const p = await c.query(`select id from profiles`);
      expect(p.rows.length).toBe(1);
      expect(p.rows[0].id).toBe(a);
      const cruzada = await c.query(
        `select count(*)::int as n from notas where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'`,
      );
      expect(cruzada.rows[0].n).toBe(0);
    });
  });

  it("B vê só a nota B", async () => {
    await como(bId, async (c) => {
      const r = await c.query(`select id from notas order by id`);
      expect(r.rows.length).toBe(1);
      expect(r.rows[0].id).toBe("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    });
  });

  it("insert com professor alheio nega", async () => {
    await como(a, async (c) => {
      await expect(
        c.query(`insert into notas (professor_id, titulo) values ($1, 'Roubo')`, [bId]),
      ).rejects.toThrow();
    });
  });

  it("update e delete cruzados não afetam linhas alheias", async () => {
    await como(a, async (c) => {
      const u = await c.query(
        `update notas set titulo = 'Invadida' where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'`,
      );
      expect(u.rowCount).toBe(0);
      const d = await c.query(
        `delete from notas where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'`,
      );
      expect(d.rowCount).toBe(0);
    });
  });

  it("A vê apenas os próprios códigos", async () => {
    await como(a, async (c) => {
      const r = await c.query(`select usuario_id from codigos_acesso`);
      expect(r.rows.length).toBe(1);
      expect(r.rows[0].usuario_id).toBe(a);
    });
  });

  it("fila e auditoria ficam ocultas sem bypass", async () => {
    await como(a, async (c) => {
      const s = await c.query(`select count(*)::int as n from solicitacoes_acesso`);
      expect(s.rows[0].n).toBe(0);
      const e = await c.query(`select count(*)::int as n from eventos_seguranca`);
      expect(e.rows[0].n).toBe(0);
    });
  });

  it("usuarios respeitam a política própria", async () => {
    await como(a, async (c) => {
      const r = await c.query(`select id from usuarios`);
      expect(r.rows.length).toBe(1);
      expect(r.rows[0].id).toBe(a);
    });
  });
});
