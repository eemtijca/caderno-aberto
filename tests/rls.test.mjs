// ============================================================
// Caderno Aberto : suíte de testes de RLS e gatilhos
//
// Roda contra o Postgres de teste preparado por
// tests/harness/preparar.mjs, simulando exatamente o que o
// PostgREST faz em produção: conecta e assume o papel
// (anon/authenticated/service_role) com o JWT em
// `request.jwt.claims`, de modo que auth.uid() e todas as
// políticas de segurança de linha sejam exercidas de verdade.
//
// Uso:  node tests/harness/preparar.mjs && node tests/rls.test.mjs
// ============================================================

import { Client } from "pg"
import { PGHOST, PGPORT, PGDATABASE } from "./harness/preparar.mjs"

let passou = 0
const falhas = []
let atual = ""

function teste(nome, fn) {
  atual = nome
  return Promise.resolve()
    .then(fn)
    .then(() => passou++)
    .catch((e) => falhas.push({ nome, erro: e.message ?? String(e) }))
}

function ok(cond, msg) {
  if (!cond) throw new Error(msg)
}

/** Abre uma conexão assumindo um papel + JWT (como o PostgREST). */
async function como(papel, uid) {
  const c = new Client({ host: PGHOST, port: PGPORT, user: "postgres", database: PGDATABASE })
  await c.connect()
  await c.query(`set role ${papel}`)
  await c.query(
    `set request.jwt.claims = '${JSON.stringify(uid ? { sub: uid, role: papel } : { role: papel })}'`,
  )
  return c
}

async function superuser() {
  const c = new Client({ host: PGHOST, port: PGPORT, user: "postgres", database: PGDATABASE })
  await c.connect()
  return c
}

/** Executa fn com um cliente no papel dado e fecha o cliente. */
async function comPapel(papel, uid, fn) {
  const c = await como(papel, uid)
  try {
    return await fn(c)
  } finally {
    await c.query("reset role").catch(() => {})
    await c.end().catch(() => {})
  }
}

/** Espera que a query lance "permission denied" (SQLSTATE 42501). */
async function espereNegado(papel, uid, sql, valores = []) {
  return comPapel(papel, uid, async (c) => {
    try {
      await c.query(sql, valores)
    } catch (e) {
      ok(e.code === "42501", `esperava permission denied, veio ${e.code}: ${e.message}`)
      return true
    }
    throw new Error(`esperava permission denied, mas a query foi aceita: ${sql}`)
  })
}

// ------------------------------------------------------------
// dados-base
// ------------------------------------------------------------
const UID_A = "11111111-1111-1111-1111-111111111111"
const UID_B = "22222222-2222-2222-2222-222222222222"

let notaA_pub,
  notaA_rasc,
  notaB_pub,
  discA,
  discA2,
  turmaA1,
  turmaA2,
  linkNotaA,
  linkTurmaA,
  linkDiscA,
  linkExpira,
  linkRevogado

await teste("gatilho handle_novo_usuario cria perfis a partir de auth.users", async () => {
  const adm = await superuser()
  try {
    for (const [uid, email, nome] of [
      [UID_A, "prof.a@escola.br", "Professora Ana"],
      [UID_B, "prof.b@escola.br", "Professor Beto"],
    ]) {
      await adm.query(
        `insert into auth.users (id, email, raw_user_meta_data, email_confirmed_at)
         values ($1, $2, $3::jsonb, now())`,
        [uid, email, JSON.stringify({ nome })],
      )
    }
    const { rows } = await adm.query("select id, nome, email from profiles")
    ok(rows.length === 2, `esperava 2 perfis, veio ${rows.length}`)
    const perfilA = rows.find((r) => r.email === "prof.a@escola.br")
    ok(perfilA?.nome === "Professora Ana", `nome do perfil A errado: ${perfilA?.nome}`)
  } finally {
    await adm.end()
  }
})

