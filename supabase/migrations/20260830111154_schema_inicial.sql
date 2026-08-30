-- Caderno Aberto. Schema unificado com carência de 24 horas, storage privado e políticas RLS.

-- 1. Tabelas

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null default '',
  email text not null default '',
  escola text not null default '',
  preferencias jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

comment on table public.profiles is 'Perfil do professor : 1:1 com auth.users';

create table public.disciplinas (
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

create index disciplinas_professor_idx on public.disciplinas (professor_id);

create table public.turmas (
  id uuid primary key default gen_random_uuid(),
  professor_id uuid not null references public.profiles (id) on delete cascade,
  nome text not null,
  serie text not null default 'Outro',
  ano_letivo int not null default extract(year from now())::int,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint turmas_professor_ano_unico unique (professor_id, nome, ano_letivo)
);

create index turmas_professor_idx on public.turmas (professor_id, ano_letivo);

-- notas : metadados denormalizados (disciplina_nome/cor,
-- turmas_ids/nomes) para leitura pública sem expor as tabelas
-- privadas; gatilhos mantêm tudo sincronizado.
-- `busca` guarda o texto normalizado (sem acentos) p/ ILIKE.
create table public.notas (
  id uuid primary key default gen_random_uuid(),
  professor_id uuid not null references public.profiles (id) on delete cascade,
  titulo text not null default 'Sem título',
  disciplina_id uuid references public.disciplinas (id) on delete set null,
  disciplina_nome text not null default '',
  disciplina_cor text not null default 'verde',
  turmas_ids uuid[] not null default '{}',
  turmas_nomes text[] not null default '{}',
  ano_letivo int not null default extract(year from now())::int,
  mes int not null default extract(month from now())::int,
  sobre text not null default '',
  habilidades text not null default '',
  status text not null default 'rascunho'
    constraint notas_status_valido check (status in ('rascunho', 'publicada')),
  blocos jsonb not null default '[]'::jsonb,
  busca text not null default '',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index notas_professor_atualizado_idx on public.notas (professor_id, atualizado_em desc);
create index notas_professor_status_idx on public.notas (professor_id, status);
create index notas_professor_disciplina_idx on public.notas (professor_id, disciplina_id);
create index notas_professor_ano_mes_idx on public.notas (professor_id, ano_letivo desc, mes desc);
create index notas_turmas_ids_idx on public.notas using gin (turmas_ids);

create table public.links (
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
  expira_em timestamptz,
  acessos int not null default 0,
  criado_em timestamptz not null default now(),
  constraint links_alvo_valido check (
    (tipo = 'nota' and nota_id is not null and turma_id is null and disciplina_id is null)
    or (tipo = 'turma' and turma_id is not null and nota_id is null and disciplina_id is null)
    or (tipo = 'disciplina' and disciplina_id is not null and nota_id is null and turma_id is null)
  )
);

create index links_professor_idx on public.links (professor_id);
create index links_nota_idx on public.links (nota_id);
create index links_turma_idx on public.links (turma_id);
create index links_disciplina_idx on public.links (disciplina_id);

-- 2. Gatilhos

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

create trigger profiles_atualizado_em
  before update on public.profiles
  for each row execute function public.definir_atualizado_em();

create trigger disciplinas_atualizado_em
  before update on public.disciplinas
  for each row execute function public.definir_atualizado_em();

create trigger turmas_atualizado_em
  before update on public.turmas
  for each row execute function public.definir_atualizado_em();

create trigger notas_atualizado_em
  before update on public.notas
  for each row execute function public.definir_atualizado_em();

/** Cria o perfil automaticamente no cadastro (sign-up). */
create or replace function public.handle_novo_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, nome, email)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'nome'), ''), split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_novo_usuario();

/** Mantém profiles.email sincronizado com auth.users. */
create or replace function public.sync_email_perfil()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row execute function public.sync_email_perfil();

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
  where turmas_ids @> array[new.id];
  return new;
