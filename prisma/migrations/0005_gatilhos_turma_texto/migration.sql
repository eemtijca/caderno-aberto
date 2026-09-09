-- Caderno Aberto. Migração 0005: gatilhos de turma em texto.
-- turmas_ids virou text[] na 0004; os literais uuid precisam de cast.

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