await teste("perfil: professor vê apenas o próprio; anon não tem acesso", async () => {
  await comPapel("authenticated", UID_A, async (c) => {
    const { rows } = await c.query("select id from profiles")
    ok(rows.length === 1 && rows[0].id === UID_A, "professor A deveria ver só o próprio perfil")
  })
  try {
    await comPapel("anon", null, async (c) => {
      await c.query("select id from profiles")
    })
    throw new Error("anon não deveria ter grant de SELECT em profiles")
  } catch (e) {
    ok(
      String(e.message).includes("permission denied") || e.code === "42501",
      `esperava negado p/ anon: ${e.message}`,
    )
  }
})

await teste(
  "perfil: update permitido apenas nas colunas nome/escola/preferencias e só na própria linha",
  async () => {
    await comPapel("authenticated", UID_A, async (c) => {
      const r = await c.query("update profiles set nome = $1, escola = $2 where id = $3", [
        "Ana",
        "EEMTI José Cláudio de Araújo",
        UID_A,
      ])
      ok(r.rowCount === 1, "update do próprio perfil deveria afetar 1 linha")
      const b = await c.query("update profiles set nome = 'Hacker' where id = $1", [UID_B])
      ok(b.rowCount === 0, "update no perfil de outro professor deveria afetar 0 linhas")
    })
    await espereNegado(
      "authenticated",
      UID_A,
      "update profiles set email = 'x@x.br' where id = $1",
      [UID_A],
    )
  },
)

await teste("perfil: INSERT/DELETE pela API não são permitidos", async () => {
  await espereNegado(
    "authenticated",
    UID_A,
    "insert into profiles (id, nome) values ($1, 'Falso')",
    ["99999999-9999-9999-9999-999999999999"],
  )
  await espereNegado("authenticated", UID_A, "delete from profiles where id = $1", [UID_A])
})

await teste("sync_email_perfil: e-mail do auth.users propaga para o perfil", async () => {
  const adm = await superuser()
  try {
    await adm.query("update auth.users set email = $1 where id = $2", ["ana.nova@escola.br", UID_A])
    const { rows } = await adm.query("select email from profiles where id = $1", [UID_A])
    ok(rows[0].email === "ana.nova@escola.br", "e-mail do perfil não sincronizou")
  } finally {
    await adm.end()
  }
})

// ------------------------------------------------------------
// disciplinas e turmas
// ------------------------------------------------------------
await teste(
  "disciplinas: CRUD do próprio professor; isolamento total entre professores",
  async () => {
    await comPapel("authenticated", UID_A, async (c) => {
      const d = await c.query(
        "insert into disciplinas (professor_id, nome, cor, icone) values ($1, 'Matemática', 'verde', 'Pi') returning id",
        [UID_A],
      )
      discA = d.rows[0].id
    })
    await comPapel("authenticated", UID_B, async (c) => {
      const { rows } = await c.query("select id from disciplinas")
      ok(rows.length === 0, "professor B não deveria ver a disciplina de A")
      const u = await c.query("update disciplinas set nome = 'Roubado' where id = $1", [discA])
      ok(u.rowCount === 0, "professor B não deveria atualizar disciplina de A")
      const del = await c.query("delete from disciplinas where id = $1", [discA])
      ok(del.rowCount === 0, "professor B não deveria excluir disciplina de A")
    })
    await comPapel("authenticated", UID_A, async (c) => {
      const { rows } = await c.query("select nome from disciplinas")
      ok(
        rows.length === 1 && rows[0].nome === "Matemática",
        "disciplina de A foi alterada indevidamente",
      )
    })
  },
)

await teste("disciplinas: não é possível criar em nome de outro professor", async () => {
  await comPapel("authenticated", UID_A, async (c) => {
    try {
      await c.query("insert into disciplinas (professor_id, nome) values ($1, 'Fantasma')", [UID_B])
      throw new Error("insert com professor_id de B deveria violar WITH CHECK")
    } catch (e) {
      ok(
        e.message.includes("row-level security") || e.code === "42501",
        `esperava violação de RLS, veio: ${e.message}`,
      )
    }
  })
})

