# Caderno Aberto

Plataforma web gratuita, multiusuário e mobile-first destinada a professores do ensino médio para a elaboração de notas de aula de qualquer disciplina, com entrega aos alunos por meio de links únicos e gerenciáveis.

O professor cria uma conta, utiliza um editor visual de blocos (caixas COPIAR, exemplos resolvidos, dicas, exercícios em três níveis com gabarito, fórmulas com LaTeX) e a plataforma gera, a partir da mesma fonte, os seguintes artefatos:

| Artefato                  | Descrição                                                                                                                                        |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Versão web responsiva     | Página de leitura mobile-first com KaTeX, tema claro/escuro, gabarito ocultável e quiz interativo, entregue aos alunos por link controlável      |
| PDF de impressão (A4)     | Layout em duas colunas com as caixas coloridas, gerado pelo navegador (Ctrl+P) a partir da vista de leitura                                      |
| Markdown (.md)            | Formato de intercâmbio legível, com importação de volta ao aplicativo                                                                            |
| JSON (.json)              | Dados completos da nota (incluindo blocos) para backup e migração                                                                                |

## Recursos

### Multiusuário (SaaS gratuito)

- Cada professor possui uma conta com dados totalmente isolados. A segurança é garantida por Row Level Security no banco de dados, e não por código da aplicação.
- Ciclo de vida completo da conta: cadastro com confirmação de e-mail e reenvio, bloqueio de login até a confirmação, logout, troca de senha, troca de e-mail, redefinição de senha por e-mail e exclusão com carência de 24 horas (dupla confirmação com a palavra EXCLUIR e senha, desativação de links, possibilidade de restauração dentro do prazo e purga automática).
- Autenticação por e-mail e senha gerenciada pelo Supabase Auth.

### Links únicos para os alunos

- Compartilhamento de uma nota, de uma turma inteira ou de uma disciplina completa.
- Cada link possui token próprio, com opções de copiar, pausar, reativar, regenerar o token (invalidando o anterior), agendar expiração ou excluir.
- Contador de acessos por link.
- Rascunhos nunca ficam visíveis; links revogados ou expirados exibem a mensagem "Link indisponível".
- Vista do aluno: leitura mobile, busca entre as aulas do link, quiz com correção instantânea, gabarito ocultável, impressão A4 e tema claro/escuro.

### Escrita e organização

- Editor visual de blocos com arrastar e soltar, prévia ao vivo, salvamento automático e barra de formato inline.
- Matemática em português: comandos `\sen`, `\tg`, `\cotg`, `\cossec`, vírgula decimal (`\dec{4,0}`), unidades (`\un{m/s^2}`) e `\resultado{...}`, correspondentes aos comandos do LaTeX original.
- Fórmulas químicas por meio de mhchem ($\ce{H2O}$).
- Campos BNCC/ENEM por nota.
- Organização automática: Ano letivo, Turma, Mês e Disciplina.
- CRUD completo: notas (criar, editar, duplicar, excluir, importar .md ou .json), disciplinas, turmas e links.
- Busca global (Ctrl+K) sem acentos, abrangendo títulos, conteúdo, fórmulas, gabaritos e habilidades.
- Backup completo em um único arquivo JSON (notas, links e imagens em base64), com restauração, incluindo o formato do aplicativo anterior "Notas de Aula".

## Stack

- Next.js 16 (App Router) com TypeScript.
- Supabase: Auth (sessões), Postgres com RLS (dados) e Storage (figuras, bucket privado).
- @supabase/ssr: sessão em cookies, renovada pelo middleware.
- Tailwind CSS 4 com shadcn/ui.
- KaTeX com mhchem.
- dnd-kit (editor) e TanStack Query.

Paleta: verde institucional #008241.

## Como executar

### 1. Criar o projeto Supabase

