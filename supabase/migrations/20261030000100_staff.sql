-- Sprint 8b: cashier accounts. Staff may use /cobro only (sell, void with a reason); /admin stays admin-only.
-- Same shape as `admins`. Access is switched off with `active = false`; rows are never deleted.
create table public.staff (
  email text primary key check (email = lower(email)),
  active boolean not null default true,
  added_by text,
  created_at timestamptz not null default now()
);

alter table public.staff enable row level security;

-- Signed-in users may check whether THEIR OWN email is staff (used by the proxy gate).
create policy "staff_select_own" on public.staff
  for select to authenticated
  using (email = lower(auth.jwt() ->> 'email'));