await teste("disciplinas: nome único por professor", async () => {
  await comPapel("authenticated", UID_A, async (c) => {
    try {
      await c.query("insert into disciplinas (professor_id, nome) values ($1, 'Matemática')", [
        UID_A,
      ])
      throw new Error("duplicidade de nome deveria ser rejeitada")
    } catch (e) {
      ok(e.message.includes("duplicate key"), `esperava unique violation: ${e.message}`)
    }
    const d2 = await c.query(
      "insert into disciplinas (professor_id, nome, cor) values ($1, 'Química', 'ciano') returning id",
      [UID_A],
    )
    discA2 = d2.rows[0].id
  })
})

await teste("turmas: criação, isolamento e restrição por professor", async () => {
  await comPapel("authenticated", UID_A, async (c) => {
    const t1 = await c.query(
      "insert into turmas (professor_id, nome, serie, ano_letivo) values ($1, '3A', '3º ano', 2026) returning id",
      [UID_A],
    )
    turmaA1 = t1.rows[0].id
    const t2 = await c.query(
      "insert into turmas (professor_id, nome, serie, ano_letivo) values ($1, '3B', '3º ano', 2026) returning id",
      [UID_A],
    )
    turmaA2 = t2.rows[0].id
  })
  await comPapel("authenticated", UID_B, async (c) => {
    const { rows } = await c.query("select id from turmas")
    ok(rows.length === 0, "professor B não deveria ver turmas de A")
  })
})

// ------------------------------------------------------------
// notas
// ------------------------------------------------------------
await teste("notas: criação com blocos JSONB e isolamento entre professores", async () => {
  await comPapel("authenticated", UID_A, async (c) => {
    const n1 = await c.query(
      `insert into notas (professor_id, titulo, disciplina_id, disciplina_nome, disciplina_cor,
                          turmas_ids, turmas_nomes, ano_letivo, mes, status, blocos, busca)
       values ($1, 'Função do 2º grau', $2, 'Matemática', 'verde', $3::uuid[], $4::text[],
               2026, 8, 'publicada', $5::jsonb, 'funcao do 2 grau')
       returning id`,
      [UID_A, discA, [turmaA1], ["3A"], JSON.stringify([{ tipo: "secao", titulo: "Introdução" }])],
    )
    notaA_pub = n1.rows[0].id
    const n2 = await c.query(
      `insert into notas (professor_id, titulo, disciplina_id, disciplina_nome, disciplina_cor, status)
       values ($1, 'Rascunho de prova', $2, 'Química', 'ciano', 'rascunho') returning id`,
      [UID_A, discA2],
    )
    notaA_rasc = n2.rows[0].id
  })
  await comPapel("authenticated", UID_B, async (c) => {
    const n = await c.query(
      `insert into notas (professor_id, titulo, status) values ($1, 'Nota do Beto', 'publicada') returning id`,
      [UID_B],
    )
    notaB_pub = n.rows[0].id
    const { rows } = await c.query("select id from notas")
    ok(
      rows.length === 1 && rows[0].id === notaB_pub,
      "professor B deveria ver apenas a própria nota",
    )
    const u = await c.query("update notas set titulo = 'Hackeada' where id = $1", [notaA_pub])
    ok(u.rowCount === 0, "professor B não deveria atualizar nota de A")
  })
})

await teste("notas: anon não insere, não atualiza, não exclui", async () => {
  await espereNegado("anon", null, "insert into notas (professor_id, titulo) values ($1, 'Spam')", [
    UID_A,
  ])
  await espereNegado("anon", null, "update notas set titulo = 'Spam' where id = $1", [notaA_pub])
  await espereNegado("anon", null, "delete from notas where id = $1", [notaA_pub])
})

