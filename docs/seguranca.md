# Segurança

## Sessão e senhas

- scrypt N=131072 (hashes antigos sobem no login), mínimo 8 caracteres.
- JWT de acesso (1h) + refresh opaco com rotação e trava de
  concorrência (só um vence). Troca de senha exige a atual e invalida
  todas as sessões. Recuperação invalida tudo e entra sozinha.
- Cookies HttpOnly, `SameSite=Lax`, `Secure` em produção.
- Respostas de auth genéricas (sem enumeração de contas).

## Requisições

- CSRF: `src/proxy.ts` nega mutação cross-site (`Sec-Fetch-Site` +
  `Origin`/`Referer`); estado nunca muda via GET.
- Rate-limit no banco (janela de 5 min) por rota + IP.
- CSP com nonce + `strict-dynamic`; `nosniff`, `DENY`,
  `Referrer-Policy` e `Permissions-Policy` em todas as respostas.

## Dados e arquivos

- Isolamento por `professorId` em cada consulta + RLS de barreira.
- KaTeX só com `\htmlClass` (links e HTML vetados).
- Upload valida bytes por tipo; SVG sem scripts, servido isolado.
- Backup valida lote, tipos e tokens (criptográficos); restauração é
  substitutiva — baixe antes.
- Links públicos: tokens de 128 bits, expiração/pausa/revogação,
  imagens só referenciadas.
- E-mails escapam nome/URL; origem canônica via `APP_URL`.
- Outbox de teste desligada fora de dev/CI; segredos nunca em logs.

## Reporte

Ver `SECURITY.md`. Não abra issue pública com dados sensíveis.
