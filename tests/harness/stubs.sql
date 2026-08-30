-- Caderno Aberto. Stubs do Supabase para testes em Postgres puro
--
-- Este arquivo não é uma migration. É infraestrutura de teste.
-- Ele reproduz, num Postgres comum sem Docker ou stack
-- local do Supabase, o mínimo necessário do Supabase para que
-- as migrations oficiais apliquem e as políticas de RLS possam
-- ser exercidas de forma fiel:
--
--   * papéis anon, authenticated, service_role e authenticator
--     (o PostgREST conecta como authenticator e assume um dos
--     papéis via SET ROLE e reproduz exatamente isso);
--   * schema auth.users e auth.uid() lendo request.jwt.claims
--     (assim o PostgREST passa o JWT para o banco);
--   * schema storage.buckets e objects e storage.foldername().
--
-- Em produção (projeto Supabase real ou `supabase start` local),
-- estes objetos já existem e este arquivo não é necessário.
-- ============================================================

-- ---------- papéis ----------
do $$
begin
  if not exists (select from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
  if not exists (select from pg_roles where rolname = 'service_role') then
    create role service_role nologin bypassrls;
  end if;
  if not exists (select from pg_roles where rolname = 'authenticator') then
    create role authenticator nologin;
  end if;
end
$$;

-- o authenticator pode assumir qualquer um dos papéis (como no PostgREST)
grant anon to authenticator;
grant authenticated to authenticator;
grant service_role to authenticator;

-- ---------- schema auth ----------
create schema if not exists auth;
grant usage on schema auth to authenticator, anon, authenticated;

create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  encrypted_password text,
  email_confirmed_at timestamptz,
  last_sign_in_at timestamptz,
  raw_user_meta_data jsonb not null default '{}'::jsonb,
  raw_app_meta_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- idempotente p/ bancos já criados
alter table auth.users add column if not exists last_sign_in_at timestamptz;

grant select, insert, update, delete on auth.users to authenticator;

-- auth.uid(). Mesma semântica do Supabase. Lê o claim sub
-- do JWT que o PostgREST entrega em request.jwt.claims.
create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claims', true)::json ->> 'sub', '')::uuid
$$;

-- ---------- schema storage ----------
create schema if not exists storage;

create table if not exists storage.buckets (
  id text primary key,
  name text not null,
  public boolean not null default false,
  file_size_limit bigint,
  allowed_mime_types text[]
);

create table if not exists storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets (id),
  name text not null,
  owner uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

-- RLS ativa para que as políticas das migrations apliquem
alter table storage.buckets enable row level security;
alter table storage.objects enable row level security;

-- concessões espelhando o Supabase real (RLS decide as linhas)
grant usage on schema storage to anon, authenticated, service_role;
grant select on storage.buckets to anon, authenticated, service_role;
grant select, insert, update, delete on storage.objects to authenticated;
grant select on storage.objects to anon;
grant all on storage.objects to service_role;
grant all on storage.buckets to service_role;

-- storage.foldername('a/b/c.png') -> {a, b} (como no Supabase)
create or replace function storage.foldername(caminho text)
returns text[]
language sql
immutable
as $$
  select (string_to_array(caminho, '/'))[1 : array_length(string_to_array(caminho, '/'), 1) - 1]
$$;
