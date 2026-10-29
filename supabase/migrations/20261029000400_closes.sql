-- Sprint 8: daily and weekly cash cuts. A closed day is "closed" while reopened_at is null.
-- Rows are never deleted: reopening sets reopened_at; closing again clears it. Additive only.
create table public.daily_closes (
  studio_date date primary key,
  pieces integer not null default 0,
  tickets integer not null default 0,
  total_mxn numeric(12,2) not null default 0,
  cash_mxn numeric(12,2) not null default 0,
  card_mxn numeric(12,2) not null default 0,
  transfer_mxn numeric(12,2) not null default 0,
  cash_float_mxn numeric(12,2) not null default 0,
  cash_counted_mxn numeric(12,2),
  cash_diff_mxn numeric(12,2),
  taxes_mxn numeric(12,2) not null default 0,
  inventory_mxn numeric(12,2) not null default 0,
  fixed_mxn numeric(12,2) not null default 0,
  profit_mxn numeric(12,2) not null default 0,
  card_fee_mxn numeric(12,2) not null default 0,
  fixed_shortfall_mxn numeric(12,2) not null default 0,
  check_counted boolean not null default false,
  check_deposited boolean not null default false,
  check_moved boolean not null default false,
  notes text,
  closed_by text not null,
  closed_at timestamptz not null default now(),
  reopened_at timestamptz
);

create table public.weekly_closes (
  week_start date primary key,
  pieces integer not null default 0,
  customers integer not null default 0,
  total_mxn numeric(12,2) not null default 0,
  taxes_mxn numeric(12,2) not null default 0,
  inventory_mxn numeric(12,2) not null default 0,
  fixed_mxn numeric(12,2) not null default 0,
  profit_mxn numeric(12,2) not null default 0,
  checklist jsonb not null default '{}'::jsonb,
  notes text,
  closed_by text not null,
  closed_at timestamptz not null default now()
);

alter table public.daily_closes enable row level security;
alter table public.weekly_closes enable row level security;