1. Criar uma conta gratuita em [supabase.com](https://supabase.com) e um novo projeto (o plano gratuito é suficiente).
2. Anotar, em Project Settings -> API, os seguintes valores:
   - Project URL, que corresponde a NEXT_PUBLIC_SUPABASE_URL.
   - anon/public key, que corresponde a NEXT_PUBLIC_SUPABASE_ANON_KEY.
   - service_role key, que corresponde a SUPABASE_SERVICE_ROLE_KEY (utilizada somente no servidor).

### 2. Aplicar o banco de dados (migration única)

Com o Supabase CLI:

```bash
npx supabase login
npx supabase link --project-ref SEU_PROJECT_REF
npx supabase db push
```

O comando `supabase db reset` pode ser utilizado para reiniciar o banco local.

Alternativa sem CLI: copiar o conteúdo do arquivo `supabase/migrations/20260830111154_schema_inicial.sql` e executá-lo no SQL Editor do Dashboard.

### 3. Configurar autenticação

No Dashboard, em Authentication:

- URL Configuration -> Site URL: definir a URL onde o aplicativo é executado (por exemplo, http://localhost:3000 em desenvolvimento).
- Email Templates: os modelos padrão funcionam; os links de confirmação e recuperação apontam para o Site URL configurado.
- Em Providers -> Email, manter a opção "Confirm email" ativada (o aplicativo trata ambos os casos).

### 4. Executar o aplicativo

```bash
npm install
cp .env.example .env
npm run dev
```

O arquivo `.env` deve ser preenchido com os três valores obtidos na etapa 1. O aplicativo estará disponível em http://localhost:3000.

Após criar uma conta, cadastrar uma disciplina em Conta e escrever a primeira nota.

## Testes

O repositório inclui uma suíte completa que executa sem Docker e com Supabase local real:

```bash
npm run test:rls
npm run test:shim
npm run test:all
npm run test:e2e
```

Os comandos correspondem a:

- `test:rls`: 28 testes de isolamento (professor A/B, anônimo, links, gatilhos, storage, carência).
- `test:shim`: 9 testes de ponta a ponta da camada Supabase (auth, REST, storage, PKCE).
- `test:all`: executa RLS e Shim.
- `test:e2e`: 93 testes Playwright em 3 navegadores, headless, cobrindo autenticação com confirmação e reenvio, notas com disciplina inline, links, conta com carência, ícones e casos extremos. Utiliza Supabase local real (npx supabase start) e Mailpit em http://127.0.0.1:54324.

Detalhes da implementação:

- `tests/harness/stubs.sql` reproduz em um Postgres comum o mínimo do Supabase (papéis anon, authenticated, service_role, função auth.uid(), schemas auth e storage), equivalente ao comportamento do PostgREST em produção.
- `tests/rls.test.mjs` executa consultas assumindo cada papel com JWT próprio e valida o isolamento.
- `tests/shim/servidor.mjs` é um servidor local que implementa a linguagem do Supabase (autenticação com PKCE, PostgREST com filtros, Storage com políticas), servindo de base para testes de aplicação completos.

Verificações de qualidade: `npm run lint`, `npm run tsc`, `npm run build` e `npx supabase db reset`.

## CI (GitHub Actions)

O workflow em `.github/workflows/ci.yml` roda a cada push em `main` e pull request (Node 24, Ubuntu):

- **qualidade**: `npm run format:check`, `npm run lint` e `npm run tsc`.
- **build**: `npm run build` com variáveis de ambiente fictícias (o prerender não depende de um Supabase real).
- **testes**: `npm run test:all` (RLS + Shim) com Postgres embutido, sem Docker. Em falha, o log do servidor (`tools/pg/pg.log`) é enviado como artefato.

Os testes E2E (Playwright com Supabase local) não fazem parte do CI e devem ser executados localmente com `npm run test:e2e`.

## Deploy

1. Supabase: criar o projeto e aplicar as migrations (etapas 1 e 2 acima).
2. Aplicativo: realizar o deploy em qualquer plataforma Node (Vercel, Railway, VPS), com comando de build `npm run build` e as três variáveis do .env.local (a `service_role` deve ser configurada apenas como variável de servidor, nunca com prefixo `NEXT_PUBLIC_`).
3. Atualizar no Supabase a Site URL e as Redirect URLs com o domínio final.

## Estrutura

```
src/
  app/api/            rotas de API (multiusuário; sessão via cookies)
    publico/[token]/  vista do aluno (sem login) e servidor de imagens
  components/         editor visual, vistas (notas, links, conta), shell
  hooks/use-sessao    ciclo de vida da autenticação com PKCE e carência
  lib/
    notas/            AST de blocos, LaTeX, Markdown, busca, paleta e ícones
    supabase/         clientes (browser, servidor, admin) e tipos do banco
    api/              helpers de sessão e serialização das rotas
supabase/
  migrations/         migration única 20260830111154_schema_inicial.sql (fonte da verdade)
tests/                harness (stubs), suíte de RLS e shim do Supabase
e2e/                  suíte Playwright headless com Mailpit para confirmação
```

## Licença

Veja o arquivo [LICENSE](./LICENSE).