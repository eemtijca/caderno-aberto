// Semeia massa de desenvolvimento realista no Caderno Aberto, de forma determinística e idempotente.
// Uso: SEED_PERFIL=leve|padrao|pesado, SEED_SEMENTE e SEED_LIMPAR no ambiente, depois: node scripts/seed.mjs
import "dotenv/config";
import { randomBytes, scrypt as scryptCb } from "node:crypto";
import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { deflateSync } from "node:zlib";
import pg from "pg";
import { DISCIPLINAS, PROFESSORES, SENHA_SEMENTE, TURMAS } from "./seed-dados.mjs";

const scrypt = promisify(scryptCb);

// Mesmos parâmetros de src/lib/auth/senha.ts e scripts/criar-admin.mjs.
const N = 131072;
const R = 8;
const P = 1;

// Notas por disciplina em cada perfil: leve 64, padrao 80 e pesado 88 no total.
const NOTAS_POR_PERFIL = { leve: 8, padrao: 10, pesado: 11 };

const PREFIXO_TOKEN = "semente-";

const PERFIL = (process.env.SEED_PERFIL ?? "padrao").trim().toLowerCase();
const SEMENTE = (process.env.SEED_SEMENTE ?? "caderno-aberto").trim() || "caderno-aberto";
const LIMPAR = (process.env.SEED_LIMPAR ?? "").trim().toLowerCase() === "true";
const DRIVER = (process.env.STORAGE_DRIVER ?? "disk").trim();
const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "/data/imagens";

if (!(PERFIL in NOTAS_POR_PERFIL)) {
  console.error(`[semente] SEED_PERFIL inválido: ${PERFIL}. Use leve, padrao ou pesado.`);
  process.exit(1);
}
const NOTAS_POR_DISCIPLINA = NOTAS_POR_PERFIL[PERFIL];

const CORES_HEX = {
  verde: "#008241",
  teal: "#0d9488",
  violeta: "#7c3aed",
  rosa: "#e11d48",
  ambar: "#d97706",
  laranja: "#ea580c",
  ciano: "#0891b2",
  fucsia: "#c026d3",
  lima: "#65a30d",
  pedra: "#57534e",
};

