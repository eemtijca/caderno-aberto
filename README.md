# Caderno Aberto

Plataforma web gratuita, multiusuário e mobile-first para professores do ensino médio elaborarem notas de aula de qualquer disciplina e as entregarem aos alunos por links únicos e gerenciáveis.

O professor cria uma conta, escreve no editor visual de blocos (caixas COPIAR, exemplos resolvidos, dicas, exercícios em três níveis com gabarito e fórmulas com LaTeX) e a plataforma gera, a partir da mesma fonte, os seguintes artefatos:

| Artefato              | Descrição                                                                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Versão web responsiva | Página de leitura mobile-first com KaTeX, tema claro/escuro, gabarito ocultável e quiz interativo, entregue aos alunos por link controlável |
| PDF de impressão (A4) | Layout em duas colunas com as caixas coloridas, gerado pelo navegador (Ctrl+P) a partir da vista de leitura                                 |
| LaTeX (.tex)          | Documento autocontido (apenas pacotes padrão do Overleaf/TeX Live, sem arquivo .cls externo) que reproduz as caixas coloridas em A4         |
| Markdown (.md)        | Formato de intercâmbio legível, com importação de volta ao aplicativo (round-trip completo, incluindo aparência)                            |
| JSON (.json)          | Dados completos da nota (incluindo blocos) para backup e migração                                                                           |

## Recursos

### Organização

- Início com saudação, contadores clicáveis (notas, publicadas, disciplinas, links), notas do mês e últimas edições.
- Notas em grade de cartões com busca local, filtros por disciplina, ano letivo, mês e turma, e contagem de resultados.
- Organização por ano letivo, com acordeão por turma (agrupado por mês), cartões por disciplina e grupo de notas sem turma.
- Busca global (`Ctrl/Cmd+K`) com debounce, mínimo de 2 caracteres e tolerância a acentos, exibindo campo de origem e trecho contextual.

### Editor de blocos

- 12 tipos de bloco: seção numerada, parágrafo, fórmula em destaque, lista, tabela, chamada, figura, diagrama TikZ, COPIAR, exemplo, dica e exercícios.
- Caixas COPIAR, exemplo e dica com blocos filhos (parágrafo, fórmula, lista, tabela e chamada).
- Exercícios em 3 níveis renomeáveis (padrão Conceitos, Aplicação e Síntese), com questões abertas ou de múltipla escolha (até 5 alternativas), marcação da correta e gabarito manual ou automático.
- Parágrafo com rótulos fixos (Definição, Fórmulas, Relações, Modelo básico e Resolução) ou rótulo livre; chamada em 3 estilos (Atenção, No dia a dia e Símbolos e unidades).
- Tabela com linhas e colunas editáveis e primeira linha opcional como cabeçalho; figura por upload com compressão ou URL, com legenda.
- Barra de formato inline (negrito, itálico, fórmula `$...$`, destaque `\resultado{...}` e química `$\ce{...}$`) e prévia KaTeX ao vivo.
- Reordenação por arrastar e soltar (mouse e teclado), botões de mover, duplicar e excluir, e paleta de inserção contextual.
- Salvamento automático com indicador de estado; título editável na barra; ações de ler, exportar, compartilhar, duplicar (a cópia abre como rascunho), alternar rascunho e publicada, e excluir com confirmação.
- Metadados por nota: disciplina, ano letivo, mês, turmas, resumo "Sobre" e habilidades BNCC/ENEM.
- Aparência por nota: 5 fontes, 4 tamanhos e 3 entrelinhas, aplicadas ao professor, ao aluno e à impressão.
- Diálogo Nova nota com título (mínimo de 2 caracteres), disciplina (seleção ou criação inline com cor e ícone), ano, mês, turmas opcionais e interruptor "Começar do modelo".

### Exportação e impressão

- No editor: arquivo para impressão (`.tex`), arquivo de texto (`.md`) e backup da nota (`.json`), todos nomeados pelo slug da nota.
- Na leitura, para professor e aluno: botão Imprimir/PDF com layout A4 em duas colunas e ocultação de barras e rodapés; alternativas do quiz impressas como texto.

### Links únicos para os alunos

