# ADR-001: Prisma Client v7 como acesso ao banco

- Estado: aceita.
- Data: 2026.

## Contexto

O contrato experimental do Prisma v8 (release candidate) substituiu a API estável por `orm.*`, sem garantia de suporte e com risco de mudanças incompatíveis. O projeto precisava de uma camada de acesso madura, com migrações versionadas e suporte a driver adapter para o PostgreSQL.

## Decisão

Adotar o Prisma Client v7 com `@prisma/adapter-pg`, schema em `prisma/schema.prisma`, migrações em `prisma/migrations/` e o SQL das políticas RLS e dos gatilhos dentro das migrações.

## Alternativas consideradas

- Prisma v8 (release candidate): descartada pela instabilidade do contrato `orm.*`.
- Cliente SQL puro ou outro ORM: descartado pelo custo de reimplementar migrações, tipagem e serialização já cobertas pelo Prisma.

## Consequências

- API estável e documentada, com tipagem gerada a partir do schema.
- Migrações versionadas aplicadas por `migrate deploy` no contêiner e na CI.
- Dependência do ciclo de vida do Prisma para recursos de RLS, que são escritos em SQL nas migrações.

Referências: [banco.md](../banco.md) e [deploy.md](../deploy.md).
