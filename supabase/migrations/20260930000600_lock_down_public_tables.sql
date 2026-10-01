-- RLS is enabled on every table in its own migration. Belt and braces:
-- the public API roles get no write privileges on any table, ever.
alter table public.schedule_slots enable row level security;
alter table public.blocked_dates enable row level security;
alter table public.bookings enable row level security;
alter table public.admins enable row level security;

revoke insert, update, delete, truncate on all tables in schema public from anon, authenticated;
alter default privileges in schema public revoke insert, update, delete, truncate on tables from anon, authenticated;

-- Tables created later get RLS automatically, so nobody can forget it.
create or replace function public.enforce_rls_on_new_tables()
returns event_trigger
language plpgsql
as $$
declare
  obj record;
begin
  for obj in select * from pg_event_trigger_ddl_commands() where command_tag = 'CREATE TABLE' loop
    if obj.schema_name = 'public' then
      execute format('alter table %s enable row level security', obj.object_identity);
    end if;
  end loop;
end;
$$;

drop event trigger if exists enforce_rls_on_new_tables;
create event trigger enforce_rls_on_new_tables on ddl_command_end
  when tag in ('CREATE TABLE')
  execute function public.enforce_rls_on_new_tables();
