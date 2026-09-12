# Referência da API

Rotas HTTP do Caderno Aberto. Todas ficam sob `/api` e respondem JSON, exceto links de e-mail, downloads e imagens. As rotas dinâmicas recebem o parâmetro `id` no caminho.

## Convenções

- **Sessão:** as rotas privadas resolvem o professor pelo cookie `sessao` (JWT de 1 hora) e, se necessário, renovam pelo cookie `sessao_refresh` (30 dias). Sem sessão válida, respondem `401` com `{ "erro": "Faça login como professor para continuar." }`.
- **Erros:** no formato `{ "erro": "mensagem" }`, com texto em português. O status indica a categoria: `400` para entrada inválida, `401` para falta de sessão, `403` para credencial ou segredo incorreto, `404` para recurso ausente, `410` para prazo expirado, `429` para excesso de tentativas e `503` para agendador não configurado.
- **Cache:** respostas JSON usam `Cache-Control: private, no-store`. Imagens usam `private, max-age=3600`.
- **Isolamento:** toda consulta filtra pelo professor dono. Recursos de outro professor se comportam como inexistentes (`404`).
- **Limite de tentativas:** rotas de autenticação limitam por IP em janela de 5 minutos (`AUTH_LIMITE_TENTATIVAS`, padrão 30; envio de e-mail `AUTH_LIMITE_EMAIL`, padrão 10). Ao exceder, respondem `429`.
- **Corpo:** `Content-Type: application/json`, salvo upload de imagem, que usa `multipart/form-data`.
- **Datas:** trafegam como ISO 8601 no JSON.

## Resumo das rotas

| Método            | Caminho                        | Acesso            | Descrição                           |
| ----------------- | ------------------------------ | ----------------- | ----------------------------------- |
| GET               | `/api`                         | Público           | Nome e versão da aplicação          |
| POST              | `/api/auth/cadastro`           | Público           | Cria conta e envia verificação      |
| POST              | `/api/auth/entrar`             | Público           | Inicia sessão                       |
| POST              | `/api/auth/sair`               | Público           | Encerra sessão                      |
| POST              | `/api/auth/renovar`            | Público (refresh) | Renova a sessão                     |
| POST              | `/api/auth/concluir`           | Público           | Define nova senha e inicia sessão   |
| GET               | `/api/auth/verificar`          | Público           | Confirma e-mail (redirect)          |
| POST              | `/api/auth/reenviar`           | Público           | Reenvia verificação                 |
| POST              | `/api/auth/redefinir`          | Público           | Solicita recuperação                |
| GET               | `/api/auth/redefinir`          | Público           | Valida token de recuperação         |
| POST              | `/api/auth/trocar-senha`       | Sessão            | Troca a senha                       |
| POST              | `/api/auth/trocar-email`       | Sessão            | Solicita troca de e-mail            |
| GET               | `/api/auth/confirmar-troca`    | Público           | Confirma troca de e-mail (redirect) |
| GET               | `/api/conta`                   | Sessão opcional   | Sessão, usuário e perfil            |
| PATCH             | `/api/conta`                   | Sessão            | Atualiza nome e escola              |
| POST              | `/api/conta/excluir`           | Sessão            | Solicita exclusão com carência      |
| POST              | `/api/conta/restaurar`         | Sessão            | Cancela a exclusão pendente         |
| GET, DELETE       | `/api/conta/restaurar`         | Segredo           | Purga contas vencidas (Cron)        |
| GET               | `/api/notas`                   | Sessão            | Lista e filtra notas                |
| POST              | `/api/notas`                   | Sessão            | Cria nota                           |
| GET, PUT, DELETE  | `/api/notas/[id]`              | Sessão            | Consulta, atualiza ou exclui nota   |
| POST              | `/api/notas/[id]/duplicar`     | Sessão            | Duplica nota como rascunho          |
| GET               | `/api/notas/[id]/exportar`     | Sessão            | Exporta em `json`, `md` ou `tex`    |
| GET, POST         | `/api/disciplinas`             | Sessão            | Lista ou cria disciplinas           |
| PUT, DELETE       | `/api/disciplinas/[id]`        | Sessão            | Atualiza ou exclui disciplina       |
| GET, POST         | `/api/turmas`                  | Sessão            | Lista ou cria turmas                |
| PUT, DELETE       | `/api/turmas/[id]`             | Sessão            | Atualiza ou exclui turma            |
| GET, POST         | `/api/links`                   | Sessão            | Lista ou cria links                 |
| PUT, DELETE       | `/api/links/[id]`              | Sessão            | Atualiza ou exclui link             |
| GET               | `/api/busca`                   | Sessão opcional   | Busca global                        |
| GET, POST         | `/api/backup`                  | Sessão            | Exporta ou restaura backup          |
| POST              | `/api/importar`                | Sessão            | Importa uma nota `.md` ou `.json`   |
| POST, GET, DELETE | `/api/imagens`                 | Sessão            | Envia, serve ou exclui imagens      |
| GET               | `/api/publico/[token]`         | Público           | Dados da vista do aluno             |
| GET               | `/api/publico/[token]/imagens` | Público           | Imagens referenciadas por um link   |
| GET, DELETE       | `/api/teste/outbox`            | Restrito          | Caixa de e-mails de teste           |

