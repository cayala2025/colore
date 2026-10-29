-- Sprint 8: bisque pieces sold at the counter. Additive only.
create table public.products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  name text not null,
  price_mxn numeric(12,2) not null check (price_mxn >= 0),
  cost_usd numeric(12,2) not null check (cost_usd >= 0),
  case_size integer not null check (case_size > 0),
  case_cost_usd numeric(12,2) not null check (case_cost_usd >= 0),
  seasonal boolean not null default false,
  active boolean not null default true,
  sort integer not null default 0
);

alter table public.products enable row level security;

insert into public.products (sku, name, price_mxn, cost_usd, case_size, case_cost_usd, seasonal, sort) values
  ('taza',     'Taza',          300, 3.69, 12, 44.28, false, 1),
  ('joyero',   'Joyero',        250, 3.91,  4, 15.65, false, 2),
  ('matcha',   'Matcha bowl',   320, 5.32,  4, 21.29, false, 3),
  ('plato',    'Plato',         300, 5.97,  4, 23.89, false, 4),
  ('ovalado',  'Plato ovalado', 350, 5.82,  6, 34.89, false, 5),
  ('tina',     'Tina',          350, 5.62,  4, 22.49, false, 6),
  ('azulejo',  'Azulejo 8"',    300, 3.71,  6, 22.26, false, 7),
  ('pumpkin',  'Pumpkin dish',  350, 6.46,  6, 38.74, true,  8),
  ('calabaza', 'Calabaza',      350, 5.54,  4, 22.17, true,  9)
on conflict (sku) do nothing;
