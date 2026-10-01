-- Weekly schedule: which 2-hour slots exist on each weekday and how many seats they have.
-- weekday is ISO: 1 = Monday … 7 = Sunday. Times are studio local time (America/Tijuana).
create table public.schedule_slots (
  id bigint generated always as identity primary key,
  weekday smallint not null check (weekday between 1 and 7),
  start_time time not null,
  end_time time not null,
  capacity integer not null check (capacity >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint schedule_slots_time_order check (end_time > start_time),
  constraint schedule_slots_weekday_start_unique unique (weekday, start_time)
);

-- Public users never touch tables directly; server code uses the service role.
alter table public.schedule_slots enable row level security;