## Saúde

### `GET /api`

Resposta `200` com `{ "app": "Caderno Aberto", "versao": "0.1.0" }`.

## Autenticação

### `POST /api/auth/cadastro`

Cria a conta e envia o e-mail de verificação. Responde sempre `201` com `{ "estado": "confirmar" }`, sem revelar se o e-mail já existe.

Corpo:

| Campo   | Tipo   | Regra                                  |
| ------- | ------ | -------------------------------------- |
| `nome`  | string | Mínimo de 2 e máximo de 120 caracteres |
| `email` | string | Formato válido, até 254 caracteres     |
| `senha` | string | Entre 8 e 256 caracteres               |

Efeitos: cria `usuarios` e `profiles` em transação, invalida tokens de verificação anteriores e emite token válido por 24 horas.

### `POST /api/auth/entrar`

Corpo: `email` e `senha`. Responde `200` com `{ "ok": true }` e grava os cookies de sessão. Exige `emailVerificadoEm` preenchido. Credenciais inválidas, conta inexistente ou conta com carência vencida respondem `401` com `{ "erro": "E-mail ou senha incorretos." }`.

### `POST /api/auth/sair`

Apaga a sessão correspondente ao refresh e limpa os cookies. Responde `200` com `{ "ok": true }`.

### `POST /api/auth/renovar`

Usa o cookie `sessao_refresh`. Responde `200` com `{ "ok": true }` e rotação do refresh, ou `401` com `{ "ok": false }`.

### `POST /api/auth/concluir`

Define a nova senha a partir de um token de recuperação. Corpo: `token` (64 caracteres hexadecimais) e `novaSenha` (8 a 256). Responde `200` com `{ "ok": true }` e inicia sessão; invalida todas as sessões anteriores. Token inválido ou expirado responde `400` com `{ "erro": "Link inválido ou expirado." }`.

### `GET /api/auth/verificar?token=`

Consome o token de verificação e grava `emailVerificadoEm`. Responde com redirecionamento para `/#/entrar?verificado=1` ou `/#/entrar?erro=expirado`.

### `POST /api/auth/reenviar`

Corpo: `email`. Reenvia a verificação quando a conta existe e ainda não foi confirmada. Responde `200` com `{ "ok": true }` em qualquer caso.

### `POST /api/auth/redefinir`

Corpo: `email`. Gera token de recuperação válido por 1 hora e envia o link. Responde `200` com `{ "ok": true }` sempre, para não revelar a existência da conta.

### `GET /api/auth/redefinir?token=`

Responde `200` com `{ "valido": true | false }`.

### `POST /api/auth/trocar-senha`

Corpo: `atual` e `nova`. Responde `200` com `{ "ok": true }` e reemite a sessão. Senha atual incorreta responde `403` com `{ "erro": "Senha incorreta." }`. A nova senha não pode ser igual à atual.

### `POST /api/auth/trocar-email`

Corpo: `novoEmail`. Envia a confirmação para o novo endereço e responde `200` com `{ "ok": true }`. E-mail indisponível responde `400` com `{ "erro": "Não foi possível usar este e-mail." }`.

### `GET /api/auth/confirmar-troca?token=`

Efetiva a troca em `usuarios` e `profiles`. Redireciona para `/#/conta?email=ok` ou `/#/conta?erro=email`.

## Conta

### `GET /api/conta`

Sessão opcional. Responde `200` com:

```json
{
  "usuario": { "id": "uuid", "email": "...", "emailConfirmado": true, "criadoEm": "ISO" },
  "perfil": {
    "nome": "...",
    "escola": "...",
    "email": "...",
    "exclusaoSolicitadaEm": null,
    "expiraEm": null
  }
}
```

Sem sessão, `usuario` e `perfil` são `null`.

### `PATCH /api/conta`

Corpo: `nome` (até 120) e `escola` (até 160), ambos opcionais. Responde `200` com o perfil atualizado.

### `POST /api/conta/excluir`

