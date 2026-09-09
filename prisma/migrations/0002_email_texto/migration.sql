-- Caderno Aberto. Migração 0002: e-mail como texto com unicidade
-- insensível a maiúsculas.

alter table public.usuarios drop constraint if exists usuarios_email_key;
alter table public.usuarios alter column email type text;
create unique index if not exists usuarios_email_unico on public.usuarios (lower(email));

alter table public.tokens_verificacao alter column novo_email type text;
