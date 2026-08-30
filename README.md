# Caderno Aberto

Plataforma web **gratuita, multiusuário e mobile-first** para professores do
ensino médio escreverem notas de aula de **qualquer disciplina** — e
entregá-las aos alunos por **links únicos e gerenciáveis**.

O professor cria sua conta, escreve em um **editor visual de blocos** (caixas
_COPIAR_, exemplos resolvidos, dicas, exercícios em três níveis com gabarito,
fórmulas com LaTeX) e a plataforma produz, a partir da mesma fonte:

| Artefato                  | Descrição                                                                                                                                        |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Versão web responsiva** | Página de leitura mobile-first com KaTeX, tema claro/escuro, gabarito ocultável e **quiz interativo** — entregue aos alunos por link controlável |
| **PDF de impressão (A4)** | Layout em duas colunas com as caixas coloridas — gerado pelo navegador (Ctrl+P) a partir da vista de leitura                                     |
| **LaTeX (`.tex`)**        | Compatível com a classe `notaaula.cls` (pasta [`latex/`](latex/)) — mantém o pipeline original com `pdflatex`                                    |
| **Markdown (`.md`)**      | Formato de intercâmbio legível, com importação de volta ao app                                                                                   |
| **JSON (`.json`)**        | Dados completos da nota (incluindo blocos) para backup e migração                                                                                |

> Mantido pela **EEMTI José Cláudio de Araújo** (Maranguape, Ceará) —
> ver [`LICENSE`](LICENSE).

## Recursos

### Multiusuário (SaaS gratuito)

- **Cada professor tem sua conta** com dados totalmente isolados — a
  segurança é garantida por **Row Level Security no banco**, não por código
  da aplicação
- **Ciclo de vida completo da conta**: cadastro com confirmação de e-mail e
  reenvio, login bloqueado até confirmar, logout, troca de senha, troca de
  e-mail, redefinição de senha por e-mail e **exclusão com carência de 24
  horas** (dupla confirmação `EXCLUIR` + senha, links desativados, restauração
  dentro do prazo, purga automática)
- Autenticação por e-mail e senha gerenciada pelo [Supabase Auth]

### Links únicos para os alunos

- Compartilhe **uma nota**, **a turma inteira** ou **a disciplina completa**
- Cada link tem **token próprio**: copie, pause, reative, **regenere o
  token** (invalida o antigo), agende **expiração** ou exclua
- **Contador de acessos** por link
- Rascunhos **nunca** ficam visíveis; links revogados/expirados mostram
  "Link indisponível"
- Vista do aluno: leitura mobile, busca entre as aulas do link, quiz com
  correção instantânea, gabarito ocultável, impressão A4 e tema claro/escuro

### Escrita e organização

- **Editor visual de blocos** com arrastar-e-soltar, prévia ao vivo,
  salvamento automático e barra de formato inline
- **Matemática em português**: `\sen`, `\tg`, `\cotg`, `\cossec`, vírgula
  decimal (`\dec{4,0}`), unidades (`\un{m/s^2}`), `\resultado{…}` — os mesmos
  comandos do LaTeX original
- **Fórmulas químicas** via mhchem (`$\ce{H2O}$`)
- **Campos BNCC/ENEM** por nota
- **Organização automática**: Ano letivo → Turma → Mês e por Disciplina
- **CRUD completo**: notas (criar, editar, duplicar, excluir, importar
  `.md`/`.json`), disciplinas, turmas e links
- **Busca global** (Ctrl+K) sem acentos — títulos, conteúdo, fórmulas,
  gabaritos e habilidades
- **Backup completo** em um JSON único (notas, links e imagens em base64),
  com restauração — inclusive do formato do app antigo "Notas de Aula"

## Stack