Corpo: `senha` e `confirmacao` igual a `EXCLUIR`. Responde `200` com `{ "ok": true, "expiraEm": "ISO" }`, grava a carência de 24 horas e pausa apenas os links ativos. Senha incorreta responde `403`.

### `POST /api/conta/restaurar`

Cancela a exclusão pendente e reativa os links que haviam sido pausados. Responde `200` com `{ "ok": true }`. Carência vencida responde `410`.

### `GET` e `DELETE /api/conta/restaurar`

Purga contas com carência vencida, em lotes de 100. Exige `Authorization: Bearer <CRON_SECRET>`. Responde `200` com `{ "removidas": 2 }`. Segredo ausente responde `503`; segredo incorreto responde `403`. O `GET` existe para o Cron da Vercel e executa a mesma operação destrutiva.

## Notas

### `GET /api/notas`

Parâmetros de consulta:

| Parâmetro    | Descrição                               |
| ------------ | --------------------------------------- |
| `q`          | Busca textual, sem distinção de acentos |
| `disciplina` | Identificador da disciplina             |
| `ano`        | Ano letivo                              |
| `mes`        | Mês (1 a 12)                            |
| `turma`      | Identificador da turma                  |
| `status`     | `rascunho` ou `publicada`               |

Responde `200` com `{ "notas": [...] }`, em ordem decrescente de ano, mês e atualização. Com `q`, a busca ocorre no banco; sem `q`, os filtros são aplicados em memória.

### `POST /api/notas`

Corpo:

| Campo          | Tipo     | Regra                                                   |
| -------------- | -------- | ------------------------------------------------------- |
| `titulo`       | string   | Obrigatório                                             |
| `disciplinaId` | string   | Obrigatório e pertencente ao professor                  |
| `anoLetivo`    | número   | Padrão o ano atual                                      |
| `mes`          | número   | 1 a 12, padrão o mês atual                              |
| `turmasIds`    | string[] | Filtrado às turmas do professor                         |
| `comModelo`    | booleano | `true` cria a nota a partir do modelo                   |
| `blocos`       | array    | Quando informado, substitui o modelo                    |
| `sobre`        | string   | Resumo                                                  |
| `habilidades`  | string   | Habilidades BNCC/ENEM                                   |
| `status`       | string   | `publicada` publica; qualquer outro valor cria rascunho |

Responde `201` com `{ "nota": {...} }`. Título ausente, disciplina ausente ou disciplina de outro professor geram `400` ou `404`.

### `GET`, `PUT` e `DELETE /api/notas/[id]`

`GET` retorna `{ "nota": {...} }` ou `404`. `PUT` aceita atualização parcial de `titulo`, `disciplinaId`, `turmasIds`, `anoLetivo` (2000 a 2100), `mes`, `sobre`, `habilidades`, `status`, `blocos` e `aparencia`, e responde `200` com a nota. `DELETE` responde `200` com `{ "ok": true }`. Os links da nota são removidos em cascata.

### `POST /api/notas/[id]/duplicar`

Cria uma cópia com o título acrescido de `(cópia)`, no status `rascunho`. Responde `201` com `{ "nota": {...} }`.

### `GET /api/notas/[id]/exportar?formato=`

Formatos: `json` (padrão), `md` e `tex`. A resposta é um anexo nomeado pelo slug da nota. Ver [editor.md](editor.md) para o conteúdo de cada formato.

## Disciplinas

### `GET` e `POST /api/disciplinas`

`GET` responde `200` com `{ "disciplinas": [{ "id", "nome", "cor", "icone", "ordem", "totalNotas" }] }`, ordenadas por `ordem`. `POST` aceita `nome` (obrigatório), `cor` (padrão `verde`) e `icone` (padrão `BookOpen`), e responde `201` com a disciplina. Nome repetido responde `400` com `{ "erro": "Já existe uma disciplina com esse nome." }`.

### `PUT` e `DELETE /api/disciplinas/[id]`

`PUT` aceita `nome`, `cor`, `icone` e `ordem`, com atualização parcial. `DELETE` responde `200` com `{ "ok": true }` e desvincula as notas (a disciplina das notas fica nula).

## Turmas

### `GET` e `POST /api/turmas`

`GET` aceita `ano` e responde `200` com `{ "turmas": [{ "id", "nome", "serie", "anoLetivo", "totalNotas" }] }`. `POST` aceita `nome` (obrigatório, convertido para maiúsculas), `serie` (inferida pelo primeiro dígito do nome quando ausente) e `anoLetivo` (padrão o ano atual). Nome repetido no mesmo ano responde `400` com `{ "erro": "Essa turma já existe no ano letivo." }`.

