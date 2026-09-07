# Caderno Aberto

Plataforma web gratuita, multiusuário e mobile-first destinada a professores do ensino médio para a elaboração de notas de aula de qualquer disciplina, com entrega aos alunos por meio de links únicos e gerenciáveis.

O professor cria uma conta, utiliza um editor visual de blocos (caixas COPIAR, exemplos resolvidos, dicas, exercícios em três níveis com gabarito, fórmulas com LaTeX) e a plataforma gera, a partir da mesma fonte, os seguintes artefatos:

| Artefato              | Descrição                                                                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Versão web responsiva | Página de leitura mobile-first com KaTeX, tema claro/escuro, gabarito ocultável e quiz interativo, entregue aos alunos por link controlável |
| PDF de impressão (A4) | Layout em duas colunas com as caixas coloridas, gerado pelo navegador (Ctrl+P) a partir da vista de leitura                                 |
| LaTeX (.tex)          | Documento **autocontido** (só pacotes padrão do Overleaf/TeX Live, sem arquivo .cls externo) reproduzindo as caixas coloridas em A4         |
| Markdown (.md)        | Formato de intercâmbio legível, com importação de volta ao aplicativo (round-trip completo, incluindo aparência)                            |
| JSON (.json)          | Dados completos da nota (incluindo blocos) para backup e migração                                                                           |

## Recursos

### Organização

- Início com saudação, contadores clicáveis (notas, publicadas, disciplinas, links), notas do mês e últimas edições.
- Notas em grade de cartões com busca local, filtros por disciplina, ano letivo, mês e turma, e contagem de resultados.
- Organização por ano letivo, com acordeão por turma (agrupado por mês) e cartões por disciplina, além do grupo de notas sem turma.
- Busca global (`Ctrl/Cmd+K`) com debounce, mínimo de 2 caracteres e tolerância a acentos, mostrando campo de origem e trecho contextual.

### Editor de blocos

- 12 tipos de bloco: seção numerada, parágrafo, fórmula em destaque, lista, tabela, chamada, figura, diagrama TikZ, COPIAR, exemplo, dica e exercícios.
- Caixas COPIAR, exemplo e dica com blocos filhos (parágrafo, fórmula, lista, tabela, chamada).
- Exercícios em 3 níveis renomeáveis (padrão Conceitos, Aplicação e Síntese), com questões abertas ou de múltipla escolha (até 5 alternativas), marcação da correta e gabarito manual ou automático.
- Parágrafo com rótulos fixos (Definição, Fórmulas, Relações, Modelo básico, Resolução) ou rótulo livre; chamada em 3 estilos (Atenção, No dia a dia, Símbolos e unidades).
- Tabela com linhas e colunas editáveis e primeira linha opcional como cabeçalho; figura por upload com compressão ou URL, com legenda.
- Barra de formato inline (negrito, itálico, fórmula `$…$`, destaque `\resultado{…}`, química `$\ce{…}$`) e prévia KaTeX ao vivo.
- Reordenação por arrastar e soltar (mouse e teclado), botões de mover, duplicar e excluir, paleta de inserção contextual.
- Salvamento automático com indicador de estado; título editável na barra; ações de ler, exportar, compartilhar, duplicar (a cópia abre como rascunho), alternar rascunho e publicada, e excluir com confirmação.
- Metadados por nota: disciplina, ano letivo, mês, turmas, resumo "Sobre" e habilidades BNCC/ENEM.
- Aparência por nota: 5 fontes, 4 tamanhos e 3 entrelinhas, aplicadas ao professor, ao aluno e à impressão.
- Diálogo Nova nota com título (mínimo 2 caracteres), disciplina (seleção ou criação inline com cor e ícone), ano, mês, turmas opcionais e interruptor "Começar do modelo".

### Exportação e impressão

- Do editor: arquivo para impressão (`.tex`), arquivo de texto (`.md`) e backup da nota (`.json`), todos anexados pelo slug da nota.
- Da leitura (professor e aluno): botão Imprimir/PDF com layout A4 em duas colunas e ocultação de barras e rodapés; alternativas do quiz impressas como texto.

### Links únicos para os alunos

