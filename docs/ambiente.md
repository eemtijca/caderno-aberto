# Ambiente

Todas as variáveis passam por `src/lib/ambiente.ts`, validado com zod na partida. Variáveis inválidas interrompem a inicialização, exceto durante a fase de build, quando são usados valores fictícios. O espelho pronto para cópia é [`.env.example`](../.env.example).

## Referência

| Variável                  | Obrigatória                | Padrão                                                | Descrição                                                                                   |
| ------------------------- | -------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `DATABASE_URL`            | Sim                        | `postgresql://caderno:caderno@localhost:5432/caderno` | Conexão de runtime com o PostgreSQL.                                                        |
| `DIRECT_URL`              | Onde o runtime usa `:6543` | `DATABASE_URL`                                        | Conexão do CLI Prisma para migrações.                                                       |
| `AUTH_SECRET`             | Sim                        | Nenhum                                                | Segredo do JWT de sessão, com no mínimo 32 caracteres. Gere com `openssl rand -base64 32`.  |
| `CRON_SECRET`             | Sim em produção            | Vazio                                                 | Segredo da purga. A Vercel envia automaticamente como `Authorization` no Cron.              |
| `APP_URL`                 | Sim em produção            | Host do pedido                                        | Origem canônica dos links e comparação de host no CSRF. Precisa ser uma URL válida.         |
| `ADMIN_EMAIL`             | No bootstrap               | Vazio                                                 | E-mail do administrador inicial, usado pelo script `criar-admin` e na partida do container. |
| `ADMIN_SENHA`             | No bootstrap               | Vazio                                                 | Senha do administrador inicial (8 a 256 caracteres). Nunca versionar.                       |
| `ADMIN_NOME`              | Não                        | Parte local do e-mail                                 | Nome exibido do administrador inicial.                                                      |
| `STORAGE_DRIVER`          | Não                        | `disk`                                                | Armazenamento de imagens: `disk` ou `s3`.                                                   |
| `UPLOAD_DIR`              | Com `STORAGE_DRIVER=disk`  | `/data/imagens`                                       | Diretório local das imagens.                                                                |
| `STORAGE_S3_ENDPOINT`     | Com `STORAGE_DRIVER=s3`    | Vazio                                                 | Endpoint compatível com S3.                                                                 |
| `STORAGE_S3_REGION`       | Com `STORAGE_DRIVER=s3`    | Vazio                                                 | Região do bucket.                                                                           |
| `STORAGE_S3_BUCKET`       | Com `STORAGE_DRIVER=s3`    | Vazio                                                 | Nome do bucket (precisa existir).                                                           |
| `STORAGE_S3_ACCESS_KEY`   | Com `STORAGE_DRIVER=s3`    | Vazio                                                 | Chave de acesso.                                                                            |
| `STORAGE_S3_SECRET_KEY`   | Com `STORAGE_DRIVER=s3`    | Vazio                                                 | Chave secreta.                                                                              |
| `AUTH_LIMITE_TENTATIVAS`  | Não                        | `30`                                                  | Tentativas por IP a cada 5 minutos nas rotas de autenticação.                               |
| `AUTH_LIMITE_CODIGO`      | Não                        | `5`                                                   | Tentativas de verificação de código por e-mail a cada 5 minutos.                            |
| `CODIGO_EXPIRA_MINUTOS`   | Não                        | `60`                                                  | Validade do código de acesso, em minutos.                                                   |
| `NEXT_PUBLIC_APP_VERSION` | Não                        | Versão do `package.json`                              | Carimbo de versão exibido na interface.                                                     |

## Conexão com o banco

`DATABASE_URL` é a conexão de runtime. Use a conexão direta `:5432` ou o pooler de sessão `:5432`. O pooler de transação `:6543`, compatível com pgbouncer, é incompatível com instruções preparadas e só deve ser usado no runtime com `?pgbouncer=true`, como no Supabase e em ambientes serverless. Detalhes em [banco.md](banco.md).

`DIRECT_URL` é a conexão do CLI Prisma (`migrate deploy` e `migrate status`), configurada em `prisma.config.ts`. É obrigatória onde o runtime usa o pooler de transação. Prefira o pooler de sessão `:5432` ou a conexão direta do projeto. Em local e CI, cai para `DATABASE_URL`.

> [!NOTE]
> No Supabase, o endpoint direto é IPv6 por padrão. Se a rede não tiver IPv6, use o pooler de sessão `:5432`.

## Administrador inicial

O acesso é por código de 8 caracteres gerido pela administração, sem envio de e-mail. Crie o primeiro administrador de forma idempotente com:

```bash
ADMIN_EMAIL=admin@escola.br ADMIN_SENHA=uma-senha-forte ADMIN_NOME=Administração npm run criar-admin
```

No Compose, defina `ADMIN_EMAIL`, `ADMIN_SENHA` e `ADMIN_NOME` no `.env`; o entrypoint executa o script na partida. O script usa `DIRECT_URL` (ou `DATABASE_URL`) e regrava a senha a cada execução.

## Armazenamento de imagens

`disk` grava em `UPLOAD_DIR` (volume Docker no Compose). `s3` usa as cinco variáveis `STORAGE_S3_*` e serve qualquer provedor compatível, como MinIO ou Cloudflare R2. O bucket precisa existir e aceitar os tipos de imagem permitidos. Na Vercel o disco é efêmero, portanto imagens exigem `s3`. Detalhes em [operacao.md](operacao.md).

## Regras

- Nunca reutilizar segredos de desenvolvimento (o valor `caderno` e os fictícios do CI) em produção.
- Com Docker Compose, definir `AUTH_SECRET` e `CRON_SECRET` no `.env`; o restante segue o padrão do `compose.yml`.
- Em produção, `CRON_SECRET` é obrigatório e a aplicação não inicia sem ele.
