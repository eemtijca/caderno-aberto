-- Acesso por codigo gerido pela administracao, sem e-mail.
-- Remove tokens_verificacao; adiciona papel, ativacao, codigos,
-- solicitacoes e trilha de auditoria.
-- Idempotente: criacoes com if not exists, drops com if exists.

-- Papeis e estado de ativacao da conta.
alter table public.usuarios
  add column if not exists papel text not null default 'professor';

alter table public.usuarios
  drop constraint if exists usuarios_papel_valido;
alter table public.usuarios
  add constraint usuarios_papel_valido check (papel in ('admin', 'professor'));

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'usuarios'
      and column_name = 'email_verificado_em'
  ) then
    alter table public.usuarios rename column email_verificado_em to ativado_em;
  end if;
end;
$$;

-- Codigos de acesso: 8 caracteres alfanumericos, guardados apenas como HMAC.
-- Um codigo ativo por (email, tipo); consumido de forma atomica.
create table if not exists public.codigos_acesso (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuarios (id) on delete cascade,
  email text not null,
  tipo text not null
    constraint codigos_acesso_tipo_valido check (tipo in ('primeiro_acesso', 'recuperacao')),
  codigo_hash text not null,
  criado_por uuid references public.usuarios (id) on delete set null,
  expira_em timestamptz not null,
  usado_em timestamptz,
  criado_em timestamptz not null default now()
);

create index if not exists codigos_acesso_email_idx on public.codigos_acesso (lower(email));
create index if not exists codigos_acesso_expira_idx on public.codigos_acesso (expira_em);
create unique index if not exists codigos_acesso_ativo_unico
  on public.codigos_acesso (lower(email), tipo)
  where usado_em is null;

-- Fila de solicitacoes: primeiro acesso e recuperacao pedidos na tela de login.
create table if not exists public.solicitacoes_acesso (
  id uuid primary key default gen_random_uuid(),
  nome text not null default '',
  email text not null,
  tipo text not null
    constraint solicitacoes_acesso_tipo_valido check (tipo in ('primeiro_acesso', 'recuperacao')),
  status text not null default 'pendente'
    constraint solicitacoes_acesso_status_valido check (status in ('pendente', 'atendida', 'cancelada')),
  atendida_por uuid references public.usuarios (id) on delete set null,
  atendida_em timestamptz,
  criado_em timestamptz not null default now()
);

create index if not exists solicitacoes_acesso_status_idx
  on public.solicitacoes_acesso (status, criado_em desc);
create unique index if not exists solicitacoes_acesso_pendente_unico
  on public.solicitacoes_acesso (lower(email), tipo)
  where status = 'pendente';

-- Trilha de auditoria dos eventos sensiveis (LGPD e resposta a incidentes).
create table if not exists public.eventos_seguranca (
  id uuid primary key default gen_random_uuid(),
  ator_id uuid references public.usuarios (id) on delete set null,
  acao text not null,
  email text not null default '',
  ip text not null default '',
  agente text not null default '',
  detalhe jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now()
);

create index if not exists eventos_seguranca_criado_idx
  on public.eventos_seguranca (criado_em desc);
create index if not exists eventos_seguranca_email_idx
  on public.eventos_seguranca (lower(email));

-- Tokens de e-mail deixam de existir.
drop table if exists public.tokens_verificacao;

-- Backstop RLS das novas tabelas, no mesmo padrao das demais.
alter table public.codigos_acesso enable row level security;
alter table public.codigos_acesso force row level security;
alter table public.solicitacoes_acesso enable row level security;
alter table public.solicitacoes_acesso force row level security;
alter table public.eventos_seguranca enable row level security;
alter table public.eventos_seguranca force row level security;

drop policy if exists "isolamento_proprio" on public.codigos_acesso;
create policy "isolamento_proprio"
  on public.codigos_acesso for all to public
  using (usuario_id = nullif(current_setting('app.usuario_atual', true), '')::uuid)
  with check (usuario_id = nullif(current_setting('app.usuario_atual', true), '')::uuid);

-- Fila e auditoria nao pertencem a um usuario; so a role com bypass enxerga.
drop policy if exists "somente_admin" on public.solicitacoes_acesso;
create policy "somente_admin"
  on public.solicitacoes_acesso for all to public
  using (false)
  with check (false);

drop policy if exists "somente_admin" on public.eventos_seguranca;
create policy "somente_admin"
  on public.eventos_seguranca for all to public
  using (false)
  with check (false);