end;
$$;

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
  set turmas_ids = array_remove(turmas_ids, old.id),
      turmas_nomes = array_remove(turmas_nomes, old.nome)
  where turmas_ids @> array[old.id];
  return old;
end;
$$;

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

create trigger on_profiles_nome_updated
  after update of nome on public.profiles
  for each row execute function public.sync_professor_nome();

-- 3. Contador de acessos dos links públicos

/**
 * Incrementa `acessos` de um link público ativo/não expirado.
 * SECURITY DEFINER é intencional e seguro: função pública que
 * apenas conta acessos : nunca lê nem retorna dados.
 */
create or replace function public.registrar_acesso(p_token text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  select id into v_id
  from public.links
  where token = p_token
    and ativo = true
    and (expira_em is null or expira_em > now());

  if v_id is null then
    return false;
  end if;

  update public.links set acessos = acessos + 1 where id = v_id;
  return true;
end;
$$;

grant execute on function public.registrar_acesso(text) to anon, authenticated;

-- 4. RLS

alter table public.profiles enable row level security;
alter table public.disciplinas enable row level security;
alter table public.turmas enable row level security;
alter table public.notas enable row level security;
alter table public.links enable row level security;

-- profiles: o professor vê e edita apenas o próprio perfil
-- (e-mail só muda via Supabase Auth; insert/delete via gatilho/cascade)
create policy "perfil_leitura_proprio"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()));

create policy "perfil_atualizacao_proprio"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- disciplinas / turmas: CRUD completo, apenas do próprio professor
create policy "disciplinas_do_professor"
  on public.disciplinas for all
  to authenticated
  using (professor_id = (select auth.uid()))
  with check (professor_id = (select auth.uid()));

create policy "turmas_do_professor"
  on public.turmas for all
  to authenticated
  using (professor_id = (select auth.uid()))
  with check (professor_id = (select auth.uid()));

-- notas: CRUD completo do professor + leitura pública via links
create policy "notas_do_professor"
  on public.notas for all
  to authenticated
  using (professor_id = (select auth.uid()))
  with check (professor_id = (select auth.uid()));

-- Leitura pública (anon): somente notas PUBLICADAS alcançáveis por um
-- link ativo e não expirado (nota própria, da turma ou da disciplina).
-- O sub-select sobre links sofre a RLS de links p/ anon (só ativos),
-- o que reforça a checagem : e não há recursão (a política de links
-- não consulta notas).
create policy "notas_leitura_publica"
  on public.notas for select
  to anon
  using (
    status = 'publicada'
    and exists (
      select 1 from public.links l
      where l.ativo = true
        and (l.expira_em is null or l.expira_em > now())
        and (
          (l.tipo = 'nota' and l.nota_id = notas.id)
          or (l.tipo = 'turma' and notas.turmas_ids @> array[l.turma_id])
          or (l.tipo = 'disciplina' and l.disciplina_id = notas.disciplina_id)
        )
    )
  );

-- links: CRUD completo do professor; anon lê metadados de links
-- ATIVOS e não expirados (o token é a própria credencial).
-- O WITH CHECK também valida a POSSE do alvo (nota/turma/
-- disciplina) : sem isso um professor poderia criar um link
-- apontando para conteúdo publicada por outro professor.
create policy "links_do_professor"
  on public.links for all
  to authenticated
  using (professor_id = (select auth.uid()))
  with check (
    professor_id = (select auth.uid())
    and (
      (tipo = 'nota' and exists (
        select 1 from public.notas n
        where n.id = nota_id and n.professor_id = (select auth.uid())
      ))
      or (tipo = 'turma' and exists (
        select 1 from public.turmas t
        where t.id = turma_id and t.professor_id = (select auth.uid())
      ))
      or (tipo = 'disciplina' and exists (
        select 1 from public.disciplinas d
        where d.id = disciplina_id and d.professor_id = (select auth.uid())
      ))
    )
  );

