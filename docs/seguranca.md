# Segurança

Este documento descreve os controles implementados e as decisões de segurança. A política de reporte de vulnerabilidades está em [../SECURITY.md](../SECURITY.md).

## Modelo de ameaça

O sistema é multiusuário e expõe duas superfícies públicas: as rotas de autenticação e os links de leitura dos alunos. Os ativos a proteger são os dados das notas de cada professor, os tokens de sessão, os tokens de verificação e recuperação, as imagens enviadas e o acesso aos links públicos.

As principais ameaças consideradas são enumeração de contas, força bruta de senhas, CSRF, injeção de conteúdo (HTML e scripts em LaTeX e SVG), acesso cruzado a dados de outro professor, reuso de refresh token e exposição de imagens não referenciadas.

## Sessão e senhas

- scrypt com `N=131072`, `r=8`, `p=1`, sal de 16 bytes e chave de 64 bytes. Hashes antigos continuam válidos e são regravados no login, sem interromper a operação.
- Senha com no mínimo 8 e no máximo 256 caracteres.
- JWT de acesso com validade de 1 hora e refresh opaco com rotação e trava de concorrência, em que apenas uma renovação vence. O refresh é armazenado apenas como SHA-256.
- Cookies `HttpOnly`, `SameSite=Lax` e `Secure` em produção.
- Troca de senha exige a senha atual e invalida todas as sessões. A recuperação também invalida todas as sessões e inicia uma nova.
- Respostas de autenticação genéricas, sem enumeração de contas. O login confere a senha mesmo para e-mail inexistente, com um hash falso, para equalizar o tempo de resposta.

## Requisições

- CSRF: `src/proxy.ts` nega mutações cross-site com base em `Sec-Fetch-Site` e, na ausência dele, na comparação de `Origin` ou `Referer` com o host próprio. O estado nunca muda por `GET`, exceto a purga agendada, que exige segredo.
- Limite de tentativas no banco, com janela fixa de 5 minutos por rota e IP, persistido em `tentativas_limite`. Se o banco estiver inacessível, a requisição é permitida para não bloquear o login.
- CSP com nonce e `strict-dynamic` em produção, além de `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy` e `Permissions-Policy` em todas as respostas.

## Dados e arquivos

- Isolamento por `professorId` ou `usuario.id` em cada consulta, com RLS como segunda barreira. Ver [banco.md](banco.md).
- KaTeX restrito à macro `\htmlClass`; links e HTML são vetados.
- Upload de imagem valida os bytes mágicos por tipo. SVG é aceito sem scripts nem atributos de evento e servido com `Content-Security-Policy: sandbox`.
- Tokens de links públicos têm 128 bits de entropia, com expiração, pausa e revogação. As imagens públicas só são servidas quando referenciadas pelos blocos das notas alcançáveis pelo link.
- A restauração de backup valida o lote, os tipos e os tokens, que são criptográficos. A restauração é substitutiva, portanto baixe um backup antes.
- Os e-mails escapam nome e URL, e a origem canônica vem de `APP_URL`.

## Segredos e configuração

- `AUTH_SECRET` e `CRON_SECRET` devem ter no mínimo 32 bytes aleatórios e nunca ser reutilizados entre ambientes.
- A outbox de teste (`ALLOW_TEST_OUTBOX=1`) expõe tokens e é proibida fora de desenvolvimento e CI. Em produção, é recusada, exceto com `TESTES_CI=1`.
- Segredos nunca são registrados em logs. A `DATABASE_URL` é mascarada na saída do entrypoint do contêiner.

## Resposta a incidentes

Em caso de suspeita de comprometimento de sessões ou segredos:

1. Gire `AUTH_SECRET` e `CRON_SECRET`, o que invalida todas as sessões.
2. Se um e-mail estiver comprometido, use a troca de e-mail com confirmação no novo endereço.
3. Para revogar um vínculo de leitura, pause ou exclua o link e regenere o token.
4. Verifique os acessos registrados por link e os registros do provedor de hospedagem. Reporte pelo canal descrito em [../SECURITY.md](../SECURITY.md).
