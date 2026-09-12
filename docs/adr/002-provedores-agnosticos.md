# ADR-002: provedores agnósticos de e-mail e imagens

- Estado: aceita.
- Contexto: acoplar a um único SaaS prende o deploy.
- Decisão: interfaces `ProvedorEmail` (`log|smtp|resend`) e
  `ProvedorArmazenamento` (`disk|s3` S3-compatível), escolhidas por env.
- Consequências: qualquer SMTP ou S3 serve; `log` cobre dev/CI com a
  outbox de teste (desligada em produção).