- Compartilhamento de uma nota (somente publicadas), de uma turma inteira ou de uma disciplina completa, com nome opcional; a criação já copia o endereço.
- Gestão por cartão ou pelo diálogo rápido, sem sair da leitura: copiar, abrir como aluno, renomear, definir expiração, pausar e reativar, regenerar o endereço (invalida o anterior) e excluir com confirmação.
- Contador de acessos por link e aviso quando a nota-alvo ainda é rascunho.
- Endereço em caminho real (`/l/<token>`): WhatsApp, Telegram e redes mostram **preview com imagem, título e descrição gerados por nota** (OpenGraph). Links antigos em `/#/l/<token>` continuam funcionando.
- Rascunhos nunca ficam visíveis; links pausados, expirados ou revogados exibem a mensagem "Link indisponível".

### Conta

- Perfil com nome e escola (exibidos nas notas e impressos) e e-mail.
- Segurança com troca de senha (mínimo 6 caracteres, com confirmação) e troca de e-mail com confirmação por link no novo endereço.
- Disciplinas com nome, cor e ícone gráfico, contador de notas e renomeação; excluir preserva as notas (só desvincula).
- Turmas com nome, série e ano letivo, agrupadas por ano; excluir preserva as notas.
- Backup completo em um único arquivo JSON (disciplinas, turmas, notas, links e imagens em base64), com restauração substitutiva e importação de nota única (`.md` ou `.json`).
- Exclusão de conta em 2 etapas (aceite, palavra EXCLUIR e senha) com carência de 24 horas, banner global de restauração e desativação dos links no período.

### Vista do aluno (sem login)

- Acesso por link único `/l/<token>`; coleções de turma e disciplina abrem lista de aulas com busca local.
- Leitura com disciplina, mês e ano, turmas, professor, caixa "Sobre" e chips de habilidades; fórmulas, diagramas, tabelas, figuras e caixas coloridas.
- Quiz de múltipla escolha com correção instantânea, botão de mostrar e ocultar gabarito, impressão em PDF e alternador de tema.
- Herança da fonte, do tamanho e da entrelinha definidos pelo professor; faixa de aviso quando o link expira em menos de 3 dias; página de demonstração em `/l/demo-landing`.

### Acesso e conta de professor

- Página inicial com proposta, recursos, passo a passo em 3 etapas, perguntas frequentes e código aberto (licença MIT).
- Cadastro com nome, e-mail e senha, confirmação por e-mail com reenvio, medidor de força e exibição da senha; login com bloqueio até a confirmação; recuperação em 2 fases (pedir link e definir nova senha); sessão persistente.
- Temas claro, escuro e sistema; aplicativo somente em português; navegação por rotas hash (`#/`, `#/notas`, `#/organizacao`, `#/links`, `#/conta`, `#/editor/:id`, `#/nota/:id`, `#/l/:token`, `#/entrar`, `#/cadastro`, `#/redefinir`) com retorno ao início em rota desconhecida.
- Layout responsivo com barra lateral no desktop e navegação inferior no celular; notificações toast em todas as ações, com mensagens de erro em português.
- Estados de carregamento independentes por elemento (esqueletos por cartão, filtro, número e seção) e animações sutis que respeitam `prefers-reduced-motion`.

## Formatos de intercâmbio

- **Backup JSON**: um arquivo com disciplinas, turmas, notas, links e imagens em base64; a restauração substitui todos os dados do professor, recria identificadores e remapeia imagens e URLs nos blocos.
- **Nota `.md`**: front-matter (título, disciplina, ano, mês, turmas, habilidades, status, aparência) mais corpo com seções, fórmulas, listas, tabelas, figuras, TikZ, caixas e exercícios com gabarito; a importação recria disciplina e turmas faltantes.
- **Nota `.json`**: envelope com os mesmos campos; aceito na importação e na exportação por nota.
- **LaTeX `.tex`**: documento autocontido com pacotes padrão e ambientes para cada caixa; imagens locais referenciadas como arquivos, externas sinalizadas como aviso.

## Stack