- Compartilhamento de uma nota (somente publicadas), de uma turma inteira ou de uma disciplina completa, com nome opcional; a criação já copia o endereço.
- Gestão por cartão ou pelo diálogo rápido, sem sair da leitura: copiar, abrir como aluno, renomear, definir expiração, pausar e reativar, regenerar o endereço (invalida o anterior) e excluir com confirmação.
- Contador de acessos por link e aviso quando a nota-alvo ainda é rascunho.
- Endereço em caminho real (`/l/<token>`): WhatsApp, Telegram e redes sociais exibem prévia com imagem, título e descrição gerados por nota (OpenGraph). Links antigos em `/#/l/<token>` continuam funcionando.
- Rascunhos nunca ficam visíveis; links pausados, expirados ou revogados exibem a mensagem "Link indisponível".

### Conta

- Perfil com nome e escola (exibidos nas notas e na impressão) e e-mail.
- Segurança com troca de senha (mínimo de 8 caracteres, com confirmação e senha atual) e troca de e-mail com confirmação por link no novo endereço.
- Disciplinas com nome, cor e ícone gráfico, contador de notas e renomeação; excluir preserva as notas (apenas desvincula).
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

## Começando

Pré-requisitos: Node 24 e Docker com Compose (modo recomendado) ou PostgreSQL 15 ou superior próprio.

Com Docker Compose:

```bash
cp .env.example .env
# Gere os segredos: openssl rand -base64 32 (cole em AUTH_SECRET e CRON_SECRET no .env)
docker compose up --build
```

O Compose sobe o PostgreSQL 17 (`db:5432`, volume `pgdata`), aplica as migrações na partida e inicia o aplicativo em http://localhost:3000. Com `STORAGE_DRIVER=disk` (padrão), as imagens ficam no volume `uploads`.

Instruções sem Docker, configuração de e-mail e demais variáveis: [docs/ambiente.md](docs/ambiente.md). Publicação: [docs/deploy.md](docs/deploy.md).

## Stack

- Next.js 16 (App Router) com TypeScript e Node 24.
- PostgreSQL 15 ou superior com Prisma ORM v7 (`prisma/schema.prisma`, migration única em `prisma/migrations/`).
- Conexões separadas no Supabase e em ambientes serverless: `DATABASE_URL` (runtime, pooler de transação `:6543`) e `DIRECT_URL` (CLI e migrações, pooler de sessão ou conexão direta `:5432`); local e CI usam apenas `DATABASE_URL`.
- Autenticação própria (scrypt e JWT em cookies HttpOnly); e-mails via Resend, SMTP genérico ou log local.
- Imagens atrás de interface agnóstica: disco local (`disk`, volume Docker) ou API compatível com S3 (`s3`: MinIO, R2 ou similar).
- Tailwind CSS 4 com shadcn/ui, KaTeX com mhchem, dnd-kit (editor) e TanStack Query.

Paleta: verde institucional `#008241`.

## Documentação

| Documento                                          | Conteúdo                                              |
| -------------------------------------------------- | ----------------------------------------------------- |
| [docs/README.md](docs/README.md)                   | Índice de toda a documentação                         |
| [docs/arquitetura.md](docs/arquitetura.md)         | Camadas, fluxo de requisição e organização do código  |
| [docs/ambiente.md](docs/ambiente.md)               | Variáveis de ambiente e execução local                |
| [docs/banco.md](docs/banco.md)                     | Esquema, migrações, RLS e rotinas de banco            |
| [docs/api.md](docs/api.md)                         | Referência das rotas HTTP                             |
| [docs/modelo-de-dados.md](docs/modelo-de-dados.md) | Entidades, relações e glossário do domínio            |
| [docs/editor.md](docs/editor.md)                   | Tipos de bloco, formatação inline e aparência         |
| [docs/interface.md](docs/interface.md)             | Design system, temas, responsividade e acessibilidade |
| [docs/operacao.md](docs/operacao.md)               | Runbooks, backup, purga e resolução de problemas      |
| [docs/testes.md](docs/testes.md)                   | Suítes de teste, convenções e CI                      |
| [docs/seguranca.md](docs/seguranca.md)             | Controles de segurança e modelo de ameaça             |
| [docs/deploy.md](docs/deploy.md)                   | Vercel, Compose, migrações e agendador                |
| [CONTRIBUTING.md](CONTRIBUTING.md)                 | Rotina de desenvolvimento e convenções                |
| [SECURITY.md](SECURITY.md)                         | Política de reporte de vulnerabilidades               |

Decisões de arquitetura ficam em [docs/adr/](docs/adr/).

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

## Licença

Veja o arquivo [LICENSE](./LICENSE).
