-- Full dates the studio is closed (holidays, private events).
create table public.blocked_dates (
  date date primary key,
  reason text,
  created_at timestamptz not null default now()
);

alter table public.blocked_dates enable row level security;
