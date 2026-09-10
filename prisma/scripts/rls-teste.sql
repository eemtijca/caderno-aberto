-- Backstop RLS dos testes de isolamento. Só local/CI, sem Supabase.
-- Aplicado por prisma/scripts/aplicar-rls-teste.mjs.

-- Papel sem privilégios para prova das políticas em testes.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'app_teste') then
    create role app_teste nologin;
  end if;
  execute format('grant connect on database %I to app_teste', current_database());
end;
$$;
grant usage on schema public to app_teste;
grant select, insert, update, delete on all tables in schema public to app_teste;
alter default privileges in schema public
  grant select, insert, update, delete on tables to app_teste;
grant usage, select on all sequences in schema public to app_teste;
alter default privileges in schema public
  grant usage, select on sequences to app_teste;

-- Permite assumir app_teste com SET ROLE onde o executor não é
-- superusuário. A filiação abrange apenas o papel restrito.
do $$
begin
  execute format('grant app_teste to %I', current_user);
exception when duplicate_object then
  -- Filiação já concedida: nada a fazer.
  null;
end;
$$;