### `PUT` e `DELETE /api/turmas/[id]`

`PUT` aceita `nome`, `serie` e `anoLetivo` (2000 a 2100). `DELETE` responde `200` com `{ "ok": true }`.

## Links

### `GET` e `POST /api/links`

`GET` responde `200` com `{ "links": [...] }` em ordem decrescente de criação. Cada link traz `tipo` (`nota`, `turma` ou `disciplina`), `token`, `nome`, `alvo`, `alvoDetalhe`, os identificadores do alvo, `ativo`, `expiraEm`, `acessos` e `criadoEm`. Em links de disciplina, `alvoDetalhe` informa a quantidade de notas publicadas no formato `N notas`; em links de turma, informa série e ano letivo.

`POST` aceita `tipo`, o identificador do alvo (`alvoId` ou `${tipo}Id`) e `nome` opcional. Responde `201` com o link e token novo de 128 bits. Destino de outro professor responde `404` com `{ "erro": "Destino não encontrado." }`.

### `PUT` e `DELETE /api/links/[id]`

`PUT` aceita `nome`, `ativo`, `expiraEm` (nulo remove a expiração) e `regenerar` igual a `true` para emitir novo token. Expiração no passado responde `400` com `{ "erro": "A expiração não pode estar no passado." }`. `DELETE` responde `200` com `{ "ok": true }`.

## Busca

### `GET /api/busca?q=`

Sessão opcional. Exige no mínimo 2 caracteres e retorna no máximo 40 resultados. Responde `200` com `{ "resultados": [{ "id", "titulo", "disciplina", "cor", "status", "anoLetivo", "mes", "turmas", "campo", "trecho" }] }`. O campo `campo` indica a origem (`título`, `resumo`, `habilidades` ou `conteúdo`) e `trecho` mostra o contexto.

## Backup e importação

### `GET /api/backup`

Baixa `backup-caderno-AAAA-MM-DD.json` com `versao`, `exportadoEm`, `professor`, `disciplinas`, `turmas`, `notas`, `links` e até 1000 imagens em base64.

### `POST /api/backup`

Restauração substitutiva. Corpo com `notas` (obrigatório), `imagens` (até 1000, com `dados` em base64) e demais coleções. Apaga links, notas, turmas e disciplinas do professor antes de recriar, preservando o perfil. Responde `200` com `{ "ok": true, "notas": 12 }`. Formato inválido responde `400` com `{ "erro": "Arquivo de backup inválido." }`.

> [!WARNING]
> A restauração substitui todos os dados do professor e não é transacional. Baixe um backup antes de enviar outro.

### `POST /api/importar`

Corpo: `conteudo` (texto) e `formato` (`json` ou `md`). Cria as disciplinas e turmas ausentes e uma nova nota. Responde `201` com `{ "nota": {...} }`. Não sobrescreve notas existentes.

## Imagens

### `POST /api/imagens`

`multipart/form-data` com o campo `arquivo`. Aceita PNG, JPEG, WebP, GIF e SVG, com no máximo 6 MB. Valida os bytes mágicos e, para SVG, bloqueia scripts. Responde `201` com `{ "caminho": "...", "url": "/api/imagens?path=..." }`.

### `GET /api/imagens?path=&png=`

Serve a imagem do professor. `png=1` converte WebP ou SVG para PNG. Caminho fora da pasta do professor responde `400` com `{ "erro": "Caminho inválido." }`.

### `DELETE /api/imagens?path=`

Remove a imagem. Responde `200` com `{ "ok": true }`.

## Público

### `GET /api/publico/[token]`

Resolve o link e retorna as notas publicadas alcançadas, com `link` (`tipo`, `nome`, `professorNome`, `expiraEm`) e `notas` (disciplina, turmas, ano, mês, sobre, habilidades, blocos e aparência). Incrementa o contador de acessos. O token especial `demo-landing` retorna a demonstração sem contabilizar acesso.

Link inexistente, pausado, expirado ou de professor em exclusão responde `404` com `{ "erro": "Este link não existe, foi revogado ou expirou." }`.

### `GET /api/publico/[token]/imagens?caminho=`

Serve imagens apenas quando referenciadas pelos blocos das notas alcançáveis pelo link. Caso contrário, responde `404` com `{ "erro": "Link indisponível." }`.

## Caixa de e-mails de teste

### `GET` e `DELETE /api/teste/outbox`

Disponível apenas com `ALLOW_TEST_OUTBOX=1` e fora de produção, ou com `TESTES_CI=1`. Caso contrário, responde `404`. `GET` lista os e-mails registrados e `DELETE` limpa a caixa.