// ------------------------------------------------------------
// links
// ------------------------------------------------------------
await teste("links: criação pelo dono, validação de alvo e isolamento", async () => {
  await comPapel("authenticated", UID_A, async (c) => {
    const l1 = await c.query(
      `insert into links (professor_id, tipo, nota_id, token, professor_nome, nome)
       values ($1, 'nota', $2, 'tok-nota-a', 'Ana', 'Aula de função') returning id`,
      [UID_A, notaA_pub],
    )
    linkNotaA = l1.rows[0].id
    const l2 = await c.query(
      `insert into links (professor_id, tipo, turma_id, token, professor_nome, nome)
       values ($1, 'turma', $2, 'tok-turma-a', 'Ana', 'Turma 3A') returning id`,
      [UID_A, turmaA1],
    )
    linkTurmaA = l2.rows[0].id
    const l3 = await c.query(
      `insert into links (professor_id, tipo, disciplina_id, token, professor_nome, nome)
       values ($1, 'disciplina', $2, 'tok-disc-a', 'Ana', 'Matemática') returning id`,
      [UID_A, discA],
    )
    linkDiscA = l3.rows[0].id
    const l4 = await c.query(
      `insert into links (professor_id, tipo, nota_id, token, professor_nome, expira_em)
       values ($1, 'nota', $2, 'tok-expira', 'Ana', now() - interval '1 hour') returning id`,
      [UID_A, notaA_pub],
    )
    linkExpira = l4.rows[0].id
    const l5 = await c.query(
      `insert into links (professor_id, tipo, nota_id, token, professor_nome, ativo)
       values ($1, 'nota', $2, 'tok-revogado', 'Ana', false) returning id`,
      [UID_A, notaA_pub],
    )
    linkRevogado = l5.rows[0].id

    // alvo inconsistente deve ser rejeitado
    try {
      await c.query(
        `insert into links (professor_id, tipo, nota_id, turma_id, token)
         values ($1, 'nota', $2, $3, 'tok-mistura')`,
        [UID_A, notaA_pub, turmaA1],
      )
      throw new Error("link com alvo misto deveria violar a constraint")
    } catch (e) {
      ok(e.message.includes("links_alvo_valido"), `esperava violação de alvo: ${e.message}`)
    }
  })

  // professor B não vê e não mexe nos links de A
  await comPapel("authenticated", UID_B, async (c) => {
    const { rows } = await c.query("select id from links")
    ok(rows.length === 0, "professor B não deveria ver links de A")
  })

  // professor B não cria link apontando para nota de A
  await comPapel("authenticated", UID_B, async (c) => {
    try {
      await c.query(
        `insert into links (professor_id, tipo, nota_id, token) values ($1, 'nota', $2, 'tok-roubo')`,
        [UID_B, notaA_pub],
      )
      throw new Error("link de B para nota de A deveria violar WITH CHECK")
    } catch (e) {
      ok(
        e.message.includes("row-level security") || e.code === "42501",
        `esperava RLS: ${e.message}`,
      )
    }
  })

  // professor B também não cria links de turma/disciplina roubando alvos de A
  await comPapel("authenticated", UID_B, async (c) => {
    for (const [tipo, col, alvo] of [
      ["turma", "turma_id", turmaA1],
      ["disciplina", "disciplina_id", discA],
    ]) {
      try {
        await c.query(
          `insert into links (professor_id, tipo, ${col}, token) values ($1, $2, $3, $4)`,
          [UID_B, tipo, alvo, `tok-roubo-${tipo}`],
        )
        throw new Error(`link de B para ${tipo} de A deveria violar WITH CHECK`)
      } catch (e) {
        ok(
          e.message.includes("row-level security") || e.code === "42501",
          `esperava RLS em ${tipo}: ${e.message}`,
        )
      }
    }
  })

  // professor A não consegue REASSIGNAR um link próprio para nota de B
  await comPapel("authenticated", UID_A, async (c) => {
    try {
      await c.query("update links set nota_id = $1 where token = 'tok-nota-a'", [notaB_pub])
      throw new Error("reassign de link para nota de B deveria violar WITH CHECK")
    } catch (e) {
      ok(
        e.message.includes("row-level security") || e.code === "42501",
        `esperava RLS no reassign: ${e.message}`,
      )
    }
  })
})

await teste("links: anon lê somente links ativos e não expirados; não modifica", async () => {
  await comPapel("anon", null, async (c) => {
    const { rows } = await c.query("select token from links order by token")
    const tokens = rows.map((r) => r.token)
    ok(tokens.includes("tok-nota-a"), "anon deveria ver o link ativo")
    ok(!tokens.includes("tok-expira"), "anon não deveria ver link expirado")
    ok(!tokens.includes("tok-revogado"), "anon não deveria ver link revogado")
  })
  await espereNegado(
    "anon",
    null,
    "insert into links (professor_id, tipo, token) values ($1, 'nota', 'x')",
    [UID_A],
  )
  await espereNegado("anon", null, "update links set nome = 'Hack' where token = 'tok-nota-a'")
  await espereNegado("anon", null, "delete from links where token = 'tok-nota-a'")
})

