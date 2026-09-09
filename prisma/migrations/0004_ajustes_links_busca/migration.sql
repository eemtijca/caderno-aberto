-- Caderno Aberto. Migração 0004: texto nas turmas das notas,
-- marca de pausa pela exclusão e fim do migrador próprio.

-- turmas_ids passa a texto para o cliente Prisma (valores inalterados).
alter table public.notas alter column turmas_ids type text[] using turmas_ids::text[];

-- Marca os links pausados pela solicitação de exclusão, para a
-- restauração não reativar os que já estavam pausados antes.
alter table public.links add column if not exists pausado_na_exclusao boolean not null default false;

-- Tabela do migrador próprio, substituído pelo Prisma Migrate.
drop table if exists public.migracoes_aplicadas;