- [Next.js 16](https://nextjs.org) (App Router) + TypeScript
- [Supabase]: **Auth** (sessões), **Postgres** com **RLS** (dados),
  **Storage** (figuras, bucket privado)
- `@supabase/ssr` — sessão em cookies, renovada pelo middleware
- Tailwind CSS 4 + shadcn/ui · [KaTeX](https://katex.org) + mhchem
- dnd-kit (editor) · TanStack Query

Paleta: verde institucional **#008241**.

## Como rodar

### 1. Criar o projeto Supabase

1. Crie uma conta gratuita em [supabase.com](https://supabase.com) e um
   projeto novo (plano gratuito basta).
2. Anote, em **Project Settings → API**:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (só no servidor!)

### 2. Aplicar o banco (migration única)

Com o [Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
npm install -g supabase        # se ainda não tiver o CLI
supabase login                 # entra com sua conta

# vincula o projeto (ref aparece no Dashboard)
supabase link --project-ref SEU_PROJECT_REF

# aplica a migration única (tabelas, gatilhos, RLS, bucket, políticas, carência)
supabase db push
# ou, para reset local: npx supabase db reset
```

> Alternativa sem CLI: copie o conteúdo de
> `supabase/migrations/20260830111154_schema_inicial.sql` e execute no
> **SQL Editor** do Dashboard.

### 3. Configurar autenticação

No Dashboard, em **Authentication**:

- **URL Configuration → Site URL**: a URL onde o app roda
  (ex.: `http://localhost:3000` em desenvolvimento)
- **Email Templates**: os modelos padrão funcionam; os links de
  confirmação/recuperação já apontam para o Site URL
- Em **Providers → Email**, mantenha "Confirm email" ativado (o app trata
  dos dois casos)

### 4. Rodar o app

```bash
npm install
cp .env.example .env.local     # preencha com os 3 valores do passo 1
npm run dev                    # http://localhost:3000
```

Crie sua conta, cadastre uma disciplina em **Conta**, e escreva a primeira
nota. Compile os `.tex` exportados com `pdflatex` usando a pasta
[`latex/`](latex/) (veja o [`latex/README.md`](latex/README.md)).

## Testes

O repositório traz suíte completa que roda **sem Docker** e com **Supabase local real**:

```bash
# RLS: 28 testes de isolamento (professor A/B, anon, links, gatilhos, storage, carência)
npm run test:rls

# Shim: 9 testes de ponta a ponta da camada Supabase (auth, REST, storage, PKCE)
npm run test:shim

# tudo (RLS + Shim)
npm run test:all

# E2E Playwright: 93 testes em 3 browsers, headless, sem abrir navegador
# cobre auth com confirmação e reenvio, notas com disciplina inline, links, conta com carência, ícones e edge cases
npm run test:e2e
# usa Supabase local real (npx supabase start) e Mailpit em http://127.0.0.1:54324
```

Como funciona:

- `tests/harness/stubs.sql` reproduz num Postgres comum o mínimo do
  Supabase (papéis `anon`/`authenticated`/`service_role`, `auth.uid()`,
  schemas `auth`/`storage`) — igual ao que o PostgREST faz em produção.
- `tests/rls.test.mjs` executa consultas assumindo cada papel com JWT
  próprio e valida o isolamento de verdade.
- `tests/shim/servidor.mjs` é um servidor local que fala a língua do
  Supabase (autenticação com PKCE, PostgREST com filtros, Storage com
  políticas) — base para testes de aplicação completos.

Verificações de qualidade: `npm run lint` · `npm run tsc` · `npm run build` · `npx supabase db reset`.

## Deploy

1. **Supabase**: crie o projeto e aplique as migrations (passos 1–2 acima).
2. **App**: faça deploy em qualquer plataforma Node
   ([Vercel](https://vercel.com), Railway, VPS…):
   - Comando de build: `npm run build`
   - Variáveis: as três do `.env.local` (a service_role só como variável de
     **servidor** — nunca `NEXT_PUBLIC_`)
3. Atualize no Supabase a **Site URL** e as **Redirect URLs** com o domínio
   final.

## Estrutura

```
src/
  app/api/            rotas de API (multiusuário; sessão via cookies)
    publico/[token]/  vista do aluno (sem login) + servidor de imagens
  components/         editor visual, vistas (notas, links, conta…), shell
  hooks/use-sessao    ciclo de vida da autenticação com PKCE e carência
  lib/
    notas/            AST de blocos, LaTeX, Markdown, busca, paleta e ícones
    supabase/         clientes (browser/servidor/admin) e tipos do banco
    api/              helpers de sessão/serialização das rotas
supabase/
  migrations/         migration única 20260830111154_schema_inicial.sql (fonte da verdade)
tests/                harness (stubs), suíte de RLS e shim do Supabase
e2e/                  suíte Playwright headless com Mailpit para confirmação
latex/                notaaula.cls + Makefile p/ compilar os .tex
```

## Licença

[MIT](LICENSE) — direitos reservados à **EEMTI José Cláudio de Araújo**.

[Supabase]: https://supabase.com
[Supabase Auth]: https://supabase.com/docs/guides/auth
