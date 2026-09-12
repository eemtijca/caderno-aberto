# ADR-001: Prisma Client v7 como acesso ao banco

- Estado: aceita.
- Contexto: o contrato experimental do Prisma v8 (RC) trocou a API
  estável por `orm.*`, sem garantia de suporte.
- Decisão: Prisma Client v7 (`prisma/schema.prisma`,
  `prisma/migrations/`, `@prisma/adapter-pg`), SQL das políticas RLS e
  gatilhos nas migrações.
- Consequências: API estável e documentada; migrações versionadas com
  `migrate deploy` no build e no contêiner.