await teste("registrar_acesso: conta acessos apenas de links válidos", async () => {
  await comPapel("anon", null, async (c) => {
    const r1 = await c.query("select public.registrar_acesso('tok-nota-a') as ok")
    ok(r1.rows[0].ok === true, "link ativo deveria registrar acesso")
    const r2 = await c.query("select public.registrar_acesso('tok-inexistente') as ok")
    ok(r2.rows[0].ok === false, "token inválido deveria retornar false")
    const r3 = await c.query("select public.registrar_acesso('tok-expira') as ok")
    ok(r3.rows[0].ok === false, "token expirado não deveria registrar acesso")
  })
  const adm = await superuser()
  try {
    const { rows } = await adm.query("select acessos from links where token = 'tok-nota-a'")
    ok(rows[0].acessos === 1, `acessos deveria ser 1, veio ${rows[0].acessos}`)
  } finally {
    await adm.end()
  }
})

// ------------------------------------------------------------
// leitura pública de notas via links
// ------------------------------------------------------------
await teste("leitura pública: nota publicada visível apenas com link ativo", async () => {
  await comPapel("anon", null, async (c) => {
    const { rows } = await c.query("select id, titulo from notas")
    ok(
      rows.length === 1 && rows[0].id === notaA_pub,
      `anon deveria ver apenas a nota publicada com link (viu ${rows.length})`,
    )
  })
})

await teste("leitura pública: rascunho nunca é exposto, mesmo com link", async () => {
  await comPapel("authenticated", UID_A, async (c) => {
    await c.query(
      `insert into links (professor_id, tipo, nota_id, token, professor_nome)
       values ($1, 'nota', $2, 'tok-rascunho', 'Ana')`,
      [UID_A, notaA_rasc],
    )
  })
  await comPapel("anon", null, async (c) => {
    const { rows } = await c.query("select id from notas where id = $1", [notaA_rasc])
    ok(rows.length === 0, "rascunho com link ativo não deveria ser visível para anon")
  })
})

await teste("leitura pública: revogar o link esconde a nota", async () => {
  // nota isolada (sem turmas/disciplina) para o teste ser determinístico
  let id = ""
  await comPapel("authenticated", UID_A, async (c) => {
    const n = await c.query(
      "insert into notas (professor_id, titulo, status) values ($1, 'Só com link próprio', 'publicada') returning id",
      [UID_A],
    )
    id = n.rows[0].id
    await c.query(
      `insert into links (professor_id, tipo, nota_id, token) values ($1, 'nota', $2, 'tok-isolada')`,
      [UID_A, id],
    )
  })
  await comPapel("anon", null, async (c) => {
    const antes = await c.query("select id from notas where id = $1", [id])
    ok(antes.rows.length === 1, "nota com link próprio ativo deveria ser visível")
  })
  await comPapel("authenticated", UID_A, async (c) => {
    await c.query("update links set ativo = false where token = 'tok-isolada'")
  })
  await comPapel("anon", null, async (c) => {
    const depois = await c.query("select id from notas where id = $1", [id])
    ok(depois.rows.length === 0, "nota com link revogado não deveria ser visível")
  })
})

await teste("leitura pública: link de turma expõe apenas as notas da turma", async () => {
  // notas SEM disciplina, para o teste isolar o efeito do link de turma
  await comPapel("authenticated", UID_A, async (c) => {
    await c.query(
      `insert into notas (professor_id, titulo, status, turmas_ids, turmas_nomes)
       values ($1, 'Aula da turma 3A', 'publicada', $2::uuid[], $3::text[])`,
      [UID_A, [turmaA1], ["3A"]],
    )
    await c.query(
      `insert into notas (professor_id, titulo, status, turmas_ids, turmas_nomes)
       values ($1, 'Aula da turma 3B', 'publicada', $2::uuid[], $3::text[])`,
      [UID_A, [turmaA2], ["3B"]],
    )
  })
  await comPapel("anon", null, async (c) => {
    const { rows } = await c.query(
      "select titulo from notas where titulo like 'Aula da turma%' order by titulo",
    )
    const titulos = rows.map((r) => r.titulo)
    ok(titulos.includes("Aula da turma 3A"), "nota da turma do link deveria aparecer")
    ok(!titulos.includes("Aula da turma 3B"), "nota de outra turma não deveria aparecer")
  })
})

