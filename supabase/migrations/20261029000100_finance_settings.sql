-- Sprint 8: finance settings (single row). Additive only.
create table public.finance_settings (
  id integer primary key default 1 check (id = 1),
  fx_rate numeric(10,4) not null default 18.5,
  waste_rate numeric(6,4) not null default 0.03,
  supplies_per_piece_mxn numeric(12,2) not null default 20.90,
  iva_rate numeric(6,4) not null default 0.08,
  isr_rate numeric(6,4) not null default 0.02,
  card_fee_rate numeric(8,5) not null default 0.04176,
  fixed_monthly_mxn numeric(12,2) not null default 97274,
  open_days_per_month integer not null default 26,
  cash_float_mxn numeric(12,2) not null default 1000,
  cushion_target_mxn numeric(12,2) not null default 291822,
  lead_time_weeks numeric(6,2) not null default 2,
  safety_weeks numeric(6,2) not null default 1,
  review_weeks numeric(6,2) not null default 2,
  plan_weekly_customers integer not null default 184,
  weekly_breakeven integer not null default 141,
  weekly_target integer not null default 221,
  monthly_breakeven integer not null default 609,
  kiln_weekly_min integer not null default 210,
  kiln_weekly_max integer not null default 280,
  resico_annual_cap numeric(14,2) not null default 3500000,
  -- Minutes before a slot starts during which a sale still counts for that slot (early arrivals).
  slot_grace_minutes integer not null default 30 check (slot_grace_minutes >= 0),
  updated_at timestamptz not null default now()
);

alter table public.finance_settings enable row level security;

insert into public.finance_settings (id) values (1) on conflict (id) do nothing;