create policy "links_leitura_publica"
  on public.links for select
  to anon
  using (ativo = true and (expira_em is null or expira_em > now()));

-- 5. GRANTs : exposição explícita à Data API (PostgREST)
--    (novas tabelas não são mais expostas automaticamente)

grant usage on schema public to anon, authenticated, service_role;

-- profiles: sem INSERT/DELETE pela API (gatilhos/cascade cuidam);
-- UPDATE colunar impede o cliente de tocar em id/e-mail.
grant select on public.profiles to authenticated;
grant update (nome, escola, preferencias) on public.profiles to authenticated;
grant select on public.profiles to service_role;

grant select, insert, update, delete on public.disciplinas to authenticated;
grant select, insert, update, delete on public.turmas to authenticated;
grant select, insert, update, delete on public.notas to authenticated;
grant select, insert, update, delete on public.links to authenticated;

-- leitura pública (RLS acima decide quais linhas)
grant select on public.notas to anon;
grant select on public.links to anon;

-- service_role: acesso total (apenas no servidor, nunca no browser)
grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

-- Bucket de imagens. Storage privado por professor.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'imagens',
  'imagens',
  false,
  6291456, -- 6 MB
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml']
)
on conflict (id) do nothing;

-- Pasta do professor = primeira pasta do caminho do objeto
create policy "imagens_leitura_professor"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'imagens'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "imagens_insercao_professor"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'imagens'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "imagens_atualizacao_professor"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'imagens'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'imagens'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "imagens_exclusao_professor"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'imagens'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- Exclusão com carência de 24 horas. Permite restauração dentro do prazo.
alter table public.profiles add column if not exists exclusao_solicitada_em timestamptz;
alter table public.profiles add column if not exists expira_em timestamptz;

comment on column public.profiles.exclusao_solicitada_em is 'Solicitação de exclusão pendente. Se preenchida, a conta será removida após expira_em.';
comment on column public.profiles.expira_em is 'Expiração da carência de 24h para restauração.';

create or replace function public.is_excluido(p_id uuid) returns boolean language sql security definer set search_path = '' as $$ select exists (select 1 from public.profiles where id = p_id and exclusao_solicitada_em is not null) $$;
grant execute on function public.is_excluido(uuid) to anon, authenticated, service_role;

-- Permitir atualização das colunas via service_role (já tem grant total). Não expor para authenticated diretamente.

-- Ajustar política de leitura pública para ocultar notas de professores com exclusão pendente
drop policy if exists "notas_leitura_publica" on public.notas;
create policy "notas_leitura_publica"
  on public.notas for select
  to anon
  using (
    status = 'publicada'
    and not public.is_excluido(notas.professor_id)
    and exists (
      select 1 from public.links l
      where l.ativo = true
        and (l.expira_em is null or l.expira_em > now())
        and (
          (l.tipo = 'nota' and l.nota_id = notas.id)
          or (l.tipo = 'turma' and notas.turmas_ids @> array[l.turma_id])
          or (l.tipo = 'disciplina' and l.disciplina_id = notas.disciplina_id)
        )
    )
  );

-- Ajustar política de links pública para ocultar links de professores com exclusão pendente
drop policy if exists "links_leitura_publica" on public.links;
create policy "links_leitura_publica"
  on public.links for select
  to anon
  using (
    ativo = true
    and (expira_em is null or expira_em > now())
    and not public.is_excluido(links.professor_id)
  );

-- Função para purga de contas expiradas. Executa como service_role via cron ou API.
create or replace function public.purge_exclusoes_expiradas()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer := 0;
  v_id uuid;
begin
  for v_id in
    select id from public.profiles where expira_em is not null and expira_em < now()
  loop
    delete from auth.users where id = v_id;
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

grant execute on function public.purge_exclusoes_expiradas() to service_role;