await teste("leitura pública: link de disciplina expõe apenas as notas da disciplina", async () => {
  await comPapel("authenticated", UID_A, async (c) => {
    // nota de A na disciplina Química (não coberta pelo link de Matemática)
    await c.query(
      `insert into notas (professor_id, titulo, status, disciplina_id, disciplina_nome)
       values ($1, 'Soluções químicas', 'publicada', $2, 'Química')`,
      [UID_A, discA2],
    )
  })
  await comPapel("anon", null, async (c) => {
    const { rows } = await c.query(
      "select titulo from notas where titulo in ('Função do 2º grau', 'Soluções químicas', 'Rascunho de prova')",
    )
    const titulos = rows.map((r) => r.titulo)
    ok(titulos.includes("Função do 2º grau"), "nota da disciplina do link deveria aparecer")
    ok(!titulos.includes("Soluções químicas"), "nota de outra disciplina não deveria aparecer")
    ok(!titulos.includes("Rascunho de prova"), "rascunho não deveria aparecer")
  })
})

await teste("leitura pública: nota publicada de outro professor não vaza", async () => {
  await comPapel("anon", null, async (c) => {
    const { rows } = await c.query("select id from notas where id = $1", [notaB_pub])
    ok(rows.length === 0, "nota de B (sem link) não deveria ser visível")
  })
})

// ------------------------------------------------------------
// gatilhos de denormalização
// ------------------------------------------------------------
await teste("gatilho sync_disciplina: renomear propaga para notas", async () => {
  await comPapel("authenticated", UID_A, async (c) => {
    await c.query("update disciplinas set nome = 'Matemática Aplicada' where id = $1", [discA])
    const { rows } = await c.query("select disciplina_nome from notas where id = $1", [notaA_pub])
    ok(rows[0].disciplina_nome === "Matemática Aplicada", "denormalização não propagou")
  })
})

await teste("gatilho sync_turma_nome: renomear propaga para notas", async () => {
  await comPapel("authenticated", UID_A, async (c) => {
    await c.query("update turmas set nome = '3A-Tarde' where id = $1", [turmaA1])
    const { rows } = await c.query("select turmas_nomes from notas where id = $1", [notaA_pub])
    ok(rows[0].turmas_nomes[0] === "3A-Tarde", "renome de turma não propagou")
  })
})

await teste(
  "gatilho sync_turma_removida: excluir turma limpa referências e mantém notas",
  async () => {
    await comPapel("authenticated", UID_A, async (c) => {
      await c.query("delete from turmas where id = $1", [turmaA1])
      const { rows } = await c.query("select turmas_ids, turmas_nomes from notas where id = $1", [
        notaA_pub,
      ])
      ok(rows[0].turmas_ids.length === 0, "turma_ids deveria ficar vazio")
      ok(rows[0].turmas_nomes.length === 0, "turmas_nomes deveria ficar vazio")
      const n = await c.query("select id from notas where id = $1", [notaA_pub])
      ok(n.rowCount === 1, "a nota deveria continuar existindo")
    })
  },
)

await teste("gatilho sync_professor_nome: nome do professor propaga para links", async () => {
  await comPapel("authenticated", UID_A, async (c) => {
    await c.query("update profiles set nome = 'Profa. Ana Maria' where id = $1", [UID_A])
    const { rows } = await c.query("select professor_nome from links where token = 'tok-nota-a'")
    ok(rows[0].professor_nome === "Profa. Ana Maria", "nome do professor não propagou para links")
  })
})

