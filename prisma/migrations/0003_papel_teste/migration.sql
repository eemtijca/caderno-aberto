-- Caderno Aberto. Migração 0003: filiação ao papel de teste.
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
