-- Caderno Aberto. Esquema inicial.
-- Sem papel de teste, que vive em prisma/scripts/rls-teste.sql, só local/CI.
-- Idempotente: criações com if not exists, drops com if exists.

-- Extensões (citext sem uso, mantida por idempotência).
create extension if not exists pgcrypto;
create extension if not exists citext;

-- Tabelas.
-- Usuários: credenciais locais (hash scrypt, nunca a senha).
-- E-mail em texto, único em lower(email).
create table if not exists public.usuarios (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  senha_hash text not null default '',
  email_verificado_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create unique index if not exists usuarios_email_unico on public.usuarios (lower(email));

create table if not exists public.profiles (
  id uuid primary key references public.usuarios (id) on delete cascade,
  nome text not null default '',
  email text not null default '',
  escola text not null default '',
  preferencias jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  exclusao_solicitada_em timestamptz,
  expira_em timestamptz
);

comment on table public.profiles is 'Perfil do professor : 1:1 com usuarios';

create table if not exists public.disciplinas (
  id uuid primary key default gen_random_uuid(),
  professor_id uuid not null references public.profiles (id) on delete cascade,
  nome text not null,
  cor text not null default 'verde',
  icone text not null default 'BookOpen',
  ordem int not null default 0,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint disciplinas_professor_nome_unico unique (professor_id, nome)
);

create index if not exists disciplinas_professor_idx on public.disciplinas (professor_id);

create table if not exists public.turmas (
  id uuid primary key default gen_random_uuid(),
  professor_id uuid not null references public.profiles (id) on delete cascade,
  nome text not null,
  serie text not null default 'Outro',
  ano_letivo int not null default extract(year from now())::int,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint turmas_professor_ano_unico unique (professor_id, nome, ano_letivo)
);

create index if not exists turmas_professor_idx on public.turmas (professor_id, ano_letivo);

-- notas: metadados denormalizados (disciplina_nome/cor,
-- turmas_ids/nomes) para leitura pública sem expor as tabelas
-- privadas; gatilhos mantêm tudo sincronizado.
-- `busca` guarda o texto normalizado (sem acentos) p/ ILIKE.
-- turmas_ids em text[].
create table if not exists public.notas (
  id uuid primary key default gen_random_uuid(),
  professor_id uuid not null references public.profiles (id) on delete cascade,
  titulo text not null default 'Sem título',
  disciplina_id uuid references public.disciplinas (id) on delete set null,
  disciplina_nome text not null default '',
  disciplina_cor text not null default 'verde',
  turmas_ids text[] not null default '{}',
  turmas_nomes text[] not null default '{}',
  ano_letivo int not null default extract(year from now())::int,
  mes int not null default extract(month from now())::int,
  sobre text not null default '',
  habilidades text not null default '',
  status text not null default 'rascunho'
    constraint notas_status_valido check (status in ('rascunho', 'publicada')),
  blocos jsonb not null default '[]'::jsonb,
  aparencia jsonb not null default '{}'::jsonb,
  busca text not null default '',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists notas_professor_atualizado_idx on public.notas (professor_id, atualizado_em desc);
create index if not exists notas_professor_status_idx on public.notas (professor_id, status);
create index if not exists notas_professor_disciplina_idx on public.notas (professor_id, disciplina_id);
create index if not exists notas_professor_ano_mes_idx on public.notas (professor_id, ano_letivo desc, mes desc);
create index if not exists notas_turmas_ids_idx on public.notas using gin (turmas_ids);

create table if not exists public.links (
  id uuid primary key default gen_random_uuid(),
  professor_id uuid not null references public.profiles (id) on delete cascade,
  tipo text not null
    constraint links_tipo_valido check (tipo in ('nota', 'turma', 'disciplina')),
  nota_id uuid references public.notas (id) on delete cascade,
  turma_id uuid references public.turmas (id) on delete cascade,
  disciplina_id uuid references public.disciplinas (id) on delete cascade,
  token text not null unique,
  professor_nome text not null default '',
  nome text not null default '',
  ativo boolean not null default true,
  pausado_na_exclusao boolean not null default false,
  expira_em timestamptz,
  acessos int not null default 0,
  criado_em timestamptz not null default now(),
  constraint links_alvo_valido check (
    (tipo = 'nota' and nota_id is not null and turma_id is null and disciplina_id is null)
    or (tipo = 'turma' and turma_id is not null and nota_id is null and disciplina_id is null)
    or (tipo = 'disciplina' and disciplina_id is not null and nota_id is null and turma_id is null)
  )
);

create index if not exists links_professor_idx on public.links (professor_id);
create index if not exists links_nota_idx on public.links (nota_id);
create index if not exists links_turma_idx on public.links (turma_id);
create index if not exists links_disciplina_idx on public.links (disciplina_id);
create index if not exists links_token_idx on public.links (token);

-- Sessões: refresh tokens opacos (só o hash é guardado).
create table if not exists public.sessoes (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuarios (id) on delete cascade,
  token_hash text not null unique,
  criado_em timestamptz not null default now(),
  expira_em timestamptz not null,
  ultimo_uso_em timestamptz not null default now(),
  ip text not null default '',
  agente text not null default ''
);

create index if not exists sessoes_usuario_idx on public.sessoes (usuario_id);
create index if not exists sessoes_expira_idx on public.sessoes (expira_em);

-- Tokens de uso único: verificação de e-mail, recuperação e troca de e-mail.
create table if not exists public.tokens_verificacao (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuarios (id) on delete cascade,
  tipo text not null
    constraint tokens_tipo_valido check (tipo in ('verificacao', 'recuperacao', 'troca_email')),
  token_hash text not null unique,
  novo_email text,
  expira_em timestamptz not null,
  usado_em timestamptz,
  criado_em timestamptz not null default now()
);

create index if not exists tokens_usuario_idx on public.tokens_verificacao (usuario_id);
create index if not exists tokens_expira_idx on public.tokens_verificacao (expira_em);

-- Janela do limite de tentativas: cada tentativa com a chave
-- (rota + IP) para o limite valer entre instâncias e reinícios.
create table if not exists public.tentativas_limite (
  chave text not null,
  feita_em timestamptz not null default now(),
  constraint tentativas_limite_pkey primary key (chave, feita_em)
);

create index if not exists tentativas_limite_feita_idx on public.tentativas_limite (feita_em);

-- Gatilhos de domínio (portáteis, só tocam o esquema public).

/** atualizado_em automático */
create or replace function public.definir_atualizado_em()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

drop trigger if exists usuarios_atualizado_em on public.usuarios;
create trigger usuarios_atualizado_em
  before update on public.usuarios
  for each row execute function public.definir_atualizado_em();

drop trigger if exists profiles_atualizado_em on public.profiles;
create trigger profiles_atualizado_em
  before update on public.profiles
  for each row execute function public.definir_atualizado_em();

drop trigger if exists disciplinas_atualizado_em on public.disciplinas;
create trigger disciplinas_atualizado_em
  before update on public.disciplinas
  for each row execute function public.definir_atualizado_em();

drop trigger if exists turmas_atualizado_em on public.turmas;
create trigger turmas_atualizado_em
  before update on public.turmas
  for each row execute function public.definir_atualizado_em();

drop trigger if exists notas_atualizado_em on public.notas;
create trigger notas_atualizado_em
  before update on public.notas
  for each row execute function public.definir_atualizado_em();

/** Renomear/corrigir disciplina propaga para as notas. */
create or replace function public.sync_disciplina()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.notas
  set disciplina_nome = new.nome,
      disciplina_cor = new.cor
  where disciplina_id = new.id;
  return new;
end;
$$;

drop trigger if exists on_disciplinas_updated on public.disciplinas;
create trigger on_disciplinas_updated
  after update of nome, cor on public.disciplinas
  for each row execute function public.sync_disciplina();

/** Renomear turma propaga para as notas. */
create or replace function public.sync_turma_nome()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.notas
  set turmas_nomes = array_replace(turmas_nomes, old.nome, new.nome)
  where turmas_ids @> array[new.id::text];
  return new;
end;
$$;

drop trigger if exists on_turmas_nome_updated on public.turmas;
create trigger on_turmas_nome_updated
  after update of nome on public.turmas
  for each row execute function public.sync_turma_nome();

/** Excluir turma remove a referência das notas (sem apagar notas). */
create or replace function public.sync_turma_removida()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.notas
  set turmas_ids = array_remove(turmas_ids, old.id::text),
      turmas_nomes = array_remove(turmas_nomes, old.nome)
  where turmas_ids @> array[old.id::text];
  return old;
end;
$$;

drop trigger if exists on_turmas_deleted on public.turmas;
create trigger on_turmas_deleted
  after delete on public.turmas
  for each row execute function public.sync_turma_removida();

/** Nome do professor aparece na vista pública (denormalizado nos links). */
create or replace function public.sync_professor_nome()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.links set professor_nome = new.nome where professor_id = new.id;
  return new;
end;
$$;

drop trigger if exists on_profiles_nome_updated on public.profiles;
create trigger on_profiles_nome_updated
  after update of nome on public.profiles
  for each row execute function public.sync_professor_nome();

-- Backstop RLS: segunda barreira com escopo por transação.
-- Sem contexto definido, nenhuma linha é visível. Papéis com
-- bypassrls não são filtrados.
-- `force` aplica o RLS também ao dono da tabela; as políticas usam
-- `nullif` para tratar o contexto vazio como nulo.

alter table public.usuarios enable row level security;
alter table public.usuarios force row level security;
alter table public.profiles enable row level security;
alter table public.profiles force row level security;
alter table public.disciplinas enable row level security;
alter table public.disciplinas force row level security;
alter table public.turmas enable row level security;
alter table public.turmas force row level security;
alter table public.notas enable row level security;
alter table public.notas force row level security;
alter table public.links enable row level security;
alter table public.links force row level security;
alter table public.sessoes enable row level security;
alter table public.sessoes force row level security;
alter table public.tokens_verificacao enable row level security;
alter table public.tokens_verificacao force row level security;

drop policy if exists "isolamento_proprio" on public.usuarios;
create policy "isolamento_proprio"
  on public.usuarios for all to public
  using (id = nullif(current_setting('app.usuario_atual', true), '')::uuid)
  with check (id = nullif(current_setting('app.usuario_atual', true), '')::uuid);

drop policy if exists "isolamento_proprio" on public.profiles;
create policy "isolamento_proprio"
  on public.profiles for all to public
  using (id = nullif(current_setting('app.usuario_atual', true), '')::uuid)
  with check (id = nullif(current_setting('app.usuario_atual', true), '')::uuid);

drop policy if exists "isolamento_professor" on public.disciplinas;
create policy "isolamento_professor"
  on public.disciplinas for all to public
  using (professor_id = nullif(current_setting('app.usuario_atual', true), '')::uuid)
  with check (professor_id = nullif(current_setting('app.usuario_atual', true), '')::uuid);

drop policy if exists "isolamento_professor" on public.turmas;
create policy "isolamento_professor"
  on public.turmas for all to public
  using (professor_id = nullif(current_setting('app.usuario_atual', true), '')::uuid)
  with check (professor_id = nullif(current_setting('app.usuario_atual', true), '')::uuid);

drop policy if exists "isolamento_professor" on public.notas;
create policy "isolamento_professor"
  on public.notas for all to public
  using (professor_id = nullif(current_setting('app.usuario_atual', true), '')::uuid)
  with check (professor_id = nullif(current_setting('app.usuario_atual', true), '')::uuid);

drop policy if exists "isolamento_professor" on public.links;
create policy "isolamento_professor"
  on public.links for all to public
  using (professor_id = nullif(current_setting('app.usuario_atual', true), '')::uuid)
  with check (professor_id = nullif(current_setting('app.usuario_atual', true), '')::uuid);

drop policy if exists "isolamento_proprio" on public.sessoes;
create policy "isolamento_proprio"
  on public.sessoes for all to public
  using (usuario_id = nullif(current_setting('app.usuario_atual', true), '')::uuid)
  with check (usuario_id = nullif(current_setting('app.usuario_atual', true), '')::uuid);

drop policy if exists "isolamento_proprio" on public.tokens_verificacao;
create policy "isolamento_proprio"
  on public.tokens_verificacao for all to public
  using (usuario_id = nullif(current_setting('app.usuario_atual', true), '')::uuid)
  with check (usuario_id = nullif(current_setting('app.usuario_atual', true), '')::uuid);
