-- Emails allowed into /admin (in addition to having a Supabase Auth login).
create table public.admins (
  email text primary key check (email = lower(email)),
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

-- Signed-in users may check whether THEIR OWN email is an admin (used by the admin gate).
create policy "admins_select_own" on public.admins
  for select to authenticated
  using (email = lower(auth.jwt() ->> 'email'));