/** PRNG próprio: mesma semente produz a mesma sequência, sem Math.random. */
function xmur3(texto) {
  let h = 1779033703 ^ texto.length;
  for (let i = 0; i < texto.length; i++) {
    h = Math.imul(h ^ texto.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

function mulberry32(a) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fluxo determinístico por escopo: cada entidade tem o seu, sem depender da ordem. */
function rng(escopo) {
  return mulberry32(xmur3(`${SEMENTE}|${escopo}`)());
}

// Os ids da semente são estáveis entre execuções e entre SEED_SEMENTE diferentes:
// a semente muda o conteúdo sorteado, não a identidade dos registros, o que mantém
// a idempotência e permite atualizar a massa no lugar em vez de acumular duplicatas.
function uuidDaSemente(escopo) {
  const rand = mulberry32(xmur3(`caderno-aberto|uuid|${escopo}`)());
  const bytes = Buffer.from(Array.from({ length: 16 }, () => Math.floor(rand() * 256)));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function normalizarTexto(texto) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function slugificar(texto) {
  return (
    normalizarTexto(texto)
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "nota"
  );
}

function mascarar(url) {
  return url.replace(/(:\/\/[^:]+:)[^@]+@/, "$1***@");
}

// Espelha src/lib/notas/texto.ts para gravar o índice de busca como o aplicativo faria.
function textoPuro(texto) {
  return texto
    .replace(/\$\$([^$]+)\$\$/g, " $1 ")
    .replace(/\$([^$\n]+)\$/g, " $1 ")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*\n]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\\(?:resultado|dest|textbf|textit)\{([^}]*)\}/g, "$1")
    .replace(/\\[a-zA-Z]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extrairTextoBlocos(blocos) {
  const partes = [];
  const visitaFilhos = (filhos) => {
    for (const filho of filhos) {
      if (filho.tipo === "paragrafo") {
        if (filho.rotulo?.texto) partes.push(filho.rotulo.texto);
        partes.push(textoPuro(filho.texto));
      } else if (filho.tipo === "formula") partes.push(filho.latex);
      else if (filho.tipo === "lista") partes.push(...filho.itens.map(textoPuro));
      else if (filho.tipo === "tabela") {
        for (const linha of filho.linhas) partes.push(...linha.map(textoPuro));
      } else if (filho.tipo === "chamada") partes.push(textoPuro(filho.texto));
    }
  };
  const visita = (lista) => {
    for (const bloco of lista) {
      switch (bloco.tipo) {
        case "secao":
          partes.push(bloco.titulo);
          break;
        case "paragrafo":
          if (bloco.rotulo?.texto) partes.push(bloco.rotulo.texto);
          partes.push(textoPuro(bloco.texto));
          break;
        case "formula":
          partes.push(bloco.latex);
          break;
        case "lista":
          partes.push(...bloco.itens.map(textoPuro));
          break;
        case "tabela":
          for (const linha of bloco.linhas) partes.push(...linha.map(textoPuro));
          break;
        case "chamada":
          partes.push(textoPuro(bloco.texto));
          break;
        case "figura":
          partes.push(textoPuro(bloco.legenda));
          break;
        case "tikz":
          partes.push(textoPuro(bloco.legenda), bloco.codigo);
          break;
        case "copiar":
        case "exemplo":
        case "dica":
          partes.push(bloco.rotulo);
          visitaFilhos(bloco.filhos);
          break;
        case "exercicios":
          partes.push(bloco.rotulo, bloco.gabarito);
          for (const nivel of bloco.niveis) {
            partes.push(`Nível ${nivel.numero} ${nivel.titulo}`);
            for (const questao of nivel.questoes) {
              partes.push(textoPuro(questao.enunciado));
              partes.push(...questao.alternativas.map(textoPuro));
            }
          }
          break;
        default:
          break;
      }
    }
  };
  visita(blocos);
  return partes.filter(Boolean).join(" \u00b7 ");
}

function textoDeBusca(nota) {
  const meta = [
    nota.titulo,
    nota.sobre,
    nota.habilidades,
    nota.disciplinaNome,
    ...nota.turmasNomes.map((nome) => `${nome} ${nota.serie}`),
  ];
  return normalizarTexto([...meta, extrairTextoBlocos(nota.blocos)].join(" \u00b7 "));
}

async function hashSenha(senha) {
  const sal = randomBytes(16);
  const chave = await scrypt(senha, sal, 64, { N, r: R, p: P, maxmem: 256 * 1024 * 1024 });
  return `scrypt$${N}$${R}$${P}$${sal.toString("hex")}$${chave.toString("hex")}`;
}

/** Monta os blocos variados de uma aula, com ids únicos por nota. */
function montarBlocos(aula, { prefixo, urlFigura }) {
  const blocos = [];
  let contador = 0;
  const id = () => `${prefixo}-b${++contador}`;
  const idFilho = () => `${prefixo}-f${++contador}`;

  blocos.push({ id: id(), tipo: "secao", titulo: aula.titulo });
  blocos.push({ id: id(), tipo: "paragrafo", texto: aula.intro, rotulo: null });

  const conceito = [
    { id: idFilho(), tipo: "paragrafo", texto: aula.definicao, rotulo: { tipo: "definicao" } },
  ];
  if (aula.formula) conceito.push({ id: idFilho(), tipo: "formula", latex: aula.formula });
  if (aula.itens) conceito.push({ id: idFilho(), tipo: "lista", itens: aula.itens });
  if (aula.chamada) {
    conceito.push({
      id: idFilho(),
      tipo: "chamada",
      estilo: aula.chamada.estilo,
      texto: aula.chamada.texto,
    });
  }
  blocos.push({ id: id(), tipo: "copiar", rotulo: "Conceito-chave", filhos: conceito });

  if (aula.figura && urlFigura) {
    blocos.push({ id: id(), tipo: "figura", url: urlFigura, legenda: aula.figura });
  }
  if (aula.tabela) {
    blocos.push({ id: id(), tipo: "tabela", comCabecalho: true, linhas: aula.tabela });
  }

  if (aula.exemplo) {
    const exemplo = [{ id: idFilho(), tipo: "paragrafo", texto: aula.exemplo }];
    if (aula.resolucao) {
      exemplo.push({
        id: idFilho(),
        tipo: "paragrafo",
        texto: aula.resolucao,
        rotulo: { tipo: "resolucao" },
      });
    }
    blocos.push({ id: id(), tipo: "exemplo", rotulo: "Exemplo resolvido", filhos: exemplo });
  }

  if (aula.dica) {
    blocos.push({
      id: id(),
      tipo: "dica",
      rotulo: "Dica",
      filhos: [{ id: idFilho(), tipo: "paragrafo", texto: aula.dica }],
    });
  }

  const numeroAberta = aula.quiz.length + 1;
  blocos.push({
    id: id(),
    tipo: "exercicios",
    rotulo: "Exercícios propostos",
    niveis: [
      {
        numero: 1,
        titulo: "Conceitos",
        questoes: aula.quiz.map((questao, indice) => ({
          id: `${prefixo}-q${indice + 1}`,
          enunciado: questao.e,
          alternativas: questao.alt,
          correta: questao.correta,
        })),
      },
      {
        numero: 2,
        titulo: "Aplicação",
        questoes: [
          {
            id: `${prefixo}-q${numeroAberta}`,
            enunciado: aula.aberta,
            alternativas: [],
            correta: null,
          },
        ],
      },
      { numero: 3, titulo: "Síntese", questoes: [] },
    ],
    gabarito: aula.gabarito ? `Questão ${numeroAberta}: ${aula.gabarito}` : "",
  });

  return blocos;
}

/** PNG mínimo com zlib nativo, sem dependência nova. */
const TABELA_CRC = (() => {
  const tabela = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    tabela[n] = c >>> 0;
  }
  return tabela;
})();

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = TABELA_CRC[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function blocoPng(tipo, dados) {
  const comprimento = Buffer.alloc(4);
  comprimento.writeUInt32BE(dados.length, 0);
  const corpo = Buffer.concat([Buffer.from(tipo, "ascii"), dados]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(corpo), 0);
  return Buffer.concat([comprimento, corpo, crc]);
}

function pngDe(largura, altura, pintar) {
  const pixels = Buffer.alloc(largura * altura * 3);
  for (let y = 0; y < altura; y++) {
    for (let x = 0; x < largura; x++) {
      const [r, g, b] = pintar(x, y);
      const indice = (y * largura + x) * 3;
      pixels[indice] = r;
      pixels[indice + 1] = g;
      pixels[indice + 2] = b;
    }
  }
  const linhas = [];
  for (let y = 0; y < altura; y++) {
    linhas.push(Buffer.from([0]), pixels.subarray(y * largura * 3, (y + 1) * largura * 3));
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(largura, 0);
  ihdr.writeUInt32BE(altura, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    blocoPng("IHDR", ihdr),
    blocoPng("IDAT", deflateSync(Buffer.concat(linhas), { level: 9 })),
    blocoPng("IEND", Buffer.alloc(0)),
  ]);
}

function hexParaRgb(hex) {
  const valor = parseInt(hex.replace("#", ""), 16);
  return [(valor >> 16) & 0xff, (valor >> 8) & 0xff, valor & 0xff];
}

/** Gráfico de barras simples para as figuras das notas. */
function pngDoGrafico(valores, corHex) {
  const largura = 320;
  const altura = 180;
  const margem = { esquerda: 32, direita: 14, topo: 14, base: 26 };
  const cor = hexParaRgb(corHex);
  const maximo = Math.max(...valores, 1);
  const larguraUtil = largura - margem.esquerda - margem.direita;
  const alturaUtil = altura - margem.topo - margem.base;
  const passo = larguraUtil / valores.length;
  return pngDe(largura, altura, (x, y) => {
    const base = altura - margem.base;
    if (x === margem.esquerda - 1 && y >= margem.topo && y <= base) return [148, 163, 184];
    if (y === base && x >= margem.esquerda - 1 && x <= largura - margem.direita) {
      return [148, 163, 184];
    }
    const indice = Math.floor((x - margem.esquerda) / passo);
    if (indice >= 0 && indice < valores.length) {
      const topo = base - Math.round((valores[indice] / maximo) * alturaUtil);
      const inicio = Math.round(margem.esquerda + indice * passo + passo * 0.2);
      const fim = Math.round(margem.esquerda + (indice + 1) * passo - passo * 0.2);
      if (x >= inicio && x < fim && y >= topo && y < base) return cor;
    }
    return [248, 250, 252];
  });
}

function valoresDaFigura(escopo) {
  const rand = rng(`figura|${escopo}`);
  return Array.from({ length: 6 }, () => 3 + Math.floor(rand() * 7));
}

/** Monta a lista completa de notas do perfil antes de gravar, para ajustar os status. */
function montarNotas(disciplinas, turmas) {
  const notas = [];
  for (const disciplina of disciplinas) {
    const aulas = disciplina.aulas.slice(0, NOTAS_POR_DISCIPLINA);
    const registros = aulas.map((aula) => {
      const chave = `${disciplina.chave}|${aula.titulo}`;
      const randStatus = rng(`status|${chave}`);
      const randTurmas = rng(`turmas|${chave}`);
      const id = uuidDaSemente(`nota|${chave}`);
      const status = aula.destaque ? "publicada" : randStatus() < 0.7 ? "publicada" : "rascunho";
      const daSerie = turmas.filter(
        (turma) => turma.professor === disciplina.professor && turma.serie === aula.serie,
      );
      const quantidade = randTurmas() < 0.3 ? 2 : 1;
      const selecionadas = daSerie.slice(0, Math.min(quantidade, daSerie.length));
      const caminhoImagem =
        aula.figura && DRIVER === "disk"
          ? `${disciplina.professorId}/${PREFIXO_TOKEN}${slugificar(aula.titulo)}-${slugificar(disciplina.chave)}.png`
          : null;
      return {
        id,
        chave,
        professorId: disciplina.professorId,
        professorNome: disciplina.professorNome,
        disciplinaId: disciplina.id,
        disciplinaNome: disciplina.nome,
        disciplinaCor: disciplina.cor,
        disciplinaChave: disciplina.chave,
        aula,
        serie: aula.serie,
        turmas: selecionadas,
        status,
        caminhoImagem,
      };
    });

    // Garante mistura de publicadas e rascunhos em cada disciplina.
    if (!registros.some((registro) => registro.status === "publicada")) {
      registros[0].status = "publicada";
    }
    if (!registros.some((registro) => registro.status === "rascunho")) {
      const alvo = [...registros].reverse().find((registro) => !registro.aula.destaque);
      if (alvo) alvo.status = "rascunho";
    }
    notas.push(...registros);
  }

  // Garante ao menos uma nota publicada por professor e série, para os links de turma.
  const grupos = new Map();
  for (const nota of notas) {
    const chave = `${nota.professorId}|${nota.serie}`;
    grupos.set(chave, [...(grupos.get(chave) ?? []), nota]);
  }
  for (const lista of grupos.values()) {
    if (!lista.some((nota) => nota.status === "publicada")) lista[0].status = "publicada";
  }
  return notas;
}

async function upsertProfessor(cliente, professor) {
  const senhaHash = await hashSenha(SENHA_SEMENTE);
  const id = uuidDaSemente(`professor|${professor.chave}`);
  const { rows } = await cliente.query(
    `insert into public.usuarios (id, email, senha_hash, papel, ativado_em)
     values ($1, $2, $3, 'professor', now())
     on conflict (lower(email)) do update
       set senha_hash = excluded.senha_hash,
           ativado_em = coalesce(public.usuarios.ativado_em, now())
     returning id`,
    [id, professor.email, senhaHash],
  );
  const idFinal = rows[0].id;
  await cliente.query(
    `insert into public.profiles (id, nome, email, escola)
     values ($1, $2, $3, $4)
     on conflict (id) do update
       set nome = excluded.nome, email = excluded.email, escola = excluded.escola`,
    [idFinal, professor.nome, professor.email, professor.escola],
  );
  return idFinal;
}

async function upsertDisciplina(cliente, disciplina, professorId) {
  const id = uuidDaSemente(`disciplina|${disciplina.chave}`);
  const { rows } = await cliente.query(
    `insert into public.disciplinas (id, professor_id, nome, cor, icone, ordem)
     values ($1, $2, $3, $4, $5, $6)
     on conflict (professor_id, nome) do update
       set cor = excluded.cor, icone = excluded.icone, ordem = excluded.ordem
     returning id`,
    [id, professorId, disciplina.nome, disciplina.cor, disciplina.icone, disciplina.ordem],
  );
  return rows[0].id;
}

async function upsertTurma(cliente, turma, professorId, anoLetivo) {
  const id = uuidDaSemente(`turma|${turma.professor}|${turma.nome}`);
  const { rows } = await cliente.query(
    `insert into public.turmas (id, professor_id, nome, serie, ano_letivo)
     values ($1, $2, $3, $4, $5)
     on conflict (professor_id, nome, ano_letivo) do update
       set serie = excluded.serie
     returning id`,
    [id, professorId, turma.nome, turma.serie, anoLetivo],
  );
  return rows[0].id;
}

async function gravarNota(cliente, nota, anoLetivo) {
  const randAparencia = rng(`aparencia|${nota.chave}`);
  const urlFigura = nota.caminhoImagem
    ? `/api/imagens?path=${encodeURIComponent(nota.caminhoImagem)}`
    : null;
  const blocos = montarBlocos(nota.aula, {
    prefixo: nota.id.slice(0, 8),
    urlFigura,
  });

  const aparencias = [{}, {}, {}, { fonte: "serifada" }, { escala: "g" }, { entrelinha: "ampla" }];
  const aparencia = aparencias[Math.floor(randAparencia() * aparencias.length)];
  const dia = 3 + Math.floor(rng(`data|${nota.chave}`)() * 22);
  const mes = String(nota.aula.mes).padStart(2, "0");
  const diaTexto = String(dia).padStart(2, "0");
  const criadoEm = `${anoLetivo}-${mes}-${diaTexto} 08:00:00-03`;
  const atualizadoEm = `${anoLetivo}-${mes}-${diaTexto} 14:30:00-03`;

  const turmasIds = nota.turmas.map((turma) => turma.id);
  const turmasNomes = nota.turmas.map((turma) => turma.nome);
  const busca = textoDeBusca({
    titulo: nota.aula.titulo,
    sobre: nota.aula.sobre,
    habilidades: nota.aula.habilidades,
    disciplinaNome: nota.disciplinaNome,
    serie: nota.serie,
    turmasNomes,
    blocos,
  });

  await cliente.query(
    `insert into public.notas (
       id, professor_id, titulo, disciplina_id, disciplina_nome, disciplina_cor,
       turmas_ids, turmas_nomes, ano_letivo, mes, sobre, habilidades, status,
       blocos, aparencia, busca, criado_em, atualizado_em
     ) values (
       $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
     )
     on conflict (id) do update set
       professor_id = excluded.professor_id,
       titulo = excluded.titulo,
       disciplina_id = excluded.disciplina_id,
       disciplina_nome = excluded.disciplina_nome,
       disciplina_cor = excluded.disciplina_cor,
       turmas_ids = excluded.turmas_ids,
       turmas_nomes = excluded.turmas_nomes,
       ano_letivo = excluded.ano_letivo,
       mes = excluded.mes,
       sobre = excluded.sobre,
       habilidades = excluded.habilidades,
       status = excluded.status,
       blocos = excluded.blocos,
       aparencia = excluded.aparencia,
       busca = excluded.busca`,
    [
      nota.id,
      nota.professorId,
      nota.aula.titulo,
      nota.disciplinaId,
      nota.disciplinaNome,
      nota.disciplinaCor,
      turmasIds,
      turmasNomes,
      anoLetivo,
      nota.aula.mes,
      nota.aula.sobre,
      nota.aula.habilidades,
      nota.status,
      JSON.stringify(blocos),
      JSON.stringify(aparencia),
      busca,
      criadoEm,
      atualizadoEm,
    ],
  );
}

async function upsertLink(cliente, { id, professorId, tipo, alvo, token, professorNome, nome }) {
  const { rows } = await cliente.query(
    `insert into public.links (
       id, professor_id, tipo, nota_id, turma_id, disciplina_id, token, professor_nome, nome, ativo
     ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
     on conflict (id) do update set
       professor_id = excluded.professor_id,
       tipo = excluded.tipo,
       nota_id = excluded.nota_id,
       turma_id = excluded.turma_id,
       disciplina_id = excluded.disciplina_id,
       token = excluded.token,
       professor_nome = excluded.professor_nome,
       nome = excluded.nome,
       ativo = true
     returning id`,
    [
      id,
      professorId,
      tipo,
      tipo === "nota" ? alvo : null,
      tipo === "turma" ? alvo : null,
      tipo === "disciplina" ? alvo : null,
      token,
      professorNome,
      nome,
    ],
  );
  return rows[0].id;
}

async function gravarImagens(imagens) {
  let gravadas = 0;
  const falhas = [];
  for (const imagem of imagens) {
    try {
      const destino = path.join(UPLOAD_DIR, imagem.caminho);
      await mkdir(path.dirname(destino), { recursive: true });
      await writeFile(destino, imagem.bytes);
      gravadas++;
    } catch (erro) {
      falhas.push(`${imagem.caminho}: ${erro.message}`);
    }
  }
  return { gravadas, falhas };
}

async function removerImagensDosProfessores(ids) {
  let removidas = 0;
  for (const id of ids) {
    const pasta = path.join(UPLOAD_DIR, id);
    const nomes = await readdir(pasta).catch(() => []);
    for (const nome of nomes) {
      if (!nome.startsWith(PREFIXO_TOKEN)) continue;
      await rm(path.join(pasta, nome), { force: true });
      removidas++;
    }
    const restantes = await readdir(pasta).catch(() => null);
    if (restantes && restantes.length === 0) {
      await rm(pasta, { recursive: true, force: true }).catch(() => undefined);
    }
  }
  return removidas;
}

async function limpar(cliente) {
  const emails = PROFESSORES.map((professor) => professor.email);
  const { rows } = await cliente.query(
    "select id from public.usuarios where lower(email) = any($1::text[])",
    [emails],
  );
  const ids = rows.map((linha) => linha.id);

  await cliente.query("begin");
  const links = await cliente.query("delete from public.links where token like $1 returning id", [
    `${PREFIXO_TOKEN}%`,
  ]);
  const usuarios = await cliente.query(
    "delete from public.usuarios where lower(email) = any($1::text[]) returning id",
    [emails],
  );
  await cliente.query("commit");

  let imagens = 0;
  if (DRIVER === "disk" && ids.length > 0) {
    imagens = await removerImagensDosProfessores(ids);
  } else if (DRIVER !== "disk") {
    console.warn(
      `[semente] Aviso: STORAGE_DRIVER=${DRIVER} não é disk; imagens em ${UPLOAD_DIR} não foram removidas.`,
    );
  }

  console.log(
    `[semente] Limpeza concluída: ${usuarios.rowCount} professores, ${links.rowCount} links e ${imagens} imagens.`,
  );
  console.log("[semente] Nenhum dado de teste (captura_/e2e) ou real foi tocado.");
}

async function semear(cliente) {
  const anoLetivo = new Date().getFullYear();
  const imagens = [];
  const resumo = {
    professores: 0,
    disciplinas: 0,
    turmas: 0,
    notas: 0,
    publicadas: 0,
    rascunhos: 0,
    links: 0,
    figuras: 0,
  };

  await cliente.query("begin");
  let figurasIgnoradas = 0;
  try {
    const professoresCriados = [];
    for (const professor of PROFESSORES) {
      const id = await upsertProfessor(cliente, professor);
      professoresCriados.push({ ...professor, id });
      resumo.professores++;
    }

    const turmasCriadas = [];
    for (const turma of TURMAS) {
      const professor = professoresCriados.find((item) => item.chave === turma.professor);
      const id = await upsertTurma(cliente, turma, professor.id, anoLetivo);
      turmasCriadas.push({ ...turma, id, professorId: professor.id });
      resumo.turmas++;
    }

    const disciplinasCriadas = [];
    for (const disciplina of DISCIPLINAS) {
      const professor = professoresCriados.find((item) => item.chave === disciplina.professor);
      const id = await upsertDisciplina(cliente, disciplina, professor.id);
      disciplinasCriadas.push({
        ...disciplina,
        id,
        professorId: professor.id,
        professorNome: professor.nome,
      });
      resumo.disciplinas++;
    }

    const notas = montarNotas(disciplinasCriadas, turmasCriadas);
    for (const nota of notas) {
      await gravarNota(cliente, nota, anoLetivo);
      resumo.notas++;
      if (nota.status === "publicada") resumo.publicadas++;
      else resumo.rascunhos++;
      if (nota.caminhoImagem) {
        const cor = CORES_HEX[nota.disciplinaCor] ?? CORES_HEX.verde;
        imagens.push({
          caminho: nota.caminhoImagem,
          bytes: pngDoGrafico(valoresDaFigura(nota.chave), cor),
        });
        resumo.figuras++;
      } else if (nota.aula.figura) {
        figurasIgnoradas++;
      }
    }

    // Remove notas da semente que ficaram fora do perfil atual, sem tocar em outras.
    for (const disciplina of disciplinasCriadas) {
      const selecionadas = new Set(
        disciplina.aulas
          .slice(0, NOTAS_POR_DISCIPLINA)
          .map((aula) => uuidDaSemente(`nota|${disciplina.chave}|${aula.titulo}`)),
      );
      const excedentes = disciplina.aulas
        .map((aula) => uuidDaSemente(`nota|${disciplina.chave}|${aula.titulo}`))
        .filter((id) => !selecionadas.has(id));
      if (excedentes.length > 0) {
        await cliente.query(
          "delete from public.notas where professor_id = $1 and id = any($2::uuid[])",
          [disciplina.professorId, excedentes],
        );
      }
    }

    // Links públicos determinísticos: uma turma, uma disciplina e as notas destaque.
    for (const turma of turmasCriadas) {
      await upsertLink(cliente, {
        id: uuidDaSemente(`link|turma|${turma.professor}|${turma.nome}`),
        professorId: turma.professorId,
        tipo: "turma",
        alvo: turma.id,
        token: `${PREFIXO_TOKEN}turma-${slugificar(turma.nome)}`,
        professorNome: professoresCriados.find((item) => item.chave === turma.professor).nome,
        nome: `Turma ${turma.nome}`,
      });
      resumo.links++;
    }
    for (const disciplina of disciplinasCriadas) {
      await upsertLink(cliente, {
        id: uuidDaSemente(`link|disciplina|${disciplina.chave}`),
        professorId: disciplina.professorId,
        tipo: "disciplina",
        alvo: disciplina.id,
        token: `${PREFIXO_TOKEN}disciplina-${slugificar(disciplina.chave)}`,
        professorNome: disciplina.professorNome,
        nome: disciplina.nome,
      });
      resumo.links++;
    }
    for (const nota of notas.filter((item) => item.aula.destaque)) {
      await upsertLink(cliente, {
        id: uuidDaSemente(`link|nota|${nota.chave}`),
        professorId: nota.professorId,
        tipo: "nota",
        alvo: nota.id,
        token: `${PREFIXO_TOKEN}nota-${slugificar(nota.aula.titulo)}`,
        professorNome: nota.professorNome,
        nome: nota.aula.titulo,
      });
      resumo.links++;
    }

    await cliente.query("commit");
  } catch (erro) {
    await cliente.query("rollback").catch(() => undefined);
    throw erro;
  }

  let gravadas = 0;
  if (DRIVER === "disk") {
    const resultado = await gravarImagens(imagens);
    gravadas = resultado.gravadas;
    for (const falha of resultado.falhas) {
      console.warn(`[semente] Aviso: falha ao gravar a imagem ${falha}`);
    }
  } else if (figurasIgnoradas > 0) {
    console.warn(
      `[semente] Aviso: STORAGE_DRIVER=${DRIVER} não é disk; ${figurasIgnoradas} imagens foram ignoradas.`,
    );
  }

  console.log(`[semente] Perfil: ${PERFIL} (${NOTAS_POR_DISCIPLINA} notas por disciplina)`);
  console.log(`[semente] Semente: ${SEMENTE}`);
  console.log(`[semente] Professores: ${resumo.professores}`);
  console.log(`[semente] Disciplinas: ${resumo.disciplinas}`);
  console.log(`[semente] Turmas: ${resumo.turmas}`);
  console.log(
    `[semente] Notas: ${resumo.notas} (${resumo.publicadas} publicadas, ${resumo.rascunhos} rascunhos)`,
  );
  console.log(`[semente] Links públicos: ${resumo.links}`);
  console.log(
    `[semente] Figuras: ${resumo.figuras} geradas, ${gravadas} gravadas em ${UPLOAD_DIR}`,
  );
  console.log(`[semente] Conta de acesso: ${PROFESSORES[0].email} com a senha ${SENHA_SEMENTE}`);
  console.log("[semente] Links de exemplo: /l/semente-nota-leis-de-newton e /l/semente-turma-1a");
}

async function main() {
  const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!url) {
    console.error("[semente] DIRECT_URL/DATABASE_URL não definida.");
    process.exit(1);
  }

  const cliente = new pg.Client({ connectionString: url });
  try {
    await cliente.connect();
  } catch (erro) {
    console.error("[semente] Sem ligação ao banco:", erro.message);
    process.exit(2);
  }

  try {
    if (LIMPAR) {
      await limpar(cliente);
    } else {
      await semear(cliente);
    }
    console.log(`[semente] Banco: ${mascarar(url)}`);
    process.exit(0);
  } catch (erro) {
    console.error("[semente] Falha:", erro.message);
    console.error("[semente] Verifique se as migrações foram aplicadas.");
    process.exit(1);
  } finally {
    await cliente.end().catch(() => undefined);
  }
}

const executadoDireto =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (executadoDireto) {
  await main();
}

export { pngDoGrafico, montarBlocos, montarNotas, rng, slugificar, textoDeBusca, uuidDaSemente };
