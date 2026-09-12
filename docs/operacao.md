# Operação

Runbooks e resolução de problemas. Para configuração, ver [ambiente.md](ambiente.md); para publicação, ver [deploy.md](deploy.md).

## Banco local

### Aplicar migrações

```bash
npx prisma migrate deploy
```

O Compose aplica as migrações na partida pelo entrypoint. Em produção, a Action `db-migrate` cuida da migração.

### Repor o banco local

```bash
DATABASE_URL=postgresql://caderno:caderno@localhost:5432/caderno node docker/postgres/repor.mjs
docker compose down -v
docker compose up --build
```

O script apaga as tabelas do aplicativo, o registro de migrações e as funções de sincronização. Nunca execute contra produção.

### Verificar o histórico

```bash
npx prisma migrate status
```

Com `DIRECT_URL` definida, o comando usa essa conexão.

## Acesso por código

- O acesso não depende de e-mail. O primeiro administrador é criado com `npm run criar-admin` (variáveis `ADMIN_EMAIL`, `ADMIN_SENHA`, `ADMIN_NOME`), também executado na partida do Compose quando definidas.
- A administração vê a fila de solicitações no console (`#/admin`), gera o código de 8 caracteres e o entrega ao professor. O código expira em `CODIGO_EXPIRA_MINUTOS` (padrão 60) e é exibido uma única vez.
- Esqueceu a senha é equivalente: o professor solicita na tela de login e a administração gera um novo código.
- Auditoria: as ações sensíveis ficam em `eventos_seguranca` e na aba Auditoria.

Se um código não funcionar, confira a validade, o bloqueio por tentativas (`AUTH_LIMITE_CODIGO`) e regenere o código, já que o anterior é invalidado.

## Imagens

- `disk`: os arquivos ficam em `UPLOAD_DIR`. No Compose, o volume `uploads` precisa existir.
- `s3`: confira o endpoint, a região, o bucket e as credenciais. O bucket precisa existir e aceitar os tipos permitidos.

A rota de leitura converte WebP e SVG para PNG quando recebe `png=1`. SVG é servido com sandbox e sem scripts.

## Backup e restauração

- Exportar: Conta, opção de backup, ou `GET /api/backup`.
- Restaurar: Conta, opção de restauração, ou `POST /api/backup`.

A restauração é substitutiva: apaga links, notas, turmas e disciplinas do professor e recria a partir do arquivo. Baixe um backup antes. As imagens antigas do armazenamento não são removidas fisicamente no fluxo.

## Exclusão de conta e purga

1. O professor solicita a exclusão informando a senha e a palavra `EXCLUIR`.
2. A conta entra em carência de 24 horas. O login fica bloqueado ao fim do prazo, os links públicos ficam indisponíveis e os links ativos são pausados.
3. `POST /api/conta/restaurar` cancela a exclusão dentro do prazo e reativa os links pausados.
4. A purga remove definitivamente as contas com prazo vencido.

### Acionar a purga manualmente

```bash
curl -X DELETE https://app.exemplo.br/api/conta/restaurar \
  -H "Authorization: Bearer $CRON_SECRET"
```

Resposta `{ "removidas": 2 }`. Sem `CRON_SECRET` configurado, a rota responde `503`.

### Agendador

O `vercel.json` registra o Cron diário em `GET /api/conta/restaurar` e a Vercel envia o `Authorization` automaticamente. Fora da Vercel, agende a mesma chamada com o cabeçalho (cron do host ou `schedule` do GitHub Actions).

## Links públicos

- Para revogar um acesso, pause ou exclua o link na vista Links.
- Para trocar um endereço vazado, use regenerar token, que invalida o anterior.
- Links expirados, pausados ou revogados exibem a mensagem Link indisponível.
- O contador de acessos é incrementado a cada leitura e falhas de contagem não bloqueiam a resposta.

## RLS local

`npm run test:api` aplica `prisma/scripts/rls-teste.sql` antes de rodar a suíte. O papel `app_teste` existe apenas em local e CI. No Supabase ele não é criado, pois o usuário do schema já tem `BYPASSRLS`.

## Resolução de problemas

| Sintoma                            | Causa provável e ação                                                                                          |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Aplicação não inicia               | Variável inválida ou ausente. A mensagem de erro do zod indica o campo. Confira `AUTH_SECRET` e `CRON_SECRET`. |
| Erro de conexão com o banco        | `DATABASE_URL` incorreta ou banco indisponível. Evite o pooler de transação fora do runtime serverless.        |
| Migração acusa checksum divergente | Uma migração aplicada foi editada. Crie uma nova migração corretiva e restaure o histórico.                    |
| E-mail não enviado                 | Não se aplica: o acesso usa código gerido pela administração.                                                  |
| Imagem não aparece                 | Caminho fora da pasta do professor ou imagem não referenciada nos blocos. Confira o armazenamento.             |
| Login falha com mensagem genérica  | Credenciais incorretas, conta não ativada por código ou carência de exclusão vencida. Verifique o log.         |
| Muitas tentativas (429)            | Limite por IP atingido. Aguarde a janela de 5 minutos ou ajuste `AUTH_LIMITE_*`.                               |
| Link público indisponível          | Link pausado, expirado, revogado ou professor em exclusão. Verifique a vista Links.                            |
| Testes de isolamento falham        | Banco não migrado ou papel `app_teste` ausente. Rode `npm run test:api`, que aplica o script.                  |

## Saúde e logs

- `GET /api` informa nome e versão. Use como verificação de disponibilidade.
- O entrypoint mascara a senha da `DATABASE_URL` nos registros.
- Segredos não são registrados. Em incidentes, siga [seguranca.md](seguranca.md).
