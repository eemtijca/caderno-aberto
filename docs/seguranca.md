# Segurança

Este documento descreve os controles implementados e as decisões de segurança. A política de reporte de vulnerabilidades está em [../SECURITY.md](../SECURITY.md).

## Modelo de ameaça

O sistema é multiusuário e expõe duas superfícies públicas: as rotas de autenticação e os links de leitura dos alunos. Os ativos a proteger são os dados das notas de cada professor, os tokens de sessão, os códigos de acesso, as imagens enviadas e o acesso aos links públicos.

As principais ameaças consideradas são enumeração de contas, força bruta de senhas e de códigos, CSRF, injeção de conteúdo (HTML e scripts em LaTeX e SVG), acesso cruzado a dados de outro professor, escalonamento de papel, reuso de refresh token e exposição de imagens não referenciadas.

## Sessão e senhas

- scrypt com `N=131072`, `r=8`, `p=1`, sal de 16 bytes e chave de 64 bytes. Hashes antigos continuam válidos e são regravados no login, sem interromper a operação.
- Senha com no mínimo 8 e no máximo 256 caracteres.
- JWT de acesso com validade de 1 hora e refresh opaco com rotação e trava de concorrência, em que apenas uma renovação vence. O refresh é armazenado apenas como SHA-256.
- Cookies `HttpOnly`, `SameSite=Lax` e `Secure` em produção.
- Troca de senha exige a senha atual e invalida todas as sessões. A recuperação por código também invalida todas as sessões e inicia uma nova.
- Respostas de autenticação genéricas, sem enumeração de contas. O login confere a senha mesmo para e-mail inexistente ou conta não ativada, com um hash falso, para equalizar o tempo de resposta.

## Códigos de acesso

- Código de 8 caracteres de um alfabeto sem ambíguos, gerado com aleatoriedade criptográfica e guardado apenas como HMAC-SHA256 com o `AUTH_SECRET` como pepper. O valor em claro é exibido uma única vez à administração.
- Um código ativo por par (e-mail, tipo). Gerar um novo revoga o anterior; o consumo é atômico (`update ... where usado_em is null`), impedindo reuso concorrente.
- Validade de `CODIGO_EXPIRA_MINUTOS` (padrão 60) e bloqueio por e-mail após `AUTH_LIMITE_CODIGO` tentativas erradas (padrão 5) na janela de 5 minutos, além do limite por IP.
- O papel de administrador é reconferido no banco a cada requisição. Mudar o papel ou desativar a conta derruba as sessões e o acesso imediatamente.
- Ações sensíveis (geração, revogação e uso de código, criação, edição e exclusão de usuário, login) ficam registradas em `eventos_seguranca`, com e-mail mascarado na leitura.

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
- Os e-mails são considerados dado pessoal: aparecem mascarados na auditoria e não vão para os logs.

## Segredos e configuração

- `AUTH_SECRET` e `CRON_SECRET` devem ter no mínimo 32 bytes aleatórios e nunca ser reutilizados entre ambientes.
- `ADMIN_SENHA` é usada apenas na criação do administrador e nunca é registrada.
- Segredos nunca são registrados em logs. A `DATABASE_URL` é mascarada na saída do entrypoint do contêiner.

## Resposta a incidentes

Em caso de suspeita de comprometimento de sessões ou segredos:

1. Gire `AUTH_SECRET` e `CRON_SECRET`, o que invalida todas as sessões e todos os códigos de acesso pendentes.
2. Para trocar o e-mail de uma conta, use a edição de usuário no console de administração.
3. Para revogar um vínculo de leitura, pause ou exclua o link e regenere o token.
4. Revogue códigos ativos, encerre sessões e confira a aba Auditoria. Reporte pelo canal descrito em [../SECURITY.md](../SECURITY.md).