- Next.js 16 (App Router) com TypeScript e Node 24.
- PostgreSQL 15 ou superior com Prisma ORM v8 (contrato em `src/prisma/contract.prisma`).
- Autenticação própria (scrypt + JWT em cookies HttpOnly); e-mails via Resend, SMTP genérico ou log local.
- Imagens atrás de interface agnóstica: disco local (`disk`, volume Docker) ou API S3-compatível (`s3`: Supabase Storage, MinIO, R2).
- Tailwind CSS 4 com shadcn/ui.
- KaTeX com mhchem.
- dnd-kit (editor) e TanStack Query.

Paleta: verde institucional #008241.

## Como executar

### Pré-requisitos

Node 24, Docker com Compose (para o modo recomendado) ou Supabase CLI com Docker (para o modo Supabase local).

### Com Docker Compose (recomendado)

```bash
cp .env.example .env
# Gere um segredo: openssl rand -base64 32  (cole em AUTH_SECRET no .env)
docker compose up --build
```

O Compose sobe o PostgreSQL 17 (`db:5432`, volume `pgdata`), aplica as migrações na partida (`docker/postgres/migracoes/`) e inicia o app em http://localhost:3000. Com `STORAGE_DRIVER=disk` (padrão), as imagens ficam no volume `uploads`.

### Com Supabase local (banco + Storage S3)

```bash
supabase start
PGPASSWORD=postgres createdb -h 127.0.0.1 -p 54322 -U postgres cadernoaberto
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/cadernoaberto node docker/app/migrar.mjs
```

Sem o cliente `postgresql-client`, crie o banco com `psql -h 127.0.0.1 -p 54322 -U postgres -c "CREATE DATABASE cadernoaberto;"` (com `PGPASSWORD=postgres` no ambiente).

Crie o bucket `imagens` uma vez por instância (privado, limite 6 MB, tipos de imagem):

```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('imagens', 'imagens', false, 6291456,
  '{image/png,image/jpeg,image/webp,image/gif,image/svg+xml}');
```

No `.env`, aponte `DATABASE_URL` para o banco acima e, para imagens no Storage, defina `STORAGE_DRIVER=s3` com `STORAGE_S3_ENDPOINT=http://127.0.0.1:54321/storage/v1/s3`, `STORAGE_S3_REGION=local`, `STORAGE_S3_BUCKET=imagens` e as chaves do protocolo S3 do serviço Storage (variáveis `S3_PROTOCOL_ACCESS_KEY_ID` e `S3_PROTOCOL_ACCESS_KEY_SECRET` do contêiner `storage`). Depois suba o app:

```bash
npm run dev
```

### Sem Docker (PostgreSQL próprio)

```bash
npm install
cp .env.example .env
# Preencha DATABASE_URL (qualquer PostgreSQL 15+, incluindo o banco
# direto de um projeto Supabase) e AUTH_SECRET no .env
# Sem volume Docker, defina STORAGE_DRIVER=disk com UPLOAD_DIR local
node docker/app/migrar.mjs
npm run dev
```

E-mails em desenvolvimento usam `EMAIL_DRIVER=log` (links impressos no console e visíveis em `/api/teste/outbox`). Para envios reais, configure `EMAIL_DRIVER=resend` com `RESEND_API_KEY` e domínio verificado, ou `EMAIL_DRIVER=smtp` com `SMTP_URL`.

Após criar uma conta, cadastrar uma disciplina em Conta e escrever a primeira nota.

## Testes

```bash
npm run test:unit
npm run test:api
npm run test:contratos
npm run test:e2e
```

Os comandos correspondem a:

- `test:unit`: testes puros de geração LaTeX/Markdown (autocontenção, round-trip, aparência), também grava `.tex` de exemplo em `tests/tex/` para compilação manual com `tectonic`.
- `test:api`: 6 testes de isolamento do backstop RLS (papel restrito `app_teste`, sem contexto, A/B, escrita cruzada). Exige `DATABASE_URL` com as migrações aplicadas.
- `test:contratos`: 40 verificações HTTP de ponta a ponta da API (conta, CRUD, links públicos, imagens, backup). Exige o app no ar (`TEST_BASE_URL`, padrão http://127.0.0.1:3000).
- `test:e2e`: suíte Playwright em 3 navegadores, headless, cobrindo autenticação com confirmação e reenvio, notas com disciplina inline, links, conta com carência, ícones e casos extremos. Os e-mails de teste são lidos em `/api/teste/outbox` (provedor `log`). A interface interativa (`test:e2e:ui`) abre o executor visual.

Verificações de qualidade: `npm run lint`, `npm run tsc`, `npm run build`.

## CI (GitHub Actions)

Quatro workflows em `.github/workflows/` rodam a cada push em `main` e pull request (Node 24, Ubuntu):

- **quality**: `npm run format:check`, `npm run lint`, `npm run tsc` e `test:unit`.
- **build**: `npm run build` com `DATABASE_URL`/`AUTH_SECRET` fictícios e `EMAIL_DRIVER=log`.
- **test-db**: service `postgres:17`, migrações, `test:api` (isolamento RLS) e `test:contratos` (sobe o app e testa a API).
- **db-reset**: só manual (`workflow_dispatch`), restrito ao environment `production` (detalhes abaixo).

Os testes E2E (Playwright) não fazem parte do CI e devem ser executados localmente com o app no ar.

## Reset do banco real (antes de haver usuários reais)

Apaga **todos** os dados do banco (tabelas do app, `auth.users` e objetos do Storage) **sem volta** — não há backup — e reaplica as migrações do zero. Vale somente enquanto não há usuários reais; ao liberá-los, desabilite este workflow no GitHub UI (Actions → Reset do Banco Real → Disable workflow).

Pré-requisitos no GitHub (Settings → Environments → `production`, com revisor obrigatório):

| Secret | Valor |
|---|---|
| `DATABASE_URL_PROD` | Conexão **direta** `:5432` do projeto Supabase real (`postgresql://postgres:[senha]@db.[REF].supabase.co:5432/postgres`). Nunca pooler `:6543`, nunca outra base. |

Para disparar: Actions → "Reset do Banco Real" → Run workflow → digite exatamente `APAGAR-BANCO-REAL`. O workflow trava se o host da URL não for `*.supabase.co`, executa `docker/postgres/repor.mjs` + `docker/app/migrar.mjs` e verifica o estado final (3 migrações aplicadas, zero usuários, isolamento). Segredos trafegam só via bloco `env:` (nunca em `echo` ou argumento de comando) e forks não os recebem em dispatch manual.

## Deploy

1. Banco: PostgreSQL 15 ou superior (Compose, gerenciado ou o banco direto de um projeto Supabase). As migrações aplicam sozinhas na partida do contêiner (`docker/app/migrar.mjs`); fora do Compose, rode o migrador com a `DATABASE_URL` de produção antes de publicar.
2. Aplicativo na Vercel: comando de build `npm run build` e as variáveis do `.env.example` (`DATABASE_URL` do pooler de sessão com `?sslmode=require`, `AUTH_SECRET` com 32 ou mais bytes aleatórios, `EMAIL_DRIVER=resend` com `RESEND_API_KEY` e domínio verificado, `STORAGE_DRIVER=s3` com as 5 variáveis `STORAGE_S3_*` e `CRON_SECRET` com segredo aleatório). O disco é efêmero na Vercel: imagens exigem `s3`, nunca `disk`.
3. Agendador da purga: o `vercel.json` já registra o Cron diário em `GET /api/conta/restaurar`; a Vercel envia `CRON_SECRET` como `Authorization` automaticamente. Fora da Vercel, agende a mesma chamada com o cabeçalho (cron do host, GitHub Actions com `schedule` ou similar).
4. Produção: use um papel dono do schema na `DATABASE_URL` (as políticas RLS de segunda barreira valem para papéis com `bypassrls` apenas como documentação; o isolamento real é aplicado pela API). Aponte deploys de pré-visualização para um banco de staging, nunca para produção.
5. Alternativa self-hosted: `docker compose up --build` com `.env` preenchido (o entrypoint migra e serve; imagens no volume `uploads`).

## Referência da API

Autenticação (`/api/auth`): `POST cadastro`, `POST entrar`, `POST` e `GET sair`, `GET verificar?token=`, `POST reenviar`, `POST redefinir` e `GET redefinir?token=`, `POST concluir`, `POST renovar`, `POST trocar-senha`, `POST trocar-email` e `GET confirmar-troca?token=`. E-mail inexistente sempre responde 200 na recuperação e no reenvio.

Conta (`/api/conta`): `GET` (sessão com usuário e perfil), `PATCH` (nome e escola), `POST excluir` (exige senha e palavra EXCLUIR, carência de 24 horas), `POST restaurar` (dentro da carência) e `DELETE restaurar` (purga com segredo).

Notas (`/api/notas`): `GET` com filtros `q`, `disciplina`, `ano`, `mes`, `turma` e `status`; `POST` (título e disciplina obrigatórios); `GET`, `PUT` e `DELETE /api/notas/[id]`; `POST /api/notas/[id]/duplicar` (cópia como rascunho); `GET /api/notas/[id]/exportar?formato=json|md|tex` (anexo pelo slug).

Disciplinas, turmas e links: `GET` com contagens (`totalNotas`), `POST`, `PUT` e `DELETE` por id; links com `tipo` nota, turma ou disciplina, expiração, pausa e regeneração de token.

Busca (`GET /api/busca?q=`, mínimo 2 caracteres, limite 40, com campo de origem e trecho); backup (`GET` exporta, `POST` restaura de forma substitutiva); importação (`POST /api/importar` com `conteudo` e `formato`); imagens (`POST` multipart até 6 MB, `GET ?path=` com `?png=1` para conversão, `DELETE`); visão pública sem login (`GET /api/publico/[token]` com contador de acessos e demonstração, `GET /api/publico/[token]/imagens` só para imagens referenciadas); saúde (`GET /api`); caixa de e-mail de teste fora de produção (`GET` e `DELETE /api/teste/outbox`).

Os contratos vivos estão em `tests/api/contratos.test.mjs` (40 verificações) e o isolamento em `tests/api/isolamento.test.mjs`.

## Perguntas frequentes

**O Caderno Aberto é gratuito?**
Sim, e de código aberto sob licença MIT. Cada professor cria a própria conta sem custo.

**Meus dados ficam isolados dos outros professores?**
Sim. Toda consulta é filtrada pelo professor dono no servidor, com políticas de segunda barreira no banco e suíte de isolamento automatizada.

**Como levo minhas notas para outro lugar?**
Baixe o backup completo em Conta (JSON com notas, links e imagens) ou exporte cada nota em `.md`, `.json` ou `.tex`. A restauração substitui os dados atuais.

**Excluí minha conta. E agora?**
Dentro de 24 horas, entre e escolha Restaurar conta no aviso exibido. Depois do prazo, a purga remove tudo permanentemente.

**Funciona sem internet ou como aplicativo de celular?**
Não. O Caderno Aberto é uma aplicação web responsiva, em português, que exige conexão; não há modo offline nem aplicativo nativo.

## Estrutura

```
src/
  app/api/            rotas de API (multiusuário; sessão via cookies)
    auth/             cadastro, login, verificação, recuperação e troca
    publico/[token]/  vista do aluno (sem login) e servidor de imagens
  components/         editor visual, vistas (notas, links, conta), shell
  hooks/use-sessao    ciclo de vida da autenticação com carência
  lib/
    auth/             scrypt, JWT+sessões, validação e limite de tentativas
    email/            provedor agnóstico (log, smtp, resend) e modelos pt-BR
    armazenamento/    imagens atrás de interface única (disk, s3)
    banco/            tipos das linhas (espelham o contrato Prisma)
    notas/            AST de blocos, LaTeX, Markdown, busca, paleta e ícones
    api/              sessão, serialização, links públicos e limite
  prisma/             contrato Prisma v8 (fonte da verdade do esquema)
docker/
  postgres/migracoes/ SQL versionado aplicado pelo migrador próprio
  app/                entrypoint + migrador do contêiner
supabase/
  config.toml         orquestração mínima do stack local (banco + Storage S3)
tests/api/            contratos HTTP + isolamento do backstop RLS
e2e/                  suíte Playwright headless com outbox de e-mail local
```

## Licença

Veja o arquivo [LICENSE](./LICENSE).