await teste("excluir nota derruba os links dela (cascade)", async () => {
  await comPapel("authenticated", UID_A, async (c) => {
    const n = await c.query(
      "insert into notas (professor_id, titulo, status) values ($1, 'Efêmera', 'publicada') returning id",
      [UID_A],
    )
    await c.query(
      `insert into links (professor_id, tipo, nota_id, token) values ($1, 'nota', $2, 'tok-efemera')`,
      [UID_A, n.rows[0].id],
    )
    await c.query("delete from notas where id = $1", [n.rows[0].id])
    const l = await c.query("select id from links where token = 'tok-efemera'")
    ok(l.rowCount === 0, "link deveria sumir junto com a nota")
  })
})

// ------------------------------------------------------------
// storage
// ------------------------------------------------------------
await teste("storage: bucket privado e políticas por pasta do professor", async () => {
  const adm = await superuser()
  try {
    const b = await adm.query("select public from storage.buckets where id = 'imagens'")
    ok(b.rows[0].public === false, "bucket deveria ser privado")
  } finally {
    await adm.end()
  }

  await comPapel("authenticated", UID_A, async (c) => {
    await c.query(
      `insert into storage.objects (bucket_id, name, owner) values ('imagens', $1, $2)`,
      [`${UID_A}/fig1.png`, UID_A],
    )
    const { rows } = await c.query("select name from storage.objects")
    ok(rows.length === 1 && rows[0].name.startsWith(UID_A), "A deveria ver apenas a própria pasta")
  })

  // A tenta subir objeto na pasta de B
  await comPapel("authenticated", UID_A, async (c) => {
    try {
      await c.query(
        `insert into storage.objects (bucket_id, name, owner) values ('imagens', $1, $2)`,
        [`${UID_B}/invasao.png`, UID_A],
      )
      throw new Error("upload na pasta de outro professor deveria ser bloqueado")
    } catch (e) {
      ok(
        e.message.includes("row-level security") || e.code === "42501",
        `esperava RLS: ${e.message}`,
      )
    }
  })

  // anon não sobe nada
  await espereNegado(
    "anon",
    null,
    `insert into storage.objects (bucket_id, name) values ('imagens', 'x/y.png')`,
  )

  // service_role vê tudo
  await comPapel("service_role", null, async (c) => {
    const { rows } = await c.query("select name from storage.objects")
    ok(rows.length === 1, "service_role deveria ver todos os objetos")
  })
})

// ------------------------------------------------------------
// service_role / ciclo de vida da conta
// ------------------------------------------------------------
await teste("service_role enxerga dados de todos os professores (bypass RLS)", async () => {
  await comPapel("service_role", null, async (c) => {
    const { rows } = await c.query("select distinct professor_id from notas order by professor_id")
    ok(rows.length === 2, "service_role deveria ver notas de A e B")
  })
})

await teste("excluir a conta do professor A apaga TODOS os seus dados e preserva B", async () => {
  const adm = await superuser()
  try {
    await adm.query("delete from auth.users where id = $1", [UID_A])
    const p = await adm.query("select count(*)::int as n from profiles where id = $1", [UID_A])
    ok(p.rows[0].n === 0, "perfil de A deveria ter caído")
    const n = await adm.query("select count(*)::int as n from notas where professor_id = $1", [
      UID_A,
    ])
    ok(n.rows[0].n === 0, "notas de A deveriam ter caído")
    const l = await adm.query("select count(*)::int as n from links where professor_id = $1", [
      UID_A,
    ])
    ok(l.rows[0].n === 0, "links de A deveriam ter caído")
    const nb = await adm.query("select count(*)::int as n from notas where professor_id = $1", [
      UID_B,
    ])
    ok(nb.rows[0].n === 1, "nota de B deveria continuar existindo")
  } finally {
    await adm.end()
  }
})

// ------------------------------------------------------------
// resumo
// ------------------------------------------------------------
console.log("")
if (falhas.length === 0) {
  console.log(`✓ RLS: ${passou} testes passaram.`)
  process.exit(0)
} else {
  console.error(`✗ ${falhas.length} teste(s) falharam (de ${passou + falhas.length}):`)
  for (const f of falhas) console.error(`  • ${f.nome}\n    ${f.erro}`)
  process.exit(1)
}
